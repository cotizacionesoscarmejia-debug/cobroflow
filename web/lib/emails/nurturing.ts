// E — nurturing Free → Pro (34, adaptado). CobroFlow no tiene lead magnet
// separado: el plan Free permanente ES el imán ("prueba antes de pagar" de
// FICHA-MERCADO §4) — así que esta secuencia nutre a quien YA se registró
// gratis y no ha subido de plan, en vez de a un lead sin cuenta. Estructura
// PAS (problema/mecanismo/prueba+oferta) del archivo 34, comprimida a 3 correos
// porque no hay lead magnet que "entregar" en el email 0.

import { plantillaBase, textoPlano } from './layout';

export function emailNurturing1() {
  const subject = '¿Sigues revisando WhatsApp para saber quién te debe?';
  const subjectAlt = 'La pregunta que te trajo a CobroFlow';
  const preheader = 'Con Pro, ese cálculo lo hace la app — clientes y proyectos ilimitados.';
  const cuerpoHtml = `
    <p>Te registraste en CobroFlow porque en algún momento perdiste la cuenta de quién te debía
    dinero — revisando chats, hojas de cálculo, o memoria pura.</p>
    <p>Con el plan Free ya puedes probar cómo se siente tener eso calculado solo. El límite es
    de 3 clientes y 5 proyectos — si ya lo llenaste, es señal de que CobroFlow te está sirviendo
    de verdad.</p>
  `;
  const html = plantillaBase({
    preheader,
    titulo: '¿Sigues revisando WhatsApp?',
    cuerpoHtml,
    cta: { texto: 'Ver mi plan Pro', href: 'https://www.cobroflow.app/app/cuenta' },
    notaPie: '¿Prefieres no recibir estos correos? Responde "quitar" y te sacamos de esta lista.',
  });
  const text = textoPlano({
    titulo: '¿Sigues revisando WhatsApp?',
    parrafos: [cuerpoHtml.replace(/<[^>]+>/g, '')],
    ctaTexto: 'Ver mi plan Pro',
    ctaHref: 'https://www.cobroflow.app/app/cuenta',
  });
  return { subject, subjectAlt, preheader, html, text };
}

export function emailNurturing2() {
  const subject = 'Lo que cambia cuando pasas a Pro';
  const subjectAlt = 'De 3 clientes a ilimitados — y lo que más se nota';
  const preheader = 'Centro de cobros, recordatorios con plantillas, reportes y varias monedas.';
  const cuerpoHtml = `
    <p>Con Pro no solo se levanta el límite de clientes y proyectos — cambia cómo trabajas:</p>
    <ul style="margin:8px 0 0;padding-left:20px;">
      <li>El Centro de cobros te dice a quién seguirle hoy, sin que tengas que acordarte tú</li>
      <li>Los recordatorios ya vienen con plantillas listas para copiar a WhatsApp</li>
      <li>Reportes y gráficas de cómo va tu negocio mes a mes</li>
      <li>Si trabajas con clientes de otro país, varias monedas a la vez</li>
    </ul>
    <p>$7.99/mes — menos que un café a la semana.</p>
  `;
  const html = plantillaBase({
    preheader,
    titulo: 'Lo que cambia con Pro',
    cuerpoHtml,
    cta: { texto: 'Pasar a Pro', href: 'https://www.cobroflow.app/api/ir-a-hotmart?plan=pro' },
    notaPie: '¿Prefieres no recibir estos correos? Responde "quitar" y te sacamos de esta lista.',
  });
  const text = textoPlano({
    titulo: 'Lo que cambia con Pro',
    parrafos: [cuerpoHtml.replace(/<[^>]+>/g, ' ')],
    ctaTexto: 'Pasar a Pro',
    ctaHref: 'https://www.cobroflow.app/api/ir-a-hotmart?plan=pro',
  });
  return { subject, subjectAlt, preheader, html, text };
}

export function emailNurturing3() {
  const subject = '¿Qué te está deteniendo de pasar a Pro?';
  const subjectAlt = 'Las dudas más comunes sobre CobroFlow Pro';
  const preheader = 'Cancelas cuando quieras, y tus datos nunca se pierden si bajas de plan.';
  const cuerpoHtml = `
    <p>Si no has pasado a Pro todavía, puede que tengas alguna de estas dudas:</p>
    <p><strong>"¿Y si no lo uso lo suficiente?"</strong> — Cancelas cuando quieras, sin
    permanencia. Y si vuelves a Free, no pierdes nada de lo que ya cargaste.</p>
    <p><strong>"¿Esto reemplaza mi programa de facturación?"</strong> — No. CobroFlow no hace
    facturas fiscales ni impuestos, es el lugar simple donde ves quién te debe y cuánto.</p>
    <p><strong>"¿Es seguro pagar?"</strong> — El cobro lo procesa Hotmart, la misma pasarela que
    usan miles de negocios. CobroFlow nunca ve ni guarda tu tarjeta.</p>
  `;
  const html = plantillaBase({
    preheader,
    titulo: 'Tus dudas, resueltas',
    cuerpoHtml,
    cta: { texto: 'Pasar a Pro', href: 'https://www.cobroflow.app/api/ir-a-hotmart?plan=pro' },
    notaPie: '¿Prefieres no recibir estos correos? Responde "quitar" y te sacamos de esta lista.',
  });
  const text = textoPlano({
    titulo: 'Tus dudas, resueltas',
    parrafos: [cuerpoHtml.replace(/<[^>]+>/g, ' ')],
    ctaTexto: 'Pasar a Pro',
    ctaHref: 'https://www.cobroflow.app/api/ir-a-hotmart?plan=pro',
  });
  return { subject, subjectAlt, preheader, html, text };
}
