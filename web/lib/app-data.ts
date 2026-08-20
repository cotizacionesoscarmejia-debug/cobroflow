// Datos de la app interna — Supabase real (Sesión 6). Reemplaza la versión de
// localStorage de la Sesión 5: mismo modelo, mismas reglas de estado (se siguen
// calculando en el cliente con matemática simple, nunca en SQL — regla del SO).

import { createClient } from './supabase/client';
import { leerEstado as leerOnboarding, simboloMoneda } from './onboarding';
import { planEfectivo, type Plan } from './planes';

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

/** Agrega un proyecto a un cliente que YA existe (a diferencia de agregarClienteYProyecto). */
export async function agregarProyecto(datos: {
  clienteId: string;
  nombre: string;
  precioTotal: number;
  anticipo: number;
  fechaPromesa: string;
}): Promise<void> {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error('sin_sesion');

  const { data: proyecto, error } = await supabase
    .from('projects')
    .insert({
      user_id: user.id,
      client_id: datos.clienteId,
      nombre: datos.nombre.trim() || 'Proyecto',
      precio_total: datos.precioTotal,
      fecha_promesa: datos.fechaPromesa,
    })
    .select('id')
    .single();
  if (error || !proyecto) throw error ?? new Error('no_se_pudo_crear_proyecto');

  if (datos.anticipo > 0) {
    await supabase.from('payments').insert({ user_id: user.id, project_id: proyecto.id, monto: datos.anticipo });
  }
}

// ── Pagos y búsqueda globales — vistas derivadas para las nuevas secciones
// Proyectos/Pagos y el buscador de la barra superior. ──

export interface PagoConDatos extends Pago {
  cliente: Cliente;
  proyecto: Proyecto;
}

/** Todos los pagos del usuario, con su cliente y proyecto ya resueltos, más recientes primero. */
export function pagosConDatos(db: DB): PagoConDatos[] {
  return db.pagos
    .map((pago) => {
      const proyecto = db.proyectos.find((p) => p.id === pago.proyectoId);
      const cliente = proyecto ? db.clientes.find((c) => c.id === proyecto.clienteId) : undefined;
      if (!proyecto || !cliente) return null;
      return { ...pago, proyecto, cliente };
    })
    .filter((p): p is PagoConDatos => p !== null)
    .sort((a, b) => b.fecha.localeCompare(a.fecha));
}

export interface ResultadoBusqueda {
  tipo: 'cliente' | 'proyecto' | 'pago';
  clienteId: string;
  titulo: string;
  subtitulo: string;
}

