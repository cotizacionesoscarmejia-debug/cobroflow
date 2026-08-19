-- Gastos (Pro+, categorías y recurrencia Premium) — para calcular utilidad neta
-- (cobrado - gastado) y restar gastos recurrentes de la Proyección de flujo.
-- Tabla nueva, aditiva: no toca clients/projects/payments/profiles.
create table public.expenses (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  monto numeric(12, 2) not null check (monto > 0),
  moneda text not null,
  categoria text,
  descripcion text not null default '',
  fecha date not null default current_date,
  recurrente boolean not null default false,
  created_at timestamptz not null default now()
);

create index idx_expenses_user_id on public.expenses(user_id);

alter table public.expenses enable row level security;

create policy "el usuario administra sus propios gastos"
  on public.expenses for all
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

-- Gastos es Pro+ — el plan Free no puede insertar ninguno (defensa en servidor,
-- nunca confiar solo en el gate del frontend, 09-SEGURIDAD). Extiende la misma
-- función de límites que ya usan clients/projects.
create or replace function public.valida_limite_free()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_plan text;
  v_count int;
begin
  select plan into v_plan from public.profiles where id = new.user_id;

  if v_plan = 'free' then
    if TG_TABLE_NAME = 'clients' then
      select count(*) into v_count from public.clients where user_id = new.user_id;
      if v_count >= 3 then
        raise exception 'limite_free_clientes';
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

create trigger trg_limite_gastos
  before insert on public.expenses
  for each row execute function public.valida_limite_free();
