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
    // Proyección de flujo y metas mensuales NO existen todavía en CobroFlow —
    // se dejan en `false` a propósito (nunca mostrar una función que no
    // existe de verdad). El día que se construyan, solo cambia esta línea.
    canUseForecasting: false,
    canUseGoals: false,
    canUseReminderTemplates: true,
  },
};

export function capacidadesDe(plan: Plan): Capacidades {
  return CAPACIDADES[plan] ?? CAPACIDADES.free;
}

export const NOMBRE_PLAN: Record<Plan, string> = { free: 'Free', pro: 'Pro', premium: 'Premium' };

/** A qué plan hay que subir para desbloquear una capacidad — para el CTA "Mejorar a X". */
export function planQueDesbloquea(capacidad: keyof Capacidades): 'pro' | 'premium' {
  if (CAPACIDADES.pro[capacidad]) return 'pro';
  return 'premium';
}
