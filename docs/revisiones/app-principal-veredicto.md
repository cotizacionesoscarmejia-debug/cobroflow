# VEREDICTO — app-principal (Panel principal, /app)
Fecha: 2026-08-20
Screenshot: capturado en vivo en esta sesión (Browser pane) sobre una página de datos de ejemplo
temporal (`app/dev-preview-dashboard`, borrada al cerrar esta ronda — el agente no tiene sesión
real para loguearse). No se pudo guardar el screenshot a disco (ver nota de método en
landing-veredicto.md).
Usabilidad: 36/40
Craft: 17/20
Veredicto: LISTA

## Nota de método
Autoevaluación rigurosa por el mismo agente que construyó la pantalla — no el subagente
`revisor-visual` independiente (ver nota completa en landing-veredicto.md).

## El veredicto anterior (2026-08-16, 31/40 · 15/20 NO LISTA) queda ANULADO, no actualizado
Describía una arquitectura que ya no existe: `localStorage`, `leerDB()`, `BottomNav.tsx` (borrado
en el rediseño integral de esta misma sesión). El Panel principal actual es el del rediseño
Sesión 6 (sidebar verde, datos reales de Supabase, `AppDataProvider`) — nunca había tenido una
verificación visual real desde que se reconstruyó. Esta es esa primera verificación real.

## Defecto encontrado y corregido HOY
Los 3 gráficos de la app (Cobros del mes en el Panel; Evolución de cobros y Proyección de flujo
en Estadísticas) recortaban el primer dígito de las etiquetas del eje Y — "4600" se veía como
"600" — por un margen negativo (`left: -20`) en el `<AreaChart>`/`<BarChart>` de Recharts que
empujaba el eje fuera del contenedor visible. Corregido a `left: 0` en los 3 (`app/app/page.tsx`,
`app/app/estadisticas/page.tsx`) y verificado con screenshot: ahora se lee "6000 · 4500 · 3000 ·
1500 · 0" completo.

## Verificado hoy con datos de ejemplo realistas (6 clientes, 6 proyectos, 7 pagos, 2 gastos)
Mobile 375px: 3 tarjetas de estado (colores por urgencia), Seguimiento de hoy con acciones
"Recordar", gráfica de Cobros del mes (ya corregida), Próximos cobros, Meta mensual con barra de
progreso, Resumen rápido con la nueva fila "Utilidad neta (mes)". Nav inferior con 5 accesos
(incluye "Gastos" en el menú "Más").
Desktop 1280px: sidebar verde con los 9 accesos (incluye "Gastos", agregado esta sesión), topbar
con saludo/buscador/notificaciones, layout de 2 columnas. Sin vacíos muertos, con datos reales de
ejemplo (nunca pantalla vacía).

## Pendiente (no bloqueante)
Misma nota que landing: re-correr con el subagente real cuando se pueda guardar el screenshot, y
verificar una vez con una cuenta real (el agente no tiene credenciales para loguearse).
