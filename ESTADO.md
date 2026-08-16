# ESTADO — CobroFlow
Última actualización: 2026-08-16 | Sesión actual: 6

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
