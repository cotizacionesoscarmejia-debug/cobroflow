# FICHA DE DIRECCIÓN DE ARTE — CobroFlow

## Referencia del usuario (CONTRATO — ver 16)
- ¿Hay imagen(es) de referencia del usuario?: NO → dirección derivada sin contrato visual
  (el usuario sí dio brief textual: "fintech moderna, amigable, no bancaria ni corporativa fría,
  verde de dinero/crecimiento" — tratado como guía de PASO 0, no como contrato de píxeles).

## Identidad derivada (sin referencia — FUSIÓN de líderes, 16 PASO 0.2bis + banco 54)
- TABLA DE LÍDERES (nicho: fintech personal / control de cobros freelance):
  - **Nubank** (gigante LATAM admirado) → tipografía sans redondeada-geométrica cálida, tarjetas
    blancas sobre fondo con color, números grandes y protagonistas.
  - **Revolut** → el "delta" (flecha + %) como forma de mostrar tendencia sin gráfico pesado.
  - **Bonsai** (competidor directo, EE.UU.) → cards muy redondeadas, tono amable, ilustrativo,
    pensado para que un freelancer no sienta que usa "software contable".
  - Robado de cada uno: de Nubank la calidez tipográfica y el número héroe; de Revolut el
    indicador de tendencia; de Bonsai la generosidad del radio y el tono no-corporativo.
- Combinación tipográfica: **Sora (display) + Wix Madefor Text (body)** — sans geométrica-humanista
  cálida + sans neutra legible para cifras; validada contra Nubank/Bonsai (ninguna serif, ninguna
  mono como marca).
- Arquetipo: **Cuidador** (protector, cálido-confiable) con un matiz de **Gente Común** (honesto,
  accesible, cero jerga bancaria). Mundo del sujeto (0.45): el **recibo/comprobante de pago real**
  — el objeto físico que un freelancer LATAM ya conoce (boleta, ticket, captura de WhatsApp del
  pago) — de ahí sale el dispositivo ownable, no de un ícono de billetera genérico.
- Dirección del banco 54 usada para el dispositivo: inspirada en "Fintech de bolsillo" (#3, cifras
  tabulares) pero en su variante CLARA propia del proyecto — paleta base tomada de la fusión de
  líderes de arriba, no del banco (el banco solo aportó la idea de "regla de dato", adaptada al
  recibo perforado).

## Personalidad compilada
- 3 adjetivos: **claro, confiable, cercano**
- Compilación: spring sutil (bounce 0.1, casi sin rebote) · duración base 280ms · stagger de
  lista 70ms · exclamaciones máx. 1/pantalla (solo en celebración de pago recibido) · celebración
  nivel medio (check + micro-confeti solo en "saldo llegó a $0", nunca en cada acción) · radio
  tendencial 20-22px.

## Brand kit final
- Fondo: `#FAF6EF` · Superficie: `#FFFFFF` · Hundido: `#F1ECE1` · Texto 1º/2º: `#241E14` / `#7A7161`
- Acento: `#187C51` (ajustado de `#1B8A5A` original ~10% más oscuro — el texto claro sobre el
  acento en botones/badges no llegaba a AA 4.5:1; mismo hue, verificado con revisor-visual R1.
  SOLO en: CTA primario, saldo cobrado, checkmarks, ícono activo de nav) ·
  2ª nota: `#C97A2E` (ámbar cálido — porqué: hitos, botón flotante "+", estado "vence hoy" — nunca
  compite con el verde en el mismo elemento)
- Semánticos: éxito `#147A4E` (texto) / `#E4F3EA` (fondo) · error `#B3402C` / `#FBE7E4` · aviso
  `#946015` / `#FBF0DD`
- Display: **Sora** (pesos 700/800) · Body: **Wix Madefor Text** (pesos 400/500/600/700) ·
  Escala: display 36-38px · title 19-22px · body 14-15px · label 11-12px
- Radio: 22px cards / 16px botones y pills · Profundidad: sombras suaves multicapa con tinte
  cálido (elevación de modo claro, nunca borde duro) · Espaciado base: escala 4·8·12·16·24·32·48·64
- Dispositivo ownable: **"recibo perforado"** — cada card de cliente/pago lleva un borde
  punteado vertical (perforación de ticket) a la izquierda, evocando un comprobante real
- Motion signature: `--ease-out` estándar (cubic-bezier 0.16,1,0.3,1) · stagger 70ms · números
  cuentan hasta su valor final en 600-800ms, nunca aparecen de golpe

## Trazabilidad y vetos
- Protocolo A/B/C: opción elegida **A ("Radar en calma")** · descartadas: B "Radar preciso"
  (oscura/técnica, fusión Revolut+Linear) y C "Radar cercano" (terrosa/relacional, fusión Bonsai
  + salvia) · página comparativa: `docs/revisiones/direcciones-abc.html` · screenshots de la
  comparativa: capturados en sesión (Browser pane), no guardados a disco por falta de mecanismo
  de captura-a-archivo esta sesión — la comparativa HTML en sí queda como evidencia completa.
- Paleta derivada de: fusión Nubank + Bonsai (tomada tal cual de esa lógica, sin inventar hue) ·
  Dispositivo ownable elegido: recibo perforado (propio, inspirado en el mundo del sujeto 0.45)
- Registro anti-repetición: paleta cálida verde/ámbar #1B8A5A + Sora/Wix Madefor Text quedan
  VETADAS para el próximo proyecto del SO (anotar también en el ESTADO.md raíz del workspace si
  se crea un proyecto nuevo después de este).
- Modo (claro/oscuro) DERIVADO por: arquetipo Cuidador/Gente Común + pedido explícito del usuario
  de "no bancario, no corporativo frío" — claro cálido rompe el cliché fintech-oscuro que usan
  Alegra/Siigo/competencia contable, y es hoy más distintivo en la categoría.

## Idioma UI: Español LATAM neutro · Fecha de cierre de la ficha: 2026-08-15 · Aprobada por el usuario: SÍ
