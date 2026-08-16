// Estado del onboarding — vive en sessionStorage hasta que exista Supabase real
// (Sesión 6). Igual que en English2Hire: el registro real (Sesión 6) migra este
// mismo objeto a la cuenta del usuario en vez de perderlo.

export interface PrimerCliente {
  nombre: string;
  proyecto: string;
  total: number;
  anticipo: number;
}

export interface EstadoOnboarding {
  perfil?: string;
  moneda?: string;
  primerCliente?: PrimerCliente;
  planElegido?: 'free' | 'pro' | 'premium';
}

const KEY = 'cobroflow_onboarding';

export function leerEstado(): EstadoOnboarding {
  if (typeof window === 'undefined') return {};
  try {
    const raw = window.sessionStorage.getItem(KEY);
    return raw ? (JSON.parse(raw) as EstadoOnboarding) : {};
  } catch {
    return {};
  }
}

export function guardarEstado(parcial: Partial<EstadoOnboarding>): EstadoOnboarding {
  const actual = leerEstado();
  const nuevo = { ...actual, ...parcial };
  try {
    window.sessionStorage.setItem(KEY, JSON.stringify(nuevo));
  } catch {
    // sessionStorage bloqueado (privado/incógnito) — el flujo sigue, solo sin persistencia
  }
  return nuevo;
}

export function saldoPendiente(c: PrimerCliente): number {
  return Math.max(0, c.total - c.anticipo);
}

export const MONEDAS = ['USD', 'MXN', 'COP', 'ARS', 'PEN', 'CLP'] as const;

export const PERFILES = [
  'Freelancer',
  'Profesional independiente',
  'Agencia pequeña',
  'Microempresa',
] as const;
