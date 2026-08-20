-- Certificación pre-lanzamiento — bug real encontrado: valida_limite_free()
-- comparaba el plan CRUDO de profiles.plan contra 'free', pero esa columna
-- guarda "el último plan pagado" y NUNCA vuelve a 'free' sola tras cancelar,
-- reembolso o chargeback (ver apply_hotmart_event — a propósito, para
-- reactivar sin perder el plan si el usuario vuelve a pagar). Resultado real:
-- un usuario cancelado/reembolsado, ya sin acceso pagado según planEfectivo()
-- (lib/planes.ts) del lado de la app, podía seguir creando clientes/proyectos
-- SIN LÍMITE en la base de datos, porque el trigger nunca se enteraba.
--
-- Fix: replica en SQL la misma lógica de planEfectivo() (fuente única ya
-- documentada en lib/planes.ts) y el trigger la usa en vez del plan crudo.
--
-- Segundo bug encontrado en la misma pasada: ESTADO.md documentaba (Fase 1,
-- Multimoneda) que este trigger ya rechazaba una 2ª moneda en el plan Free
-- (error 'limite_free_moneda', que el frontend en
-- app/app/clientes/nuevo/page.tsx YA sabe manejar) — pero esa validación
-- nunca se escribió en ninguna migración. Un usuario Free podía crear
-- clientes en varias monedas sin ninguna restricción real. Se agrega aquí.

create or replace function public.plan_efectivo(
  p_plan text,
  p_status text,
  p_access_until timestamptz,
  p_grace_ends_at timestamptz
)
returns text
language sql
stable
as $$
  select case
    when p_status = 'active' then p_plan
    when p_status = 'past_due' and p_grace_ends_at is not null and p_grace_ends_at > now() then p_plan
    when p_status = 'cancelled' and p_access_until is not null and p_access_until > now() then p_plan
    else 'free'
  end;
$$;

create or replace function public.valida_limite_free()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_plan_efectivo text;
  v_count int;
begin
  select public.plan_efectivo(plan, status, access_until, grace_ends_at)
    into v_plan_efectivo
    from public.profiles where id = new.user_id;

  if v_plan_efectivo = 'free' then
    if TG_TABLE_NAME = 'clients' then
      select count(*) into v_count from public.clients where user_id = new.user_id;
      if v_count >= 3 then
        raise exception 'limite_free_clientes';
      end if;
      -- Free = una sola moneda. Si ya tiene clientes en otra moneda distinta
      -- a la del nuevo, rechaza (el frontend ya sabe mostrar el upsell a Pro).
      if exists (
        select 1 from public.clients
        where user_id = new.user_id and moneda <> new.moneda
      ) then
        raise exception 'limite_free_moneda';
      end if;
    elsif TG_TABLE_NAME = 'projects' then
      select count(*) into v_count from public.projects where user_id = new.user_id;
      if v_count >= 5 then
        raise exception 'limite_free_proyectos';
      end if;
    elsif TG_TABLE_NAME = 'expenses' then
      raise exception 'limite_free_gastos';
    end if;
  end if;

  return new;
end;
$$;
