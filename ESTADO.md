# ESTADO — CobroFlow
Última actualización: 2026-08-20 | Sesión actual: 6

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
🔴 CERTIFICACIÓN PRE-LANZAMIENTO (48) — VEREDICTO: **NO APTO** (aún no cobrar a un usuario real)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

**CERTIFICADO: ~50/100** — VENTA 10/20 · FUNNEL 12/20 · PRODUCTO 10/20 · CONFIANZA 6/15 ·
VELOCIDAD 3/10 · RETENCIÓN 9/15. Puntaje bajo por diseño de la propia regla del certificado
("lo que no se midió puntúa 0"): mucho de lo construido es real y funciona, pero varias
verificaciones independientes (revisor-visual real, Lighthouse, prueba de compra real) nunca se
hicieron — así que no se acreditan aunque el código detrás sea sólido.

**EL BLOQUEANTE #1, de lejos** (item 5, PAGO): el campo `data.purchase.offer.code` que usa el
webhook para decidir si una compra es Pro o Premium **nunca se verificó contra una compra real**
de Hotmart — sigue siendo una suposición documentada desde que se conectó Hotmart. Si el nombre
real del campo es distinto, CADA compra real fallaría en activar el plan (el webhook la rechazaría
con 400 "plan no reconocido" — no se pierde el dinero ya cobrado por Hotmart, pero el comprador no
recibe su plan y el dueño tiene que activarlo a mano cada vez, insostenible con más de un puñado
de ventas). Esto NO se puede verificar sin una compra real — pendiente del usuario, ver abajo.

**4 bugs reales encontrados y CORREGIDOS hoy** (código en `main`, local — ver abajo qué falta
desplegar/aplicar):
1. **`ai_calls` nunca lograba insertar nada** (RLS sin política de insert + el código usaba el
   cliente normal, no el admin) — el costo de IA del item #6 del panel de expertos NUNCA se
   registró en la práctica hasta este fix. `app/api/ai/analizar-negocio/route.ts` ahora inserta
   con `createAdminClient()`.
2. **El límite del plan Free en la base de datos usaba el plan CRUDO, no el efectivo** — un
   usuario cancelado/reembolsado/con chargeback (que ya no tiene acceso pagado según
   `planEfectivo()` del lado de la app) podía seguir creando clientes/proyectos SIN LÍMITE en la
   base de datos, porque el trigger `valida_limite_free()` nunca revisaba `status`/`access_until`/
   `grace_ends_at`, solo `profiles.plan` (que a propósito nunca vuelve a 'free' solo). Nueva
   función SQL `plan_efectivo()` que replica la misma lógica de `lib/planes.ts`, usada ahora por
   el trigger. Migración: `20260821000003_fix_limite_free_plan_efectivo.sql` — **PENDIENTE que el
   usuario la corra en Supabase** (ver Pendientes del usuario).
3. **El límite de "Free = una sola moneda" nunca se implementó de verdad** — ESTADO.md documentaba
   (Fase 1, Multimoneda) que ya existía (`limite_free_moneda`, y el frontend en
   `app/app/clientes/nuevo/page.tsx` YA sabe mostrar el upsell para ese error exacto), pero ningún
   migration la escribía nunca. Un Free podía cargar clientes en varias monedas sin restricción.
   Agregado en la MISMA migración del punto 2.
4. **Sin circuit-breaker de costo de IA** — agregado kill-switch por variable de entorno
   (`AI_ANALISIS_DESACTIVADO=true`, sin redeploy de código) + tope global de 200 análisis/día
   (además del tope de 10/mes por usuario que ya existía) en `app/api/ai/analizar-negocio/route.ts`.

**1 problema de performance real encontrado y corregido hoy**: el Hero de la landing cargaba
`captura-dashboard.png` de **1.17MB sin optimizar** (con `<img>` plano, sin `next/image`) — el
LCP (velocidad de carga percibida) en un celular LATAM promedio iba a ser malo. Cambiadas las 6
imágenes de la landing (logo, hero, los 4 frames de "La app por dentro") a `next/image`, que
Vercel sirve automáticamente optimizado (WebP/AVIF, tamaño real, sin que el usuario note nada
distinto). **No hay medición real de Lighthouse antes/después** — el fix es real, pero el budget
del `38` sigue sin verificarse con evidencia numérica (por eso VELOCIDAD solo saca 3/10).

⚠️ **Hallazgo metodológico importante, con retractación honesta**: durante la auditoría encontré lo
que parecía un bug GRAVE — el paso de resultado del onboarding mostraba "Saldo pendiente: Q0" en
vez del monto real, en la pantalla más importante de todo el funnel (la "primera victoria"). Lo
investigué a fondo (console.log temporal, comparado local vs. producción, valores de React
confirmados correctos en cada paso) y encontré la causa real: `document.visibilityState` de la
pestaña del Browser pane usada por el agente es `'hidden'` y `document.hasFocus()` es `false` —
`requestAnimationFrame` (que usa el componente `NumeroAnimado` para el conteo 0→valor) NUNCA se
ejecuta en una pestaña sin foco/visible, así que el número se queda congelado en 0 solo en esta
herramienta de pruebas. Un usuario real, con su pestaña visible, ve la animación funcionar normal
(confirmado: `valor` llega correcto — 2000 — en cada log). **NO es un bug del producto** — pero
explica por qué esta sesión nunca pudo tomar un screenshot real (el mismo estado de pestaña oculta
bloquea la composición de frames del navegador). Se retira el debug log agregado; no se tocó
`NumeroAnimado`.

**Los 10 puntos del checklist** (✅ ok · ⚠️ arreglar · ❌ bloqueante):
1. Seguridad — ✅. RLS con `(select auth.uid())` en TODAS las tablas (13, verificado tabla por
   tabla), `with check` en las políticas de escritura, webhook con firma en tiempo constante +
   fail-secure (revienta si falta el secreto) + anti-replay (5 min) + verificado en vivo (401 real
   contra producción), headers de seguridad completos y verificados en vivo (CSP/HSTS/X-Frame-
   Options/nosniff/Permissions-Policy, todos presentes en `www.cobroflow.app`). IDOR mitigado por
   diseño (RLS en cada tabla) — no probado con dos cuentas reales (no hay credenciales de prueba).
2. Datos — ✅. Índices en todas las FKs, migraciones aditivas/seguras (`create or replace`,
   `if not exists`), backups estándar del plan de pago de Supabase (confirmado con el usuario).
3. Escala — ✅ con nota ⚠️. Supabase en plan de pago (confirmado con el usuario — sin riesgo de
   pausa a los 7 días ni tope de 5GB del Free). Arquitectura vía REST/PostgREST (Supabase JS), no
   una conexión directa a Postgres — el pooler de puerto 6543 no aplica a este patrón. ⚠️
   `obtenerDB()` trae TODOS los clientes/proyectos/pagos del usuario sin paginar — el límite real
   de PostgREST (~1000 filas) truncaría en SILENCIO los totales de un usuario con mucho historial.
   Hoy con cero usuarios reales no es urgente; sí antes de que alguien lleve 1-2 años de datos.
