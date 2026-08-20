// C2 — cancelación (empática, disparada por el webhook) + win-back 30/60/90
// (58-RETENCION-DE-INGRESOS.md). Tono: nunca culpar, nunca confirmshaming.

import { plantillaBase, textoPlano } from './layout';

export function emailCancelacion() {
  const subject = 'Tu cuenta sigue aquí, con todo tal como la dejaste';
  const subjectAlt = 'Cancelaste tu plan — esto es lo que pasa ahora';
  const preheader = 'Sigues con acceso hasta el final de tu período pagado. Tus datos nunca se borran.';
  const cuerpoHtml = `
    <p>Vimos que cancelaste tu suscripción — sin problema, gracias por haber sido cliente.</p>
    <p>Sigues teniendo acceso completo hasta el final de tu período ya pagado. Después, tu cuenta
    pasa al plan Free automáticamente: <strong>tus clientes, proyectos y pagos ya cargados nunca
    se borran</strong>, sin importar cuánto tiempo pase.</p>
    <p>Si cancelaste por algo puntual (precio, una función que te faltó, o simplemente no le
    diste uso), responde este correo y lo escuchamos — a veces hay una solución más simple que
    cancelar del todo.</p>
  `;
  const html = plantillaBase({
    preheader,
    titulo: 'Tu cuenta sigue aquí',
    cuerpoHtml,
    cta: { texto: 'Contarnos qué pasó', href: 'mailto:soporte@cobroflow.app' },
  });
  const text = textoPlano({
    titulo: 'Tu cuenta sigue aquí',
    parrafos: [
      'Vimos que cancelaste tu suscripción — gracias por haber sido cliente.',
      'Sigues con acceso hasta el final de tu período pagado. Después pasas a Free automáticamente: tus datos nunca se borran.',
      'Si cancelaste por algo puntual, responde este correo y lo escuchamos.',
    ],
  });
  return { subject, subjectAlt, preheader, html, text };
}

const WINBACK: Record<30 | 60 | 90, { subject: string; subjectAlt: string; cuerpo: string }> = {
  30: {
    subject: 'Tus clientes de CobroFlow te siguen esperando',
    subjectAlt: '¿Cómo vas llevando tus cobros sin CobroFlow?',
    cuerpo: `
      <p>Han pasado 30 días desde que cancelaste. Tu cuenta y tus datos siguen exactamente como
      los dejaste — nada se perdió.</p>
      <p>Si volviste a perder de vista quién te debe, con un clic vuelves a tenerlo todo
      calculado, sin cargar nada de nuevo.</p>
    `,
  },
  60: {
    subject: 'Tu historial en CobroFlow sigue guardado',
    subjectAlt: 'Vuelve cuando quieras — nada se borró',
    cuerpo: `
      <p>Sigue aquí, esperándote: tus clientes, tus proyectos y tu historial de pagos, tal como
      los dejaste hace 60 días.</p>
      <p>Si el problema fue el precio, dinos y vemos qué plan te acomoda mejor.</p>
    `,
  },
  90: {
    subject: 'Última nota: tu cuenta de CobroFlow te sigue esperando',
    subjectAlt: 'Antes de dejarte tranquilo — esto sigue guardado para ti',
    cuerpo: `
      <p>Este es el último correo que te mandamos por esto — no queremos llenarte la bandeja.</p>
      <p>Tu cuenta y tu historial siguen intactos si algún día quieres retomarlos. Si prefieres
      no volver a saber de CobroFlow, no hace falta que hagas nada más.</p>
    `,
  },
};

export function emailWinback(dia: 30 | 60 | 90) {
  const base = WINBACK[dia];
  const preheader = 'Tu cuenta y tus datos siguen exactamente como los dejaste.';
  const html = plantillaBase({
    preheader,
    titulo: base.subject,
    cuerpoHtml: base.cuerpo,
    cta: { texto: 'Volver a CobroFlow', href: 'https://www.cobroflow.app/login' },
    notaPie: '¿Prefieres no recibir más correos como este? Responde "quitar" y te sacamos de esta lista.',
  });
  const text = textoPlano({
    titulo: base.subject,
    parrafos: [base.cuerpo.replace(/<[^>]+>/g, '')],
    ctaTexto: 'Volver a CobroFlow',
    ctaHref: 'https://www.cobroflow.app/login',
  });
  return { subject: base.subject, subjectAlt: base.subjectAlt, preheader, html, text };
}
