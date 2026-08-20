// "Analizar mi negocio" — SOLO Premium. Ruta de servidor: el plan se verifica
// AQUÍ (nunca confiar solo en el gate del cliente), los datos del usuario se
// agregan en código (lib/ai-negocio.ts) y a Claude solo le llega ese JSON ya
// calculado — nunca clientes/proyectos crudos (regla dura del proyecto, ver
// CLAUDE.md y docs/sistema/30-INTEGRACION-IA.md). Tope de 10 análisis/mes por
// usuario para controlar el costo; el último análisis se guarda y se puede
// releer sin gastar una llamada nueva.

import { NextResponse } from 'next/server';
import Anthropic from '@anthropic-ai/sdk';
import { z } from 'zod';
import { createClient } from '@/lib/supabase/server';
import { type Cliente, type Proyecto, type Pago, type TasaCambio } from '@/lib/app-data';
import { construirResumenNegocio } from '@/lib/ai-negocio';
import { planEfectivo, type Plan } from '@/lib/planes';

export const runtime = 'nodejs';

const LIMITE_ANALISIS_MES = 10;
const AI_MODEL = process.env.AI_MODEL || 'claude-sonnet-4-6';

const AnalisisSchema = z.object({
  resumen: z.string().min(1),
  positivos: z.array(z.string()).min(1),
  alertas: z.array(z.string()),
  recomendaciones: z.array(z.string()).min(1),
  proximos_pasos: z.array(z.string()).min(1),
});
type Analisis = z.infer<typeof AnalisisSchema>;

const TOOL_REPORTAR_ANALISIS = {
  name: 'reportar_analisis',
  description: 'Reporta el análisis del negocio del usuario en las 5 secciones pedidas.',
  input_schema: {
    type: 'object' as const,
    properties: {
      resumen: { type: 'string', description: 'Resumen de 2 a 4 frases del estado financiero actual del negocio, en español latino neutro, tono humano y directo.' },
      positivos: { type: 'array', items: { type: 'string' }, description: 'Aspectos positivos detectados, cada uno en 1 frase corta.' },
      alertas: { type: 'array', items: { type: 'string' }, description: 'Riesgos o alertas detectadas (atrasos, concentración en pocos clientes, caídas). Si no hay ninguna, un arreglo vacío.' },
      recomendaciones: { type: 'array', items: { type: 'string' }, description: 'Recomendaciones concretas y accionables, cada una en 1 frase.' },
      proximos_pasos: { type: 'array', items: { type: 'string' }, description: 'Próximos pasos priorizados, en orden, cada uno en 1 frase corta y accionable.' },
    },
    required: ['resumen', 'positivos', 'alertas', 'recomendaciones', 'proximos_pasos'],
    additionalProperties: false,
  },
};

async function usuarioYPlan(supabase: Awaited<ReturnType<typeof createClient>>) {
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { user: null, plan: null as Plan | null };
  const { data } = await supabase.from('profiles').select('plan, status, access_until, grace_ends_at').eq('id', user.id).single();
  if (!data) return { user, plan: 'free' as Plan };
  const plan = planEfectivo({
    plan: (data.plan as Plan) ?? 'free',
    status: data.status ?? 'free',
    accessUntil: data.access_until,
    graceEndsAt: data.grace_ends_at,
  });
  return { user, plan };
}

async function obtenerDBServidor(supabase: Awaited<ReturnType<typeof createClient>>, userId: string) {
  const [{ data: clientesRaw }, { data: proyectosRaw }, { data: pagosRaw }] = await Promise.all([
    supabase.from('clients').select('id, nombre, telefono, moneda, created_at').eq('user_id', userId),
    supabase.from('projects').select('id, client_id, nombre, precio_total, fecha_promesa').eq('user_id', userId),
    supabase.from('payments').select('id, project_id, monto, fecha').eq('user_id', userId),
  ]);

  const clientes: Cliente[] = (clientesRaw ?? []).map((c) => ({
    id: c.id,
    nombre: c.nombre,
    telefono: c.telefono ?? undefined,
    moneda: c.moneda,
    creadoEn: (c.created_at as string).slice(0, 10),
  }));
  const proyectos: Proyecto[] = (proyectosRaw ?? []).map((p) => ({
    id: p.id,
    clienteId: p.client_id,
    nombre: p.nombre,
    precioTotal: Number(p.precio_total),
    fechaPromesa: p.fecha_promesa,
  }));
  const pagos: Pago[] = (pagosRaw ?? []).map((g) => ({
    id: g.id,
    proyectoId: g.project_id,
    monto: Number(g.monto),
    fecha: g.fecha,
  }));

  return { clientes, proyectos, pagos };
}

export async function GET() {
  const supabase = await createClient();
  const { user, plan } = await usuarioYPlan(supabase);
  if (!user) return NextResponse.json({ error: 'sin_sesion' }, { status: 401 });
  if (plan !== 'premium') return NextResponse.json({ error: 'requiere_premium' }, { status: 403 });

  const inicioMes = new Date();
  inicioMes.setDate(1);
  inicioMes.setHours(0, 0, 0, 0);

  const [{ data: ultimo }, { count: usadosEsteMes }] = await Promise.all([
    supabase
      .from('ai_analysis')
      .select('resumen, positivos, alertas, recomendaciones, proximos_pasos, created_at')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle(),
    supabase
      .from('ai_analysis')
      .select('id', { count: 'exact', head: true })
      .eq('user_id', user.id)
      .gte('created_at', inicioMes.toISOString()),
  ]);

  return NextResponse.json({
    ultimo: ultimo ?? null,
    usadosEsteMes: usadosEsteMes ?? 0,
    limiteMes: LIMITE_ANALISIS_MES,
  });
}

