-- CobroFlow — pagos con Hotmart (Sesión 6, reemplaza el plan original de Stripe:
-- Stripe no admite cuentas de vendedor en Guatemala). Sigue el patrón de seguridad
-- de webhook de docs/sistema/18-VENTA-HOTMART.md: dedupe por event_id, log de
-- auditoría, y transición de estado atómica vía RPC (nunca un UPDATE directo desde
-- el route handler).

-- Cambia los campos de Stripe por los de Hotmart + ventanas de acceso para
-- cancelaciones (access_until) y pagos atrasados (grace_ends_at).
alter table public.profiles
  drop column if exists stripe_customer_id,
  drop column if exists stripe_subscription_id,
  add column hotmart_subscriber_code text,
  add column access_until timestamptz,
  add column grace_ends_at timestamptz;

alter table public.profiles
  drop constraint if exists profiles_status_check,
  add constraint profiles_status_check
    check (status in ('free', 'active', 'past_due', 'cancelled', 'expired', 'refunded', 'chargeback'));

-- El trigger que bloquea escritura de cliente ahora protege los campos de Hotmart
-- en vez de los de Stripe (mismo patrón, ver migración inicial).
create or replace function public.restringe_update_profiles()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if auth.role() <> 'service_role' then
    new.plan := old.plan;
    new.plan_period := old.plan_period;
    new.status := old.status;
    new.hotmart_subscriber_code := old.hotmart_subscriber_code;
    new.access_until := old.access_until;
    new.grace_ends_at := old.grace_ends_at;
    new.first_paid_at := old.first_paid_at;
  end if;
  return new;
end;
$$;

-- ============================================================================
-- DEDUPE + AUDITORÍA DEL WEBHOOK — Hotmart reenvía eventos; sin esto, un reintento
-- puede duplicar una acción o (peor) reactivar una cuenta ya reembolsada.
-- ============================================================================
create table public.processed_events (
  event_id text primary key,
  event_type text not null,
  payload_hash text,
  processed_at timestamptz not null default now()
);

create table public.webhook_log (
  id bigserial primary key,
  event_id text,
  type text,
  result text not null check (result in ('applied', 'duplicate', 'illegal', 'unauthorized', 'ignored', 'error')),
  received_at timestamptz not null default now()
);

create index idx_webhook_log_received on public.webhook_log (received_at desc);

-- Solo el service_role (el webhook) toca estas dos tablas.
alter table public.processed_events enable row level security;
alter table public.webhook_log enable row level security;

-- ============================================================================
-- RPC: aplica un evento de Hotmart de forma atómica (dedupe + transición + log).
-- Busca el perfil PRIMERO por hotmart_subscriber_code (compra de un usuario ya
-- registrado, Modelo 2A/2B — evita duplicar cuenta si compra con otro correo) y
-- si no lo encuentra, por email. Nunca hace INSERT ciego de un perfil nuevo: el
-- perfil ya existe siempre (lo crea handle_new_user al registrarse).
-- ============================================================================
create or replace function public.apply_hotmart_event(
  p_event_id text,
  p_event_type text,
  p_payload_hash text,
  p_email text,
  p_subscriber_code text,
  p_plan text,           -- 'pro' | 'premium', null si el evento no cambia plan
  p_new_status text,      -- 'active' | 'past_due' | 'cancelled' | 'expired' | 'refunded' | 'chargeback'
  p_access_until timestamptz default null,
  p_grace_ends_at timestamptz default null
)
returns text
language plpgsql
security definer
set search_path = public
as $$
declare
  v_profile_id uuid;
  v_current_status text;
  v_result text;
begin
  -- 1. Dedupe técnico: si ya procesamos este event_id, no repetir la acción.
  begin
    insert into public.processed_events (event_id, event_type, payload_hash)
    values (p_event_id, p_event_type, p_payload_hash);
  exception when unique_violation then
    insert into public.webhook_log (event_id, type, result) values (p_event_id, p_event_type, 'duplicate');
    return 'duplicate';
  end;

  -- 2. Encontrar el perfil: primero por subscriber_code (ya vinculado a una
  --    compra anterior), luego por email.
  if p_subscriber_code is not null then
    select id, status into v_profile_id, v_current_status
    from public.profiles where hotmart_subscriber_code = p_subscriber_code;
  end if;

  if v_profile_id is null and p_email is not null then
    select id, status into v_profile_id, v_current_status
    from public.profiles where email = p_email;
  end if;

  if v_profile_id is null then
    insert into public.webhook_log (event_id, type, result) values (p_event_id, p_event_type, 'error');
    return 'no_profile_match';
  end if;

  -- 3. Transición ilegal: no resucitar un reembolso/chargeback con un evento
  --    de acceso reentregado (ej. un PURCHASE_APPROVED viejo reenviado).
  if v_current_status in ('refunded', 'chargeback') and p_new_status = 'active' then
    insert into public.webhook_log (event_id, type, result) values (p_event_id, p_event_type, 'illegal');
    return 'illegal_transition';
  end if;

  -- 4. Aplicar el cambio.
  update public.profiles set
    status = p_new_status,
    plan = coalesce(p_plan, plan),
    hotmart_subscriber_code = coalesce(p_subscriber_code, hotmart_subscriber_code),
    access_until = p_access_until,
    grace_ends_at = p_grace_ends_at,
    first_paid_at = case when p_new_status = 'active' and first_paid_at is null then now() else first_paid_at end
  where id = v_profile_id;

  insert into public.webhook_log (event_id, type, result) values (p_event_id, p_event_type, 'applied');
  return 'applied';
end;
$$;
