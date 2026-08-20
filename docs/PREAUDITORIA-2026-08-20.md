# Preauditoría final — CobroFlow (previo a auditoría profesional externa)
Fecha: 2026-08-20 · Alcance: inspección completa, sin cambios de código.

> ✅ **Actualización — los 2 P0 ya se corrigieron el mismo día** (ver detalle en cada hallazgo abajo):
> P0-1 (doble-tap al confirmar pago) y P0-2 acotado a Pagos (ahora se pueden eliminar, con
> confirmación real). Verificado con `tsc`/`build` limpios y prueba en vivo (Browser pane): el
> mensaje de error aparece si el guardado falla, el modal de confirmación de borrado funciona.
> **Veredicto actualizado: 🟢 GO** — con esto resuelto, ya no quedan P0 abiertos.

---

## A. VEREDICTO EJECUTIVO

**🟡 CONDITIONAL GO** — corrige 2 puntos específicos y envía.

Puntuación general: **68/100**. Hay **2 P0** y **6 P1**. El riesgo principal: un doble-tap en
"confirmar pago" puede duplicar un pago en la base de datos, y una vez ahí **no hay forma de
editarlo ni borrarlo** — el saldo de ese cliente queda mal para siempre, sin que el usuario (ni tú)
puedan corregirlo desde la app. Recomendación: arregla los 2 P0 (son acotados, no tocan diseño ni
arquitectura) y envía la app a la auditoría profesional esta misma semana — no vale la pena
posponerla más, el resto de los hallazgos son exactamente el tipo de cosas que un equipo externo
sabe priorizar mejor que nosotros.

---

## B. LOS 5 PROBLEMAS MÁS IMPORTANTES

1. **Doble-tap en "confirmar pago" puede duplicar el pago** (`app/app/clientes/[id]/page.tsx`) — sin
   `disabled` durante el envío. Corrompe el dato más importante de la app: el saldo.
2. **No se puede editar ni eliminar un Cliente, Proyecto o Pago, en ningún lugar de la app** — un
   error de tipeo (monto, precio, nombre) queda permanente. Sin esto, el hallazgo #1 no tiene
   forma de arreglarse desde la app.
3. **Eliminar un Gasto no pide confirmación** — un toque y desaparece, sin "¿estás seguro?".
4. **No existe `app/error.tsx`** — un error inesperado en cualquier pantalla cae en la página de
   error genérica de Next.js, no en algo con tu marca ni con un botón de "volver a intentar".
5. **El PDF de Premium le dice al usuario "todavía no registramos gastos"** — texto viejo, de antes
   de que existiera Gastos (que ya funciona hace semanas). Un cliente que paga Premium ve un dato
   falso sobre su propia herramienta.

---

## C. HALLAZGOS P0

### P0-1 — Doble-tap al confirmar un pago puede insertarlo dos veces
**Ubicación:** `app/app/clientes/[id]/page.tsx`, función `confirmarPago()` y su botón (línea ~124).
**Categoría:** Integridad de datos / cálculos incorrectos.
**Qué ocurre:** El botón que confirma un pago no tiene `disabled` mientras la operación está en
curso. `confirmarPago()` es `async` y hace una escritura real a Supabase.
**Por qué importa:** Es el ÚNICO botón de "agregar dinero" de toda la app sin esta protección — el
resto (Nuevo cliente, Nuevo proyecto, Nuevo pago, Nuevo gasto) sí la tiene (`disabled={guardando}`).
Un doble-tap real (común en celular, sobre todo con conexión lenta) inserta el mismo pago dos
veces, y el saldo del cliente queda incorrecto — exactamente lo contrario de la promesa central
de la app ("sabe cuánto te deben con exactitud").
**Cómo reproducirlo:** Entra a un cliente con saldo pendiente → toca "Registrar pago" → escribe un
monto → toca el botón de confirmar dos veces rápido (o simula una conexión lenta y haz doble-tap).
**Resultado esperado:** Se registra un solo pago.
**Resultado actual (por lectura de código, no probado en vivo — requiere verificación manual):** El
código no tiene ninguna barrera que lo impida.
**Solución recomendada:** Agregar un estado `confirmando` (mismo patrón que `guardando` en los
otros 4 formularios) y `disabled={confirmando}` en el botón.
**Riesgo de hacer el cambio:** Ninguno — es agregar una línea de estado, mismo patrón ya probado en
4 pantallas.
**¿Obligatorio antes de la auditoría?:** **Sí.**

