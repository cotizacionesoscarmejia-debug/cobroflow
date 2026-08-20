// Copy del banner in-app no bloqueante para el estado past_due (58) — en su
// propio archivo (separado de lib/emails/dunning.ts) para que el Dashboard
// (client component) no tenga que llevarse al bundle del navegador las
// plantillas HTML completas de los 3 correos de dunning, que solo usa el
// servidor (webhook/cron).
export const BANNER_PAST_DUE = {
  texto: 'Tu pago no se procesó — actualiza tu método para no perder el acceso a tu plan.',
  ctaTexto: 'Actualizar método de pago',
  ctaHref: 'https://consumer.hotmart.com',
};
