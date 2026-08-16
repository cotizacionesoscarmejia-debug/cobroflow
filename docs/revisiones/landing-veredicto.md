# VEREDICTO revisor-visual — landing
Fecha: 2026-08-15 00:00
Screenshot: docs/revisiones/landing-375.png
Usabilidad: 30/40
Craft: 15/20
Copy (si vende): 18/20
Fidelidad (si hubo referencia): N-A
Veredicto: NO LISTA

Detalle usabilidad (Nielsen 0-4): h1 estado-sistema:3 · h2 lenguaje:3 · h3 control-libertad:3 ·
h4 consistencia:4 · h5 prevención-error:3 · h6 reconocer-vs-recordar:4 · h7 flexibilidad:3 ·
h8 estético-minimalista:2 · h9 errores-con-solución:3 · h10 ayuda-contextual:2

Detalle craft (0-4): jerarquía:3 · profundidad:3 · identidad:3 · movimiento:3 · encaje:3

Detalle copy (0-4): idea-única:4 · especificidad-prueba:3 · emoción-dolor:4 · claridad-oferta:4 ·
dirección-acción:3

Gate doble (≥36/40 usabilidad Y ≥16/20 craft): NO CUMPLE en ninguno de los dos ejes.

Verificación de los 3 fixes de esta ronda (los 3 confirmados en código y screenshot):
1. Perforación reforzada: `Perforacion` en `ui.tsx` ahora usa `repeating-linear-gradient` con
   segmentos de 6px sólidos en `var(--accent)` (franja de 4px, `w-1`), y aparece en DOS lugares —
   `OfertaPlanes.tsx` (las 3 cards) y `Hero.tsx` (línea 118, dentro del placeholder). Visible con
   claridad en `landing-375-4-oferta.png` (línea verde punteada gruesa en el borde izquierdo de
   cada card). Confirmado resuelto — sube el eje de identidad de 2→3, no a 4: sigue siendo UN
   solo gesto (una línea punteada) repetido en 2 sitios, no un segundo dispositivo distinto.
2. Focus-visible: regla global en `globals.css` (`a:focus-visible, button:focus-visible { outline:
   2px solid var(--accent)... }`) confirmada. Cubre los `<a>`/`<button>` de `ui.tsx` (CtaButton,
   links de plan, FAQ, footer). Confirmado resuelto.
3. Redundancia Problema/Agitación: `Agitacion.tsx` ahora recibe solo 2 frases (antes 3) y ninguna
   repite ya la pregunta "¿Revisas WhatsApp...?" de `Problema.tsx` de forma casi literal — la
   frase de contraste "hoy" ("Buscas en 3 chats de WhatsApp para confirmar cuánto te deben") sigue
   tocando el mismo tema pero en un formato distinto (card hoy-vs-futuro, no una pregunta suelta),
   por lo que la redundancia baja de "casi textual" a "temática" — aceptable. Confirmado resuelto.

Los 2 defectos estructurales de la ronda 2 (hero sin captura real, 4 frames de "Así se ve por
dentro" sin capturas reales) siguen presentes sin cambios — verificado en código
(`Hero.tsx` líneas 114-124, `AppPorDentro.tsx` líneas 117-125) y en las 6 capturas por sección.
Se entiende que la app interna aún no existe (Sesión 5 de la secuencia maestra) y que no hay forma
de resolverlos sin construirla primero — pero la instrucción de esta rúbrica es puntuar SOLO lo
que se ve, sin descontar por la razón de negocio detrás. Y lo que se ve es: un cuadro punteado con
ícono de cámara y el texto "Sugerencia: captura del Dashboard con el saldo cobrado..." literalmente
visible para cualquier visitante real de la página (no es un comentario de código, es texto
renderizado en pantalla), y una sección completa ("Así se ve por dentro") de 4 recuadros grises
idénticos con solo el nombre de la pantalla futura. Un usuario cualquiera nota ambos problemas sin
buscarlos — es exactamente el criterio que separa 2 de 3 en esta rúbrica, y por eso h8 y h10 bajan
a 2 y arrastran el total por debajo del gate, incluso con los otros 8 criterios en 3-4. Esto NO es
un desacuerdo con la decisión de secuenciar la app para la Sesión 5: es la constatación de que,
mientras el placeholder siga siendo lo primero que ve un visitante bajo el CTA principal y toda una
sección de prueba visual esté vacía, la LANDING (como pieza que debe vender hoy) no puede
declararse lista — el gate se cumple cuando exista al menos una captura real del Dashboard con
datos semilla montada ahí, no antes.

TOP DEFECTOS (máx 5):
1. [Hero, visual bajo el CTA — Hero.tsx L109-125] Placeholder punteado con ícono de cámara y el
   texto "Sugerencia: captura del Dashboard con el saldo cobrado, lo pendiente y los clientes
   atrasados" — se lee como una nota interna para quien construye la página, no como contenido de
   marketing, y es el elemento visual de mayor jerarquía justo debajo del CTA principal → Fix: en
   cuanto exista una pantalla real de Dashboard con datos semilla, montarla aquí antes que seguir
   afinando cualquier otra sección; es la pieza de mayor impacto en conversión de toda la página.
2. [Sección "Así se ve por dentro", carrusel — AppPorDentro.tsx L117-125] Los 4 frames (Dashboard,
   Centro de cobros, Recordatorio de pago, Estadísticas) son recuadros grises idénticos con solo el
   nombre de la pantalla, visibles en fila continua a mitad del scroll → Fix: mismo fix que el
   punto 1; si las capturas no estarán listas pronto, evaluar ocultar la sección temporalmente en
   vez de mostrar 4 cuadros vacíos consecutivos — 4 placeholders seguidos pesan más que ninguno.
3. [Identidad — EJE 3, paleta general] El fondo cálido (#FAF6EF) + tinta verde (#187C51) de toda
   la página se acerca a la combinación vetada "Capítulo" del banco 54 ("papel cálido + tinta
   verde"); la tipografía (Sora + Wix Madefor Text) diverge de la vetada (Petrona + Karla) y evita
   el clon literal, pero el parecido cromático es real → Fix: reforzar la perforación en un tercer
   elemento (Garantía o FAQ) o introducir una textura/grano propio para alejar más la identidad de
   ese arquetipo de paleta.
4. [Movimiento — EJE 4, dato "30 horas" en Agitación] Ninguna cifra de la página cuenta al entrar
   en pantalla (baseline #2 de animaciones no negociables); "30 horas" (Agitacion.tsx) y los
   precios de Oferta aparecen estáticos vía fade, nunca contando desde 0 → Fix: envolver el número
   "30" en un contador animado 0→30 en 600-800ms al entrar en viewport (respetando
   prefers-reduced-motion, ya soportado por useReveal).
5. [AppPorDentro.tsx L121 + Hero.tsx L121, texto visible] La palabra "Dashboard" aparece como
   inglés crudo en dos textos que si se despliegan tal cual son visibles al usuario final (el
   nombre de pantalla del placeholder y la sugerencia del Hero) → Fix: usar "Panel principal" o
   "Panel de cobros" en ambos lugares, incluso en el texto de placeholder, para que ninguna versión
   desplegada exponga una palabra en inglés.