### P0-2 — Imposible editar o eliminar Clientes, Proyectos o Pagos
**Ubicación:** `lib/app-data.ts` (no existe `actualizarCliente`/`actualizarProyecto`/
`actualizarPago`/`eliminarCliente`/`eliminarProyecto`/`eliminarPago`), confirmado también en
`app/app/clientes/[id]/page.tsx` (solo permite AGREGAR pagos nuevos, no tocar los existentes).
**Categoría:** Funcionalidad principal incompleta.
**Qué ocurre:** Una vez creado un cliente, un proyecto o un pago, no hay ningún botón, pantalla ni
función en toda la app para corregirlo o borrarlo (sí existe `eliminarGasto`, pero solo para
Gastos — una entidad secundaria, no las 3 principales).
**Por qué importa:** Los datos de entrada de estas 3 tablas son exactamente lo que calcula el
saldo — el corazón del producto. Un error de tipeo (un cero de más en un monto, un precio mal
puesto) es un escenario normal y esperable, no un caso extremo — y hoy es irreversible. Combinado
con el P0-1, un doble-tap accidental no tiene ninguna forma de corregirse.
**Cómo reproducirlo:** Crea un cliente cualquiera, agrégale un proyecto y un pago. Intenta
encontrar una forma de cambiar el monto del pago o el nombre del cliente. No existe.
**Resultado esperado:** Poder corregir un dato mal ingresado.
**Resultado actual:** No hay ningún camino, ni siquiera borrando y recreando (tampoco se puede
borrar).
**Solución recomendada:** Como mínimo viable antes de la auditoría: agregar edición/eliminación de
**Pagos** (es lo más urgente, por el P0-1) y de **Proyectos** (el precio total también define el
saldo). Clientes puede esperar a después de la auditoría si el tiempo aprieta — el daño de un
nombre mal escrito es mucho menor que el de un monto mal escrito.
**Riesgo de hacer el cambio:** Bajo-medio — es CRUD estándar, pero toca RLS (ya existe la política
`for all` en `clients`/`projects`/`payments`, así que el permiso YA está listo del lado de la base
de datos) y hay que decidir la UX (¿editar inline? ¿modal?). No es un cambio de una línea, pero
tampoco es una reconstrucción.
**¿Obligatorio antes de la auditoría?:** **Sí, al menos para Pagos** (por la combinación con P0-1).
Proyectos y Clientes son fuertemente recomendables pero podrían quedar como P1 si el tiempo no
alcanza antes de enviar a los auditores.

---

## D. HALLAZGOS P1

### P1-1 — Eliminar un Gasto no pide confirmación
**Ubicación:** `app/app/gastos/page.tsx`, función `borrar()` (línea 31), botón con ícono `Trash2`.
**Categoría:** UX / acción irreversible sin advertencia.
**Qué ocurre:** Un toque en el ícono de basura borra el gasto al instante — sin modal de "¿estás
seguro?", sin deshacer.
**Por qué importa:** Regla básica de UX de la propia app (CLAUDE.md, regla 8: "confirmación solo
para irreversibles") — este es exactamente ese caso, y no la sigue. Impacto real limitado (un
gasto se puede volver a cargar fácil), por eso es P1 y no P0.
**Cómo reproducirlo:** `/app/gastos` → toca el ícono de basura junto a cualquier gasto.
**Resultado esperado:** Un paso de confirmación antes de borrar.
**Resultado actual:** Se borra inmediatamente.
**Solución recomendada:** Modal de confirmación simple (el kit de diseño ya tiene el patrón, usado
en otras partes de la app en vez de `window.confirm`).
**Riesgo de hacer el cambio:** Ninguno.
**¿Obligatorio antes de la auditoría?:** No, pero muy recomendable — es rápido de arreglar.

