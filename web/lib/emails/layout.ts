// Envoltorio HTML compartido por TODOS los correos — mismos colores de marca
// (FICHA-ARTE.md), tabla-based para compatibilidad real con clientes de correo
// (Gmail/Outlook no soportan flexbox/grid), multipart (siempre se manda html Y
// text). Los valores hex van fijos porque los emails no leen CSS vars.

const ACENTO = '#187C51';
const FONDO = '#FAF6EF';
const SUPERFICIE = '#FFFFFF';
const TEXTO_1 = '#241E14';
const TEXTO_2 = '#7A7161';
const BORDE = '#E7E0D2';

export interface PlantillaOpts {
  /** Texto corto que se ve junto al asunto en la bandeja (Gmail/Outlook) — nunca vacío. */
  preheader: string;
  /** Título grande dentro de la tarjeta. */
  titulo: string;
  /** Párrafos del cuerpo, ya en HTML simple (<p>, <strong>, <ul>). */
  cuerpoHtml: string;
  /** Botón principal — un solo CTA dominante, como pide 18/34/58. */
  cta?: { texto: string; href: string };
  /** Nota chica al pie de la tarjeta (ej. "¿no fuiste tú? escríbenos"). */
  notaPie?: string;
}

export function plantillaBase(opts: PlantillaOpts): string {
  return `<!doctype html>
<html lang="es">
<head>
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width, initial-scale=1" />
<title>CobroFlow</title>
</head>
<body style="margin:0;padding:0;background:${FONDO};font-family:Arial,Helvetica,sans-serif;">
  <!-- Preheader oculto: se ve junto al asunto en la bandeja, nunca en el cuerpo abierto -->
  <div style="display:none;max-height:0;overflow:hidden;opacity:0;">${escapeHtml(opts.preheader)}</div>
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:${FONDO};padding:32px 16px;">
    <tr>
      <td align="center">
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:480px;">
          <tr>
            <td style="padding-bottom:24px;">
              <span style="font-size:18px;font-weight:700;color:${TEXTO_1};">CobroFlow</span>
            </td>
          </tr>
          <tr>
            <td style="background:${SUPERFICIE};border:1px solid ${BORDE};border-radius:16px;padding:32px 28px;">
              <h1 style="margin:0 0 16px;font-size:22px;line-height:1.3;color:${TEXTO_1};font-weight:700;">${escapeHtml(opts.titulo)}</h1>
              <div style="font-size:15px;line-height:1.6;color:${TEXTO_1};">${opts.cuerpoHtml}</div>
              ${
                opts.cta
                  ? `<table role="presentation" cellpadding="0" cellspacing="0" style="margin-top:24px;">
                      <tr>
                        <td style="background:${ACENTO};border-radius:12px;">
                          <a href="${opts.cta.href}" style="display:inline-block;padding:14px 28px;font-size:15px;font-weight:700;color:#ffffff;text-decoration:none;">${escapeHtml(opts.cta.texto)} →</a>
                        </td>
                      </tr>
                    </table>`
                  : ''
              }
              ${
                opts.notaPie
                  ? `<p style="margin:24px 0 0;font-size:12.5px;line-height:1.5;color:${TEXTO_2};">${opts.notaPie}</p>`
                  : ''
              }
            </td>
          </tr>
          <tr>
            <td style="padding-top:20px;text-align:center;">
              <p style="margin:0;font-size:12px;color:${TEXTO_2};">CobroFlow · <a href="mailto:soporte@cobroflow.app" style="color:${TEXTO_2};">soporte@cobroflow.app</a></p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}

/** Versión texto plano — Resend/los clientes de correo puntúan peor el solo-HTML (46). */
export function textoPlano(opts: { titulo: string; parrafos: string[]; ctaTexto?: string; ctaHref?: string }): string {
  const cuerpo = opts.parrafos.join('\n\n');
  const cta = opts.ctaTexto && opts.ctaHref ? `\n\n${opts.ctaTexto}: ${opts.ctaHref}` : '';
  return `${opts.titulo}\n\n${cuerpo}${cta}\n\n—\nCobroFlow · soporte@cobroflow.app`;
}

function escapeHtml(s: string): string {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}
