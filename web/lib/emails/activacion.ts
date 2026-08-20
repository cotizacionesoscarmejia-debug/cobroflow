// D — bienvenida/activación D1-D7 (que quien pagó realmente USE la app en su
// primera semana — el "acantilado del mes 1" de 58 empieza aquí). Transaccional
// en espíritu (dispara por haber pagado) pero de tono cercano, no de aviso.

import { plantillaBase, textoPlano } from './layout';

export function emailActivacionD1() {
  const subject = 'Tu primer minuto en CobroFlow: agrega tu primer cliente';
  const subjectAlt = 'Empecemos — esto es lo primero que hacer en CobroFlow';
  const preheader = 'Agrega un cliente real y ve tu saldo calculado al instante, sin hacer cuentas.';
  const cuerpoHtml = `
    <p>Ya tienes tu plan activo — ahora la parte que de verdad importa: que en un minuto veas
    a CobroFlow calcular algo por ti.</p>
    <p>Agrega a un cliente real, con lo que te debe y desde cuándo. El saldo se calcula solo, y
    a partir de ahí ya sabes exactamente a quién seguirle.</p>
  `;
  const html = plantillaBase({
    preheader,
    titulo: 'Agrega tu primer cliente',
    cuerpoHtml,
    cta: { texto: 'Agregar mi primer cliente', href: 'https://www.cobroflow.app/app/clientes/nuevo' },
  });
  const text = textoPlano({
    titulo: 'Agrega tu primer cliente',
    parrafos: [cuerpoHtml.replace(/<[^>]+>/g, '')],
    ctaTexto: 'Agregar mi primer cliente',
    ctaHref: 'https://www.cobroflow.app/app/clientes/nuevo',
  });
  return { subject, subjectAlt, preheader, html, text };
}

export function emailActivacionD3() {
  const subject = 'El truco que más usan los clientes de CobroFlow';
  const subjectAlt = 'Un minuto para ahorrarte el "¿en qué quedamos?"';
  const preheader = 'El Centro de cobros te dice, cada día, a quién seguirle — sin que tengas que acordarte tú.';
  const cuerpoHtml = `
    <p>Si ya cargaste a tus clientes, hay una pantalla que vale la pena conocer: el
    <strong>Centro de cobros</strong>.</p>
    <p>Ahí ves, de un vistazo, quién está atrasado, a quién le vence hoy y a quién le toca
    pronto — con el mensaje de recordatorio ya escrito, listo para copiar a WhatsApp.</p>
  `;
  const html = plantillaBase({
    preheader,
    titulo: 'Deja de acordarte tú solo',
    cuerpoHtml,
    cta: { texto: 'Ver mi Centro de cobros', href: 'https://www.cobroflow.app/app/cobros' },
  });
  const text = textoPlano({
    titulo: 'Deja de acordarte tú solo',
    parrafos: [cuerpoHtml.replace(/<[^>]+>/g, '')],
    ctaTexto: 'Ver mi Centro de cobros',
    ctaHref: 'https://www.cobroflow.app/app/cobros',
  });
  return { subject, subjectAlt, preheader, html, text };
}

export function emailActivacionD7() {
  const subject = '¿Cómo te fue esta primera semana con CobroFlow?';
  const subjectAlt = 'Una semana con CobroFlow — ¿ya sabes quién te debe?';
  const preheader = 'Si te falta cargar algún cliente o proyecto, este es el momento.';
  const cuerpoHtml = `
    <p>Llevas una semana con tu plan activo. Si ya cargaste a tus clientes reales, este es un
    buen momento para revisar tu Panel principal y ver todo tu negocio de un vistazo.</p>
    <p>Si todavía no has cargado a todos, vale la pena hacerlo ahora — entre más completa esté
    tu información, más útil es cada cálculo que hace CobroFlow por ti.</p>
    <p>Cualquier duda, responde este correo — leemos todo.</p>
  `;
  const html = plantillaBase({
    preheader,
    titulo: 'Una semana con CobroFlow',
    cuerpoHtml,
    cta: { texto: 'Ver mi Panel principal', href: 'https://www.cobroflow.app/app' },
  });
  const text = textoPlano({
    titulo: 'Una semana con CobroFlow',
    parrafos: [cuerpoHtml.replace(/<[^>]+>/g, '')],
    ctaTexto: 'Ver mi Panel principal',
    ctaHref: 'https://www.cobroflow.app/app',
  });
  return { subject, subjectAlt, preheader, html, text };
}
