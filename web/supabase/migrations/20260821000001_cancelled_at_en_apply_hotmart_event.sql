-- Agrega cancelled_at a la transición de apply_hotmart_event (mismo patrón que
-- first_paid_at: se fija cuando el nuevo estado es 'cancelled'). Necesario para
-- que el cron de win-back (día 30/60/90) tenga desde cuándo contar — antes solo
-- existía access_until, que mide otra cosa (hasta cuándo dura el acceso pagado).
create or replace function public.apply_hotmart_event(
  p_event_id text,
  p_event_type text,
  p_payload_hash text,
  p_email text,
  p_subscriber_code text,
  p_plan text,
  p_new_status text,
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
  begin
    insert into public.processed_events (event_id, event_type, payload_hash)
    values (p_event_id, p_event_type, p_payload_hash);
  exception when unique_violation then
    insert into public.webhook_log (event_id, type, result) values (p_event_id, p_event_type, 'duplicate');
    return 'duplicate';
  end;

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

  if v_current_status in ('refunded', 'chargeback') and p_new_status = 'active' then
    insert into public.webhook_log (event_id, type, result) values (p_event_id, p_event_type, 'illegal');
    return 'illegal_transition';
  end if;

  update public.profiles set
    status = p_new_status,
    plan = coalesce(p_plan, plan),
    hotmart_subscriber_code = coalesce(p_subscriber_code, hotmart_subscriber_code),
    access_until = p_access_until,
    grace_ends_at = p_grace_ends_at,
    first_paid_at = case when p_new_status = 'active' and first_paid_at is null then now() else first_paid_at end,
    cancelled_at = case when p_new_status = 'cancelled' then now() else cancelled_at end
  where id = v_profile_id;

  insert into public.webhook_log (event_id, type, result) values (p_event_id, p_event_type, 'applied');
  return 'applied';
end;
$$;
