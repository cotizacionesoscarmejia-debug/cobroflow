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
  /** Ciclo de pago elegido para un plan pago (hoy solo aplica a Premium Anual,
   *  panel de expertos item #10 — el plan sigue siendo 'premium', esto solo
   *  decide qué oferta de Hotmart usar). Default implícito 'mensual'. */
  cicloElegido?: 'mensual' | 'anual';
  nombre?: string;
  apellido?: string;
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

export const MONEDAS = ['USD', 'MXN', 'COP', 'ARS', 'PEN', 'CLP', 'GTQ'] as const;

// El símbolo real de cada moneda — no todas usan "$" (el quetzal usa "Q", el sol peruano "S/").
// Mostrar "GTQ $" mezcla el símbolo del dólar con el código del quetzal; esto lo evita.
const SIMBOLOS_MONEDA: Record<string, string> = {
  USD: '$',
  MXN: '$',
  COP: '$',
  ARS: '$',
  PEN: 'S/',
  CLP: '$',
  GTQ: 'Q',
};

export function simboloMoneda(moneda?: string): string {
  return SIMBOLOS_MONEDA[moneda ?? 'USD'] ?? '$';
}

// Preselección de moneda por región del navegador (auditoría, hallazgo del
// paso "moneda" del onboarding: 7 chips en paridad sin ninguna preselección
// violaba el límite de ≤4 opciones simultáneas sin ayuda). Es solo una
// SUGERENCIA visual — la persona sigue pudiendo tocar cualquier otra moneda,
// nunca se avanza de paso solo por la preselección.
const MONEDA_POR_PAIS: Record<string, (typeof MONEDAS)[number]> = {
  MX: 'MXN',
  CO: 'COP',
  AR: 'ARS',
  PE: 'PEN',
  CL: 'CLP',
  GT: 'GTQ',
};

export function monedaSugerida(): (typeof MONEDAS)[number] {
  if (typeof navigator === 'undefined') return 'USD';
  const idiomas = navigator.languages && navigator.languages.length > 0 ? navigator.languages : [navigator.language];
  for (const idioma of idiomas) {
    const pais = idioma?.split('-')[1]?.toUpperCase();
    if (pais && MONEDA_POR_PAIS[pais]) return MONEDA_POR_PAIS[pais];
  }
  return 'USD';
}

export const PERFILES = [
  'Freelancer',
  'Profesional independiente',
  'Agencia pequeña',
  'Microempresa',
] as const;
