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
