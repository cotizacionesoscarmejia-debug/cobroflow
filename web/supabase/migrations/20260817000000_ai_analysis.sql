-- "Analizar mi negocio" (Premium, Fase 5). Log + caché de cada análisis
-- generado por IA — cada fila es un análisis inmutable (nunca se edita, solo
-- se inserta), sirve para releer el último sin regenerar y para limitar el
-- uso mensual por usuario (10/mes, controlado en la ruta de API).
create table public.ai_analysis (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  resumen text not null,
  positivos text[] not null default '{}',
  alertas text[] not null default '{}',
  recomendaciones text[] not null default '{}',
  proximos_pasos text[] not null default '{}',
  datos_entrada jsonb not null,
  created_at timestamptz not null default now()
);

create index ai_analysis_user_created_idx on public.ai_analysis (user_id, created_at desc);

alter table public.ai_analysis enable row level security;

create policy "select_own_ai_analysis" on public.ai_analysis
  for select using ((select auth.uid()) = user_id);

create policy "insert_own_ai_analysis" on public.ai_analysis
  for insert with check ((select auth.uid()) = user_id);
