// B — carrito abandonado (18/35). En CobroFlow la fuente real es nuestro
// propio registro de clic a /api/ir-a-hotmart (nunca un evento de Hotmart sin
// confirmar) — la cadencia se adapta a un cron diario: EMAIL 1 al día
// siguiente del clic (no 1-3h, que exigiría un cron por minutos), EMAIL 2 al
// día 3, EMAIL 3 al día 6.

import { plantillaBase, textoPlano } from './layout';

const NOMBRE_PLAN: Record<string, string> = { pro: 'Pro', premium: 'Premium' };

export function emailCarrito1(plan: 'pro' | 'premium') {
  const nombrePlan = NOMBRE_PLAN[plan];
  const subject = `¿Te quedó alguna duda sobre ${nombrePlan}?`;
  const subjectAlt = `Vimos que estabas por pasar a ${nombrePlan}`;
  const preheader = 'Tu cuenta sigue en Free — si te quedó una duda, aquí seguimos.';
  const cuerpoHtml = `
    <p>Vimos que estabas por pasar a <strong>${nombrePlan}</strong> y no llegaste a terminar el
    pago — puede que solo te haya faltado un minuto, o que te haya quedado alguna duda.</p>
    <p>Si fue una duda, responde este correo y te contestamos directo. Si solo se te pasó,
    aquí tienes el enlace para retomarlo.</p>
  `;
  const html = plantillaBase({
    preheader,
    titulo: `¿Seguimos con tu plan ${nombrePlan}?`,
    cuerpoHtml,
    cta: { texto: `Continuar con ${nombrePlan}`, href: `https://www.cobroflow.app/api/ir-a-hotmart?plan=${plan}` },
  });
  const text = textoPlano({
    titulo: `¿Seguimos con tu plan ${nombrePlan}?`,
    parrafos: [cuerpoHtml.replace(/<[^>]+>/g, '')],
    ctaTexto: `Continuar con ${nombrePlan}`,
    ctaHref: `https://www.cobroflow.app/api/ir-a-hotmart?plan=${plan}`,
  });
  return { subject, subjectAlt, preheader, html, text };
}

export function emailCarrito2(plan: 'pro' | 'premium') {
  const nombrePlan = NOMBRE_PLAN[plan];
  const subject = `Lo que ${nombrePlan} te resuelve, en 3 líneas`;
  const subjectAlt = `Por si te sirve verlo de nuevo: qué trae ${nombrePlan}`;
  const preheader = 'Clientes y proyectos ilimitados, reportes, y seguimiento sin buscar en WhatsApp.';
  const cuerpoHtml =
    plan === 'pro'
      ? `
      <p>Con Pro dejas atrás el límite de 3 clientes y 5 proyectos del plan Free, y sumas:</p>
      <ul style="margin:8px 0 0;padding-left:20px;">
        <li>Centro de cobros con seguimiento de a quién le toca hoy</li>
        <li>Recordatorios con plantillas listas para WhatsApp</li>
        <li>Reportes, gráficas y varias monedas</li>
      </ul>
      <p>Menos que un café a la semana, para dejar de revisar WhatsApp cada vez que quieres saber quién te debe.</p>
    `
      : `
      <p>Con Premium, además de todo lo de Pro sin límites, sumas:</p>
      <ul style="margin:8px 0 0;padding-left:20px;">
        <li>Proyección de tu flujo de dinero para los próximos meses</li>
        <li>Metas mensuales con tu progreso real</li>
        <li>Un análisis de tu negocio con IA, cuando tú lo pidas</li>
      </ul>
    `;
  const html = plantillaBase({
    preheader,
    titulo: `Lo que ${nombrePlan} te resuelve`,
    cuerpoHtml,
    cta: { texto: `Activar ${nombrePlan}`, href: `https://www.cobroflow.app/api/ir-a-hotmart?plan=${plan}` },
  });
  const text = textoPlano({
    titulo: `Lo que ${nombrePlan} te resuelve`,
    parrafos: [cuerpoHtml.replace(/<[^>]+>/g, ' ')],
    ctaTexto: `Activar ${nombrePlan}`,
    ctaHref: `https://www.cobroflow.app/api/ir-a-hotmart?plan=${plan}`,
  });
  return { subject, subjectAlt, preheader, html, text };
}

export function emailCarrito3(plan: 'pro' | 'premium') {
  const nombrePlan = NOMBRE_PLAN[plan];
  const subject = `Último recordatorio sobre tu plan ${nombrePlan}`;
  const subjectAlt = `Este es el último correo sobre ${nombrePlan}`;
  const preheader = 'No queremos llenarte la bandeja — este es el último aviso sobre esto.';
  const cuerpoHtml = `
    <p>Este es el último correo que te mandamos sobre esto — no queremos llenarte la bandeja.</p>
    <p>Tu cuenta sigue en Free, con todo lo que ya cargaste intacto. Si más adelante quieres
    pasar a ${nombrePlan}, el botón para hacerlo sigue en tu Configuración, sin ninguna prisa.</p>
  `;
  const html = plantillaBase({
    preheader,
    titulo: 'Un último recordatorio',
    cuerpoHtml,
    cta: { texto: `Activar ${nombrePlan}`, href: `https://www.cobroflow.app/api/ir-a-hotmart?plan=${plan}` },
  });
  const text = textoPlano({
    titulo: 'Un último recordatorio',
    parrafos: [cuerpoHtml.replace(/<[^>]+>/g, '')],
    ctaTexto: `Activar ${nombrePlan}`,
    ctaHref: `https://www.cobroflow.app/api/ir-a-hotmart?plan=${plan}`,
  });
  return { subject, subjectAlt, preheader, html, text };
}
