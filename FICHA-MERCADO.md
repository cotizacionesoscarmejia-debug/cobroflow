# FICHA DE MERCADO — CobroFlow

## Alcance de esta ficha
- Nicho/categoría exacta: control de cuentas por cobrar / seguimiento de pagos pendientes para
  freelancers y microempresas de servicios (NO facturación electrónica fiscal, NO contabilidad).
- País(es) donde se va a vender: LATAM, multi-país (sin foco fiscal por país, ver multi-moneda
  en ESTADO.md) · Moneda de cobro de la propia suscripción: USD (Hotmart).
- Fecha de investigación: 2026-08-15 · **Vence el:** 2027-02-15 (6 meses).
- Pasarela/plataforma de venta elegida: **Hotmart** — corrección 2026-08-21: el plan original era
  Stripe, pero en Sesión 6 se descubrió que Stripe no abre cuenta de vendedor en Guatemala (país
  del usuario) y se migró a Hotmart (ver ESTADO.md, "Decisiones técnicas"). Este campo había
  quedado desactualizado; se corrige aquí porque alimenta directamente el texto de las páginas
  legales (auditoría legal 2026-08-21).

## 1. PRECIO — contra qué se compara el tuyo
- Competencia internacional (Bonsai/HoneyBook, EE.UU., invoicing+contratos para freelance):
  HoneyBook Starter $36/mes, Essentials $59/mes, Premium $129/mes (subió desde $19/$39/$79 en
  feb-2025) | fuente: Agiled/Capterra comparativas | fecha: 2026.
- Competencia LATAM adyacente (software contable, no "cobros" puro): Alegra Emprendedor
  ~$10/mes, Siigo Independiente ~$35/mes | fuente: blog.alegra.com, guiadesoftware.com | 2026.
- Quipu (España, facturación+tesorería): 13€-49€/mes | fuente: getquipu.com/pricing-plans | 2026.
- Competidor más cercano en LATAM (Freelanzer.mx — más amplio que CobroFlow, incluye
  contratos/cotizaciones): precio **NO ENCONTRADO** en la búsqueda — se decide por criterio y
  se revisa el 2027-02-15.
- **Precio elegido para esta app:** Free $0 · Pro $7.99/mes · Premium $14.99/mes (decisión del
  usuario). **Desvío respecto a la mediana:** por debajo de toda la competencia relevada (~40-80%
  más barato que HoneyBook, competitivo con Alegra/Quipu pero sin ser software contable).
- Razón escrita del desvío: posicionamiento deliberado "más simple que un sistema contable, más
  barato que un CRM freelance completo" — el usuario lo definió así en el brief original.
- Precio por país/moneda: NO diferenciado en el MVP (un solo precio en USD vía Stripe) — revisar
  si el poder adquisitivo de países específicos (ej. Argentina) pide price parity más adelante.

## 2. CICLO DE DECISIÓN
- ¿Se compra el mismo día o se piensa?: NO ENCONTRADO para esta categoría específica — el modelo
  Free-sin-tarjeta del propio producto reduce el riesgo de este dato (el usuario prueba gratis
  antes de decidir pagar, no depende de convencer en una sola visita).
- **Ventana mínima antes de declarar que una campaña fracasó:** se define en Sesión 8
  (adquisición), no bloquea la construcción.

## 3. CÓMO PAGA ESTE MERCADO
- Medios de pago del checkout real: los que ofrece Hotmart por país (tarjeta, y métodos locales
  según el mercado — ej. PIX en Brasil).
- Penetración de tarjeta de crédito: variable por país LATAM, dato NO ENCONTRADO agregado — se
  revisa por país si se detecta fricción real de checkout.
- **Consecuencia para el producto:** un segmento de freelancers LATAM sin tarjeta internacional
  podría quedar excluido del pago — mitigado por el plan Free sin tarjeta (pueden usar la app
  igual) y revisable más adelante (Hotmart soporta métodos locales según el país).

## 4. PRUEBA Y GARANTÍA
- Modelo: **freemium (plan Free permanente), NO trial de tiempo limitado** — el usuario definió
  Free como el "probar antes de pagar", sin fecha de vencimiento.
- **Prueba elegida: 0** días (no hay trial cronometrado — el Free permanente cumple ese rol).
- **Garantía elegida: 7** días — CobroFlow no promete una garantía propia de "devolución de
  dinero" más allá de la que Hotmart ya aplica a toda compra en su plataforma (derecho de
  retracto, ley de protección al consumidor de Brasil). Documentado así en
  `/cancelacion-reembolsos` (auditoría legal 2026-08-21). 7 > 0, cumple la regla garantía>prueba
  de `18`.
- Si más adelante se agrega una garantía de reembolso PROPIA más larga en el copy de ventas, esta
  ficha se actualiza ANTES de publicarla (regla fail-closed de CLAUDE.md) — y debe confirmarse que
  el plazo prometido coincide con lo configurado para el producto en el panel de Hotmart.

## 5. CONVERSIÓN ESPERABLE
- Conversión típica freemium→pago de SaaS de utilidad B2B/prosumer: NO ENCONTRADO con fuente
  propia de esta categoría — se usará el dato real de la app (backoffice, `21`) apenas haya
  tráfico, en vez de un benchmark genérico.

## 6. ESTACIONALIDAD Y CONTEXTO
- ¿Picos de demanda? NO ENCONTRADO — hipótesis a validar con datos propios: posible pico a
  inicio de mes/trimestre (cuando el freelancer revisa cuánto le deben) y fin de año (cierre
  fiscal informal). No se usa como promesa, solo como hipótesis interna.
- Regulación: ninguna que aplique — CobroFlow no procesa pagos de terceros ni emite facturas
  fiscales, así que no hereda las obligaciones de facturación electrónica de Alegra/Siigo. Se
  mantiene así a propósito (ver "qué nunca hace la app" en ESTADO.md).
