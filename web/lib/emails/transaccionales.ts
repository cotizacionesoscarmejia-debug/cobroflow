// A1 y A1b — los correos que NUNCA pueden fallar (18-VENTA-HOTMART.md). CobroFlow
// no usa enlace mágico: el usuario ya se registró con contraseña ANTES de pagar
// (Fase 3 de Sesión 6), así que estos correos CONFIRMAN el acceso, no lo entregan.

import { plantillaBase, textoPlano } from './layout';

const NOMBRE_PLAN: Record<string, string> = { pro: 'Pro', premium: 'Premium' };

export function emailPagoConfirmado(plan: 'pro' | 'premium') {
  const nombrePlan = NOMBRE_PLAN[plan];
  const subject = `Tu plan ${nombrePlan} de CobroFlow ya está activo 🎉`;
  const subjectAlt = `Listo — CobroFlow ${nombrePlan} está activo en tu cuenta`;
  const preheader = `Ya puedes usar todo lo de ${nombrePlan}. Entra con tu correo y contraseña de siempre.`;
  const cuerpoHtml = `
    <p>¡Gracias por confiar en CobroFlow!</p>
    <p>Tu pago se procesó y tu cuenta ya tiene el plan <strong>${nombrePlan}</strong> activo — no
    necesitas hacer nada más. Entra con el mismo correo y contraseña que ya usabas.</p>
    <p>Ya puedes ver quién te debe, cuánto y desde cuándo, sin volver a revisar WhatsApp ni Excel.</p>
  `;
  const html = plantillaBase({
    preheader,
    titulo: `Tu plan ${nombrePlan} ya está activo`,
    cuerpoHtml,
    cta: { texto: 'Entrar a CobroFlow', href: 'https://www.cobroflow.app/login' },
    notaPie: '¿No reconoces este pago? Responde a este correo y lo revisamos contigo de inmediato.',
  });
  const text = textoPlano({
    titulo: `Tu plan ${nombrePlan} ya está activo`,
    parrafos: [
      '¡Gracias por confiar en CobroFlow!',
      `Tu pago se procesó y tu cuenta ya tiene el plan ${nombrePlan} activo. Entra con el mismo correo y contraseña que ya usabas.`,
    ],
    ctaTexto: 'Entrar a CobroFlow',
    ctaHref: 'https://www.cobroflow.app/login',
  });
  return { subject, subjectAlt, preheader, html, text };
}

/** A1b (cliente) — su pago no se pudo vincular a ninguna cuenta de CobroFlow. */
export function emailCompraSinVincular() {
  const subject = 'Recibimos tu pago, pero necesitamos un dato tuyo';
  const subjectAlt = 'Tu pago llegó — ayúdanos a activar tu plan';
  const preheader = 'Tu pago fue aprobado por Hotmart, pero no lo pudimos conectar con una cuenta de CobroFlow todavía.';
  const cuerpoHtml = `
    <p>Vimos que tu pago fue aprobado por Hotmart — gracias.</p>
    <p>No lo pudimos conectar automáticamente con una cuenta de CobroFlow, seguramente porque
    pagaste con un correo distinto al que usaste para registrarte (o todavía no te has
    registrado).</p>
    <p>Escríbenos respondiendo este correo con: (1) el correo con el que pagaste en Hotmart y
    (2) el correo con el que tienes (o quieres tener) tu cuenta en CobroFlow. Activamos tu plan a
    mano el mismo día.</p>
  `;
  const html = plantillaBase({
    preheader,
    titulo: 'Ayúdanos a activar tu plan',
    cuerpoHtml,
    cta: { texto: 'Responder a soporte', href: 'mailto:soporte@cobroflow.app' },
  });
  const text = textoPlano({
    titulo: 'Ayúdanos a activar tu plan',
    parrafos: [
      'Vimos que tu pago fue aprobado por Hotmart — gracias.',
      'No lo pudimos conectar automáticamente con una cuenta de CobroFlow. Escríbenos con el correo con el que pagaste y el correo de tu cuenta (o el que quieras usar) y activamos tu plan a mano el mismo día.',
    ],
    ctaTexto: 'Escríbenos',
    ctaHref: 'mailto:soporte@cobroflow.app',
  });
  return { subject, subjectAlt, preheader, html, text };
}

/** A1b (dueño) — alerta interna simple, sin plantilla de marca, para reconciliar a mano. */
export function emailAlertaPagoSinVincular(datos: { email?: string; eventType: string; productId?: string; offerCode?: string; subscriberCode?: string }) {
  const subject = `⚠️ Pago sin cuenta — ${datos.email ?? 'correo desconocido'}`;
  const text = [
    'Un pago de Hotmart no se pudo vincular a ninguna cuenta de CobroFlow (no_profile_match).',
    '',
    `Correo del comprador: ${datos.email ?? '(no vino en el payload)'}`,
    `Evento: ${datos.eventType}`,
    `Producto: ${datos.productId ?? '—'}`,
    `Oferta: ${datos.offerCode ?? '—'}`,
    `Código de suscriptor: ${datos.subscriberCode ?? '—'}`,
    '',
    'Al comprador ya se le envió un correo pidiéndole el dato para reconciliar. Si escribe,',
    'busca la compra en el panel de Hotmart y actualiza el email de su cuenta en Supabase',
    '(profiles.email) o crea/activa el plan a mano.',
  ].join('\n');
  return { subject, text };
}
