# Manual del dueño — CobroFlow

Guía en lenguaje simple para operar el negocio sin depender de un desarrollador. Guárdala en un lugar seguro (no la subas a redes ni la compartas por correo sin cifrar — tiene nombres de tus cuentas, aunque ninguna clave).

## 1. Tus cuentas (dónde vive cada cosa)

| Servicio | Para qué sirve | Dónde entrar |
|---|---|---|
| **Vercel** | Aloja la app (donde vive el código en producción) | vercel.com → proyecto `cobroflow` (equipo "OM SOLUTIONS PROYECTS") |
| **GitHub** | Guarda el código y su historial | `github.com/cotizacionesoscarmejia-debug/cobroflow` |
| **Supabase** | La base de datos (usuarios, clientes, pagos) | supabase.com → proyecto `CobroFlow`, org `ogames2003@gmail.com's Org`, ref `lacvctwsgkehemhdhqvx` |
| **Hotmart** | Cobra las suscripciones Pro/Premium | hotmart.com → producto "CobroFlow" (ID 8326549) |
| **Resend** | Manda todos los correos de la app | resend.com |
| **Anthropic (Claude)** | La IA de "Analizar mi negocio" (solo Premium) | console.anthropic.com |
| **Dominio** | `cobroflow.app` | Comprado y administrado desde Vercel |

## 2. Cómo se despliega un cambio

1. Cuando le pidas un cambio a tu agente de IA, al final él sube el código a GitHub (`git push`).
2. Vercel detecta el cambio automáticamente y publica una nueva versión — normalmente en 1-3 minutos.
3. Puedes ver el progreso en Vercel → tu proyecto → pestaña "Deployments". Verde = listo.
4. Si agregaste o cambiaste una variable de entorno (una clave o configuración), Vercel necesita que le des **Redeploy** manualmente — guardar la variable sola no alcanza.

## 3. Cómo deshacer un cambio que salió mal (rollback)

1. Vercel → tu proyecto → "Deployments".
2. Busca la versión anterior que sí funcionaba (tiene fecha y el commit correspondiente).
3. Clic en los 3 puntos → "Promote to Production". En segundos, esa versión vuelve a ser la que ven tus usuarios — sin tocar código ni esperar un nuevo build.

## 4. Tareas comunes

**Ver cuántos usuarios tienes / en qué plan están:**
Supabase → tu proyecto → "Table Editor" → tabla `profiles`. Columna `plan` (free/pro/premium) y `status` (active/past_due/cancelled/etc).

**Ver los últimos pagos/eventos de Hotmart:**
Supabase → "Table Editor" → tabla `webhook_log` (cada evento que llegó, si se aplicó o no) y `processed_events`.

**Ver cuánto está costando la IA:**
Supabase → "Table Editor" → tabla `ai_calls` — cada fila es un análisis, con el costo estimado en dólares. Suma la columna `costo_estimado_usd` del mes para saber el gasto real.

**Apagar la IA de emergencia (si algo sale mal con el costo):**
Vercel → tu proyecto → Settings → Environment Variables → agrega `AI_ANALISIS_DESACTIVADO` = `true` → Redeploy. Nadie podrá usar "Analizar mi negocio" hasta que borres esa variable y vuelvas a desplegar. No afecta el resto de la app.

**Subir/bajar el plan de un usuario a mano** (ej. alguien pagó fuera de Hotmart, o hay que darle acceso de cortesía):
Supabase → "SQL Editor" → pide ayuda a tu agente de IA para armar el `UPDATE` exacto (nunca lo hagas a mano sin su ayuda — hay varias columnas que deben cambiar juntas: `plan`, `status`, `first_paid_at`).

**Cambiar un precio:**
1. Cambia el precio en Hotmart (el cobro real).
2. Pide a tu agente que actualice el número mostrado en la landing y el paywall (son solo copy, no vuelven a cobrar nada).
Nunca cambies solo uno de los dos lados — el precio mostrado y el cobrado real SIEMPRE deben coincidir.

## 5. Qué hacer si algo se cae (mini-runbook)

**La app no carga / pantalla en blanco:**
1. Revisa Vercel → Deployments — ¿el último build falló (marca roja)? Si sí, usa el rollback (sección 3).
2. Si el build está verde pero igual no carga, revisa Supabase → tu proyecto → ¿dice "Paused" o algo similar arriba? (No debería pasarte, tu plan es de pago — pero si ves un aviso de facturación, revísalo).

**Un usuario pagó y no le activó el plan:**
1. Supabase → tabla `webhook_log`, busca el evento más reciente de esa persona (columna `type`/`result`).
2. Si dice `error` o `no_profile_match`: revisa la tabla `profiles` — probablemente pagó con un correo distinto al de su cuenta. El correo automático de soporte que te llega a `soporte@cobroflow.app` cuando esto pasa trae los datos para resolverlo a mano.
3. Mientras confirmas, puedes subirle el plan manualmente (ver sección 4) para no hacerlo esperar.

**Los correos no están llegando:**
1. Resend → Domains — ¿`tx.cobroflow.app` y `news.cobroflow.app` dicen "Verified"? Si no, revisa que pegaste los registros DNS correctos en Vercel → Domains.
2. Resend → Logs — ahí ves cada correo enviado y si rebotó o llegó.

**Sospechas que se filtró una clave (API key, contraseña):**
1. Ve inmediatamente al panel del servicio correspondiente (Supabase/Resend/Anthropic/Hotmart) y genera una clave nueva ("regenerate"/"rotate").
2. Borra la clave vieja de Vercel y pon la nueva → Redeploy.
3. Nunca pegues una clave real en el chat con tu agente de IA — solo dile el nombre de la variable y que ya la configuraste.

## 6. Lo que NO existe todavía (para que sepas a dónde escalar si pasa)

- **No hay Sentry ni monitoreo de errores automático.** Si algo falla, hoy te enteras porque un usuario te escribe, no porque un sistema te avise. Es la mejora #1 recomendada antes de tener muchos usuarios (ver certificado de lanzamiento).
- **No hay página de estado pública** (`status.cobroflow.app`) — si hay una caída, no tienes dónde avisar a tus usuarios de un vistazo.
- **El borrado de cuenta es manual** — si alguien pide eliminar su cuenta, te escribe a `soporte@cobroflow.app` y lo haces tú (o tu agente) desde Supabase, no hay un botón de autoservicio.

## 7. Contactos y soporte de cada proveedor

- Supabase: soporte vía el dashboard (ícono de ayuda) — plan de pago tiene soporte por correo.
- Vercel: soporte vía dashboard.
- Hotmart: help.hotmart.com (ya usado para resolver el enlace de cancelación).
- Resend: resend.com/docs o soporte por correo.
- Anthropic: soporte vía console.anthropic.com.
