// Datos de la app interna — localStorage hasta que exista Supabase real (Sesión 6).
// Semilla realista siempre presente ("la app nunca se enseña vacía", 32-DEL-MVP-AL-PRODUCTO)
// + migración del primer cliente que el usuario cargó en el onboarding, si existe.

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

interface DB {
  clientes: Cliente[];
  proyectos: Proyecto[];
  pagos: Pago[];
}

const KEY = 'cobroflow_app_data';

function hoyISO(offsetDias = 0): string {
  const d = new Date();
  d.setDate(d.getDate() + offsetDias);
  return d.toISOString().slice(0, 10);
}

function semilla(): DB {
  const clientes: Cliente[] = [
    { id: 'c1', nombre: 'Clínica Nova', telefono: '', moneda: 'USD', creadoEn: hoyISO(-30) },
    { id: 'c2', nombre: 'Restaurante Verde', telefono: '', moneda: 'USD', creadoEn: hoyISO(-20) },
    { id: 'c3', nombre: 'María López', telefono: '', moneda: 'USD', creadoEn: hoyISO(-45) },
  ];
  const proyectos: Proyecto[] = [
    { id: 'p1', clienteId: 'c1', nombre: 'Página Web Profesional', precioTotal: 900, fechaPromesa: hoyISO(-6) },
    { id: 'p2', clienteId: 'c2', nombre: 'Landing Page', precioTotal: 450, fechaPromesa: hoyISO(0) },
    { id: 'p3', clienteId: 'c3', nombre: 'Automatización', precioTotal: 600, fechaPromesa: hoyISO(-15) },
  ];
  const pagos: Pago[] = [
    { id: 'g1', proyectoId: 'p1', monto: 450, fecha: hoyISO(-4) },
    { id: 'g2', proyectoId: 'p3', monto: 600, fecha: hoyISO(-2) },
  ];
  return { clientes, proyectos, pagos };
}

function leerDB(): DB {
  if (typeof window === 'undefined') return { clientes: [], proyectos: [], pagos: [] };
  const raw = window.localStorage.getItem(KEY);
  if (raw) {
    try {
      return JSON.parse(raw) as DB;
    } catch {
      // Datos corruptos: NUNCA sobreescribir en silencio — se respaldan bajo otra
      // llave (recuperables a mano) antes de reiniciar con la semilla.
      try {
        window.localStorage.setItem(`${KEY}_corrupto_${Date.now()}`, raw);
      } catch {
        // localStorage sin espacio/bloqueado — igual seguimos con la semilla
      }
    }
  }
  const db = semilla();
  // Migra el primer cliente del onboarding, si existe y no coincide con la semilla.
  const ob = leerOnboarding();
  if (ob.primerCliente && ob.primerCliente.nombre && !db.clientes.some((c) => c.nombre === ob.primerCliente!.nombre)) {
    const clienteId = 'c-onb';
    const proyectoId = 'p-onb';
    db.clientes.unshift({ id: clienteId, nombre: ob.primerCliente.nombre, moneda: ob.moneda ?? 'USD', creadoEn: hoyISO(0) });
    db.proyectos.unshift({
      id: proyectoId,
      clienteId,
      nombre: ob.primerCliente.proyecto || 'Proyecto',
      precioTotal: ob.primerCliente.total,
      fechaPromesa: hoyISO(7),
    });
    if (ob.primerCliente.anticipo > 0) {
      db.pagos.unshift({ id: 'g-onb', proyectoId, monto: ob.primerCliente.anticipo, fecha: hoyISO(0) });
    }
  }
  guardarDB(db);
  return db;
}

function guardarDB(db: DB): void {
  try {
    window.localStorage.setItem(KEY, JSON.stringify(db));
  } catch {
    // localStorage bloqueado — la sesión sigue, solo sin persistencia
  }
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

// Nombre sin prefijo "use": no es un hook de React (no usa useState/useEffect
// internamente) — llamarlo "useDB" confundiría al linter de reglas de hooks,
// ya que se invoca dentro de handlers y efectos, no en el nivel superior.
export function obtenerDB(): DB {
  return leerDB();
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

export function agregarClienteYProyecto(
  db: DB,
  datos: { nombre: string; moneda: string; proyecto: string; precioTotal: number; anticipo: number; fechaPromesa: string }
): DB {
  const clienteId = `c-${Date.now()}`;
  const proyectoId = `p-${Date.now()}`;
  const nuevo: DB = {
    clientes: [{ id: clienteId, nombre: datos.nombre, moneda: datos.moneda, creadoEn: hoyISO(0) }, ...db.clientes],
    proyectos: [
      { id: proyectoId, clienteId, nombre: datos.proyecto || 'Proyecto', precioTotal: datos.precioTotal, fechaPromesa: datos.fechaPromesa },
      ...db.proyectos,
    ],
    pagos: datos.anticipo > 0 ? [{ id: `g-${Date.now()}`, proyectoId, monto: datos.anticipo, fecha: hoyISO(0) }, ...db.pagos] : db.pagos,
  };
  guardarDB(nuevo);
  return nuevo;
}

export function registrarPago(db: DB, proyectoId: string, monto: number): DB {
  const nuevo: DB = {
    ...db,
    pagos: [{ id: `g-${Date.now()}`, proyectoId, monto, fecha: hoyISO(0) }, ...db.pagos],
  };
  guardarDB(nuevo);
  return nuevo;
}

export function cobradoEsteMes(db: DB): number {
  const mesActual = hoyISO(0).slice(0, 7);
  return db.pagos.filter((p) => p.fecha.slice(0, 7) === mesActual).reduce((s, p) => s + p.monto, 0);
}
