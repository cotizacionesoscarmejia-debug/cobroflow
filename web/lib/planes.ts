// Fuente ÚNICA de verdad para lo que puede hacer cada plan (rediseño integral,
// Sesión 6). El control REAL de límites duros (clientes/proyectos/moneda) ya
// vive en Postgres (trigger `valida_limite_free`, ver supabase/migrations) —
// este archivo es la fuente de verdad del LADO DE LA INTERFAZ: qué mostrar,
// qué bloquear con elegancia, y los mismos límites para mostrarlos ANTES de
// que el usuario choque con el error del servidor (no para reemplazar la
// validación del servidor, solo para no hacerlo esperar el rebote).
//
// Nunca ocultar una función Pro/Premium con solo CSS: todo componente que
// dependa de una capacidad debe leerla de aquí, nunca inventar su propio
// `if (plan === 'premium')` disperso.

export type Plan = 'free' | 'pro' | 'premium';

export interface Capacidades {
  limiteClientes: number | null;
  limiteProyectos: number | null;
  canUseAdvancedReports: boolean;
  canUseCharts: boolean;
  canUseMultipleCurrencies: boolean;
  canExportCSV: boolean;
  canExportPDF: boolean;
  canUseAI: boolean;
  canUseForecasting: boolean;
  canUseGoals: boolean;
  canUseReminderTemplates: boolean;
  canUseExpenses: boolean;
  canCategorizeExpenses: boolean;
}

const CAPACIDADES: Record<Plan, Capacidades> = {
  free: {
    limiteClientes: 3,
    limiteProyectos: 5,
    canUseAdvancedReports: false,
    canUseCharts: false,
    canUseMultipleCurrencies: false,
    canExportCSV: false,
    canExportPDF: false,
    canUseAI: false,
    canUseForecasting: false,
    canUseGoals: false,
    canUseReminderTemplates: false,
    canUseExpenses: false,
    canCategorizeExpenses: false,
  },
  pro: {
    limiteClientes: null,
    limiteProyectos: null,
    canUseAdvancedReports: true,
    canUseCharts: true,
    canUseMultipleCurrencies: true,
    canExportCSV: true,
    canExportPDF: true,
    canUseAI: false,
    canUseForecasting: false,
    canUseGoals: false,
    canUseReminderTemplates: true,
    canUseExpenses: true,
    canCategorizeExpenses: false,
  },
  premium: {
    limiteClientes: null,
    limiteProyectos: null,
    canUseAdvancedReports: true,
    canUseCharts: true,
    canUseMultipleCurrencies: true,
    canExportCSV: true,
    canExportPDF: true,
    canUseAI: true,
    canUseForecasting: true,
    canUseGoals: true,
    canUseReminderTemplates: true,
    canUseExpenses: true,
    canCategorizeExpenses: true,
  },
};

export function capacidadesDe(plan: Plan): Capacidades {
  return CAPACIDADES[plan] ?? CAPACIDADES.free;
}

export const NOMBRE_PLAN: Record<Plan, string> = { free: 'Free', pro: 'Pro', premium: 'Premium' };

/**
 * El plan REAL vigente hoy — nunca confiar solo en la columna `plan` de
 * `profiles`. El webhook de Hotmart (apply_hotmart_event) guarda `plan` como
 * el último plan pagado, pero deja la EXPIRACIÓN en `access_until` (cancelado
 * — sigue con acceso hasta el fin del ciclo ya pagado) y `grace_ends_at`
 * (pago atrasado — colchón de dunning). Nada más en el proyecto volvía a leer
 * esas dos columnas, así que una cuenta cancelada o con reembolso/chargeback
 * se quedaba con el plan pagado PARA SIEMPRE (auditoría, hallazgo crítico #1).
 * Esta función es la ÚNICA fuente de verdad del plan efectivo — todo lugar
 * que lea `profiles.plan` para dar acceso (UI o servidor) debe pasar por acá.
 */
export function planEfectivo(perfil: {
  plan: Plan;
  status: string;
  accessUntil: string | null;
  graceEndsAt: string | null;
}): Plan {
  const ahora = Date.now();
  switch (perfil.status) {
    case 'active':
      return perfil.plan;
    case 'past_due':
      return perfil.graceEndsAt && new Date(perfil.graceEndsAt).getTime() > ahora ? perfil.plan : 'free';
    case 'cancelled':
      return perfil.accessUntil && new Date(perfil.accessUntil).getTime() > ahora ? perfil.plan : 'free';
    default:
      // 'free' | 'expired' | 'refunded' | 'chargeback' | cualquier otro: sin acceso pagado.
      return 'free';
  }
}

/** A qué plan hay que subir para desbloquear una capacidad — para el CTA "Mejorar a X". */
export function planQueDesbloquea(capacidad: keyof Capacidades): 'pro' | 'premium' {
  if (CAPACIDADES.pro[capacidad]) return 'pro';
  return 'premium';
}
