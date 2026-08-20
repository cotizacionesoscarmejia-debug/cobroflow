// Links de pago (checkout) reales de Hotmart. No son secretos — son URLs
// públicas que cualquiera puede abrir para comprar, así que van directo en el
// código (no en .env). El código de oferta (`off=`) es lo que distingue Pro de
// Premium dentro del único producto de Hotmart — ver lib/membership-fsm.ts.
const CHECKOUT_BASE = 'https://pay.hotmart.com/F107189741W';
const OFFER_CODE = { pro: 's6j82uzz', premium: 'avoatd7z' } as const;

/**
 * Área de compras del comprador en Hotmart — desde ahí gestiona/cancela
 * cualquier suscripción activa (con el mismo correo con el que pagó). CobroFlow
 * no tiene su propio panel de facturación (Hotmart es quien cobra), así que
 * este es el único lugar real donde alguien puede cancelar (auditoría,
 * hallazgo importante #6 — antes Cuenta no lo mencionaba ni enlazaba).
 */
export const HOTMART_AREA_COMPRAS_URL = 'https://purchases.hotmart.com';

/**
 * Arma el link de pago de un plan, con el correo y el id del usuario ya
 * registrado precargados. Precargar el email conecta la compra con la cuenta
 * correcta si paga con el mismo correo (mitigación (a) de 18-VENTA-HOTMART.md);
 * `sck` viaja como tracking y el webhook lo usa para matchear por id primero,
 * antes que por email (mitigación (b)) — evita crear una cuenta duplicada si
 * la persona paga con un correo distinto al de su cuenta de CobroFlow.
 */
export function hotmartCheckoutUrl(plan: 'pro' | 'premium', usuario?: { email?: string; userId?: string }): string {
  const url = new URL(CHECKOUT_BASE);
  url.searchParams.set('off', OFFER_CODE[plan]);
  if (usuario?.email) url.searchParams.set('email', usuario.email);
  if (usuario?.userId) url.searchParams.set('sck', usuario.userId);
  return url.toString();
}
