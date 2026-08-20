-- Sistema de emails del negocio (transaccionales + retención + nurturing).
-- email_log es la fuente de idempotencia de TODAS las secuencias por cron
-- (dunning, win-back, activación, nurturing): antes de mandar el email del día
-- N, se pregunta "¿ya le mandé esta plantilla?" en vez de llevar un contador
-- aparte por usuario — una tabla sirve para todas las secuencias.

create table public.email_log (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete set null,
  email text not null,
  template text not null,
  resend_id text,
  sent_at timestamptz not null default now()
);

create index idx_email_log_email_template on public.email_log(email, template, sent_at desc);
create index idx_email_log_user_template on public.email_log(user_id, template, sent_at desc);

alter table public.email_log enable row level security;
-- Sin políticas a propósito: nadie con anon/authenticated debe leer el log de
-- correos de otros usuarios. Solo el service_role (webhook/cron) lo toca, y
-- ese rol siempre pasa por encima de RLS.

-- Lista de supresión (bounces/quejas que reporte Resend) — se consulta SIEMPRE
-- antes de mandar marketing (nurturing/win-back); los transaccionales igual se
-- intentan (son parte del servicio que la persona ya pagó/pidió).
create table public.email_suppression (
  email text primary key,
  reason text not null,
  suppressed_at timestamptz not null default now()
);
alter table public.email_suppression enable row level security;

-- cancelled_at: momento REAL de la cancelación, para calcular los días del
-- win-back (30/60/90) sin depender de access_until (que ya tiene otro
-- propósito: hasta cuándo dura el acceso pagado, no cuándo se canceló).
alter table public.profiles add column if not exists cancelled_at timestamptz;

-- marketing_opt_out: baja de nurturing/win-back — nunca de los transaccionales
-- (no son marketing, son el servicio que la persona pidió/pagó).
alter table public.profiles add column if not exists marketing_opt_out boolean not null default false;

-- Carrito abandonado (B, 18/35): en CobroFlow SIEMPRE hay una cuenta registrada
-- antes de llegar a Hotmart (el paywall manda a /registro, nunca directo al
-- checkout) — así que en vez de depender de un evento de webhook de Hotmart
-- sin confirmar (ver la nota de "verificar antes de codear" del propio SO),
-- registramos el clic al link de checkout NOSOTROS MISMOS: dato 100% real, no
-- una adivinanza de nombre de evento. /api/ir-a-hotmart inserta aquí antes de
-- redirigir; el cron compara contra el plan actual para saber si convirtió.
create table public.checkout_intentos (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  plan text not null check (plan in ('pro', 'premium')),
  clicked_at timestamptz not null default now()
);
create index idx_checkout_intentos_user on public.checkout_intentos(user_id, clicked_at desc);
alter table public.checkout_intentos enable row level security;
create policy "el usuario ve sus propios intentos de checkout"
  on public.checkout_intentos for select
  using ((select auth.uid()) = user_id);
-- Solo el server (BFF /api/ir-a-hotmart, con el cliente autenticado del propio
-- usuario) inserta — de ahí el with check igual a la policy de select.
create policy "el usuario registra su propio intento de checkout"
  on public.checkout_intentos for insert
  with check ((select auth.uid()) = user_id);