### P1-2 — No existe `app/error.tsx` (error boundary de Next.js)
**Ubicación:** raíz de `app/` — existe `not-found.tsx` pero no `error.tsx` ni `global-error.tsx`.
**Categoría:** Manejo de errores.
**Qué ocurre:** Si un componente de servidor o cliente lanza una excepción no controlada, Next.js
muestra su pantalla de error genérica en vez de algo con la marca de CobroFlow y un botón de
"reintentar" o "volver al Panel".
**Por qué importa:** Es la única red de seguridad que falta — todo lo demás (formularios, la ruta
de IA, el webhook) sí maneja sus propios errores con mensajes en español. Esta es la que cubre lo
inesperado.
**Cómo reproducirlo:** Difícil de forzar sin cambiar código — **requiere verificación manual** (no
se pudo reproducir sin modificar algo, que está fuera del alcance de esta fase).
**Resultado esperado:** Una pantalla con el estilo de CobroFlow, un mensaje humano y un botón para
volver.
**Resultado actual:** Pantalla de error por defecto de Next.js (en producción, sin stack trace
visible — Next.js ya lo sanitiza — pero sin marca ni salida clara).
**Solución recomendada:** Un `app/error.tsx` simple con el mismo lenguaje/tono del resto de la app.
**Riesgo de hacer el cambio:** Ninguno — es un archivo nuevo, aditivo.
**¿Obligatorio antes de la auditoría?:** No bloqueante, pero barato de resolver y da buena imagen
si el equipo auditor fuerza algún error durante sus pruebas.

### P1-3 — El PDF de Premium describe una función que ya existe como si no existiera
**Ubicación:** `lib/pdf-report.ts:354` — `"Gastos: CobroFlow todavía no registra gastos del
negocio (próximamente)."`
**Categoría:** Consistencia del producto / demo artifact.
**Qué ocurre:** Texto que quedó de antes de construir la función de Gastos (ya construida y
funcionando, Pro+). El PDF que descarga un usuario Premium sigue diciendo lo contrario.
**Por qué importa:** Es exactamente el tipo de "error básico evidente" que no quieres que el
equipo auditor encuentre primero — y es trivial de corregir.
**Cómo reproducirlo:** Cuenta Premium con gastos cargados → Cuenta → Descargar reporte PDF.
**Resultado esperado:** El PDF debería mostrar el resumen real de gastos (ya existe el dato:
`gastadoEsteMesPorMoneda`, usado en otras pantallas).
**Resultado actual:** Texto fijo diciendo que la función no existe.
**Solución recomendada:** Reemplazar esa línea por el resumen real de gastos del período del
reporte.
**Riesgo de hacer el cambio:** Bajo — un cambio acotado a una función de generación de PDF ya
existente.
**¿Obligatorio antes de la auditoría?:** Muy recomendable — es de las correcciones más baratas y
más vergonzosas si la encuentra alguien de afuera.

