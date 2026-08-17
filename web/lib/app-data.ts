// Datos de la app interna — Supabase real (Sesión 6). Reemplaza la versión de
// localStorage de la Sesión 5: mismo modelo, mismas reglas de estado (se siguen
// calculando en el cliente con matemática simple, nunca en SQL — regla del SO).

import { createClient } from './supabase/client';
import { leerEstado as leerOnboarding } from './onboarding';

export interface Cliente {
  id: string;
  nombre: string;
  telefono?: string;
  moneda: string;
  creadoEn: string;
}

export interface Proyecto {
  id: string;
  clienteId: string;
  nombre: string;
  precioTotal: number;
  /** Fecha ISO en la que se espera terminar de cobrar el saldo. */
  fechaPromesa: string;
}

export interface Pago {
  id: string;
  proyectoId: string;
  monto: number;
  fecha: string;
}

export type EstadoCobro = 'pagado' | 'atrasado' | 'vence_hoy' | 'proximo' | 'al_dia';

export interface DB {
  clientes: Cliente[];
  proyectos: Proyecto[];
  pagos: Pago[];
}

function hoyISO(offsetDias = 0): string {
  const d = new Date();
  d.setDate(d.getDate() + offsetDias);
  return d.toISOString().slice(0, 10);
}

// Trae TODOS los clientes/proyectos/pagos del usuario logueado (RLS solo deja
// ver los propios, pero igual filtramos por user_id — defensa en profundidad).
export async function obtenerDB(): Promise<DB> {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { clientes: [], proyectos: [], pagos: [] };

  const [{ data: clientesRaw }, { data: proyectosRaw }, { data: pagosRaw }] = await Promise.all([
    supabase.from('clients').select('id, nombre, telefono, moneda, created_at').eq('user_id', user.id),
    supabase.from('projects').select('id, client_id, nombre, precio_total, fecha_promesa').eq('user_id', user.id),
    supabase.from('payments').select('id, project_id, monto, fecha').eq('user_id', user.id),
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

export function saldoProyecto(db: DB, proyectoId: string): number {
  const pagado = db.pagos.filter((p) => p.proyectoId === proyectoId).reduce((s, p) => s + p.monto, 0);
  const proyecto = db.proyectos.find((p) => p.id === proyectoId);
  return Math.max(0, (proyecto?.precioTotal ?? 0) - pagado);
}

export function pagadoProyecto(db: DB, proyectoId: string): number {
  return db.pagos.filter((p) => p.proyectoId === proyectoId).reduce((s, p) => s + p.monto, 0);
}

export function estadoProyecto(proyecto: Proyecto, saldo: number): EstadoCobro {
  if (saldo <= 0) return 'pagado';
  const hoy = hoyISO(0);
  if (proyecto.fechaPromesa < hoy) return 'atrasado';
  if (proyecto.fechaPromesa === hoy) return 'vence_hoy';
  const en7dias = hoyISO(7);
  if (proyecto.fechaPromesa <= en7dias) return 'proximo';
  return 'al_dia';
}

export function diasAtraso(proyecto: Proyecto): number {
  const hoy = new Date(hoyISO(0));
  const promesa = new Date(proyecto.fechaPromesa);
  return Math.max(0, Math.round((hoy.getTime() - promesa.getTime()) / 86400000));
}

export interface ProyectoConDatos extends Proyecto {
  cliente: Cliente;
  saldo: number;
  pagado: number;
  estado: EstadoCobro;
}

export function proyectosConDatos(db: DB): ProyectoConDatos[] {
  return db.proyectos.map((p) => {
    const saldo = saldoProyecto(db, p.id);
    return {
      ...p,
      cliente: db.clientes.find((c) => c.id === p.clienteId)!,
      saldo,
      pagado: pagadoProyecto(db, p.id),
      estado: estadoProyecto(p, saldo),
    };
  });
}

export async function agregarClienteYProyecto(
  _db: DB,
  datos: { nombre: string; moneda: string; proyecto: string; precioTotal: number; anticipo: number; fechaPromesa: string }
): Promise<void> {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error('sin_sesion');

  const { data: cliente, error: errCliente } = await supabase
    .from('clients')
    .insert({ user_id: user.id, nombre: datos.nombre, moneda: datos.moneda })
    .select('id')
    .single();
  if (errCliente || !cliente) throw errCliente ?? new Error('no_se_pudo_crear_cliente');

  const { data: proyecto, error: errProyecto } = await supabase
    .from('projects')
    .insert({
      user_id: user.id,
      client_id: cliente.id,
      nombre: datos.proyecto || 'Proyecto',
      precio_total: datos.precioTotal,
      fecha_promesa: datos.fechaPromesa,
    })
    .select('id')
    .single();
  if (errProyecto || !proyecto) throw errProyecto ?? new Error('no_se_pudo_crear_proyecto');

  if (datos.anticipo > 0) {
    await supabase.from('payments').insert({ user_id: user.id, project_id: proyecto.id, monto: datos.anticipo });
  }
}

export async function registrarPago(_db: DB, proyectoId: string, monto: number): Promise<void> {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error('sin_sesion');
  await supabase.from('payments').insert({ user_id: user.id, project_id: proyectoId, monto });
}

export function cobradoEsteMes(db: DB): number {
  const mesActual = hoyISO(0).slice(0, 7);
  return db.pagos.filter((p) => p.fecha.slice(0, 7) === mesActual).reduce((s, p) => s + p.monto, 0);
}

export function cobradoEsteMesPorMoneda(db: DB): Record<string, number> {
  const mesActual = hoyISO(0).slice(0, 7);
  const items = db.pagos
    .filter((p) => p.fecha.slice(0, 7) === mesActual)
    .map((p) => {
      const proyecto = db.proyectos.find((pr) => pr.id === p.proyectoId);
      const cliente = proyecto ? db.clientes.find((c) => c.id === proyecto.clienteId) : undefined;
      return { moneda: cliente?.moneda ?? 'USD', monto: p.monto };
    });
  return totalesPorMoneda(items);
}

// ── Multimoneda: nunca sumar montos de monedas distintas — se agrupan por
// código de moneda y, si hay tasa configurada, se ofrece un total consolidado
// aparte (nunca oculto: siempre se puede ver el desglose real). ──

export interface TasaCambio {
  monedaOrigen: string;
  monedaDestino: string;
  tasa: number;
  actualizadoEn: string;
}

export interface PerfilMoneda {
  plan: 'free' | 'pro' | 'premium';
  monedaPrincipal: string;
}

// ── Identidad: nombre y apellido en vez del correo como identificador visual. ──

export interface Perfil {
  email: string;
  nombre: string;
  apellido: string;
}

export async function obtenerPerfil(): Promise<Perfil> {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { email: '', nombre: '', apellido: '' };
  const { data } = await supabase.from('profiles').select('nombre, apellido').eq('id', user.id).single();
  return {
    email: user.email ?? '',
    nombre: data?.nombre ?? '',
    apellido: data?.apellido ?? '',
  };
}

export async function actualizarNombre(nombre: string, apellido: string): Promise<void> {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error('sin_sesion');
  const { error } = await supabase.from('profiles').update({ nombre, apellido }).eq('id', user.id);
  if (error) throw error;
}

/** "Nombre Apellido" si ya se cargó; si no, un nombre derivado del correo (mismo criterio que antes). */
export function nombreParaMostrar(perfil: { nombre: string; apellido: string; email: string }): string {
  const completo = `${perfil.nombre} ${perfil.apellido}`.trim();
  if (completo) return completo;
  return perfil.email ? perfil.email.split('@')[0].replace(/[._]/g, ' ') : '';
}

export function inicialesParaMostrar(perfil: { nombre: string; apellido: string; email: string }): string {
  if (perfil.nombre || perfil.apellido) {
    const i1 = perfil.nombre.trim().charAt(0);
    const i2 = perfil.apellido.trim().charAt(0);
    const iniciales = `${i1}${i2}`.toUpperCase();
    if (iniciales) return iniciales;
  }
  return perfil.email ? perfil.email.slice(0, 2).toUpperCase() : '··';
}

export async function obtenerPerfilMoneda(): Promise<PerfilMoneda> {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { plan: 'free', monedaPrincipal: 'USD' };
  const { data } = await supabase.from('profiles').select('plan, moneda_principal').eq('id', user.id).single();
  return {
    plan: (data?.plan as 'free' | 'pro' | 'premium') ?? 'free',
    monedaPrincipal: data?.moneda_principal ?? 'USD',
  };
}

export async function actualizarMonedaPrincipal(moneda: string): Promise<void> {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error('sin_sesion');
  const { error } = await supabase.from('profiles').update({ moneda_principal: moneda }).eq('id', user.id);
  if (error) throw error;
}

export async function obtenerTasas(): Promise<TasaCambio[]> {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return [];
  const { data } = await supabase
    .from('exchange_rates')
    .select('moneda_origen, moneda_destino, tasa, actualizado_en')
    .eq('user_id', user.id);
  return (data ?? []).map((t) => ({
    monedaOrigen: t.moneda_origen,
    monedaDestino: t.moneda_destino,
    tasa: Number(t.tasa),
    actualizadoEn: (t.actualizado_en as string).slice(0, 10),
  }));
}

export async function guardarTasa(monedaOrigen: string, monedaDestino: string, tasa: number): Promise<void> {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error('sin_sesion');
  const { error } = await supabase
    .from('exchange_rates')
    .upsert(
      { user_id: user.id, moneda_origen: monedaOrigen, moneda_destino: monedaDestino, tasa, actualizado_en: hoyISO(0) },
      { onConflict: 'user_id,moneda_origen,moneda_destino' }
    );
  if (error) throw error;
}

/** Agrupa montos por moneda — la única forma correcta de sumar en una app multimoneda. */
export function totalesPorMoneda(items: { moneda: string; monto: number }[]): Record<string, number> {
  const totales: Record<string, number> = {};
  for (const item of items) {
    totales[item.moneda] = (totales[item.moneda] ?? 0) + item.monto;
  }
  return totales;
}

/**
 * Convierte un total consolidado a la moneda principal SOLO si existe tasa
 * configurada para cada moneda distinta de la principal. Si falta alguna,
 * no inventa el total: devuelve qué monedas faltan por configurar.
 */
export function totalConsolidado(
  totalesPorMonedaMap: Record<string, number>,
  monedaPrincipal: string,
  tasas: TasaCambio[]
): { total: number; faltantes: string[] } {
  let total = 0;
  const faltantes: string[] = [];
  for (const [moneda, monto] of Object.entries(totalesPorMonedaMap)) {
    if (moneda === monedaPrincipal) {
      total += monto;
      continue;
    }
    const tasa = tasas.find((t) => t.monedaOrigen === moneda && t.monedaDestino === monedaPrincipal);
    if (!tasa) {
      faltantes.push(moneda);
      continue;
    }
    total += monto * tasa.tasa;
  }
  return { total, faltantes };
}

// Migra el primer cliente cargado en el onboarding (sessionStorage) a la cuenta
// real recién creada — se llama una sola vez desde /confirmar tras el login.
export async function migrarClienteDeOnboarding(): Promise<void> {
  const ob = leerOnboarding();
  if (!ob.primerCliente || !ob.primerCliente.nombre) return;
  await agregarClienteYProyecto(
    { clientes: [], proyectos: [], pagos: [] },
    {
      nombre: ob.primerCliente.nombre,
      moneda: ob.moneda ?? 'USD',
      proyecto: ob.primerCliente.proyecto,
      precioTotal: ob.primerCliente.total,
      anticipo: ob.primerCliente.anticipo,
      fechaPromesa: hoyISO(7),
    }
  );
}
