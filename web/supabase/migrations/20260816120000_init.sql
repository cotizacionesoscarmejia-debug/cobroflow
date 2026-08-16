-- CobroFlow — esquema inicial (Sesión 6)
-- Tablas: profiles (plan/estado del usuario), clients, projects, payments.
-- Migra el modelo ya probado en lib/app-data.ts (frontend con localStorage) — mismos
-- campos, mismas reglas de estado (atrasado/proximo/al_dia se calculan en el cliente
-- con fecha_promesa, no aquí: son matemática simple, no necesitan vivir en SQL).

-- ============================================================================
-- PROFILES — el perfil/plan del usuario. Se crea solo via trigger al registrarse.
-- ============================================================================
create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text not null,
  full_name text,
  plan text not null default 'free' check (plan in ('free', 'pro', 'premium')),
  plan_period text check (plan_period in ('monthly', 'annual')),
  status text not null default 'free' check (status in ('free', 'active', 'trialing', 'past_due', 'cancelled', 'expired')),
  stripe_customer_id text,
  stripe_subscription_id text,
  first_paid_at timestamptz,
  created_at timestamptz not null default now()
);

alter table public.profiles enable row level security;

create policy "el usuario ve su propio perfil"
  on public.profiles for select
  using ((select auth.uid()) = id);

create policy "el usuario edita su propio perfil (columnas protegidas via trigger)"
  on public.profiles for update
  using ((select auth.uid()) = id);

-- El cliente NUNCA puede escribir plan/status/stripe_* directamente — solo el
-- webhook de Stripe (via service_role) puede. Mismo patrón ya probado en
-- English2Hire (migración "restringe_update_profiles").
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
    new.stripe_customer_id := old.stripe_customer_id;
    new.stripe_subscription_id := old.stripe_subscription_id;
    new.first_paid_at := old.first_paid_at;
  end if;
  return new;
end;
$$;

create trigger trg_restringe_update_profiles
  before update on public.profiles
  for each row execute function public.restringe_update_profiles();

-- Crea el perfil automáticamente al registrarse (magic link o Google).
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, email, full_name)
  values (new.id, new.email, new.raw_user_meta_data ->> 'full_name');
  return new;
end;
$$;

create trigger trg_handle_new_user
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ============================================================================
-- CLIENTS
-- ============================================================================
create table public.clients (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  nombre text not null,
  telefono text,
  moneda text not null default 'USD',
  created_at timestamptz not null default now()
);

create index idx_clients_user_id on public.clients(user_id);

alter table public.clients enable row level security;

create policy "el usuario administra sus propios clientes"
  on public.clients for all
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

-- ============================================================================
-- PROJECTS
-- ============================================================================
create table public.projects (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  client_id uuid not null references public.clients(id) on delete cascade,
  nombre text not null default 'Proyecto',
  precio_total numeric(12, 2) not null check (precio_total > 0),
  fecha_promesa date not null,
  created_at timestamptz not null default now()
);

create index idx_projects_user_id on public.projects(user_id);
create index idx_projects_client_id on public.projects(client_id);

alter table public.projects enable row level security;

create policy "el usuario administra sus propios proyectos"
  on public.projects for all
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

-- ============================================================================
-- PAYMENTS
-- ============================================================================
create table public.payments (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  project_id uuid not null references public.projects(id) on delete cascade,
  monto numeric(12, 2) not null check (monto > 0),
  fecha date not null default current_date,
  created_at timestamptz not null default now()
);

create index idx_payments_user_id on public.payments(user_id);
create index idx_payments_project_id on public.payments(project_id);

alter table public.payments enable row level security;

create policy "el usuario administra sus propios pagos"
  on public.payments for all
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

-- ============================================================================
-- LÍMITES DEL PLAN FREE (server-side, no confiar solo en el frontend — 09-SEGURIDAD)
-- Free: 3 clientes activos, 5 proyectos. Pro/Premium: ilimitado.
-- ============================================================================
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
    end if;
  end if;

  return new;
end;
$$;

create trigger trg_limite_clientes
  before insert on public.clients
  for each row execute function public.valida_limite_free();

create trigger trg_limite_proyectos
  before insert on public.projects
  for each row execute function public.valida_limite_free();