### P1-4 — Sin timeout explícito en la llamada a Claude (IA)
**Ubicación:** `app/api/ai/analizar-negocio/route.ts` — `client.messages.create()` sin `timeout`.
**Categoría:** IA / degradación elegante.
**Qué ocurre:** No hay un límite de tiempo propio configurado para la llamada a Anthropic. El botón
"Analizando…" en `app/app/cuenta/page.tsx` sí queda deshabilitado mientras espera, así que no hay
riesgo de doble-envío — pero si la API tarda mucho, el usuario puede quedar mirando el spinner un
buen rato sin saber si sigue funcionando o se colgó.
**Por qué importa:** Coincide con lo que pide la sección 10 de este pedido ("¿qué ocurre si tarda
30 segundos?") — hoy la respuesta es "espera indefinidamente, sin mensaje de que está tardando más
de lo normal".
**Cómo reproducirlo:** No reproducible sin simular una falla real de Anthropic — **requiere
verificación manual** o prueba con la API real caída.
**Resultado esperado:** Un tope razonable (ej. 30-45s) con un mensaje "esto está tardando más de lo
normal, puedes intentar de nuevo".
**Resultado actual:** Sin tope explícito.
**Solución recomendada:** Pasar `timeout` en la llamada al SDK de Anthropic + un mensaje de UI si
pasan más de ~15s.
**Riesgo de hacer el cambio:** Bajo.
**¿Obligatorio antes de la auditoría?:** No — es un caso de baja probabilidad (Anthropic es
confiable), vale la pena mencionarlo pero no bloquea nada.

### P1-5 — `obtenerDB()` trae todos los registros sin paginar (ya documentado en la certificación
anterior, se repite aquí porque encaja directo en la sección 7 de este pedido)
**Ubicación:** `lib/app-data.ts:56-60`.
**Categoría:** Performance / escalabilidad.
**Qué ocurre:** Sin `.limit()` — a partir de ~1000 filas (tope por defecto de PostgREST/Supabase),
los totales se truncarían en silencio.
**Por qué importa:** Con 0 usuarios reales hoy no es urgente, pero es la clase de hallazgo que un
auditor externo SÍ va a marcar si prueba con datos de volumen.
**Cómo reproducirlo:** Requiere +1000 registros — **no reproducido, verificado solo por lectura de
código**.
**Solución recomendada:** Paginar o, como mínimo, agregar un `.limit(1000)` explícito + aviso si se
alcanza (mejor que un truncado silencioso).
**Riesgo de hacer el cambio:** Medio si se pagina de verdad (toca varias pantallas); bajo si solo
se agrega el límite explícito con aviso.
**¿Obligatorio antes de la auditoría?:** No — level de uso actual no lo justifica, pero vale
mencionarlo para que el equipo externo lo tenga en el radar.

### P1-6 — Sin Sentry / monitoreo de errores en producción (repetido de la certificación anterior)
**Ubicación:** `package.json` — no está instalado.
**Categoría:** Operación.
**Por qué importa:** Hoy la única forma de enterarte de un error real es que un usuario te escriba.
**Solución recomendada:** Instalar `@sentry/nextjs` (15 minutos de trabajo).
**¿Obligatorio antes de la auditoría?:** No bloquea el envío, pero sería valioso tenerlo activo
ANTES de la auditoría — así, si el equipo externo prueba la app a fondo, tú ves sus errores en
tiempo real en vez de depender de que te los reporten.

---

## E. HALLAZGOS P2

- **Botón "Calcular mi saldo" del onboarding sin `disabled` durante el envío** (`app/onboarding/
  page.tsx:197`) — a diferencia del P0-1, esta acción es 100% local (sessionStorage, sin llamada a
  red), así que un doble-tap no duplica nada en la base de datos — solo re-ejecuta la misma
  transición de estado dos veces, sin efecto visible. Cosmético, no bloqueante.
- **Clientes no se pueden eliminar aunque hayan sido datos de prueba/duplicados** — molesto pero no
  daña el cálculo (a diferencia de proyectos/pagos). Ver P0-2 para el detalle.
- **`numeric(12,2)` puede desbordar con montos absurdamente grandes** (más de ~10 mil millones) —
  el insert fallaría con un mensaje genérico ("no pudimos guardar") sin explicar por qué. Caso
  extremo, poco probable con freelancers reales.
- **Sin verificación manual de navegación por teclado** (tab, foco visible en cada control
  interactivo) — el sistema de diseño lo contempla (`focus-visible` en varios componentes
  revisados), pero no se hizo un recorrido completo con teclado. **Requiere verificación manual.**
- **Sin verificación manual del breakpoint de tablet (768px)** — se probó a fondo 375px (móvil,
  prioritario) y 1280px+ (escritorio) durante esta sesión y la anterior; tablet no se revisó
  específicamente. **Requiere verificación manual.**

---

## F. HALLAZGOS P3 / FUTURE IMPROVEMENTS

- Edición de Clientes (nombre/teléfono/moneda) — más allá del mínimo del P0-2.
- Paginación real de listas cuando haya usuarios con mucho volumen.
- Golden-set de evals automatizados para la calidad de las respuestas de la IA.
- Página de estado pública (`status.cobroflow.app`).
- Doble opt-in real para los correos de marketing (nurturing/win-back) — ya documentado como
  desviación consciente en ESTADO.md, sigue siendo válido dejarlo para después.
