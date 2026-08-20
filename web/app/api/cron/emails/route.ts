// Cron diario único que avanza TODAS las secuencias basadas en tiempo: carrito
// abandonado (B), dunning día 3/5 (C1 — el día 1 lo dispara el webhook al
// momento), win-back 30/60/90 (C2), activación D1/D3/D7 (D) y nurturing
// Free→Pro (E). Una sola tabla (email_log) decide "¿ya le mandé esto?" para
// las 5 — así no hace falta un contador de día por usuario y por secuencia.
//
// Por qué UN cron y no cinco: Vercel Cron en el plan gratuito permite pocos
// jobs; agruparlos en una sola corrida diaria además hace más fácil ver en un
// solo log qué se mandó cada día.

import { NextRequest, NextResponse } from 'next/server';
import type { SupabaseClient } from '@supabase/supabase-js';
import { createAdminClient } from '@/lib/supabase/admin';
import { enviarEmail, registrarEnvio, yaSeEnvio, estaSuprimido, FROM_TX, FROM_MKT } from '@/lib/resend-email';
import { emailCarrito1, emailCarrito2, emailCarrito3 } from '@/lib/emails/carrito';
import { emailDunning } from '@/lib/emails/dunning';
import { emailWinback } from '@/lib/emails/retencion';
import { emailActivacionD1, emailActivacionD3, emailActivacionD7 } from '@/lib/emails/activacion';
import { emailNurturing1, emailNurturing2, emailNurturing3 } from '@/lib/emails/nurturing';

export const runtime = 'nodejs';
export const maxDuration = 60;

const DIA_MS = 86_400_000;
function diasDesde(fecha: string | Date): number {
  return (Date.now() - new Date(fecha).getTime()) / DIA_MS;
}

// ── B. Carrito abandonado — sobre checkout_intentos (nuestro propio registro
//    del clic, no un evento de Hotmart sin confirmar). ──
async function procesarCarrito(admin: SupabaseClient): Promise<number> {
  const desde = new Date(Date.now() - 10 * DIA_MS).toISOString();
  const { data: intentos } = await admin
    .from('checkout_intentos')
    .select('user_id, plan, clicked_at')
    .gte('clicked_at', desde)
    .order('clicked_at', { ascending: false });
  if (!intentos || intentos.length === 0) return 0;

  // Solo el intento MÁS RECIENTE por usuario.
  const porUsuario = new Map<string, { plan: 'pro' | 'premium'; clicked_at: string }>();
  for (const i of intentos) {
    if (!porUsuario.has(i.user_id)) porUsuario.set(i.user_id, { plan: i.plan, clicked_at: i.clicked_at });
  }

  let enviados = 0;
  for (const [userId, intento] of porUsuario) {
    const { data: perfil } = await admin.from('profiles').select('email, plan').eq('id', userId).maybeSingle();
    if (!perfil || !perfil.email || perfil.plan !== 'free') continue; // ya convirtió o no existe
    const dias = diasDesde(intento.clicked_at);
    const email = perfil.email;
    const plan = intento.plan;
    try {
      if (dias >= 6 && !(await yaSeEnvio(admin, { email, template: `carrito_3_${plan}` }))) {
        const t = emailCarrito3(plan);
        const { id } = await enviarEmail({ to: email, from: FROM_TX, subject: t.subject, html: t.html, text: t.text });
        await registrarEnvio(admin, { userId, email, template: `carrito_3_${plan}`, resendId: id });
        enviados++;
      } else if (dias >= 3 && !(await yaSeEnvio(admin, { email, template: `carrito_2_${plan}` }))) {
        const t = emailCarrito2(plan);
        const { id } = await enviarEmail({ to: email, from: FROM_TX, subject: t.subject, html: t.html, text: t.text });
        await registrarEnvio(admin, { userId, email, template: `carrito_2_${plan}`, resendId: id });
        enviados++;
      } else if (dias >= 1 && !(await yaSeEnvio(admin, { email, template: `carrito_1_${plan}` }))) {
        const t = emailCarrito1(plan);
        const { id } = await enviarEmail({ to: email, from: FROM_TX, subject: t.subject, html: t.html, text: t.text });
        await registrarEnvio(admin, { userId, email, template: `carrito_1_${plan}`, resendId: id });
        enviados++;
      }
    } catch (e) {
      console.error('cron carrito: fallo con', email, e);
    }
  }
  return enviados;
}