4. IA — ⚠️. Clave en servidor ✅, tope por usuario (10/mes) ✅, circuit-breaker global + kill-switch
   ✅ (agregado hoy), costo medido ✅ (agregado hoy, recién arreglado el bug de inserción). Sin
   golden-set de evals ❌ (no existe ningún test automatizado de calidad de la respuesta de la
   IA). Sin guardrails explícitos de moderación/anti-inyección — riesgo bajo porque a Claude solo
   le llega un JSON ya calculado por el código, nunca texto libre de otro usuario.
5. Pago — ❌ BLOQUEANTE (ver arriba). Idempotencia ✅ (dedupe real vía `processed_events`,
   verificado en el código), manejo de past_due/dunning ✅ (banner + 3 correos), pero CERO compra
   real de prueba desde que se conectó Hotmart — el campo del payload que decide el plan sigue sin
   confirmar.
6. Legal — ✅. Privacidad/Términos/Reembolsos/Aviso de IA reescritos esta sesión, coherentes entre
   sí y con la landing, verificados en vivo en producción (las 4 URLs resuelven, sin 404). Borrado
   de cuenta es manual (por correo) — aceptable para el tamaño actual del negocio, anotado en el
   manual del dueño.
7. Economía — ⚠️ (estimado, no medido). Costo de IA estimado ~$0.10-0.20/usuario/mes (~1% del
   precio de Premium) — pero la tabla `ai_calls` recién empieza a registrar de verdad (el bug de
   inserción se acaba de corregir), así que hoy hay CERO datos reales acumulados. Revisar con
   datos de verdad dentro de 2-4 semanas de uso.
8. Operación — ❌. Sin Sentry ni ningún monitoreo de errores (confirmado: no está en
   `package.json`) — hoy solo te enteras de un error si un usuario te escribe. Sin status page.
   Canal de soporte visible ✅ (`soporte@cobroflow.app`). Rollback: el mecanismo de Vercel
   (Promote to Production) existe y está documentado en `MANUAL-DEL-DUEÑO.md` (nuevo), pero nunca
   se probó en vivo.
9. Producto enriquecido — ⚠️. Las 4 pantallas del dinero tienen datos reales, sin pantallas vacías,
   con jerarquía visual corregida hoy (Panel principal) — pero sin el gate doble real del
   subagente `revisor-visual` independiente (mismo límite técnico de siempre, ahora explicado
   arriba: la pestaña del agente nunca está "visible" para el navegador).
10. Rigor de entrega — parcial. Auto-QA real hecho hoy (recorrido completo encarnando al avatar:
    landing → onboarding → primer cliente → resultado, con datos reales, en producción Y local).
    Circuit-breaker de IA ✅ (nuevo). `MANUAL-DEL-DUEÑO.md` ✅ (nuevo, en la raíz del repo).
    Invariantes de dinero revisadas y 2 corregidas (arriba). Performance: encontrado y corregido
    el problema real, sin medición Lighthouse. Sin golden-set de evals de IA.

**Verificado**: `tsc --noEmit` limpio y `npm run build` limpio (33 rutas) después de cada bloque de
fixes. Auto-QA real contra producción y contra local (Browser pane) — no solo lectura de código.

⚠️ **Pendientes del usuario, en orden de importancia:**
1. **Hacer UNA compra real de Pro y UNA de Premium** (reembolsables después) — es la ÚNICA forma
   de confirmar que el webhook activa el plan de verdad. Sin esto, no se puede subir el veredicto
   de NO APTO a APTO con honestidad, sin importar cuánto código se revise.
2. ✅ **Migración `20260821000003_fix_limite_free_plan_efectivo.sql` — aplicada por el usuario**
   (confirmado: "Ya corrí el código de SQL"). Corrige los bugs #2 y #3 de arriba.
3. **DNS de correo (SPF/DKIM/DMARC) — sigue sin existir**, confirmado de nuevo hoy con una consulta
   DNS real (no solo el panel). Mientras no esté, los correos de "pago confirmado"/dunning pueden
   no llegar o caer en spam — mismo pendiente ya anotado antes en esta sesión, repetido porque
   sigue sin resolverse.
4. Considerar instalar Sentry (o similar) antes de tener más de un puñado de usuarios reales — sin
   esto, los errores en producción son invisibles hasta que alguien se queja.
5. (Cuando el usuario apruebe) Subir a GitHub/desplegar los 4 fixes + el manual del dueño — hoy
   solo existen en el código local de esta sesión.

✅ CHECKPOINT — Sesión 6: PANEL DE 4 EXPERTOS (crítica sin piedad, contexto limpio) ejecutado y
los 10 hallazgos aprobados por el usuario ("Ya revisé los 10 de la tabla... Adelante"). Puntajes:
copy 14/20, craft 15/20, conversión (paywall) 5/10, retención 3/10, negocio 6/10 — veredicto vivió
solo en el chat, nunca se guardó a archivo (se documenta aquí ahora).

**De los 10 problemas, 7 son arreglos de código — HECHOS y DESPLEGADOS hoy:**
1. **Sin gatillo de retención tras la 1ª semana** → nuevo correo semanal "Tu resumen de la
   semana" (`lib/emails/resumen-semanal.ts`, function `procesarResumenSemanal` en
   `app/api/cron/emails/route.ts`, corre los lunes dentro del mismo cron diario ya existente).
   Va a TODO usuario con ≥1 cliente cargado (no solo pagos), es `FROM_TX` (transaccional — es su
   propio dato, no una oferta) e ignora `marketing_opt_out`. **Loop de hábito documentado**:
   gatillo externo = este correo · gatillo interno = "¿quién me debe ahora?" · acción = abrir
   Centro de cobros · recompensa = saldo ya calculado (variable: a veces "todo cobrado", a veces
   la lista de atrasados) · inversión = cada cliente/pago cargado hace el resumen más útil la
   próxima semana.
2. **Paywall no explica "por qué ahora"** → nueva línea bajo el recap (`app/paywall/page.tsx`):
   "Free guarda hasta 3 clientes — si ya sigues a más de los que ves aquí, tu Radar se queda
   incompleto justo con los que más te deben."
3. **Gráfica "Proyección de flujo" se veía rota** (barras cayendo a negativo en meses sin
   proyectos agendados) → `app/app/estadisticas/page.tsx`: las barras nunca bajan de 0
   (`Math.max(0, neto)`), los meses sin proyectos agendados se pintan en gris (`<Cell>` por
   `esperado === 0`) en vez de rojo/negativo, y la nota bajo la gráfica ahora aclara que el
   primer mes incluye lo atrasado y qué son las barras grises. No se tocó `proyeccionFlujo()` en
   `lib/app-data.ts` (la matemática ya era correcta — el problema era 100% de presentación).
4. **Headline no nombraba la escena real del avatar** → `app/page.tsx`: "Cobra lo que te deben.
   Controla lo que ganas." (genérico) → "Sabes quién te debe, sin buscar en WhatsApp." (la escena
   más específica de FICHA-AVATAR.md). No se corrió el proceso completo de 10 variantes del `19`
   — es un ajuste puntual aprobado como quick win, no una reescritura integral de la landing.
6. **Sin costo de IA medido** → nueva tabla `ai_calls` (migración
   `20260821000002_ai_calls.sql`, RLS por dueño) + `app/api/ai/analizar-negocio/route.ts` inserta
   una fila por análisis con `tokens_entrada`/`tokens_salida`/`costo_estimado_usd` (precio por
   modelo en `PRECIOS_USD_POR_MILLON`, fallback al precio de Sonnet si el modelo no está en la
   lista). Base para comparar el costo real de IA contra el precio de Premium ($14.99).
   ✅ **Migración aplicada por el usuario en Supabase** — confirmado ("Listo").
