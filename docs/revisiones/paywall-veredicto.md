# VEREDICTO revisor-visual — paywall
Fecha: 2026-08-16 15:45
Screenshot: docs/revisiones/paywall-1-top.png, docs/revisiones/paywall-full.png
Usabilidad: 30/40
Craft: 15/20
Copy (si vende): 18/20
Fidelidad (si hubo referencia): N-A
Veredicto: NO LISTA

Top defectos:
1. [Fondo completo, `app/paywall/page.tsx` líneas 29-37, radial-gradient 6-8% opacidad] El mesh-gradient agregado corrige el "fill plano" en código pero a 375px sigue leyéndose casi liso — la diferencia de tono entre el tope y el resto de la pantalla no se nota sin buscarla → fix: subir la opacidad a 12-15% o sumar un segundo halo más visible detrás del H1, como en el Hero de la landing.
2. [Toda la pantalla scrolleada — perforación de las 3 cards, bordes+texto de los CTA "Seguir gratis" y "Quiero proyectar mi negocio", badge, H1, H2 compacto, checks de Pro] El verde de acento sigue apareciendo en ~10 elementos distintos de una sola vista (la reducción de los checkmarks de Free/Premium a neutro fue el fix correcto, pero la perforación reforzada en las 3 cards y los 2 CTA secundarios en el mismo verde saturado del CTA de Pro vuelven a diluir cuál es LA acción dominante) → fix: pasar los CTA secundarios (Free/Premium) y sus perforaciones a un tono más apagado (accent al 40% o el ámbar `--accent-2`), dejando el verde saturado solo en Pro + el saldo del recap.
3. [Card "Free", feature 4 — `page.tsx` línea 82] "Dashboard básico y estado de cobros" usa "Dashboard" en inglés crudo, rompiendo la regla de 0 inglés sin traducir y desentonando con el resto del copy 100% en español natural del avatar → fix: "Panel básico y estado de cobros" o "Resumen básico de tus cobros".
4. [Header, botón atrás `ChevronLeft` — `page.tsx` líneas 40-47] Es un `<button>` plano sin `whileTap` ni estado `:active`, a diferencia de los 3 CTA de las cards que sí responden al toque (`motion.a` con `whileTap={{scale:0.97}}`) — el único control de navegación de la pantalla es el que menos feedback da → fix: envolver en `motion.button` con `whileTap={{scale:0.9}}` o agregar `active:opacity-70`.
5. [Toda la pantalla] Solo existen 2 de los 3 niveles de profundidad (base con tinte sutil + superficies elevadas de las cards); no hay ningún elemento en `--surface-2` (hundido) que complete el sistema de 3 niveles del eje Profundidad → fix: opcional en este tipo de pantalla, pero si se busca el 4/4 del eje, dar al footer de disclaimer ("Cancela cuando quieras...") un fondo levemente hundido en vez de flotar sobre el mismo tono base.

Defectos de R2 verificados como CORREGIDOS:
1. Fondo: ya no es un fill 100% sólido — existe gradiente radial en código, aunque su impacto visual a 375px sigue siendo débil (ver defecto #1 de esta ronda).
2. Jerarquía tipográfica antes de la primera card: de 5 tamaños distintos (26/15/12/20/15px) bajó a 2 (26px del H1, 15px del combo "Empieza gratis. Crece cuando lo necesites.") — el kicker y el subtítulo duplicado se quitaron correctamente en modo `compacto`.
3. Checkmarks de Free y Premium: ahora usan `CheckNeutro` (gris, `OfertaPlanes.tsx` líneas 19-28) en vez del verde saturado de `CheckCustom` — de 15 checks verdes a 5 (solo Pro). Redujo el ruido pero no lo eliminó del todo (ver defecto #2 de esta ronda, causa distinta: perforación + CTA secundarios).
4. El overlay negro "N" del indicador de Next.js Dev Tools ya no aparece en ningún screenshot — `devIndicators: false` confirmado.
5. La perforación (`<Perforacion />`, `ui.tsx` líneas 81-91) ahora es visible a simple vista en las 3 cards sin necesidad de acercarse a la imagen — el dispositivo ownable ya se lee como firma reconocible, aunque el efecto colateral es reintroducir verde saturado en zonas no protagonistas (ver defecto #2).

Notas de alcance: freemium sin trial confirmado — no se exige fecha de cobro, badge de días gratis ni garantía con plazo; el plan Free y el copy "Cancela cuando quieras · [cliente] queda guardado en cualquier plan" cumplen la salida limpia. Sub-check "garantía nombrada" no aplica (no hay CTA de compra directa con cobro inmediato en esta pantalla). Los 4 anclas del "CTA héroe vivo" pasan en los 3 botones (contraste, whileTap, nunca disabled, ≥48px).