/** Busca clientes, proyectos y pagos por nombre/monto — el buscador de la barra superior. */
export function buscarEnDB(db: DB, termino: string): ResultadoBusqueda[] {
  const t = termino.trim().toLowerCase();
  if (t.length < 2) return [];
  const resultados: ResultadoBusqueda[] = [];

  for (const c of db.clientes) {
    if (c.nombre.toLowerCase().includes(t)) {
      resultados.push({ tipo: 'cliente', clienteId: c.id, titulo: c.nombre, subtitulo: 'Cliente' });
    }
  }
  for (const p of proyectosConDatos(db)) {
    if (p.nombre.toLowerCase().includes(t)) {
      resultados.push({ tipo: 'proyecto', clienteId: p.cliente.id, titulo: p.nombre, subtitulo: `Proyecto de ${p.cliente.nombre}` });
    }
  }
  for (const g of pagosConDatos(db)) {
    if (String(g.monto).includes(t) || g.proyecto.nombre.toLowerCase().includes(t)) {
      resultados.push({
        tipo: 'pago',
        clienteId: g.cliente.id,
        titulo: `${g.cliente.moneda} ${simboloMoneda(g.cliente.moneda)}${g.monto.toLocaleString('es')}`,
        subtitulo: `Pago de ${g.cliente.nombre} · ${g.proyecto.nombre}`,
      });
    }
  }
  return resultados.slice(0, 20);
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

export function cobradoEsteAnioPorMoneda(db: DB): Record<string, number> {
  const anioActual = hoyISO(0).slice(0, 4);
  const items = db.pagos
    .filter((p) => p.fecha.slice(0, 4) === anioActual)
    .map((p) => {
      const proyecto = db.proyectos.find((pr) => pr.id === p.proyectoId);
      const cliente = proyecto ? db.clientes.find((c) => c.id === proyecto.clienteId) : undefined;
      return { moneda: cliente?.moneda ?? 'USD', monto: p.monto };
    });
  return totalesPorMoneda(items);
}

/** Total cobrado por mes, últimos N meses (por defecto 6), SOLO en una moneda. Para Estadísticas. */
export function cobradosUltimosMeses(db: DB, moneda: string, meses = 6): { mes: string; total: number }[] {
  const resultado: { mes: string; total: number }[] = [];
  const hoy = new Date();
  for (let i = meses - 1; i >= 0; i--) {
    const d = new Date(hoy.getFullYear(), hoy.getMonth() - i, 1);
    const clave = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
    const total = db.pagos
      .filter((p) => {
        const proyecto = db.proyectos.find((pr) => pr.id === p.proyectoId);
        const cliente = proyecto ? db.clientes.find((c) => c.id === proyecto.clienteId) : undefined;
        return cliente?.moneda === moneda && p.fecha.slice(0, 7) === clave;
      })
      .reduce((s, p) => s + p.monto, 0);
    resultado.push({ mes: d.toLocaleDateString('es', { month: 'short' }), total });
  }
  return resultado;
}

/** Serie diaria acumulada de cobros del mes en curso, SOLO en una moneda (nunca mezcla monedas). */
export function serieCobrosDelMes(db: DB, moneda: string): { dia: string; acumulado: number }[] {
  const hoy = new Date();
  const anio = hoy.getFullYear();
  const mes = hoy.getMonth();
  const diasEnMes = new Date(anio, mes + 1, 0).getDate();
  const pagosDelMes = db.pagos.filter((p) => {
    const proyecto = db.proyectos.find((pr) => pr.id === p.proyectoId);
    const cliente = proyecto ? db.clientes.find((c) => c.id === proyecto.clienteId) : undefined;
    return cliente?.moneda === moneda && p.fecha.slice(0, 7) === hoyISO(0).slice(0, 7);
  });
  const porDia: Record<number, number> = {};
  for (const p of pagosDelMes) {
    const dia = Number(p.fecha.slice(8, 10));
    porDia[dia] = (porDia[dia] ?? 0) + p.monto;
  }
  const serie: { dia: string; acumulado: number }[] = [];
  let acumulado = 0;
  const hastaDia = hoy.getMonth() === mes && hoy.getFullYear() === anio ? hoy.getDate() : diasEnMes;
  for (let d = 1; d <= hastaDia; d++) {
    acumulado += porDia[d] ?? 0;
    serie.push({ dia: String(d), acumulado });
  }
  return serie;
}

export function cobradoMesAnteriorPorMoneda(db: DB): Record<string, number> {
  const d = new Date();
  d.setDate(1);
  d.setMonth(d.getMonth() - 1);
  const mesAnterior = d.toISOString().slice(0, 7);
  const items = db.pagos
    .filter((p) => p.fecha.slice(0, 7) === mesAnterior)
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
  /** Estado crudo de la suscripción (nunca para dar/quitar acceso — eso ya lo
   * resuelve planEfectivo() en `plan`. Solo para mostrar el banner de pago
   * atrasado en la UI). */
  status: string;
}

// ── Identidad: nombre y apellido en vez del correo como identificador visual. ──

export interface Perfil {
  email: string;
  nombre: string;
  apellido: string;
  nombreNegocio: string;
}

export async function obtenerPerfil(): Promise<Perfil> {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { email: '', nombre: '', apellido: '', nombreNegocio: '' };
  const { data } = await supabase.from('profiles').select('nombre, apellido, nombre_negocio').eq('id', user.id).single();
  return {
    email: user.email ?? '',
    nombre: data?.nombre ?? '',
    apellido: data?.apellido ?? '',
    nombreNegocio: data?.nombre_negocio ?? '',
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

// ── Recorrido guiado inicial: un flag por cuenta, se muestra una sola vez. ──

export async function obtenerTourCompletado(): Promise<boolean> {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return true;
  const { data } = await supabase.from('profiles').select('tour_completado').eq('id', user.id).single();
  return data?.tour_completado ?? false;
}

export async function marcarTourCompletado(): Promise<void> {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return;
  await supabase.from('profiles').update({ tour_completado: true }).eq('id', user.id);
}

export async function actualizarNegocio(nombreNegocio: string): Promise<void> {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error('sin_sesion');
  const { error } = await supabase.from('profiles').update({ nombre_negocio: nombreNegocio }).eq('id', user.id);
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
  if (!user) return { plan: 'free', monedaPrincipal: 'USD', status: 'free' };
  const { data } = await supabase
    .from('profiles')
    .select('plan, status, access_until, grace_ends_at, moneda_principal')
    .eq('id', user.id)
    .single();
  if (!data) return { plan: 'free', monedaPrincipal: 'USD', status: 'free' };
  return {
    plan: planEfectivo({
      plan: (data.plan as Plan) ?? 'free',
      status: data.status ?? 'free',
      accessUntil: data.access_until,
      graceEndsAt: data.grace_ends_at,
    }),
    monedaPrincipal: data.moneda_principal ?? 'USD',
    status: data.status ?? 'free',
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

// ── Meta mensual y proyección de flujo (Premium) — matemática determinística,
// nunca IA (regla dura del proyecto: la IA solo interpreta, jamás calcula). ──

export async function obtenerMetaMensual(): Promise<number | null> {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;
  const { data } = await supabase.from('profiles').select('meta_mensual').eq('id', user.id).single();
  return data?.meta_mensual != null ? Number(data.meta_mensual) : null;
}

export async function actualizarMetaMensual(monto: number | null): Promise<void> {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error('sin_sesion');
  const { error } = await supabase.from('profiles').update({ meta_mensual: monto }).eq('id', user.id);
  if (error) throw error;
}

export interface PuntoProyeccion {
  mes: string;
  /** Ingreso bruto proyectado (suma de saldos que vencen ese mes). */
  esperado: number;
  /** esperado - gastos recurrentes de esa moneda (0 si no se pasan gastos). */
  neto: number;
}

/**
 * Proyección de flujo: cuánto espera cobrar por mes en los próximos `meses`,
 * SOLO en una moneda (nunca mezcla monedas). El primer punto agrupa todo lo
 * atrasado + lo que vence este mes ("esperado ahora"); los siguientes son
 * exactamente lo que vence en ese mes. Es una suma de saldos ya registrados
 * con su fecha de vencimiento — cero adivinanza, cero IA.
 * `gastosRecurrentes` (Premium): gastos marcados como recurrentes se asumen
 * iguales cada mes y se restan del bruto para dar el neto esperado.
 */
export function proyeccionFlujo(db: DB, moneda: string, meses = 6, gastosRecurrentes: Gasto[] = []): PuntoProyeccion[] {
  const pendientes = proyectosConDatos(db).filter((p) => p.saldo > 0 && p.cliente.moneda === moneda);
  const gastoRecurrenteMensual = gastosRecurrentes
    .filter((g) => g.recurrente && g.moneda === moneda)
    .reduce((s, g) => s + g.monto, 0);
  const hoy = new Date();
  const resultado: PuntoProyeccion[] = [];
  for (let i = 0; i < meses; i++) {
    const d = new Date(hoy.getFullYear(), hoy.getMonth() + i, 1);
    const claveMes = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
    let esperado = 0;
    for (const p of pendientes) {
      const clave = p.fechaPromesa.slice(0, 7);
      if (i === 0 ? clave <= claveMes : clave === claveMes) esperado += p.saldo;
    }
    resultado.push({ mes: d.toLocaleDateString('es', { month: 'short' }), esperado, neto: esperado - gastoRecurrenteMensual });
  }
  return resultado;
}

// ── Gastos (Pro+; categorías y recurrencia solo Premium) — para la utilidad
// neta (cobrado - gastado) y para restar recurrentes de la Proyección de flujo. ──

export interface Gasto {
  id: string;
  monto: number;
  moneda: string;
  categoria: string | null;
  descripcion: string;
  fecha: string;
  recurrente: boolean;
}

export const CATEGORIAS_GASTO = [
  'Software y herramientas',
  'Transporte',
  'Contratistas y freelancers',
  'Marketing y publicidad',
  'Oficina y suministros',
  'Otro',
] as const;

export async function obtenerGastos(): Promise<Gasto[]> {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return [];
  const { data } = await supabase
    .from('expenses')
    .select('id, monto, moneda, categoria, descripcion, fecha, recurrente')
    .eq('user_id', user.id)
    .order('fecha', { ascending: false });
  return (data ?? []).map((g) => ({
    id: g.id,
    monto: Number(g.monto),
    moneda: g.moneda,
    categoria: g.categoria,
    descripcion: g.descripcion ?? '',
    fecha: g.fecha,
    recurrente: g.recurrente,
  }));
}

export async function agregarGasto(datos: {
  monto: number;
  moneda: string;
  categoria: string | null;
  descripcion: string;
  fecha: string;
  recurrente: boolean;
}): Promise<void> {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error('sin_sesion');
  const { error } = await supabase.from('expenses').insert({
    user_id: user.id,
    monto: datos.monto,
    moneda: datos.moneda,
    categoria: datos.categoria,
    descripcion: datos.descripcion,
    fecha: datos.fecha,
    recurrente: datos.recurrente,
  });
  if (error) throw error;
}

export async function eliminarGasto(id: string): Promise<void> {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error('sin_sesion');
  const { error } = await supabase.from('expenses').delete().eq('id', id).eq('user_id', user.id);
  if (error) throw error;
}

export function gastadoEsteMesPorMoneda(gastos: Gasto[]): Record<string, number> {
  const mesActual = hoyISO(0).slice(0, 7);
  const items = gastos.filter((g) => g.fecha.slice(0, 7) === mesActual).map((g) => ({ moneda: g.moneda, monto: g.monto }));
  return totalesPorMoneda(items);
}

/** Gastado por categoría este mes, SOLO en una moneda — para el desglose Premium. */
export function gastadoPorCategoria(gastos: Gasto[], moneda: string): { categoria: string; total: number }[] {
  const mesActual = hoyISO(0).slice(0, 7);
  const mapa = new Map<string, number>();
  for (const g of gastos) {
    if (g.moneda !== moneda || g.fecha.slice(0, 7) !== mesActual) continue;
    const cat = g.categoria ?? 'Sin categoría';
    mapa.set(cat, (mapa.get(cat) ?? 0) + g.monto);
  }
  return Array.from(mapa.entries())
    .map(([categoria, total]) => ({ categoria, total }))
    .sort((a, b) => b.total - a.total);
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