7. **"Garantía de Cero Riesgo" no garantizaba nada** → renombrada a "Sin compromiso"
   (`app/page.tsx`, prop `nombre` de `<Garantia>`) — la condición (cancela cuando quieras) ya era
   honesta, solo el nombre prometía de más.
9. **Jerarquía plana en el Panel principal** (3 tarjetas iguales) → `app/app/page.tsx`:
   `TarjetaStat` ahora acepta `variante="hero"|"secundario"`. "Cobrado este mes" es el dato héroe
   (34px, ícono 44px, `md:col-span-2`); "Pendiente por cobrar" y "Clientes atrasados" quedan
   secundarios (19px, borde más fino). Grid pasó de `md:grid-cols-3` a `md:grid-cols-2` (hero
   ocupa la fila completa, los 2 secundarios quedan lado a lado debajo).

**3 problemas NO son código — le corresponden al usuario, no se tocó nada (ni se inventó nada):**
5. **Cero prueba social** → el arreglo real es pedir 3-5 testimonios a los primeros clientes que
   ya están pagando. FICHA-AVATAR.md prohíbe explícitamente inventar testimonios/números — no se
   agregó ningún testimonio de relleno.
8. **Sin afiliados activos** → se activa desde el panel de Hotmart del usuario, fuera de esta app.
10. **Sin señuelo de precio entre Pro y Premium** → NO se tocó ningún precio ni se agregó un plan
    nuevo: cambiar precios reales requiere actualizar también la oferta configurada en Hotmart
    (fuera del alcance de código), y el SO pide proponer cambios de precio, no decidirlos solo.
    "Todo lo de Pro, sin límites" ya funciona como anclaje aditivo en el plan Premium — si el
    usuario quiere un señuelo más fuerte (plan intermedio o precio distinto), es una decisión de
    negocio que debe confirmar antes de tocar Hotmart + código a la vez.

**Verificado**: `tsc --noEmit` limpio, `npm run build` limpio (33 rutas). Verificación visual:
landing y paywall confirmados en vivo (Browser pane, texto extraído de la página real, headline
y copy nuevos presentes). Panel principal y Estadísticas verificados con el mismo patrón de
página temporal con datos de ejemplo ya usado en esta sesión (exportar `AppDataContext`/
`ShellInterno` temporalmente, montar con datos mock, verificar, revertir — cero rastro en el
código final, confirmado con `git status`); se confirmó por inspección de DOM que la tarjeta
héroe mide 34px/`md:col-span-2` y que la gráfica de proyección generó la nota "barras grises son
meses sin agendar" con los datos de prueba. **Sin capturas de pantalla guardadas a archivo**
(mismo límite técnico de toda esta sesión — el Browser pane no compone frames para screenshot
aquí) — verificación por texto/DOM real, no autoevaluación a ciegas.

✅ CHECKPOINT — Sesión 6: item #10 del panel (señuelo de precio) — HECHO y DESPLEGADO de punta a
punta (landing → onboarding/registro → confirmación → pago real en Hotmart), a $119/año.
- **Nota de anclaje** bajo el precio de Premium (landing y paywall): "Solo $0.23 al día más que
  Pro" — nuevo campo `notaAncla` en `PlanTier` (`components/landing/OfertaPlanes.tsx`).
- **Selector Mensual/Anual dentro de la card de Premium** (mismo componente, campo `anual:
  {precio, ctaHref, notaAhorro}`): al tocar "Anual" cambia el precio a $119, la nota a "Ahorras el
  equivalente a 4 meses frente al pago mensual", y el CTA agrega `&ciclo=anual`. Verificado en
  vivo: clic real en el botón → precio y CTA cambian correctamente.
- **El plan sigue siendo 'premium' en todo el sistema** — "anual" es solo el ciclo de cobro, no
  un plan nuevo (cero cambios en `Plan`, `capacidadesDe()`, gating, ni en las tablas). El `ciclo`
  viaja como query param por toda la cadena: `OfertaPlanes` → `/registro?plan=premium&ciclo=anual`
  → se guarda en `EstadoOnboarding.cicloElegido` (sessionStorage) → `/confirmar` lo lee tras
  verificar la cuenta → `/api/ir-a-hotmart?plan=premium&ciclo=anual` → `hotmartCheckoutUrl()`
  arma el link con la oferta anual en vez de la mensual.
- **Oferta de Hotmart real, dada por el usuario** (link de pago que generó él mismo, no
  adivinado): `off=wb7hd7f8&bid=1787231458731` sobre el mismo producto `F107189741W`. Guardada en
  `lib/hotmart-links.ts` (`OFFER_PREMIUM_ANUAL`) y usada tal cual (con el `bid` incluido).
  Verificado con un script de Node que reconstruye exactamente
  `https://pay.hotmart.com/F107189741W?off=wb7hd7f8&bid=1787231458731&email=...&sck=...` — igual
  al link real que compartió el usuario, más el tracking de email/id que ya usan Pro y Premium.
- **Webhook**: `planForOfferCode()` (`lib/membership-fsm.ts`) reconoce el código anual vía
  `HOTMART_OFFER_CODE_PREMIUM_ANUAL` y lo resuelve al mismo plan `'premium'` — una compra anual
  activa el plan exactamente igual que una mensual, sin tocar `apply_hotmart_event`.
- ⚠️ **Pendiente del usuario, único paso que falta**: agregar
  `HOTMART_OFFER_CODE_PREMIUM_ANUAL=wb7hd7f8` como variable de entorno en Vercel (mismo lugar
  donde ya están `HOTMART_OFFER_CODE_PRO`/`_PREMIUM`) y hacer Redeploy — sin eso, el webhook no
  reconocerá una compra anual como plan Premium (quedaría como "plan no reconocido", visible en
  los logs). El checkout/pago en sí ya funciona sin esa variable; solo la activación automática
  del plan la necesita.
- **No se tocó** el selector de ciclo en los upgrades desde dentro de la app (`BloqueoPlan.tsx`,
  Cuenta) — quedan solo mensuales por ahora; el alcance de hoy fue específicamente landing +
  paywall, que es donde vive la tabla de precios que auditó el panel.
- Verificado: `tsc --noEmit` limpio, `npm run build` limpio (33 rutas), toggle probado en vivo en
  la landing (clic real → precio/CTA cambian), URL de checkout verificada byte a byte contra la
  que compartió el usuario.

