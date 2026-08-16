# VEREDICTO revisor-visual — onboarding
Fecha: 2026-08-16 00:00
Screenshot: docs/revisiones/onboarding-1-perfil.png, docs/revisiones/onboarding-3-cliente.png, docs/revisiones/onboarding-4-resultado.png
Usabilidad: 34/40
Craft: 14/20
Copy (si vende): N-A
Fidelidad (si hubo referencia): N-A
Veredicto: NO LISTA
Top defectos:
1. [Paso 2 "¿Cuál es tu moneda principal?", grid de 6 chips — MONEDAS en lib/onboarding.ts] Sin resolver desde R2: 6 opciones simultáneas sin preselección siguen violando el límite de ≤4 opciones/decisión del gate de carga cognitiva → preseleccionar la moneda probable con `navigator.language`/región y dejar las demás visibles como alternativa, no las 6 en paridad.
2. [Las 3 pantallas, tercio inferior] El fix de este ciclo agregó un `radial-gradient` de 6-7% de opacidad detrás de todo el flujo (page.tsx líneas 94-102) — a 375px casi no se percibe y el fondo sigue leyéndose plano; además ningún elemento usa `--surface-2` (el nivel "hundido" ya definido en tokens.css línea 23): solo hay base y superficie elevada, nunca los 3 niveles que exige craft/profundidad → subir la opacidad 2-3 puntos y usar `--surface-2` en al menos el contenedor de los campos del paso 3.
3. [Logo "CobroFlow", esquina superior izquierda — `Marca()` en ui.tsx línea 18] La confirmación de salida usa `window.confirm()` nativo del navegador: un diálogo gris del sistema que rompe por completo la identidad cream+verde y no tiene ninguna de las transiciones suaves que exige el eje de movimiento → reemplazar por un modal propio del kit (mismo radius/tipografía/spring que el resto de la app).
4. [Paso 3, campo "Ya te pagó"] Si el anticipo introducido es mayor al precio total (ej. total=900, anticipo=2000), `saldoPendiente()` clampea el resultado a $0 sin ningún mensaje que lo explique — el usuario ve un saldo que no cuadra con lo que escribió y no sabe por qué → agregar validación inline "El anticipo no puede ser mayor al precio total" antes de permitir avanzar.
5. [Paso 3, los 4 campos del cliente] No están dentro de un `<form onSubmit>` (page.tsx línea 155-174): presionar Enter en el teclado no dispara "Calcular mi saldo", y "Nombre del cliente" no tiene `autoFocus` al entrar al paso → envolver los campos en `<form>` con `onSubmit={enviarCliente}` y añadir `autoFocus` al primer campo (heurística 7, flexibilidad/eficiencia).

CORREGIDO DESDE R2 (verificado en screenshot + código):
- Bug del mensaje de error persistente: `cambiarNombre`/`cambiarTotal` ahora limpian `errorCliente` en cada `onChange` — confirmado en onboarding-3-cliente.png (formulario lleno, sin mensaje de error) y en page.tsx líneas 57-65.
- Stagger de entrada en chips: `Chip` en ui.tsx línea 89 ahora usa `delay: index * 0.06` — presente en los 3 pasos de selección.
- Campos numéricos: `Campo` en page.tsx línea 278 filtra cualquier carácter que no sea `[0-9.,]` en el propio `onChange`, ya no se pueden escribir letras.
- Indicador flotante de Next.js quitado de los screenshots (`devIndicators: false`).