- Deshacer ("undo") en vez de solo confirmación para el borrado de Gastos.

---

## G. GOLDEN PATH

**Usuario nuevo → onboarding → primer cliente → paywall → cuenta → primer valor real.**

Probado en vivo hoy (producción y local): `/` → "Ver quién me debe, gratis" → elige perfil
(Freelancer) → elige moneda (GTQ) → carga un cliente real con precio total y anticipo → ve su saldo
calculado al instante → "Ver mi plan" → paywall con los 3 planes y el nuevo selector Mensual/Anual
de Premium.

**Punto de fricción encontrado:** ninguno nuevo en el recorrido en sí — el flujo completa sin
errores, sin pantallas rotas, sin callejones sin salida. El único "pero" real de este recorrido es
posterior: si el usuario se equivocó al escribir el monto del anticipo durante el onboarding, no
hay forma de corregirlo una vez migrado a su cuenta real (mismo P0-2).

---

## H. WORST PATH

Simulado por lectura de código (no en vivo, salvo lo ya probado):

- **Campos vacíos:** cubierto — cada formulario revisado (`Nuevo cliente`, `Nuevo proyecto`,
  `Nuevo pago`, `Nuevo gasto`, `Registro`) valida antes de enviar, con mensajes en español.
- **Montos negativos/cero/texto:** cubierto en capas — `Number(x) || 0` en el frontend + mensaje de
  error + `check (monto > 0)` / `check (precio_total > 0)` en la base de datos como respaldo final.
- **Doble-clic / doble-tap:** cubierto en 4 de 5 formularios de creación — el punto ciego real es
  el P0-1 (confirmar pago).
- **Recarga a mitad de una operación:** el onboarding persiste en `sessionStorage` en cada paso
  (`guardarEstado`), así que una recarga no pierde el progreso. Las mutaciones reales (crear
  cliente/proyecto/pago) son operaciones únicas de Supabase — o se completan o no, sin estado
  intermedio que una recarga pueda corromper.
- **Volver atrás con el navegador / URL directa a una ruta protegida:** `proxy.ts` redirige a
  `/login` sin sesión para cualquier `/app/*` — verificado en el código y también en vivo contra
  producción esta sesión (`/api/ir-a-hotmart` sin sesión → 307 a `/login`).
- **Abandonar el onboarding y volver días después:** `sessionStorage` (no `localStorage`) — se
  pierde al cerrar la pestaña/navegador. Es una decisión de diseño razonable (evita cuentas a medio
  crear colgando para siempre), pero significa que alguien que cierra el navegador a mitad del
  onboarding empieza de cero. **No es un bug, es un comportamiento a confirmar que es el deseado.**

---

## I. CHECKLIST DE PRUEBAS MANUALES

1. Crear una cuenta real (no de prueba) y completar el onboarding de punta a punta.
2. Agregar un cliente, un proyecto y un pago reales.
3. **Doble-tap intencional en "confirmar pago"** — confirma si de verdad se duplica (P0-1).
4. Intenta encontrar cualquier forma de editar el nombre de un cliente o el monto de un pago ya
   creado (confirma P0-2).
5. Borra un gasto y confirma que no pide ninguna confirmación (P1-1).
6. Desde el celular real (no el emulador), completa el mismo recorrido del punto 1 y 2 — presta
   atención a si el teclado numérico tapa el botón de continuar en algún formulario.
7. Cierra sesión y entra de nuevo — confirma que tus datos siguen ahí.
8. Con la cuenta gratis, intenta agregar un 4º cliente y un cliente en una segunda moneda — confirma
   que te bloquea con el mensaje de upgrade (y no con un error técnico).
9. Prueba "Analizar mi negocio" (necesitas una cuenta Premium) y anota cuánto tarda en responder.
10. En el navegador, entra directo a una URL de `/app/...` sin haber iniciado sesión — confirma que
    te manda a `/login` y no muestra ningún dato.
