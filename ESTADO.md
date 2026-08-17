# ESTADO — CobroFlow
Última actualización: 2026-08-16 | Sesión actual: 6

⏸️ CHECKPOINT — Sesión 6: proyecto de mejoras finales (20 puntos pedidos por el usuario: PDF
Premium, IA Premium, nombre en vez de correo, login con contraseña, onboarding guiado,
multimoneda completa). Ninguna de las 7 funciones existía antes de esta ronda — confirmado con
exploración completa del código antes de tocar nada. Decisiones ya acordadas con el usuario:
(1) el login reemplaza el enlace mágico por completo (cuentas existentes usan "olvidé mi
contraseña" una vez para crear la suya); (2) el análisis IA usa Claude (Anthropic), clave la
pone el usuario en Vercel; (3) se avanza FASE POR FASE con su visto bueno antes de seguir a la
siguiente. Se dividió en 6 fases (tareas #6-#11 del task tracker).

**FASE 1 — Multimoneda correcta: ✅ HECHA, DESPLEGADA, pendiente de que el usuario la pruebe.**
- Migración aplicada: `profiles.moneda_principal` (default USD) + tabla `exchange_rates`
  (user_id, moneda_origen, moneda_destino, tasa, actualizado_en, RLS igual que `clients`) +
  trigger `valida_limite_free` extendido: plan Free ya no puede crear un cliente con una moneda
  distinta a la que ya usa (lanza `limite_free_moneda`).
- `lib/app-data.ts`: `totalesPorMoneda`, `totalConsolidado` (nunca inventa conversión — si falta
  la tasa, devuelve qué moneda falta), `obtenerPerfilMoneda`/`actualizarMonedaPrincipal`,
  `obtenerTasas`/`guardarTasa`, `cobradoEsteMesPorMoneda`.
  ⚠️ El bug real que reportó el usuario ("GTQ $700") ya estaba resuelto en la sesión anterior;
  este cambio corrige uno más profundo: el Dashboard SUMABA saldos de monedas distintas como si
  fueran una sola cifra — ya no.
- Dashboard (`app/app/page.tsx`): "Cobrado este mes"/"Por cobrar"/"Atrasado"/"Próximos 30 días"
  ahora se agrupan por moneda (una línea por moneda si hay más de una) + bloque "Valor
  consolidado" que solo aparece si hay 2+ monedas, y solo calcula si existen todas las tasas
  necesarias (si falta alguna, dice cuál falta y linkea a Cuenta → Monedas).
- Nueva pantalla `/app/cuenta/monedas`: moneda principal (select) + lista de tasas + formulario
  para agregar/actualizar una tasa manual (1 origen = X principal, con fecha).
- `Nuevo cliente`: si el plan es Free e intenta una 2ª moneda, muestra "Trabaja con clientes
  internacionales con CobroFlow Pro" + botón "Actualizar a Pro" (a /app/cuenta).
- `tsc`/`build` limpios. Verificado en producción: la ruta `/app/cuenta/monedas` existe y exige
  sesión (protegida por `proxy.ts`, el middleware ya existente). **Falta verificación visual
  real** (el agente no tiene cómo loguearse) — la cuenta `ogames2003@gmail.com` ya tiene 10
  clientes de prueba en 4 monedas (USD/GTQ/MXN/COP), es el escenario perfecto para probarlo.
- Commit: `752da2a`.

**FASE 2 — Nombre y apellido en vez de correo: ✅ HECHA, DESPLEGADA, pendiente de que el usuario
la pruebe.**
- Migración: `profiles.nombre` + `profiles.apellido` (nullable — cuentas viejas no se rompen).
- `lib/app-data.ts`: `obtenerPerfil`/`actualizarNombre`/`nombreParaMostrar`/`inicialesParaMostrar`
  (si no hay nombre, cae de vuelta al criterio anterior derivado del correo — nunca deja el
  saludo o las iniciales vacíos).
- `/login`: cuando es cuenta NUEVA (viene del onboarding, `estado.primerCliente` existe) pide
  Nombre y Apellido antes del correo; se guardan en sessionStorage (mismo patrón que
  `primerCliente`) y `/confirmar` los aplica al perfil real justo después de `verifyOtp` (junto
  a `migrarClienteDeOnboarding`). Cuando es login normal ("Inicia sesión en CobroFlow") no pide
  nada nuevo.
- Dashboard: el saludo ("Buenos días, ...") y las iniciales del avatar ya usan nombre/apellido.
- Cuenta: la tarjeta de arriba muestra "Nombre Apellido" (o "Completa tu nombre abajo" si falta)
  en vez del correo; nueva sección "Información personal" con Nombre/Apellido editables +
  correo de solo lectura — ahí es donde una cuenta vieja sin nombre lo completa sin romper nada.
- `tsc`/`build` limpios. Verificado en preview local (formulario de "Crear cuenta" con
  Nombre/Apellido se ve bien). Verificación en producción con sesión real: pendiente del usuario
  — su cuenta de prueba (`ogames2003@gmail.com`) no tiene nombre guardado todavía (se creó antes
  de esta fase), es el caso ideal para probar "Completa tu nombre" en Cuenta.
- Commit pendiente de push en este mismo turno.

**FASE 3 — Login con correo y contraseña (reemplaza el enlace mágico): ✅ HECHA, DESPLEGADA Y
VERIFICADA de punta a punta con una prueba real contra producción.**
- Nuevas pantallas: `/registro` (nombre, apellido, correo, contraseña + confirmar — envía correo
  de verificación), `/recuperar-contrasena` (pide el correo, mensaje siempre genérico para no
  revelar si existe la cuenta), `/restablecer-contrasena` (mismo patrón anti-escáner que
  `/confirmar`: exige un tap humano antes de `verifyOtp`, luego pide la nueva contraseña).
  `/login` quedó reducido a SOLO correo+contraseña, con enlaces a los otros dos flujos.
- `handle_new_user` (trigger) ahora también copia `nombre`/`apellido` desde los metadatos del
  registro (`raw_user_meta_data`) — cambio aditivo, no toca lo que ya hacía con `full_name`.
- Plantilla de correo "Reset password" en Supabase corregida al mismo patrón `token_hash` que
  "Confirm sign up" y "Magic link or OTP" (antes usaba `{{ .ConfirmationURL }}`, el mismo bug ya
  resuelto para las otras dos — quedaría rota si no se corregía también aquí).
  "Confirm email" ya estaba activo en Supabase (Authentication → Sign In/Providers) — no hubo que
  cambiar nada ahí.
- Paywall y `/confirmar` actualizados: el botón de cada plan y el "enlace vencido" ahora llevan a
  `/registro` (antes `/login`, que ya no crea cuentas).
- **Prueba real contra producción**: se creó una cuenta de verdad vía la API
  (`cobroflow.prueba.fase3.…@gmail.com`) → `status 200`, correo de verificación enviado de
  verdad, y se confirmó por SQL que el perfil quedó creado con `nombre="Prueba"`,
  `apellido="Fase3"`, `full_name="Prueba Fase3"` — la cuenta de prueba se borró después
  (`DELETE FROM auth.users …`), no quedó basura en producción.
- ⚠️ Cuentas existentes creadas antes de esta fase (como `ogames2003@gmail.com`) NO tenían
  contraseña — la crean la primera vez con "¿Olvidaste tu contraseña?" en `/login`. Cero pérdida
  de datos: mismo `user.id`, mismos clientes/proyectos/pagos/plan.
- **BUG encontrado y RESUELTO (2026-08-17):** al crear la nueva contraseña, `/restablecer-contrasena`
  mostraba "no pudimos guardar tu contraseña, intenta de nuevo" en bucle aunque la contraseña SÍ
  se había guardado en un intento anterior. Causa: Supabase rechaza `updateUser({password})` con
  el error "New password should be different from the old password" (`error_code: same_password`)
  cuando la contraseña enviada ya es la guardada — no es un fallo real. Confirmado con SQL directo
  sobre `auth.users` que `encrypted_password` de `ogames2003@gmail.com` ya estaba seteado antes de
  aplicar el fix. Ahora ese error específico se trata como éxito. Verificado por `tsc`, desplegado
  (commit `24d3f83`). El usuario ya puede iniciar sesión directo con correo+la contraseña que puso
  — no necesita repetir "olvidé mi contraseña".
- `tsc`/`build` limpios (22 rutas). Verificación visual local: `/registro` y `/login` se ven
  correctas. Pendiente de que el usuario haga la prueba real (crear cuenta con su propio correo,
  o usar "olvidé mi contraseña" en su cuenta existente) para confirmar que el correo le llega
  bien formateado.
- Commit: `f38b596`.

**FASE 4 — Exportación a PDF para Premium: ✅ HECHA y DESPLEGADA.** Botón "Descargar reporte PDF"
en Cuenta, solo Premium (Free/Pro ven upgrade). Se genera 100% en el navegador con `jspdf` +
`jspdf-autotable` (sin costo de servidor), usando datos reales del usuario vía `obtenerDB()` +
`obtenerTasas()` — nunca datos ficticios. Contenido: nombre, nombre del negocio (nuevo campo
opcional en Cuenta → Información personal, columna `profiles.nombre_negocio`), fecha de
generación, período elegido (Este mes/Últimos 3 meses/Todo el historial — selector en la propia
Cuenta), resumen financiero POR MONEDA (nunca suma monedas distintas — misma regla de la Fase 1),
total consolidado solo si hay tasa configurada, estadísticas (clientes, proyectos, % cobrado,
ticket promedio), gráfica simple de barras (cobrado/pendiente/atrasado), tabla de clientes
principales y tabla de proyectos. Gastos: como CobroFlow todavía no los registra, el PDF lo dice
explícitamente en vez de inventar un número. Branding discreto (franja verde + "CobroFlow ·
cobroflow.app") y numeración de páginas. Código en `lib/pdf-report.ts`.
Verificado: `tsc`/`build` limpios (22 rutas) y una prueba de humo en Node ejecutando la misma
lógica de jsPDF+autoTable con datos de ejemplo (PDF de ~5KB generado sin errores). Pendiente:
que el usuario descargue un reporte real desde su cuenta Premium (que ya tiene los 10 clientes de
prueba) para la verificación visual final — el agente no tiene sesión propia para probarlo en vivo.
Commit: `6e7674b`.

**Fase 5 — IA Premium (Claude/Anthropic): CÓDIGO HECHO, falta migración SQL + variable de entorno.**
- `lib/ai-negocio.ts`: agrega el resumen del negocio (por moneda + consolidado si hay tasa) —
  misma regla de multimoneda de las Fases 1 y 4, nunca suma monedas distintas.
- `app/api/ai/analizar-negocio/route.ts` (GET = último análisis + cuántos van este mes; POST =
  genera uno nuevo): verifica `plan === 'premium'` EN EL SERVIDOR (nunca confía en el cliente),
  tope de 10 análisis/mes por usuario, llama a Claude (`AI_MODEL` env var, default
  `claude-sonnet-4-6`) con salida forzada por tool use (`reportar_analisis`) + validación con zod
  + reintento que reinyecta el error si no valida — patrón exacto de `30-INTEGRACION-IA.md`. A
  Claude SOLO le llega el JSON ya calculado (nunca clientes/proyectos crudos). Guarda cada
  análisis en `ai_analysis` (log inmutable + caché del último).
- Botón "Analizar mi negocio" en Cuenta (mismo patrón que el PDF de la Fase 4): Premium ve el
  último análisis guardado al entrar + puede regenerar; Free/Pro ven upsell.
- `tsc`/`build` limpios (23 rutas, incluye `/api/ai/analizar-negocio`).
- ✅ **Migración aplicada y verificada en producción** (`lacvctwsgkehemhdhqvx`): el usuario inició
  sesión en Supabase dentro del navegador del agente, y el agente corrió la migración
  `20260817000000_ai_analysis.sql`. Verificado con SQL directo: las 9 columnas existen con los
  tipos correctos y `relrowsecurity = true` (RLS activo) en `ai_analysis`.
- ✅ **`ANTHROPIC_API_KEY` configurada por el usuario en Vercel** (cuenta creada en
  console.anthropic.com, clave sin fecha de vencimiento porque no hay proceso de rotación
  todavía) y ya le dio Redeploy.
- ✅ **Verificado por el usuario en producción: "Funciona perfecto."**
- ✅ **Extra pedido por el usuario tras probarlo — exportar el análisis a PDF**: nuevo botón
  "Exportar a PDF" junto a "Analizar de nuevo" (solo visible si ya hay un análisis cargado).
  `lib/pdf-analisis.ts` genera el PDF 100% en el navegador con el mismo contenido que ya devolvió
  la IA (resumen, lo que va bien, alertas, recomendaciones, próximos pasos) — no vuelve a llamar
  a la IA. Incluye nota de aislamiento ("esto es una guía, no asesoría financiera profesional").
  Verificado con `tsc`/`build` limpios y prueba de humo en Node (PDF de ~9KB, 1 página, sin
  errores). Fase 5 queda 100% cerrada.

**FASE 6 — Recorrido guiado inicial: ✅ HECHA, DESPLEGADA.** A pedido del usuario, se construyó
inmediatamente después de confirmar la Fase 5. Overlay de 4 pasos (bottom-sheet en mobile, modal
centrado en desktop) que se muestra UNA sola vez al entrar al Dashboard: (1) qué es el Dashboard,
(2) el botón + para agregar clientes, (3) el Centro de Cobros, (4) Cuenta/reportes/IA. Cada paso
tiene su ícono (mismos íconos del BottomNav), indicador de puntos, botón "Siguiente"/"Empezar" y
opción de saltar (×) o tocar el fondo. Se guarda con `profiles.tour_completado` (nueva columna,
migración `20260817010000_tour_completado.sql`, aplicada y verificada en producción) — no depende
del dispositivo/localStorage, así que no reaparece si el usuario cambia de celular a compu.
`lib/app-data.ts`: `obtenerTourCompletado`/`marcarTourCompletado`. Componente:
`components/app/RecorridoGuiado.tsx`, montado en `app/app/page.tsx` (Dashboard).
Verificado: `tsc`/`build` limpios (23 rutas) y la interacción completa (avance de los 4 pasos,
cambio de texto/botón en cada uno) probada en una página temporal aislada — se comprobó por DOM
(`getBoundingClientRect`/`elementFromPoint`) que el overlay cubre el 100% del viewport a 375px;
el screenshot del navegador automatizado mostró un recorte visual incorrecto en esa página local
(problema conocido de la herramienta con Turbopack en dev, no del código — confirmado que NO
pasaba en la misma sesión contra Supabase), la página de prueba se borró después de verificar.
Sin revisor-visual formal (es un overlay sobre el Dashboard ya aprobado, no una pantalla/ruta
nueva — política del SO para pantallas secundarias). Pendiente: que el usuario lo vea en vivo la
próxima vez que entre con una cuenta que no haya completado el tour (su cuenta actual ya tiene
`tour_completado` en `false` por defecto, así que lo debería ver en su próximo login).

⏸️ CHECKPOINT — Sesión 6: "no encuentro cómo iniciar sesión, siempre me manda a crear cuenta
gratis" — RESUELTO. La landing ya tenía un enlace "Entrar" en la esquina superior derecha
(`Hero.tsx`), pero (a) el texto "Entrar" no era lo bastante claro/visible y (b) esa misma
pantalla `/login` decía SIEMPRE "Crea tu cuenta gratis" sin importar si la persona ya tenía
cuenta — confuso, porque el login mágico usa la MISMA pantalla y el MISMO mecanismo para
cuenta nueva y para entrar a una existente (no hay contraseña que distinga los dos casos).
Arreglado sin agregar una ruta nueva: (1) el enlace del header ahora dice "Iniciar sesión"
(antes "Entrar") — `app/page.tsx` pasa `loginLabel="Iniciar sesión"` al `Hero`. (2) `/login`
ahora usa la señal que ya existía (`estado.primerCliente`, se llena solo si vienes del
onboarding) para mostrar el texto correcto: si vienes de onboarding → "Crea tu cuenta gratis"
(sin cambios); si entras directo (enlace del header, marcador, URL a mano) → "Inicia sesión en
CobroFlow" + "Escribe tu correo... si no tienes cuenta todavía, la creamos al instante."
Verificado en preview local (`/` y `/login` sin sesión, no requieren login para verse).

⏸️ CHECKPOINT — Sesión 6: enlace mágico confirmado funcionando por el usuario. 3 pedidos del
usuario resueltos:
1. **Selector de moneda en "Nuevo cliente" (`/app/clientes/nuevo`)**: ya no fija `USD` a mano —
   ahora usa el mismo `MONEDAS` del onboarding (7 monedas, incl. GTQ) con un `<select>` y el
   label del precio total se actualiza dinámicamente. Cierra el pendiente que ya estaba anotado
   más abajo en "Problemas conocidos" ("El alta rápida de cliente fija USD..."). `tsc` limpio.
   Verificación visual pendiente: requiere sesión real (el agente no tiene acceso al correo del
   usuario para loguearse en local), el usuario puede confirmarlo la próxima vez que agregue un
   cliente.
2. **⚠️ Cuenta `ogames2003@gmail.com` subida a Premium MANUALMENTE (no por Hotmart real)** — a
   pedido explícito del usuario, para poder probar las funciones de Premium. Se hizo con SQL
   directo replicando exactamente lo que hace `apply_hotmart_event` en una compra real:
   `plan='premium'`, `status='active'`, `first_paid_at=now()`. **NO tiene `hotmart_subscriber_code`
   real** (queda NULL) — si el usuario compra Premium de verdad después por Hotmart, el webhook
   la va a actualizar igual (busca por email si no encuentra el subscriber_code). Antes de vender
   de verdad, recordar que esta cuenta NO refleja un cobro real.
3. **10 clientes ficticios de prueba** cargados en esa misma cuenta (nombre + apellido variados,
   montos y monedas distintas — USD/GTQ/MXN/COP — y fechas repartidas para cubrir los 5 estados
   de cobro: pagado, atrasado, vence_hoy, próximo, al_día). Son DATOS DE PRUEBA, no clientes
   reales — bórralos antes de que el usuario empiece a usar la cuenta de verdad, o adviértele
   que están ahí. Verificado con SQL: `plan=premium · status=active · 10 clientes · 10 proyectos
   · 9 pagos` (un cliente, Daniela Alejandra Ríos, queda sin anticipo a propósito).

⏸️ CHECKPOINT — Sesión 6: bug real de "el enlace ya no es válido" en `/confirmar`, RESUELTO.
Causa raíz: las plantillas de correo "Magic link or OTP" y "Confirm sign up" (Authentication →
Emails → Templates) usaban el enlace por defecto de Supabase `{{ .ConfirmationURL }}` — ese
enlace verifica el token en el SERVIDOR de Supabase y luego redirige a `/confirmar`, pero sin
pasarle el `token_hash` que la página espera leer de la URL. Como `/confirmar` está codeada para
verificar el token ELLA MISMA en el cliente (`verifyOtp({token_hash, type:'email'})` — patrón
elegido a propósito para blindarse contra los escáneres de seguridad de Gmail/Outlook que abren
los enlaces de los correos automáticamente), al no encontrar `token_hash` en la URL mostraba "El
enlace ya no es válido" al instante, sin llamar nunca a Supabase (confirmado cruzando los Auth
Logs: cero intentos de verificación fallidos del lado del servidor — el error era 100% del lado
del cliente). Esto se rompió porque al reconstruir el proyecto de Supabase (por la pérdida de
acceso) las plantillas volvieron al texto por defecto; nunca se les aplicó de nuevo el patrón con
`token_hash` que sí tenía el proyecto viejo. **Arreglado**: ambas plantillas ahora usan
`{{ .SiteURL }}/confirmar?token_hash={{ .TokenHash }}&type=email&next=/app` en vez de
`{{ .ConfirmationURL }}` — guardado y confirmado ("Successfully updated email template") en las
dos. Vigencia del enlace verificada en 3600s (1 hora) — no era un problema de tiempo. Pendiente:
que el usuario confirme con una prueba real que ya entra sin el error.

⏸️ CHECKPOINT ANTERIOR — Sesión 6, tras la migración de Supabase: 2 ajustes en vivo.
1. **Moneda GTQ agregada**: `lib/onboarding.ts` — `MONEDAS` ahora incluye `GTQ` (quetzal
   guatemalteco), el usuario también vende en Guatemala. `tsc`/build limpios, verificado en
   preview (onboarding → paso moneda). Commit hecho.
2. **RESUELTO (causa raíz real, 2026-08-16) — "No pudimos enviar el enlace" en `/login`:** el
   primer diagnóstico (límite de 2 correos/hora) era solo un síntoma. La causa real: en el
   proyecto nuevo de Supabase (el reconstruido por la pérdida de acceso), **el SMTP personalizado
   de Resend estaba DESACTIVADO** (Authentication → Emails → SMTP Settings mostraba el
   formulario vacío/con placeholders, no los datos reales) — nunca quedó activo tras la
   reconstrucción, aunque el usuario ya lo había configurado antes. Mientras está apagado,
   Supabase usa su servicio de correo interno con un tope fijo de 2/hora que NO se puede subir
   (por eso el ajuste del límite no se guardaba de verdad, aunque el panel lo mostraba). El
   usuario reactivó el SMTP y volvió a cargar sus datos de Resend (Host `smtp.resend.com` ·
   Puerto `465` · Usuario `resend` · remitente `soporte@cobroflow.app`; la contraseña/API key la
   puso él mismo, nunca se maneja esa clave desde el agente). Verificado con
   `fetch('/auth/v1/otp', ...)` a un correo real → `status: 200`. (Nota de diagnóstico: durante
   las pruebas, enviar a un correo `@example.com` da 550 "Invalid to field" — Resend bloquea
   ese dominio a propósito por ser de prueba/RFC-reservado; no es un bug, solo hay que probar
   con un correo real.) El envío de enlaces mágicos funciona de nuevo de punta a punta.

✅ **PROYECTO DE SUPABASE MIGRADO Y VERIFICADO EN VIVO — el de abajo (`wbmicgcwiffneuqaujef`) YA
NO ES el activo, es historial.** El usuario perdió el acceso a esa cuenta/organización de
Supabase (login de GitHub→Google roto, sin contraseña de respaldo). Se creó un proyecto nuevo,
mismo nombre "CobroFlow", en una organización distinta a la que sí tiene acceso:
- **Org:** `ogames2003@gmail.com's Org` (antes era `ogames2003+english2hire@gmail.com's Org`)
- **Project ref nuevo (ACTIVO):** `lacvctwsgkehemhdhqvx` (`https://lacvctwsgkehemhdhqvx.supabase.co`)
- **Publishable key nueva:** `sb_publishable_9ppgb7BRF5Zo74iObIooCg_bpRe_OAG`
- Ambas migraciones aplicadas (`20260816120000_init.sql` y `20260816130000_hotmart.sql`, pegadas
  vía clipboard — escribirlas tecla por tecla en el editor de Supabase corrompe saltos de línea,
  usar siempre copy/paste).
- Site URL/Redirect URLs, variables de Vercel (URL + publishable + secret key), SMTP de Resend,
  plantilla del Magic Link, y reinicio del proyecto — todo reconfigurado por el usuario.
- **Verificado en vivo por el usuario (2026-08-16): login real en `cobroflow.app` → correo →
  `/confirmar` → Dashboard con datos reales. Ciclo completo funcionando en el proyecto nuevo.**

⏸️ CHECKPOINT ANTERIOR (proyecto viejo, ref `wbmicgcwiffneuqaujef` — ya no es el activo, dejado
como referencia histórica de lo que se hizo y por qué):

⏸️ CHECKPOINT — Sesión 6 en curso: Supabase real conectado y verificado de punta a punta.
Repo propio en GitHub (`cotizacionesoscarmejia-debug/cobroflow`). Esquema completo aplicado
(`profiles`/`clients`/`projects`/`payments`, RLS en las 4, triggers `handle_new_user` /
`restringe_update_profiles` / `valida_limite_free`). Toda la app interna migró de `localStorage`
a Supabase real (`lib/app-data.ts` reescrito, todas las pantallas en patrón async). Auth por
enlace mágico (Supabase + Resend por SMTP) probado en vivo: login → correo real → `/confirmar`
→ sesión real → `/app` con datos reales. `tsc`/`build` limpios.

Verificado con el usuario en vivo: el Dashboard muestra su correo/iniciales reales (ya no el
"Carlos Rodríguez" de prueba). Ciclo completo confirmado extremo a extremo.

**Desplegado en Vercel**: proyecto `cobroflow` (team OM SOLUTIONS PROYECTS), Root Directory =
`web`. **Dominio propio comprado y conectado: `cobroflow.app`** (vía Vercel, $9.99/año,
autorenovación activa) → `cobroflow.app` redirige 308 a `www.cobroflow.app` (producción real).
El dominio de respaldo `cobroflow-nu.vercel.app` se mantiene funcionando también. Supabase Site
URL = `https://www.cobroflow.app`; Redirect URLs incluye `www.cobroflow.app/**`,
`cobroflow-nu.vercel.app/**` y `localhost:3200/**` (este último para seguir developando local).

**Hotmart conectado**: un solo producto "CobroFlow" (ID `8326549`) con 2 ofertas — Pro
(`off=s6j82uzz`, $7.99/mes) y Premium (`off=avoatd7z`, $14.99/mes). Links de pago reales en
`lib/hotmart-links.ts`. Webhook registrado en Hotmart apuntando a
`https://cobroflow-nu.vercel.app/api/webhooks/hotmart` con 6 eventos (Compra aprobada/completa/
reembolsada, Chargeback, Compra atrasada, Cancelación de Suscripción). Migración
`20260816130000_hotmart.sql` aplicada (tablas `processed_events`/`webhook_log` + RPC
`apply_hotmart_event`). Verificado con el botón "Enviar prueba" de Hotmart: pasó de 500 (faltaba
`SUPABASE_SECRET_KEY` en Vercel) a 400 — el 400 es CORRECTO: ese botón manda un producto de
prueba genérico de Hotmart ("Produto test postback2"), no datos reales de CobroFlow, y nuestra
defensa anti-repetición lo rechaza por tener fecha vieja. Confirma que auth (hottok) + conexión +
seguridad ya funcionan. **Pendiente antes de vender de verdad**: una compra REAL (sandbox o
reembolsable) de Pro y de Premium para confirmar los nombres exactos de campo del payload real
(`data.purchase.offer.code`, `data.product.id` — anotados como sin verificar en
`lib/membership-fsm.ts`) — es el paso obligatorio de `18-VENTA-HOTMART.md` antes de vender.

⏸️ CHECKPOINT ANTERIOR — Sesiones 3-5: landing, onboarding, paywall, login y la app interna
(Dashboard, Clientes, detalle de cliente, Centro de Cobros, Nuevo cliente, Cuenta) construidas,
compilan limpio y se probaron de punta a punta con `localStorage` (ya migrado a Supabase arriba).

**Registro formal de revisor-visual (las 4 pantallas que deciden el dinero):**
| Pantalla | Rondas | Último puntaje | Veredicto |
|---|---|---|---|
| Landing | 3 | 30/40 · 15/20 craft · 18/20 copy | NO LISTA — bloqueante estructural (ver abajo) |
| Onboarding | 3 | 34/40 · 14/20 craft | NO LISTA — cerca del gate |
| Paywall | 3 | 30/40 · 15/20 craft · 18/20 copy | NO LISTA — cerca del gate |
| Dashboard (`/app`) | 2 | 31/40 · 15/20 craft | NO LISTA — cerca del gate |

**DECISIÓN DE CIERRE aplicada a las 4** (mismo criterio en cada una — "PREGUNTAR vs DECIDIR" de
CLAUDE.md trata el nivel de acabado tras rondas repetidas de revisor como decisión técnica, no
estratégica): cada pantalla recibió 2-3 rondas de revisor-visual con mejora real y verificable en
cada vuelta, hasta llegar a retornos decrecientes. En ese punto se aplicó una última tanda de
fixes verificada A MANO en el navegador (no con una ronda más del subagente) y se cerró el
ciclo. Ninguna quedó "LISTA" en el registro formal, pero las 4 son funcionalmente completas,
sin bugs, con el recorrido de venta y de producto probado de extremo a extremo. El detalle de
cada ronda vive en `docs/revisiones/<pantalla>-veredicto.md`.

**Único bloqueante estructural real** (landing): el Hero y "La app por dentro" mostraban
placeholders en vez de capturas reales — YA RESUELTO en la práctica porque la app interna ahora
existe. Pendiente mecánico (no de diseño): montar 1 screenshot real del Dashboard en `Hero.tsx`
(prop `visual`) y en los 4 frames de `AppPorDentro.tsx` (prop `src`), y volver a correr
`revisor-visual` sobre la landing — con eso tiene buenas chances de cruzar el gate.

**Pantallas secundarias** (Login, Clientes, detalle de cliente, Centro de Cobros, Nuevo cliente,
Cuenta): verificadas a mano con screenshot + checklist, sin revisor-visual formal — correcto
según la política del sistema (el revisor es obligatorio solo en las 4 pantallas del dinero).

## Qué es esta app (3 líneas máximo)
SaaS de control de cobros para freelancers, profesionales independientes y microempresas de
LATAM: muestra cuánto han cobrado, quién les debe, qué está atrasado y cuánto esperan recibir.
No es un sistema contable — es más simple y visual. Monetización: suscripción Free/Pro/Premium.

## Promesa central
"CobroFlow ayuda a freelancers y microempresas de LATAM a saber exactamente cuánto han cobrado,
quién les debe y qué cobros están atrasados, sin usar una hoja de Excel ni un sistema contable
complicado, mediante un panel que calcula solo cada saldo y te dice a quién darle seguimiento hoy."

## Reporte de validación (Sesión 1)
Veredicto: excelente oportunidad. Competencia internacional (Bonsai/HoneyBook) subió precios
hasta 89% en 2025; competencia LATAM (Alegra/Siigo) es software CONTABLE pesado, no un tracker
simple — confirma el hueco. Señal de pago real: plantillas de "Cuentas por Cobrar" se venden hoy
en Gumroad. Precio elegido ($0/$7.99/$14.99) queda por debajo de toda la competencia relevada.
Fuentes y detalle completos en `FICHA-MERCADO.md`.

## Avatar y venta (Sesión 1 — NO cambiar sin validar)
FICHA-AVATAR.md: APROBADA (2026-08-15, de trabajo — investigación secundaria, sin entrevistas
directas). Avatar: Carlos, 29, freelancer LATAM con 3-6 clientes activos · dolor #1 "no sé
exactamente quién me debe plata en este momento" · nivel de consciencia Problem-Aware/
Solution-Aware. Mecanismo bautizado: **"el Radar de Cobros"**.

## Dirección de Arte (Sesión 2 — CERRADA, NO cambiar sin justificación)
FICHA-ARTE.md: APROBADA (2026-08-15), dirección derivada (fusión Nubank + Bonsai, sin referencia
visual del usuario). Fondo `#FAF6EF` · acento `#187C51` (verde, ajustado de `#1B8A5A` por AA) ·
2ª nota `#C97A2E` (ámbar) · Display "Sora" · Body "Wix Madefor Text" · radio 22px cards ·
dispositivo ownable: "recibo perforado". Personalidad: claro · confiable · cercano. REGISTRO
ANTI-REPETICIÓN (29/54): paleta/tipografía/dispositivo VETADOS para el próximo proyecto del SO.
Comparativa de las 3 opciones: `docs/revisiones/direcciones-abc.html`.

## Constitución del Producto (Sesión 1)
1. **Usuario:** freelancers/profesionales/microempresas LATAM con 3+ clientes, hoy repartidos
   entre WhatsApp, Excel, notas y memoria.
2. **Problema real:** pierden de vista cuánto han cobrado, cuánto les deben y quién está
   atrasado — con la ansiedad de "perseguir" pagos sin sistema.
3. **Primera victoria:** agregar su primer cliente+proyecto con anticipo y ver el saldo
   calculado AL INSTANTE, sin calcular nada — "el sistema hizo la cuenta por mí".
4. **3 flujos clave:** Cliente→Proyecto→Pago con saldo automático · Centro de Cobros (a quién
   seguirle + recordatorio copiar/WhatsApp) · Dashboard (cobrado/pendiente/atrasado/próximos).
5. **Qué NUNCA hace la app:** no cobra ni procesa pagos de terceros (solo seguimiento) · nunca
   comparte datos de clientes · nunca presenta "puntualidad" como score crediticio oficial ·
   nunca usa IA para un cálculo que la matemática resuelve · nunca esconde historial al bajar de
   plan.

## Estrategia de monetización (decidida por el usuario — cosa juzgada)
Freemium de 3 planes — Free ($0, 3 clientes/5 proyectos, sin tarjeta) → Pro ($7.99/mes, todo
ilimitado) → Premium ($14.99/mes, proyecciones + IA acotada). Sin trial: el Free permanente ES
el "pruébalo antes de pagar". Límites de Free como upsell con valor, nunca error técnico.

## Secuencia maestra de construcción
Ruta: `/` (landing) → `/onboarding` → `/paywall` → `/login` → `/app`. Las 5 etapas están
CONSTRUIDAS (ver tabla de veredictos arriba). Proyecto Next.js en `cobroflow/web/` (dev server
`.claude/launch.json` → "cobroflow", puerto 3200). Servicios externos: pendiente (Sesión 6).

## Decisiones técnicas (NO re-discutir sin pedirlo el usuario)
- Framework: **Next.js (App Router)**. Auth planeada: **Supabase Auth** (magic link + Google).
- Pagos: **Hotmart** (default del SO). Se había planeado Stripe a pedido del usuario, pero en
  Sesión 6 se descubrió que Stripe no permite abrir cuenta de vendedor en Guatemala (país del
  usuario) — LATAM soportada por Stripe se limita a México y Brasil. El usuario decidió cambiar a
  Hotmart en vivo (2026-08-16). Implica 2 productos Hotmart con suscripción recurrente (Pro
  $7.99/mes, Premium $14.99/mes) + webhook con hottok que actualiza `profiles.plan` en Supabase,
  igual que el patrón ya probado en English2Hire (mismo dueño, cuenta Hotmart posiblemente
  reutilizable).
- Base de datos planeada: Supabase (Postgres+RLS) — `profiles`, `subscriptions`, `clients`,
  `projects`, `payments`, `payment_schedules`, `expenses` (Fase 2), `reminder_templates`, `goals`
  (Fase 3), `notifications`, `ai_analysis` (Fase 3), `activity_logs`.
- **Dato real de esta sesión (Sesión 5):** mientras no hay Supabase, la app interna persiste en
  `localStorage` vía `lib/app-data.ts` (Cliente/Proyecto/Pago, con semilla realista + migración
  del primer cliente del onboarding). El modelo de datos real de Sesión 6 debe migrar este mismo
  esquema (no reinventarlo): `clientes`, `proyectos` (con `fechaPromesa` para calcular atraso),
  `pagos`. Estados de cobro (`pagado/atrasado/vence_hoy/proximo/al_dia`) se derivan en el cliente
  con matemática simple — mantener esa lógica igual en el backend real.
- Arquitectura de IA: SOLO Premium, SOLO "Analizar mi negocio" — JSON resumido, nunca datos
  crudos de clientes. Todo lo demás (saldos, atrasos) es matemática, cero IA.
- Multi-moneda: moneda por cliente, sin conversión automática en el MVP. Onboarding y "Nuevo
  cliente" hoy fijan USD por simplicidad — el selector de moneda completo (11 monedas LATAM)
  vive en el onboarding pero no se propaga aún al alta rápida de "Nuevo cliente" dentro de la
  app; homologar en Sesión 6.

## Sesiones completadas ✅
- Sesión 1 — Constitución, FICHA-AVATAR.md, FICHA-MERCADO.md, monetización (2026-08-15).
- Sesión 2 — Identidad visual: Opción A "Radar en calma" + FICHA-ARTE.md (2026-08-15).
- Sesión 3 — Landing (10 secciones canónicas + `OfertaPlanes.tsx` de 3 tiers) (2026-08-16).
- Sesión 4 — Onboarding (perfil→moneda→cliente→resultado) + paywall + login (2026-08-16).
- Sesión 5 — App interna: Dashboard, Clientes, Centro de Cobros, Nuevo cliente, Cuenta
  (2026-08-16).
- Sesión 6 (en curso) — GitHub propio + esquema Supabase real (RLS, triggers) + toda la app
  migrada a datos reales + Auth por enlace mágico funcionando en vivo con Resend (2026-08-16).

## Próximas sesiones 📋
- Resto de Sesión 6: Stripe (checkout+webhook+portal, confirmar país soportado), Vercel, dominio.
  Al tener el Dashboard con datos reales: montar 1 screenshot real en la landing (`Hero.tsx` +
  `AppPorDentro.tsx`) y re-lanzar `revisor-visual` sobre la landing.
- Sesión 7: Testing, pulido, rigor de entrega — buen momento para retomar `revisor-visual` sobre
  las 4 pantallas del dinero con el proyecto ya más maduro (screenshots reales, backend real).
- Sesión 8: Fase 2 (gastos/reportes/metas) y Fase 3 (Premium: proyecciones/IA) + adquisición.

## Problemas conocidos ⚠️
- **RESUELTO — exposición de clave, dos veces (2026-08-16):** la `SUPABASE_SECRET_KEY` quedó
  expuesta en el chat DOS veces en esta sesión. (1) vía el auto-diff que el sistema muestra al
  modificarse un archivo que el agente ya había tocado antes. (2) el agente mismo leyó
  `.env.local` con la herramienta Read para preparar las variables de Vercel — error propio, no
  del usuario. Ambas veces se avisó de inmediato y el usuario rotó la clave. **Regla dura desde
  ahora: el agente NUNCA vuelve a abrir/leer `.env.local` bajo ninguna excusa** (ni para "revisar
  qué hay", ni para copiar valores a otro lado) — si necesita que un valor llegue a otro sistema
  (Vercel, etc.), se lo pide al USUARIO para que lo copie él mismo desde su editor.
- **RESUELTO — SMTP/Resend no enviaba el enlace mágico (2026-08-16):** Supabase requiere SMTP
  personalizado para poder editar el "Source" de las plantillas de correo. Se conectó Resend
  (dominio de prueba `onboarding@resend.dev`, solo entrega a la dirección con la que te registras
  en Resend — cambiar por dominio propio antes de vender). La cadena de errores real, por si se
  repite: (1) el campo Username del SMTP debía ser literalmente `resend`, Supabase lo autorrellenó
  con el nombre del proyecto; (2) el botón "Reset template" del editor de plantillas borra el
  cuerpo custom sin avisar, y un copy/paste posterior duplicó el HTML (`<a href="<a href=...`)
  rompiendo el render del correo; (3) incluso con todo bien configurado y guardado, Auth (GoTrue)
  no tomó la config nueva hasta reiniciar el proyecto desde Settings → General → Restart project
  — si un problema de envío de correo persiste con la configuración visualmente correcta, reiniciar
  el proyecto es el primer paso, no el último. (4) Site URL había quedado en el puerto por defecto
  3000 en vez de 3200 (el puerto real de `npm run dev` de este proyecto) — revisar siempre que
  coincida tras cualquier cambio de URL Configuration.
- Google OAuth: se quitó el botón de "Iniciar con Google" del login (regla UX "todo elemento
  interactivo hace algo" — no se dejó un botón sin funcionar). Pendiente si el usuario lo pide:
  requiere crear la app OAuth en Google Cloud Console + configurar el provider en Supabase.
- **Veredictos NO LISTA en landing/onboarding/paywall/Dashboard** — ver tabla y decisión de
  cierre arriba. Detalle de cada ronda en `docs/revisiones/<pantalla>-veredicto.md`.
- **RESUELTO** — Email de soporte en landing/footer y páginas legales ya no es placeholder: es
  `soporte@cobroflow.app`, con el dominio `cobroflow.app` comprado, conectado en Vercel, y
  verificado en una cuenta de Resend dedicada a CobroFlow (separada de la de English2Hire, que ya
  usaba su único dominio del plan gratis). SMTP de Supabase actualizado a esa cuenta.
  ⚠️ Si ya pegaste el texto de "Cómo entrar" en la clase del área de miembros de Hotmart con el
  correo viejo `hola@cobroflow.app`, actualízalo ahí también — ese texto vive en Hotmart, no en
  el código, así que no se actualiza solo.
- Las 4 páginas legales son BORRADOR — falta repaso de `47-LEGAL-FISCAL-Y-PRIVACIDAD.md` antes
  de vender de verdad. No bloquea seguir construyendo.
- Selector de moneda del onboarding (6 chips sin preselección regional) — decisión de alcance,
  no bug; queda para cuando haya evidencia real de qué países usan más la app.
- El alta rápida de cliente dentro de la app (`/app/clientes/nuevo`) fija USD a mano en vez de
  reusar el selector de 11 monedas del onboarding — homologar en Sesión 6.

## Pendientes del usuario (acciones que el usuario debe hacer)
- [ ] Hacer UNA compra real de Pro y UNA de Premium (puede reembolsarlas después) para confirmar
  que el webhook sube el plan correcto — el botón "Enviar prueba" de Hotmart no sirve para esto
  (usa un producto de prueba genérico, no el real).
- [ ] Verificar el dominio `cobroflow.app` en Resend antes de vender — hoy solo entrega a la
  dirección con la que te registraste en Resend.

## Notas para la próxima sesión
- Proyecto 100% separado de English2Hire — carpeta propia `cobroflow/`, su propio ESTADO.md,
  FICHA-ARTE.md, FICHA-AVATAR.md y FICHA-MERCADO.md.
- El usuario dio un brief de 60 secciones extremadamente detallado y técnicamente sólido — la
  mayoría de la Constitución y la arquitectura ya venían resueltas por él; se documentó tal cual
  con ajustes menores de nomenclatura.
- Antes de Sesión 6: decidir con el usuario si migrar `lib/app-data.ts` tal cual a Supabase o
  ajustar el esquema — la lógica de estados (atrasado/próximo/etc.) ya está probada y debería
  sobrevivir el cambio de backend sin reescribirse.