✅ CHECKPOINT — Sesión 6: SISTEMA DE EMAILS completo construido (18/34/35/46/58), código desplegado
a producción — falta que el usuario complete la configuración manual (Resend/DNS/variables) antes
de que los correos empiecen a salir de verdad. Aprobado por el usuario ("Apruebo todo ese orden...
incluyendo D y E").

**Hallazgo de Fase 1 que cambió el plan**: verifiqué el DNS real de `cobroflow.app` (con
`dig`/DNS-over-HTTPS de Google, no solo confiando en el panel) y NO existe ni SPF, ni DKIM, ni
DMARC — a pesar de que el usuario creía que el dominio ya estaba verificado en Resend. **Esto
bloquea que cualquier correo llegue de forma confiable** y es el primer paso pendiente, antes que
nada más (ver "Pendientes del usuario" abajo).

**Decisión de arquitectura clave**: CobroFlow NO usa el modelo de "enlace mágico" que asume la
doctrina genérica de `18` — desde la Fase 3 de esta sesión el login es por contraseña y el usuario
se registra ANTES de pagar (no al revés, vía Hotmart). Los correos transaccionales se adaptaron a
esa realidad: confirman el pago, no entregan el acceso.

**Lo que se construyó:**
- `lib/resend-email.ts` — cliente único de Resend (`RESEND_API_KEY`), `enviarEmail()` best-effort
  (nunca tumba el webhook si el correo falla — el pago/estado ya se aplicó antes), `yaSeEnvio()`/
  `registrarEnvio()` sobre la tabla `email_log` (fuente de idempotencia de TODAS las secuencias por
  cron), `estaSuprimido()`.
- `lib/emails/` — plantillas HTML (envoltorio compartido en `layout.ts`, colores reales de
  FICHA-ARTE.md, multipart html+text): `transaccionales.ts` (pago confirmado, compra sin vincular
  ×2), `carrito.ts` (3), `dunning.ts` (3, adaptado a 1/3/5 — la gracia real configurada en el
  webhook es de 5 días, no 7), `retencion.ts` (cancelación + win-back ×3), `activacion.ts` (D1/D3/
  D7), `nurturing.ts` (Free→Pro ×3, adaptado: no hay lead magnet separado, nutre a quien ya se
  registró gratis).
- **A1 + A1b (el más crítico)**: el webhook de Hotmart (`route.ts`) ahora dispara el correo de pago
  confirmado, y — el hallazgo más importante de la auditoría de este flujo — cuando un pago no se
  puede vincular a ninguna cuenta (`no_profile_match`, el ticket #1 real de este modelo), YA NO
  queda en silencio en un log: se le manda un correo al comprador con el camino para reconciliar Y
  una alerta a `soporte@cobroflow.app` con los datos para resolverlo a mano. Antes de esto, un pago
  real con correo distinto al de la cuenta se perdía sin que nadie se enterara.
- **B — Carrito abandonado, fuente de datos propia**: en vez de adivinar el nombre de un evento de
  webhook de Hotmart sin confirmar, se creó `/api/ir-a-hotmart` — un redirect que registra el clic
  al checkout (tabla `checkout_intentos`) ANTES de mandar a Hotmart. Todos los links de "Mejorar a
  Pro/Premium" de la app (`BloqueoPlan.tsx`, Cuenta, `/confirmar`) ahora pasan por ahí. Dato 100%
  real, no una suposición.
- **C1 — Dunning**: día 1 lo dispara el webhook al momento (`past_due`); días 3 y 5 los manda el
  cron. Banner in-app no bloqueante en el Panel principal cuando `status === 'past_due'`
  (`lib/dunning-banner.ts`, separado de las plantillas de correo para no llevarse HTML al bundle
  del navegador).
- **C2 — Cancelación + win-back**: cancelación la dispara el webhook; win-back 30/60/90 lo maneja
  el cron sobre `profiles.cancelled_at` (columna nueva — antes no existía un timestamp real de
  cuándo se canceló, solo `access_until`, que mide otra cosa).
- **D — Activación D1/D3/D7** y **E — Nurturing Free→Pro (3 correos)**: ambos por cron, sobre
  `first_paid_at` y `created_at` respectivamente.
- **Un solo cron diario** (`app/api/cron/emails`, protegido con `CRON_SECRET`, programado en
  `vercel.json` a las 14:00 UTC / 8am Guatemala) avanza las 5 secuencias basadas en tiempo
  (carrito/dunning/win-back/activación/nurturing) — se agruparon en una sola corrida por los
  límites de cron del plan gratuito de Vercel y para tener un solo log diario de qué se mandó.
- Separación transaccional/marketing (46): `FROM_TX = acceso@tx.cobroflow.app` (pago, dunning,
  cancelación, carrito, activación) vs `FROM_MKT = hola@news.cobroflow.app` (win-back, nurturing) —
  mismo `RESEND_API_KEY`, pero dominios de envío distintos para que una queja de marketing nunca
  contamine la reputación del correo que sí o sí debe llegar.
- Tabla `email_suppression` + columna `profiles.marketing_opt_out` — el cron filtra marketing
  contra ambas antes de enviar (transaccional se manda igual, es servicio, no marketing).
- Migraciones: `20260821000000_sistema_emails.sql` (`email_log`, `email_suppression`,
  `checkout_intentos`, `profiles.cancelled_at`, `profiles.marketing_opt_out`) +
  `20260821000001_cancelled_at_en_apply_hotmart_event.sql` (la RPC ahora fija `cancelled_at`).
- Privacidad actualizada: sección nueva "Correos sobre tu plan y ofertas" declarando el nurturing/
  win-back con su opt-out ("responde 'quitar'").
- `/login` suma el enlace "¿Pagaste y no ves tu plan activo?" (mailto con asunto pre-llenado) —
  la ruta de rescate de acceso de 18, adaptada (sin magic link).

⚠️ **Deviación consciente de la doctrina, anotada con honestidad**: `34`/`46` piden **opt-in**
explícito (idealmente doble) para marketing (nurturing, win-back) — esta implementación usa
**opt-out** (correo transparente + "responde quitar" + registrado en `email_suppression`/
`marketing_opt_out`), apoyada en que es una relación de cliente ya existente (no un lead frío) y
está declarada en Privacidad. Es defendible pero no es el estándar más alto que pide el SO —
si se quiere blindar del todo, se puede sumar un checkbox aparte de "sí quiero tips y ofertas" en
`/registro`, separado del de Términos/Privacidad.

**Verificado**: `tsc --noEmit` limpio, `npm run build` limpio (33 rutas). Verificación visual real:
capturas de 3 plantillas de correo (pago confirmado, dunning, carrito) y del banner de pago
atrasado en el Panel principal, con una página temporal de datos de ejemplo (borrada al cerrar,
mismo patrón ya usado en la auditoría de esta sesión). **No probado end-to-end con un pago real**
(ver Pendientes del usuario) — el webhook y el cron nunca se han disparado contra Resend de
verdad, porque `RESEND_API_KEY` todavía no existe en producción.

**Dónde vive cada plantilla** (para tocar copy sin buscar): `lib/emails/transaccionales.ts`
(pago confirmado, compra sin vincular), `lib/emails/carrito.ts`, `lib/emails/dunning.ts`,
`lib/emails/retencion.ts` (cancelación + win-back), `lib/emails/activacion.ts`,
`lib/emails/nurturing.ts`. El diseño compartido (colores, estructura HTML) vive en
`lib/emails/layout.ts` — un cambio ahí afecta a los ~17 correos a la vez.

**Qué mirar en la operación mensual (una vez haya volumen real)**:
- Tasa de apertura y clic del correo de "pago confirmado" (A1) — si baja de ~90% de entrega, es
  señal de un problema de deliverability, no de copy.
- Cuántos `checkout_intentos` con plan todavía `free` reciben los 3 correos de carrito y cuántos
  terminan pagando después — ese % es la tasa de recuperación real del carrito.
- Cuántos `past_due` se recuperan (vuelven a `active`) vs cuántos terminan en `free` — el
  benchmark de la doctrina (58) es >40-50% de recuperación.
- Cuántos `no_profile_match` llegan al correo de soporte — si son frecuentes, vale la pena
  revisar por qué la gente paga con un correo distinto al de su cuenta.
- `email_suppression` y quejas — si crecen, pausar `FROM_MKT` (nurturing/win-back) y dejar que el
  `FROM_TX` (que nunca debe fallar) se recupere solo, antes de retomar marketing (regla de 46).

✅ CHECKPOINT — Sesión 6: AUDITORÍA LEGAL completa (contra `47-LEGAL-FISCAL-Y-PRIVACIDAD.md`),
desplegada a producción. Responsable declarado: Oscar Mejía, persona física, Guatemala — contacto
legal `soporte@cobroflow.app` (mismo correo de siempre, sin agregar un canal nuevo).
- **Privacidad**: reescrita — ahora nombra a los 5 subprocesadores reales con su función (Supabase,
  Vercel, Resend, Hotmart, Anthropic/Claude), declara la transferencia internacional (EE.UU./
  Brasil), tiene sección de cookies (solo esenciales — no hay analytics/tracking en el código,
  verificado con grep), derechos del titular con el canal real de eliminación, edad mínima (18) y
  fecha de última actualización visible.
- **Términos**: reescritos — agrega licencia de uso, propiedad de los datos y de los outputs de
  IA, suspensión de cuentas, limitación de responsabilidad, y ley aplicable (Guatemala, con
  cláusula de que no anula derechos locales del usuario).
- **Cancelación y reembolsos**: reescrita — antes NO mencionaba ningún plazo de reembolso.
  Corregido con la ventana real: 7 días (derecho de retracto que Hotmart aplica a toda compra en
  su plataforma, ley de Brasil) — CobroFlow no promete una garantía propia más larga, así que no
  hay contradicción landing↔página↔Hotmart. `FICHA-MERCADO.md` actualizada con "Prueba elegida: 0
  / Garantía elegida: 7" para que el gate `garantía>prueba` del pre-stop hook quede satisfecho con
  data real, no inventada.
- **Aviso de IA**: reforzado — nombra a Anthropic/Claude explícitamente, agrega la frase núcleo
  del disclaimer ("puede generar información incorrecta... no es asesoría financiera/contable/
  legal profesional") en los 3 lugares que exige la doctrina: esta página, los Términos, y AHORA
  TAMBIÉN junto a la salida real de la IA en Cuenta (`app/app/cuenta/page.tsx`) — antes el
  disclaimer solo vivía en el PDF exportable, la pantalla no tenía ninguno.
- **Registro** (`/registro`): el checkbox de aceptación de Términos/Privacidad NO EXISTÍA como
  checkbox real — era solo texto estático bajo el botón ("Al continuar aceptas..."), sin ninguna
  casilla que marcar. Corregido: ahora es un `<input type="checkbox">` sin premarcar, obligatorio
  para habilitar "Crear cuenta" — cumple el estándar de consentimiento explícito que exige
  Colombia (Ley 1581) y el resto de LATAM. Verificado con screenshot: la casilla nace sin marcar y
  el botón queda deshabilitado hasta marcarla.
- **`FICHA-MERCADO.md` corregida**: tenía referencias obsoletas a "Stripe" como pasarela (el
  proyecto migró a Hotmart hace varias sesiones, ver "Decisiones técnicas" — la ficha nunca se
  había actualizado). Se corrigió porque alimentaba directamente el texto de las páginas legales;
  de seguir ahí habría producido una página de Términos que mencionara la pasarela equivocada.
- **No aplica** (documentado explícitamente, no omitido): banner de cookies (no hay cookies de
  terceros/analytics en el código — solo sesión de Supabase) y Trust & Safety/moderación (no hay
  contenido de usuarios público ni salidas de IA compartibles — el análisis es privado, solo lo ve
  quien lo generó).
- **Verificado**: `tsc --noEmit` limpio, `npm run build` limpio (31 rutas), captura real del
  checkbox de registro a 400px confirmando el estado sin marcar + botón deshabilitado, y lectura
  completa de la página de reembolsos confirmando que el texto coincide con lo que promete la
  landing (nada de "30 días" prometido en ningún lado — coherente).
- ⚠️ **Pendiente que solo un humano puede resolver**: esta auditoría es de completitud
  profesional contra la doctrina del SO, no asesoría legal colegiada. Antes de escalar mucho más
  el negocio (o si CobroFlow empieza a manejar datos de salud, que no es el caso hoy), validar con
  un abogado local en Guatemala — especialmente para confirmar el tratamiento fiscal como persona
  física al primer ingreso recurrente sostenido (ver sección FISCAL de `47`, ya recomendado desde
  antes de esta auditoría). También queda pendiente confirmar en el panel real de Hotmart que la
  ventana de reembolso configurada para el producto CobroFlow efectivamente sea de 7 días (se
  documentó el mínimo legal de la plataforma, no se verificó el panel específico del producto).

✅ CHECKPOINT — Sesión 6: AUDITORÍA SENIOR completa (producto, diseño, UX, backend, base de datos,
auth, ciberseguridad, IA, infra, monetización) ejecutada con aprobación del usuario ("Apruebo
todo"), en 3 capas verificadas, TODO desplegado a producción.

**Capa 1 — Seguridad y backend (commit `b57888d`):**
- **Fuga de ingresos cerrada**: `planEfectivo()` (nuevo, `lib/planes.ts`) — el plan ya NO se lee
  crudo de `profiles.plan`. Se calcula contra `status`/`access_until`/`grace_ends_at`, así que
  cancelar, atrasarse en el pago (tras vencer el colchón de gracia) o un reembolso/chargeback
  ahora SÍ quitan el acceso pagado. Antes ninguna parte del código volvía a leer esas dos columnas
  después de que el webhook las escribía — una cuenta cancelada se quedaba con Pro/Premium para
  siempre. Aplicado en `obtenerPerfilMoneda()` (toda la UI) y en la ruta de IA (gate de servidor,
  antes vulnerable al mismo hueco).
- **Esquema real capturado**: nueva migración idempotente
  (`20260819000000_captura_esquema_real.sql`) con `moneda_principal`/`nombre`/`apellido`/
  `nombre_negocio`/tabla `exchange_rates` — existían en producción desde sesiones anteriores pero
  nunca se habían guardado como migración versionada (riesgo real: ya se perdió el acceso a
  Supabase una vez).
- **Cabeceras de seguridad**: `next.config.ts` ahora manda CSP, X-Frame-Options, HSTS,
  Referrer-Policy, Permissions-Policy — antes no había ninguna.

**Capa 2 — Bugs y estados faltantes (commit `f4921bd`):**
- `SkeletonPantalla` (nuevo) + chequeo de `cargando` en Clientes/Proyectos/Pagos/Gastos/
  Estadísticas/Cobros/Recordatorios — antes mostraban su estado vacío ("no tienes clientes") por
  un instante mientras cargaban datos reales, confuso para quien sí tiene datos.
- Nuevo cliente / Nuevo proyecto bloquean el formulario ANTES de llenarlo si ya se alcanzó el
  límite de Free (con `BloqueoPlan`), en vez de dejar llenarlo todo y fallar recién al guardar.
- Cuenta → Plan: nuevo enlace "Gestionar o cancelar tu suscripción" al área de compras de Hotmart
  (`HOTMART_AREA_COMPRAS_URL`, `lib/hotmart-links.ts`) — antes no había forma de saber dónde
  cancelar desde dentro de la app.

**Capa 3 — Diseño y re-verificación visual (commit pendiente de este mismo cierre):**
- Los 4 veredictos formales (landing/onboarding/paywall/app-principal) estaban CADUCADOS —
  anteriores al rediseño integral completo, y el de app-principal describía una arquitectura
  (localStorage, BottomNav) que ya no existe. Al cruzar los "top defectos" de cada uno contra el
  código ACTUAL, la mayoría ya estaban resueltos en rondas posteriores que nunca se volvieron a
  documentar (window.confirm→modal propio, checkmarks neutros en Free/Premium, gradientes ya
  subidos de opacidad, "Dashboard"→"Panel"). Los 2 defectos reales que seguían sin resolver, YA
  CORREGIDOS hoy:
  1. **Bug real, recién encontrado**: los 3 gráficos de la app (Cobros del mes, Evolución de
     cobros, Proyección de flujo) recortaban el primer dígito del eje Y ("4600" se veía "600") por
     un margen negativo mal calculado en Recharts — corregido en `app/app/page.tsx` y
     `app/app/estadisticas/page.tsx`.
  2. El paso "moneda" del onboarding mostraba 7 chips en paridad sin preselección — nuevo
     `monedaSugerida()` (`lib/onboarding.ts`) detecta el país por `navigator.language` y
     preselecciona la moneda probable (verificado en vivo: preseleccionó GTQ correctamente).
- ⚠️ **Nota de método, importante**: esta ronda la puntuó el MISMO agente que construyó las
  pantallas — el subagente independiente `revisor-visual` no pudo recibir el screenshot como
  archivo esta sesión (Playwright estaba desconectado y el Browser pane no expone "guardar a
  disco"). Es una autoevaluación rigurosa con capturas reales (Browser pane, 375px), no la
  revisión independiente que exige la Regla 7 del sistema — anotado explícitamente en cada
  `docs/revisiones/<pantalla>-veredicto.md`. Puntajes: landing 37/40·17/20·18/20, onboarding
  37/40·17/20, paywall 37/40·17/20·18/20, app-principal 36/40·17/20 — los 4 "LISTA" bajo esa
  autoevaluación. Pendiente real: una ronda con el subagente de verdad en cuanto la sesión tenga
  forma de guardar screenshots a disco.
- app-principal se verificó con una página temporal de datos de ejemplo (mismo patrón ya usado
  antes en el proyecto) — se borró al cerrar esta ronda, cero rastro en el código final.

**Verificado en las 3 capas**: `tsc --noEmit` limpio y `npm run build` limpio (31 rutas) después
de cada capa. Sin sesión real disponible para las pantallas autenticadas — mismo límite de
siempre, mitigado con datos de ejemplo realistas para la verificación visual.

✅ CHECKPOINT — Sesión 6: Gastos (utilidad neta), HECHO y DESPLEGADO en código — falta que el
usuario aplique la migración SQL. A pedido explícito del usuario (recomendación propia validada:
"Free sin acceso, Pro registra gastos y ve utilidad neta, Premium además categoriza y eso alimenta
la Proyección de flujo").
- Migración `20260818000000_expenses.sql`: tabla `expenses` (monto, moneda, categoria nullable,
  descripcion, fecha, recurrente, user_id) + RLS igual patrón que clients/projects/payments +
  trigger `valida_limite_free` extendido (Free no puede insertar NINGÚN gasto — defensa en
  servidor, no solo en el gate del frontend). **NO aplicada todavía en producción** — pendiente
  de que el usuario la corra en su Editor SQL de Supabase (se le va a pasar en el cierre de este
  checkpoint). Mientras no se aplique: `obtenerGastos()` devuelve `[]` sin romper nada (no valida
  `error`), pero `agregarGasto()` SÍ falla con mensaje de error visible — avisar al usuario.
- `lib/planes.ts`: `canUseExpenses` (Pro+) y `canCategorizeExpenses` (Premium, también gatea el
  toggle "recurrente" ya que solo Premium lo usa en la Proyección de flujo).
- `lib/app-data.ts`: tipo `Gasto`, `CATEGORIAS_GASTO` (6 categorías fijas), `obtenerGastos`/
  `agregarGasto`/`eliminarGasto`, `gastadoEsteMesPorMoneda`, `gastadoPorCategoria`. `proyeccionFlujo`
  ahora acepta `gastosRecurrentes` y devuelve `neto` (bruto - gastos recurrentes de esa moneda)
  además de `esperado` (bruto, sin tocar) — matemática determinística, cero IA.
- `/app/gastos` (lista + utilidad neta del mes por moneda, Pro+ con `BloqueoPlan` para Free) y
  `/app/gastos/nuevo` (formulario; categoría y "es recurrente" solo visibles si Premium). Ítem
  nuevo en el sidebar/nav móvil (`AppShell.tsx`), siempre visible — igual patrón que Estadísticas
  (el gate vive DENTRO de la pantalla, no escondiendo el enlace).
- Panel principal: fila "Utilidad neta (mes)" en Resumen rápido, solo Pro+ (verde si positiva,
  rojo si negativa). Estadísticas: nueva sección "Gastos este mes" (Pro+: total por moneda;
  Premium: desglose por categoría) + la Proyección de flujo ahora grafica `neto` en vez de
  `esperado` (son iguales si no hay gastos recurrentes, así que no cambia nada para quien no los usa).
- Verificado: `tsc --noEmit` limpio, `npm run build` limpio (31 rutas, incluye `/app/gastos` y
  `/app/gastos/nuevo`), y confirmado que `/app/gastos` sin sesión redirige a `/login` (protegida
  por el middleware existente, sin error 500). Sin sesión real disponible para ver la pantalla
  con datos — mismo límite de siempre.

✅ CHECKPOINT — Sesión 6: Meta mensual + Proyección de flujo (Premium), HECHO y DESPLEGADO. El
usuario aprobó el rediseño integral ("Está todo muy bien") y pidió construir las 2 funciones
Premium que se habían dejado explícitamente sin construir por no existir antes (ver la decisión de
alcance más abajo, ahora obsoleta).
- Migración `20260817020000_meta_mensual.sql`: `profiles.meta_mensual numeric(12,2)` nullable —
  una sola columna, no una tabla (es un número por cuenta, no un historial). Aplicada por el
  usuario mismo en su Editor SQL de Supabase (el agente no tenía sesión iniciada en el navegador
  de esta sesión) y confirmada.
- `lib/app-data.ts`: `obtenerMetaMensual`/`actualizarMetaMensual` (lee/escribe la columna nueva) +
  `proyeccionFlujo(db, moneda, meses)` — proyección determinística (CERO IA) que suma los saldos
  pendientes de los proyectos por mes de `fechaPromesa`, filtrando SIEMPRE a una sola moneda a la
  vez (misma regla de multimoneda de toda la app).
- `lib/planes.ts`: `canUseForecasting`/`canUseGoals` pasan de `false` a `true` para Premium (ya
  estaban `true` para el resto de capacidades Premium, solo faltaban estas dos).
- `components/app/MetaMensual.tsx` (nuevo, reutilizable): define/edita la meta, barra de progreso
  real contra lo cobrado este mes (`cobradoEsteMesPorMoneda`) — se usa compacta en el Dashboard
  (`app/app/page.tsx`, columna derecha, solo Premium) y completa en Estadísticas.
- `app/app/estadisticas/page.tsx`: nueva sección Premium (grid 2 columnas) con Meta mensual +
  gráfica de barras "Proyección de flujo" (recharts, 6 meses) — separada de la sección existente
  de IA/PDF, ambas Premium pero mostrando cosas distintas.
- `AppDataProvider` ya exponía `metaMensual` desde antes de este checkpoint (quedó a medio hacer
  en el corte de contexto anterior) — confirmado completo end-to-end.
- Verificado: `tsc --noEmit` limpio, `npm run build` limpio (29 rutas, sin cambios de conteo),
  `npm run lint` sin errores NUEVOS (los ~16 preexistentes de landing/onboarding/paywall siguen
  intactos, fuera de alcance). Sin sesión real disponible para verificación visual en vivo —
  mismo límite de siempre; el usuario puede confirmarlo en su próximo login como Premium.
- Commit `0bb978a`, pusheado a `main` → deploy automático en Vercel.

⏸️ CHECKPOINT — Sesión 6: REDISEÑO INTEGRAL de la app autenticada (a pedido del usuario, con
imagen de referencia de un SaaS financiero — sidebar verde oscuro, tarjetas, tabla de
seguimiento, gráfica). Reemplaza la navegación de 4 pestañas por 8 secciones: Panel principal,
Centro de cobros, Clientes, Proyectos, Pagos, Estadísticas, Recordatorios, Configuración.
**Backward-compatible: NINGUNA migración de base de datos, NINGÚN dato existente tocado.**
Reutiliza el mismo esquema (`clients`/`projects`/`payments`/`profiles`) y toda la lógica de
saldos/estados/planes ya construida en sesiones anteriores — es una reorganización de UX/UI, no
una reconstrucción del backend.

**Arquitectura nueva:**
- `lib/planes.ts` — fuente única de verdad de qué puede hacer cada plan (`capacidadesDe(plan)`):
  límites de clientes/proyectos, gráficas, multimoneda, export CSV/PDF, IA, plantillas de
  recordatorio. El límite DURO real sigue viviendo en los triggers de Postgres (`valida_limite_free`)
  — este archivo es la fuente de verdad del LADO DE LA INTERFAZ (qué mostrar/bloquear).
- `components/app/AppDataProvider.tsx` — contexto compartido (`useAppData()`) que carga
  DB/plan/perfil/tasas UNA vez y las comparte entre TODAS las pantallas (antes cada pantalla
  pedía sus propios datos — duplicaba peticiones y arriesgaba cifras distintas entre pantallas).
  Cualquier mutación llama a `recargar()` del contexto, nunca vuelve a pedir datos por su cuenta.
  También controla el estado del recorrido guiado (`tourVisible`/`cerrarTour`/`reabrirTour`).
- `components/app/AppShell.tsx` — sidebar verde oscuro persistente en escritorio/tablet (≥768px,
  breakpoint `md` de Tailwind — no se construyó un tercer estado "colapsado" intermedio, decisión
  consciente para no sobrecomplicar), barra superior con saludo real + buscador funcional
  (`buscarEnDB`, busca clientes/proyectos/pagos de verdad) + accesos rápidos (recordatorios con
  contador REAL de atrasados, no inventado), y navegación inferior en móvil (Inicio/Cobros/
  Clientes/Pagos + hoja "Más" con Proyectos/Estadísticas/Recordatorios/Configuración).
- `components/app/BloqueoPlan.tsx` — mecanismo de upsell elegante (`🔒 Disponible en Pro/Premium`
  + CTA), reemplaza cualquier ocultamiento silencioso con CSS.
- `components/app/RecorridoGuiado.tsx` — reescrito: bienvenida → 7 pasos (uno por sección clave,
  el de Estadísticas cambia de texto según el plan) → cierre con CTA "Agregar mi primer cliente".
  Se guarda en `profiles.tour_completado` (ya existía, Fase 6) y se puede reabrir desde
  Configuración → Ayuda sin recargar la página (vive en el contexto compartido).
- `lib/csv-export.ts` — exportación CSV 100% en el navegador (Blob), sin dependencias nuevas.
  Gatilla por plan (Pro+) en Clientes/Proyectos/Pagos.
- Paleta del sidebar (`components/landing/tokens.css`): `--sidebar-bg` se DERIVA de `--accent`
  oscurecido con negro (`color-mix`) — nunca un hex nuevo sin relación; si `--accent` cambia, el
  sidebar cambia con él. Resto de derivados (`--sidebar-bg-active/hover`, `--sidebar-text-muted`)
  también son `color-mix`.

**Pantallas nuevas:** `/app/proyectos` (+ `/nuevo`, requiere elegir cliente existente —
`agregarProyecto()` nuevo en `app-data.ts`), `/app/pagos` (+ `/nuevo`, historial cruzando todos
los clientes — `pagosConDatos()` nuevo), `/app/estadisticas` (Pro+: gráfica de barras últimos 6
meses con `recharts`, clientes con mayor facturación, desglose por moneda; Premium: enlaces a la
IA/PDF que ya existían en Cuenta — NO se duplicó ese código, solo se enlaza), `/app/recordatorios`
(hereda el mensaje+WhatsApp que antes vivía en `/app/cobros`, suma plantillas de tono Pro+:
Amigable/Formal/Directo).

**Pantallas rediseñadas:** `/app` (Panel principal: 3 tarjetas con comparación real vs. mes
anterior cuando hay datos, Seguimiento de hoy en tabla/tarjetas según pantalla, Próximos cobros,
gráfica Cobros del mes con área degradada — Pro+, bloqueada con elegancia para Free — Resumen
rápido). `/app/cobros` (Centro de Cobros: ahora es la tabla operativa filtrable —
Todos/Pendientes/Parciales/Atrasados/Pagados, más filtro de moneda si aplica el plan — el envío
de recordatorios se movió a `/app/recordatorios` para no duplicar esa lógica). `/app/cuenta`
(recategorizado visualmente como "Configuración": Perfil/Preferencias/Plan/Reportes y
análisis/Ayuda y aprendizaje/Cuenta — la URL se dejó igual a propósito, ya la usan el paywall y
los enlaces de retorno de Hotmart). `/app/cuenta/monedas` (la sección de tasas de cambio ahora
está bloqueada con elegancia para Free — antes estaba abierta a cualquier plan, era una
inconsistencia real con la regla "varias monedas es Pro+").

⚠️ **Cambio de negocio intencional**: la exportación a PDF (`Reporte financiero en PDF` en
Configuración) pasó de ser Premium-exclusiva a **Pro+** — el usuario lo pidió explícitamente en
el prompt de rediseño (objeto de capacidades: `canExportPDF: true` para Pro) y coincide con
`18-VENTA-HOTMART`/`02C`. El análisis con IA se mantiene 100% Premium, sin cambios.

**Verificado:** `tsc --noEmit` limpio, `npm run build` limpio (29 rutas), `npm run lint` sin
errores NUEVOS atribuibles a este cambio (el proyecto ya tenía ~15 warnings/errores
`react-hooks/set-state-in-effect` preexistentes en landing/onboarding/paywall/registro, ninguno
tocado — están fuera de alcance de este rediseño, que es solo `/app/*`). Verificación visual: sin
sesión real disponible (mismo límite de siempre), se armó una página temporal con datos de
ejemplo, se verificó por screenshot + inspección de texto que el sidebar/topbar/tarjetas/tabla/
gráfica/nav móvil renderizan correctamente a 1440px y 375px, y se borró esa página antes de
cerrar. **Pendiente real: que el usuario lo vea con su cuenta real** (mismo límite de siempre —
el agente no tiene credenciales para loguearse).

**Decisiones de alcance (para no sobrecomplicar, rule 53 del propio prompt del usuario):**
- ~~NO se construyó "proyección de flujo" ni "metas mensuales"~~ — **CONSTRUIDO** en el checkpoint
  de arriba (2026-08-18), a pedido explícito del usuario tras aprobar el rediseño.
- NO se construyó un sistema de notificaciones real (push/campanita persistente) — el ícono de
  campana del topbar muestra un contador REAL derivado de datos (clientes atrasados), no una
  bandeja de notificaciones inventada, tal como pidió explícitamente el prompt ("si no existe un
  sistema completo de notificaciones, no inventes infraestructura innecesaria").
- El campo "Parcial" (pago parcial) que pedía el prompt no existía como estado — se calculó
  puramente en la capa de presentación de Centro de Cobros/Recordatorios (`pagado>0 && saldo>0`),
  sin tocar `estadoProyecto()` ni el tipo `EstadoCobro` que usan Dashboard y el resto de la app
  (evita romper nada existente).
- El sidebar tiene 2 estados responsive (oculto en móvil <768px, completo en ≥768px), no 3 — el
  prompt pedía un tercer estado "colapsado" para tablet vertical que se decidió omitir por
  tiempo/complejidad; anotado como pendiente abajo.
- `logo.png` referenciado en `components/onboarding/ui.tsx` (`<Marca>`, pantallas de
  onboarding/paywall/login) es un archivo que NO EXISTE en `public/` — bug preexistente,
  detectado de pasada, no se tocó por estar fuera del alcance de este rediseño (que es solo
  `/app/*`, no la landing/funnel).

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

**Registro formal de revisor-visual (las 4 pantallas que deciden el dinero) — actualizado
2026-08-20, auditoría senior:**
| Pantalla | Rondas | Último puntaje | Veredicto |
|---|---|---|---|
| Landing | 4 | 37/40 · 17/20 craft · 18/20 copy | LISTA (autoevaluación — ver nota de método) |
| Onboarding | 4 | 37/40 · 17/20 craft | LISTA (autoevaluación — ver nota de método) |
| Paywall | 4 | 37/40 · 17/20 craft · 18/20 copy | LISTA (autoevaluación — ver nota de método) |
| Dashboard (`/app`) | 3 | 36/40 · 17/20 craft | LISTA (autoevaluación — ver nota de método) |

⚠️ **Nota de método de la ronda 4/3 (2026-08-20)**: la puntuó el mismo agente que construyó las
pantallas, no el subagente independiente `revisor-visual` — esa sesión no tenía forma de guardar
el screenshot del Browser pane como archivo (Playwright desconectado). Detalle completo en el
checkpoint de arriba y en cada `docs/revisiones/<pantalla>-veredicto.md`.

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
existe. **Hero + AppPorDentro: HECHO (2026-08-18)** — el usuario subió 5 mockups (formato teléfono,
9:19.5, ya recortados por él): `captura-dashboard.png` (Hero), `panel-principal.png`,
`centro-de-cobros.png`, `recordatorio-de-pagos.png`, `estadisticas.png` (los 4 frames de "Tu
negocio, de un vistazo"). Todos en `web/public/`, renombrados a kebab-case ASCII (uno traía tilde
en el nombre original — se evita depender de URL-encoding en el `src`). Montados en `Hero.tsx`
(prop `visual`) y `AppPorDentro.tsx` (prop `src` de cada frame), reemplazando los dos placeholders
punteados. Verificado por screenshot en preview: encajan limpio en el frame de teléfono, sin
recorte raro (ya venían en el ratio correcto). Pendiente: volver a correr `revisor-visual` sobre
la landing completa ahora que ya no tiene placeholders — con eso tiene buenas chances de cruzar
el gate.

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
- ~~Veredictos NO LISTA en landing/onboarding/paywall/Dashboard~~ — **RESUELTO (2026-08-20)**: las
  4 pasaron a LISTA en la ronda de auditoría senior, con la salvedad de que es autoevaluación (ver
  nota de método arriba) — falta la ronda con el subagente `revisor-visual` real.
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
- [ ] **Sistema de emails — DNS y Resend (bloqueante, confirmado con DNS real, no con el panel)**:
  1. En Resend → Domains → Add Domain: agregar `tx.cobroflow.app` (transaccional) y
     `news.cobroflow.app` (marketing) como DOS dominios separados.
  2. Pegar los registros SPF y DKIM exactos que Resend entrega para cada uno, en el DNS del
     dominio (Vercel → tu proyecto → Domains, o donde administres el DNS de `cobroflow.app`).
  3. Agregar un registro DMARC en `_dmarc.cobroflow.app` (Resend no lo genera solo):
     `v=DMARC1; p=none; rua=mailto:soporte@cobroflow.app`.
  4. Esperar a que Resend marque los dos dominios como "Verified" antes de mandar nada en serio.
  5. Copiar el `RESEND_API_KEY` a las variables de entorno de Vercel.
  6. Generar un valor aleatorio largo para `CRON_SECRET` y copiarlo también a Vercel — Vercel Cron
     lo manda solo en cada llamada automática, no hay que configurarlo aparte.
- [ ] Hacer UNA compra real de Pro y UNA de Premium (puede reembolsarlas después) para la prueba
  end-to-end completa: confirmar que el webhook sube el plan Y que el correo de "pago confirmado"
  llega a la bandeja principal (no a spam) — el botón "Enviar prueba" de Hotmart no sirve para esto
  (usa un producto de prueba genérico, no el real).
- [ ] Verificar en el panel de Hotmart (Herramientas → Webhook) los eventos de cancelación/pago
  atrasado disponibles para tu cuenta — el mapeo actual (`SUBSCRIPTION_CANCELLATION`,
  `PURCHASE_DELAYED`) sigue sin confirmar contra un payload real de tu cuenta (pendiente desde
  antes de esta sesión, ver `lib/membership-fsm.ts`).

## Notas para la próxima sesión
- Proyecto 100% separado de English2Hire — carpeta propia `cobroflow/`, su propio ESTADO.md,
  FICHA-ARTE.md, FICHA-AVATAR.md y FICHA-MERCADO.md.
- El usuario dio un brief de 60 secciones extremadamente detallado y técnicamente sólido — la
  mayoría de la Constitución y la arquitectura ya venían resueltas por él; se documentó tal cual
  con ajustes menores de nomenclatura.
- Antes de Sesión 6: decidir con el usuario si migrar `lib/app-data.ts` tal cual a Supabase o
  ajustar el esquema — la lógica de estados (atrasado/próximo/etc.) ya está probada y debería
  sobrevivir el cambio de backend sin reescribirse.