11. Prueba el flujo de "olvidé mi contraseña" de punta a punta con un correo real.
12. Revisa la landing y el paywall en tu celular real, no solo en el navegador de escritorio
    achicado — el "sentir" táctil es distinto.

---

## J. SCORECARD 0–100

| Área | Puntuación | Evidencia |
|---|---:|---|
| Funcionalidad | 62 | Golden path funciona de punta a punta; el hueco real es CRUD incompleto (P0-2) |
| Estabilidad | 65 | Sin errores de build/tsc; el riesgo real es el doble-submit (P0-1), no crashes |
| UX | 72 | Onboarding claro, mensajes humanos; falta confirmación en borrado (P1-1) |
| UI | 80 | Sistema de diseño consistente, verificado en varias pantallas esta sesión y la anterior |
| Responsive | 70 | Móvil (375px) y escritorio probados a fondo; tablet sin verificar |
| Seguridad | 82 | RLS completo, headers verificados en vivo, webhook fail-secure — ya auditado a fondo antes |
| Performance | 60 | Imagen del hero ya optimizada; falta medición real de Lighthouse y paginación de listas |
| Manejo de errores | 65 | Formularios bien manejados; falta `error.tsx` global (P1-2) |
| Calidad técnica | 78 | `tsc`/`build` limpios, sin TODOs/console.log/datos de prueba sueltos en el código |
| Claridad del producto | 75 | Promesa clara, mecanismo nombrado ("Radar de Cobros"), un solo texto desactualizado (P1-3) |
| IA | 70 | Gating correcto, límites y circuit-breaker ya agregados; sin timeout explícito (P1-4) |
| Monetización | 78 | Límites de plan claros y ahora reforzados en base de datos; señuelo de precio ya resuelto |
| **Preparación general** | **68** | 2 P0 puntuales, resto son mejoras — no hay nada estructuralmente roto |

---

## K. AUDIT GATE

- [x] No existen P0 abiertos → **FALLA** (hay 2: doble-submit de pago, sin editar/eliminar).
- [x] Los flujos principales funcionan → cumple (golden path probado en vivo).
- [x] No hay errores evidentes en consola en funciones esenciales → cumple (`tsc`/`build` limpios).
- [ ] No hay pérdida conocida de datos → **FALLA parcialmente** (no es pérdida, es corrupción
      silenciosa posible por P0-1, sin forma de corregirla por P0-2).
- [x] La autenticación funciona correctamente → cumple.
- [x] Los permisos funcionan correctamente → cumple (RLS + `planEfectivo()` verificados).
- [x] La aplicación funciona en móvil → cumple (375px verificado extensamente).
- [x] Los estados de error principales existen → cumple, salvo el error boundary global (P1-2).
- [x] Los formularios principales están validados → cumple.
- [x] No existen secretos evidentes expuestos → cumple (verificado en la certificación anterior).
- [x] No existen elementos importantes de demo/desarrollo → cumple, salvo el texto viejo del PDF
      (P1-3, menor).
- [x] La experiencia principal puede completarse de principio a fin → cumple.
- [x] Un usuario nuevo puede entender el producto → cumple.
- [x] La aplicación parece un producto terminado → cumple, con matices menores de copy.

**2 de 14 puntos fallan** — ambos por la misma raíz (P0-1 + P0-2). El resto del gate pasa limpio.

---

## L. VEREDICTO FINAL

### ¿SOLICITARÍAS HOY LA AUDITORÍA PROFESIONAL DE ESTA APLICACIÓN?

**NO — todavía no, pero está a un arreglo puntual de distancia.**

No es un "no" por falta de madurez general: seguridad, auth, legal, diseño y el recorrido de venta
ya están sólidos y verificados con evidencia real. Es un "no" muy específico — un doble-tap puede
corromper silenciosamente el dato central de la app (cuánto te deben) y hoy no existe ninguna
forma de corregirlo. Corrige el P0-1 (agregar `disabled` al confirmar pago) y, como mínimo, la
edición/eliminación de Pagos (P0-2 acotado a Pagos) — con eso, pasa a **GO** y vale la pena
gastar la auditoría externa esta semana.
