// C1 — dunning (pago fallido), 58-RETENCION-DE-INGRESOS.md. Tono servicial, NO
// acusatorio (no fue su culpa, fue la tarjeta) — escalando urgencia real día a
// día. El CTA va al portal de Hotmart, único lugar donde de verdad se actualiza
// el método de pago.
//
// Cadencia adaptada a 1/3/5 (no 1/3/5/7 del doctrina genérica): la gracia real
// configurada en el webhook (ACCESS_GRACE_DAYS_PAST_DUE, route.ts) es de 5
// días, no 7 — un email de "día 7" caería después de que el acceso ya bajó a
// Free, así que el día 5 absorbe el mensaje de "último día".

import { plantillaBase, textoPlano } from './layout';
export { BANNER_PAST_DUE } from '../dunning-banner';

const HOTMART_URL = 'https://consumer.hotmart.com';

const DUNNING: Record<1 | 3 | 5, { subject: string; subjectAlt: string; titulo: string; cuerpo: string }> = {
  1: {
    subject: 'No pudimos procesar tu pago de CobroFlow',
    subjectAlt: 'Hubo un problema con tu método de pago',
    titulo: 'No pudimos cobrar tu suscripción',
    cuerpo: `
      <p>Intentamos cobrar tu suscripción y no se pudo procesar — suele ser algo simple, como
      la tarjeta vencida o el límite del mes.</p>
      <p>Por ahora sigues con acceso completo mientras lo resuelves. Actualiza tu método de pago
      en tu portal de Hotmart y listo.</p>
    `,
  },
  3: {
    subject: 'Recordatorio: actualiza tu método de pago en CobroFlow',
    subjectAlt: 'Tu acceso a CobroFlow depende de esto',
    titulo: 'Un recordatorio rápido',
    cuerpo: `
      <p>Tu pago sigue sin procesarse. Mientras tanto conservas el acceso a tus clientes,
      proyectos y cobros — pero eso tiene un límite de días.</p>
      <p>Actualizar tu tarjeta toma un minuto y evita que pierdas el seguimiento de a quién le
      debes cobrar.</p>
    `,
  },
  5: {
    subject: 'Hoy es el último día antes de suspender tu plan',
    subjectAlt: 'Último aviso: tu plan se suspende hoy',
    titulo: 'Último aviso',
    cuerpo: `
      <p>Hoy es el último día antes de que tu cuenta pase al plan Free por falta de pago.</p>
      <p>Si quieres seguir con tu plan actual, actualiza tu método de pago ahora — tus datos
      seguirán ahí de cualquier forma, esto es solo sobre las funciones de tu plan.</p>
    `,
  },
};

export function emailDunning(dia: 1 | 3 | 5) {
  const base = DUNNING[dia];
  const preheader = 'Actualiza tu método de pago para mantener tu plan activo, sin perder tus datos.';
  const html = plantillaBase({
    preheader,
    titulo: base.titulo,
    cuerpoHtml: base.cuerpo,
    cta: { texto: 'Actualizar mi método de pago', href: HOTMART_URL },
  });
  const text = textoPlano({
    titulo: base.titulo,
    parrafos: [base.cuerpo.replace(/<[^>]+>/g, '')],
    ctaTexto: 'Actualizar mi método de pago',
    ctaHref: HOTMART_URL,
  });
  return { subject: base.subject, subjectAlt: base.subjectAlt, preheader, html, text };
}
