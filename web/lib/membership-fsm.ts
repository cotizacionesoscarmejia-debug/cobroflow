// CobroFlow no tiene período de prueba (el plan Free gratuito ES la prueba), así
// que a diferencia del ejemplo de docs/sistema/18-VENTA-HOTMART.md no existe el
// estado 'trialing'. Pro y Premium son DOS PLANES/OFERTAS de UN MISMO producto de
// Hotmart (ID en HOTMART_PRODUCT_ID) — no dos productos separados. Por eso el
// plan se identifica por el ID del plan (HOTMART_PLAN_ID_PRO/_PREMIUM), no por
// el product_id (que es el mismo para los dos).

export type Status = 'active' | 'past_due' | 'cancelled' | 'expired' | 'refunded' | 'chargeback';

// ⚠️ Nombres de evento VERIFICADOS en el panel de Hotmart al configurar el
// webhook (Herramientas → Webhook) antes de confiar en ellos — pueden variar
// por cuenta/versión (18-VENTA-HOTMART.md).
export const EVENT_TO_STATUS: Record<string, Status> = {
  PURCHASE_APPROVED: 'active',
  PURCHASE_COMPLETE: 'active',
  PURCHASE_DELAYED: 'past_due',
  SUBSCRIPTION_CANCELLATION: 'cancelled',
  PURCHASE_EXPIRED: 'expired',
  PURCHASE_REFUNDED: 'refunded',
  PURCHASE_CHARGEBACK: 'chargeback',
};

export function statusForEvent(event: string): Status | null {
  return EVENT_TO_STATUS[event] ?? null;
}

/**
 * Código de oferta de Hotmart (el `off=` del link de pago, ej. `s6j82uzz` para
 * Pro) → plan de CobroFlow. Es el mismo código que distingue los dos links de
 * pago del único producto de Hotmart (HOTMART_PRODUCT_ID).
 * ⚠️ Campo del payload sin verificar todavía contra una compra real (regla de
 * 18-VENTA-HOTMART.md: "verificar antes de confiar") — se asume que llega en
 * `data.purchase.offer.code` (el nombre documentado por Hotmart para este dato).
 * Antes de vender de verdad: comprar cada plan de prueba, loguear el payload
 * COMPLETO del webhook, y confirmar que el código viaja ahí — si Hotmart lo
 * manda en otro campo, ajustar la extracción en route.ts, no este mapeo.
 */
export function planForOfferCode(offerCode: string | undefined): 'pro' | 'premium' | null {
  if (!offerCode) return null;
  if (offerCode === process.env.HOTMART_OFFER_CODE_PRO) return 'pro';
  if (offerCode === process.env.HOTMART_OFFER_CODE_PREMIUM) return 'premium';
  return null;
}
