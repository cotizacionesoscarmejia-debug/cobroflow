// Gatillo semanal del loop de retención (panel de expertos, item #1: "sin
// ningún gatillo de retención después de la 1ª semana"). No vende nada — es un
// resumen de LOS DATOS DEL PROPIO USUARIO, por eso va como transaccional
// (FROM_TX), no como marketing, y no respeta marketing_opt_out.
//
// Loop de hábito que dispara este correo (documentado también en ESTADO.md):
//   GATILLO externo = este correo cada lunes · interno = la duda de "¿quién me
//   debe ahora?"
//   ACCIÓN = abrir el Centro de cobros / Panel principal.
//   RECOMPENSA = ver el saldo ya calculado — variable: a veces "todo cobrado",
//   a veces la lista de quién está atrasado.
//   INVERSIÓN = cada cliente/proyecto/pago cargado hace el resumen más útil la
//   semana siguiente, y más caro de abandonar.

import { plantillaBase, textoPlano } from './layout';

export function emailResumenSemanal(opts: { cobradoTexto: string; atrasados: number }) {
  const { cobradoTexto, atrasados } = opts;
  const subject =
    atrasados > 0
      ? `Tienes ${atrasados} cliente${atrasados === 1 ? '' : 's'} atrasado${atrasados === 1 ? '' : 's'} — tu resumen de la semana`
      : 'Tu resumen de la semana en CobroFlow';
  const preheader =
    atrasados > 0
      ? `Cobraste ${cobradoTexto} esta semana. ${atrasados} cliente${atrasados === 1 ? '' : 's'} sigue sin pagar.`
      : `Cobraste ${cobradoTexto} esta semana y no tienes atrasados. Así de simple.`;

  const cuerpoHtml =
    atrasados > 0
      ? `
      <p>Esta semana cobraste <strong>${cobradoTexto}</strong>.</p>
      <p>Pero tienes <strong>${atrasados} cliente${atrasados === 1 ? '' : 's'} atrasado${atrasados === 1 ? '' : 's'}</strong> — antes de que se te pase otra semana, entra y mándale el recordatorio.</p>
    `
      : `
      <p>Esta semana cobraste <strong>${cobradoTexto}</strong> y no tienes ningún cliente atrasado ahora mismo.</p>
      <p>Buen momento para revisar qué sigue esta semana.</p>
    `;

  const html = plantillaBase({
    preheader,
    titulo: 'Tu resumen de la semana',
    cuerpoHtml,
    cta: { texto: 'Ver mi Centro de cobros', href: 'https://www.cobroflow.app/app/cobros' },
    notaPie: '¿Ya no quieres este resumen semanal? Responde este correo y lo desactivamos.',
  });
  const text = textoPlano({
    titulo: 'Tu resumen de la semana',
    parrafos: [cuerpoHtml.replace(/<[^>]+>/g, '')],
    ctaTexto: 'Ver mi Centro de cobros',
    ctaHref: 'https://www.cobroflow.app/app/cobros',
  });
  return { subject, preheader, html, text };
}