export async function POST() {
  const supabase = await createClient();
  const { user, plan } = await usuarioYPlan(supabase);
  if (!user) return NextResponse.json({ error: 'sin_sesion' }, { status: 401 });
  if (plan !== 'premium') return NextResponse.json({ error: 'requiere_premium' }, { status: 403 });

  if (!process.env.ANTHROPIC_API_KEY) {
    return NextResponse.json({ error: 'servicio_no_configurado' }, { status: 503 });
  }

  const inicioMes = new Date();
  inicioMes.setDate(1);
  inicioMes.setHours(0, 0, 0, 0);
  const { count: usadosEsteMes } = await supabase
    .from('ai_analysis')
    .select('id', { count: 'exact', head: true })
    .eq('user_id', user.id)
    .gte('created_at', inicioMes.toISOString());
  if ((usadosEsteMes ?? 0) >= LIMITE_ANALISIS_MES) {
    return NextResponse.json({ error: 'limite_mensual_alcanzado', limiteMes: LIMITE_ANALISIS_MES }, { status: 429 });
  }

  const [db, { data: perfilRaw }, { data: tasasRaw }] = await Promise.all([
    obtenerDBServidor(supabase, user.id),
    supabase.from('profiles').select('moneda_principal').eq('id', user.id).single(),
    supabase.from('exchange_rates').select('moneda_origen, moneda_destino, tasa').eq('user_id', user.id),
  ]);
  const monedaPrincipal = perfilRaw?.moneda_principal ?? 'USD';
  const tasas: TasaCambio[] = (tasasRaw ?? []).map((t) => ({
    monedaOrigen: t.moneda_origen,
    monedaDestino: t.moneda_destino,
    tasa: Number(t.tasa),
    actualizadoEn: '',
  }));

  if (db.clientes.length === 0) {
    return NextResponse.json({ error: 'sin_datos' }, { status: 400 });
  }

  const resumen = construirResumenNegocio(db, monedaPrincipal, tasas);

  const client = new Anthropic();
  const systemPrompt =
    'Eres un asesor financiero que analiza el negocio de un freelancer o microempresa de LATAM ' +
    'dentro de la app CobroFlow. Recibes SOLO un resumen ya calculado (nunca datos crudos de ' +
    'clientes) — no inventes cifras, usa exclusivamente los números del resumen. Nunca sumes ' +
    'montos de monedas distintas: si hay varias monedas y el consolidado no está disponible, ' +
    'analiza cada moneda por separado y dilo explícitamente. Responde en español latino neutro ' +
    '(tuteo, sin voseo ni regionalismos), con un tono humano, directo y sin tecnicismos — como si ' +
    'le hablaras a alguien que nunca llevó una contabilidad formal. Usa SIEMPRE la herramienta ' +
    'reportar_analisis para responder.';

  const messages: Anthropic.MessageParam[] = [
    {
      role: 'user',
      content: `Aquí está el resumen de mi negocio. Analízalo:\n\n${JSON.stringify(resumen, null, 2)}`,
    },
  ];

  let analisis: Analisis | null = null;
  let ultimoError = '';
  for (let intento = 0; intento <= 1 && !analisis; intento++) {
    const res = await client.messages.create({
      model: AI_MODEL,
      max_tokens: 1536,
      system: systemPrompt,
      tools: [TOOL_REPORTAR_ANALISIS],
      tool_choice: { type: 'tool', name: 'reportar_analisis' },
      messages,
    });

    const toolUse = res.content.find((b): b is Anthropic.ToolUseBlock => b.type === 'tool_use');
    const parsed = AnalisisSchema.safeParse(toolUse?.input);
    if (parsed.success) {
      analisis = parsed.data;
      break;
    }
    ultimoError = parsed.error.message;
    messages.push({ role: 'assistant', content: res.content });
    messages.push({
      role: 'user',
      content: `La respuesta no cumplió el formato esperado: ${ultimoError}. Corrige y vuelve a llamar reportar_analisis.`,
    });
  }

  if (!analisis) {
    return NextResponse.json({ error: 'analisis_invalido' }, { status: 502 });
  }

  const { error: errInsert } = await supabase.from('ai_analysis').insert({
    user_id: user.id,
    resumen: analisis.resumen,
    positivos: analisis.positivos,
    alertas: analisis.alertas,
    recomendaciones: analisis.recomendaciones,
    proximos_pasos: analisis.proximos_pasos,
    datos_entrada: resumen,
  });
  if (errInsert) {
    return NextResponse.json({ error: 'no_se_pudo_guardar' }, { status: 500 });
  }

  return NextResponse.json({ analisis, usadosEsteMes: (usadosEsteMes ?? 0) + 1, limiteMes: LIMITE_ANALISIS_MES });
}