// ── C1. Dunning — perfiles en past_due. El día 1 ya lo mandó el webhook al
//    momento de la transición; aquí solo cubrimos 3 y 5. ──
async function procesarDunning(admin: SupabaseClient): Promise<number> {
  const { data: perfiles } = await admin.from('profiles').select('id, email, grace_ends_at').eq('status', 'past_due');
  if (!perfiles) return 0;
  let enviados = 0;
  for (const p of perfiles) {
    if (!p.email || !p.grace_ends_at) continue;
    // grace_ends_at = inicio del past_due + 5 días (ACCESS_GRACE_DAYS_PAST_DUE
    // en el webhook) → días transcurridos = 5 - días que faltan para que venza.
    const diasRestantes = Math.max(0, (new Date(p.grace_ends_at).getTime() - Date.now()) / DIA_MS);
    const diasTranscurridos = 5 - diasRestantes;
    try {
      if (diasTranscurridos >= 5 && !(await yaSeEnvio(admin, { email: p.email, template: 'dunning_5' }))) {
        const t = emailDunning(5);
        const { id } = await enviarEmail({ to: p.email, from: FROM_TX, subject: t.subject, html: t.html, text: t.text });
        await registrarEnvio(admin, { userId: p.id, email: p.email, template: 'dunning_5', resendId: id });
        enviados++;
      } else if (diasTranscurridos >= 3 && !(await yaSeEnvio(admin, { email: p.email, template: 'dunning_3' }))) {
        const t = emailDunning(3);
        const { id } = await enviarEmail({ to: p.email, from: FROM_TX, subject: t.subject, html: t.html, text: t.text });
        await registrarEnvio(admin, { userId: p.id, email: p.email, template: 'dunning_3', resendId: id });
        enviados++;
      }
    } catch (e) {
      console.error('cron dunning: fallo con', p.email, e);
    }
  }
  return enviados;
}

// ── C2. Win-back — perfiles cancelados, 30/60/90 días desde cancelled_at. ──
async function procesarWinback(admin: SupabaseClient): Promise<number> {
  const { data: perfiles } = await admin
    .from('profiles')
    .select('id, email, cancelled_at, marketing_opt_out')
    .eq('status', 'cancelled')
    .not('cancelled_at', 'is', null);
  if (!perfiles) return 0;
  let enviados = 0;
  for (const p of perfiles) {
    if (!p.email || p.marketing_opt_out) continue;
    if (await estaSuprimido(admin, p.email)) continue;
    const dias = diasDesde(p.cancelled_at!);
    try {
      if (dias >= 90 && !(await yaSeEnvio(admin, { email: p.email, template: 'winback_90' }))) {
        const t = emailWinback(90);
        const { id } = await enviarEmail({ to: p.email, from: FROM_MKT, subject: t.subject, html: t.html, text: t.text });
        await registrarEnvio(admin, { userId: p.id, email: p.email, template: 'winback_90', resendId: id });
        enviados++;
      } else if (dias >= 60 && !(await yaSeEnvio(admin, { email: p.email, template: 'winback_60' }))) {
        const t = emailWinback(60);
        const { id } = await enviarEmail({ to: p.email, from: FROM_MKT, subject: t.subject, html: t.html, text: t.text });
        await registrarEnvio(admin, { userId: p.id, email: p.email, template: 'winback_60', resendId: id });
        enviados++;
      } else if (dias >= 30 && !(await yaSeEnvio(admin, { email: p.email, template: 'winback_30' }))) {
        const t = emailWinback(30);
        const { id } = await enviarEmail({ to: p.email, from: FROM_MKT, subject: t.subject, html: t.html, text: t.text });
        await registrarEnvio(admin, { userId: p.id, email: p.email, template: 'winback_30', resendId: id });
        enviados++;
      }
    } catch (e) {
      console.error('cron winback: fallo con', p.email, e);
    }
  }
  return enviados;
}

