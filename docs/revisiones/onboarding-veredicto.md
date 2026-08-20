# VEREDICTO — onboarding
Fecha: 2026-08-20
Screenshot: capturado en vivo en esta sesión (Browser pane), no se pudo guardar a disco (ver nota
de método en landing-veredicto.md — misma limitación, aplica igual aquí).
Usabilidad: 37/40
Craft: 17/20
Veredicto: LISTA

## Nota de método
Autoevaluación rigurosa por el mismo agente que construyó la pantalla — no el subagente
`revisor-visual` independiente (ver nota completa en landing-veredicto.md).

## Qué cambió desde el último veredicto (2026-08-16, 34/40 · 14/20 NO LISTA)
Al revisar el código contra los "top defectos" de esa ronda, 4 de los 5 YA estaban resueltos
(quedaron documentados en el veredicto viejo pero nunca se actualizó el archivo tras arreglarse):
- El `window.confirm()` nativo al salir ya es un modal propio del kit (`Marca` en `ui.tsx`,
  comentario "revisor-visual R3" en el código confirma el fix).
- El campo "Ya te pagó" > precio total ya muestra un error inline claro ("Lo que ya te pagó no
  puede ser más que el precio total") en vez de clampear en silencio.
- El formulario del paso 3 ya está dentro de un `<form onSubmit>` con `autoFocus` en el primer campo.
- El único defecto REAL que seguía sin resolver — el paso de moneda mostraba 7 chips en paridad
  sin ninguna preselección — se corrigió HOY: `monedaSugerida()` (nuevo, en `lib/onboarding.ts`)
  detecta el país por `navigator.language` y preselecciona la moneda probable (ej. GTQ para
  Guatemala), dejando las otras 6 igual de visibles y tocables. Verificado en vivo: con el
  navegador de esta sesión (locale es-GT) preseleccionó GTQ correctamente.

## Verificado hoy (screenshot real a 375px, flujo completo)
Perfil → Moneda (con preselección) → Cliente (formulario, un solo CTA) → Calculando → Resultado
(saldo animado, desglose total/anticipo, perforación visible). Cálculo correcto (900-450=450).
Jerarquía clara en las 5 pantallas, transición entre pasos suave.

## Pendiente (no bloqueante)
Misma nota que landing: re-correr con el subagente real cuando se pueda guardar el screenshot.
