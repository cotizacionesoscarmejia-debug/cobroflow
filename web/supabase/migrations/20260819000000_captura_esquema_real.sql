-- CAPTURA DE ESQUEMA REAL (auditoría, hallazgo crítico #2) — estas columnas y
-- esta tabla ya existen en producción (se aplicaron a mano en el SQL Editor de
-- Supabase durante la Fase 1 de multimoneda y la Fase 2 de nombre/apellido de
-- la Sesión 6) pero NUNCA quedaron guardadas como migración en el repo. Si el
-- proyecto de Supabase se pierde otra vez (ya pasó una vez), hoy no había forma
-- de recrearlas desde el código. Esta migración es 100% idempotente (IF NOT
-- EXISTS everywhere) — segura de correr tanto en producción (donde ya existen,
-- no hace nada) como en un proyecto nuevo (donde las crea desde cero).

alter table public.profiles add column if not exists moneda_principal text not null default 'USD';
alter table public.profiles add column if not exists nombre text;
alter table public.profiles add column if not exists apellido text;
alter table public.profiles add column if not exists nombre_negocio text;

create table if not exists public.exchange_rates (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  moneda_origen text not null,
  moneda_destino text not null,
  tasa numeric(14, 6) not null check (tasa > 0),
  actualizado_en date not null default current_date,
  unique (user_id, moneda_origen, moneda_destino)
);

create index if not exists idx_exchange_rates_user_id on public.exchange_rates(user_id);

alter table public.exchange_rates enable row level security;

drop policy if exists "el usuario administra sus propias tasas" on public.exchange_rates;
create policy "el usuario administra sus propias tasas"
  on public.exchange_rates for all
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);