// ── D. Activación — perfiles con first_paid_at reciente (primera semana). ──
async function procesarActivacion(admin: SupabaseClient): Promise<number> {
  const desde = new Date(Date.now() - 8 * DIA_MS).toISOString();
  const { data: perfiles } = await admin
    .from('profiles')
    .select('id, email, first_paid_at')
    .not('first_paid_at', 'is', null)
    .gte('first_paid_at', desde);
  if (!perfiles) return 0;
  let enviados = 0;
  for (const p of perfiles) {
    if (!p.email) continue;
    const dias = diasDesde(p.first_paid_at!);
    try {
      if (dias >= 7 && !(await yaSeEnvio(admin, { email: p.email, template: 'activacion_d7' }))) {
        const t = emailActivacionD7();
        const { id } = await enviarEmail({ to: p.email, from: FROM_TX, subject: t.subject, html: t.html, text: t.text });
        await registrarEnvio(admin, { userId: p.id, email: p.email, template: 'activacion_d7', resendId: id });
        enviados++;
      } else if (dias >= 3 && !(await yaSeEnvio(admin, { email: p.email, template: 'activacion_d3' }))) {
        const t = emailActivacionD3();
        const { id } = await enviarEmail({ to: p.email, from: FROM_TX, subject: t.subject, html: t.html, text: t.text });
        await registrarEnvio(admin, { userId: p.id, email: p.email, template: 'activacion_d3', resendId: id });
        enviados++;
      } else if (dias >= 1 && !(await yaSeEnvio(admin, { email: p.email, template: 'activacion_d1' }))) {
        const t = emailActivacionD1();
        const { id } = await enviarEmail({ to: p.email, from: FROM_TX, subject: t.subject, html: t.html, text: t.text });
        await registrarEnvio(admin, { userId: p.id, email: p.email, template: 'activacion_d1', resendId: id });
        enviados++;
      }
    } catch (e) {
      console.error('cron activacion: fallo con', p.email, e);
    }
  }
  return enviados;
}

// ── E. Nurturing Free→Pro — perfiles Free, registrados hace 2-16 días
//    (ventana corta: no perseguir para siempre a quien nunca fue a subir de plan). ──
async function procesarNurturing(admin: SupabaseClient): Promise<number> {
  const desde = new Date(Date.now() - 16 * DIA_MS).toISOString();
  const hasta = new Date(Date.now() - 2 * DIA_MS).toISOString();
  const { data: perfiles } = await admin
    .from('profiles')
    .select('id, email, created_at, marketing_opt_out')
    .eq('plan', 'free')
    .gte('created_at', desde)
    .lte('created_at', hasta);
  if (!perfiles) return 0;
  let enviados = 0;
  for (const p of perfiles) {
    if (!p.email || p.marketing_opt_out) continue;
    if (await estaSuprimido(admin, p.email)) continue;
    const dias = diasDesde(p.created_at);
    try {
      if (dias >= 10 && !(await yaSeEnvio(admin, { email: p.email, template: 'nurturing_3' }))) {
        const t = emailNurturing3();
        const { id } = await enviarEmail({ to: p.email, from: FROM_MKT, subject: t.subject, html: t.html, text: t.text });
        await registrarEnvio(admin, { userId: p.id, email: p.email, template: 'nurturing_3', resendId: id });
        enviados++;
      } else if (dias >= 5 && !(await yaSeEnvio(admin, { email: p.email, template: 'nurturing_2' }))) {
        const t = emailNurturing2();
        const { id } = await enviarEmail({ to: p.email, from: FROM_MKT, subject: t.subject, html: t.html, text: t.text });
        await registrarEnvio(admin, { userId: p.id, email: p.email, template: 'nurturing_2', resendId: id });
        enviados++;
      } else if (dias >= 2 && !(await yaSeEnvio(admin, { email: p.email, template: 'nurturing_1' }))) {
        const t = emailNurturing1();
        const { id } = await enviarEmail({ to: p.email, from: FROM_MKT, subject: t.subject, html: t.html, text: t.text });
        await registrarEnvio(admin, { userId: p.id, email: p.email, template: 'nurturing_1', resendId: id });
        enviados++;
      }
    } catch (e) {
      console.error('cron nurturing: fallo con', p.email, e);
    }
  }
  return enviados;
}

export async function GET(req: NextRequest) {
  // Fail-secure: sin CRON_SECRET configurado, el endpoint no corre (nadie más
  // que Vercel Cron debe poder disparar envíos masivos de correo).
  const secret = process.env.CRON_SECRET;
  if (!secret) {
    console.error('CRON_SECRET no configurado — cron de emails no puede correr');
    return NextResponse.json({ error: 'no_configurado' }, { status: 503 });
  }
  const auth = req.headers.get('authorization');
  if (auth !== `Bearer ${secret}`) {
    return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  }

  const admin = createAdminClient();
  const [carrito, dunning, winback, activacion, nurturing] = await Promise.all([
    procesarCarrito(admin),
    procesarDunning(admin),
    procesarWinback(admin),
    procesarActivacion(admin),
    procesarNurturing(admin),
  ]);

  return NextResponse.json({ ok: true, enviados: { carrito, dunning, winback, activacion, nurturing } });
}
