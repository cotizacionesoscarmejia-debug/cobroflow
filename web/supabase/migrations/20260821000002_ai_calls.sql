-- Costo de IA medido por llamada (panel de expertos, item #6: "sin costo de IA
-- medido"). Cada POST exitoso a /api/ai/analizar-negocio inserta una fila con
-- los tokens reales que devolvió Claude y un costo estimado en USD, para poder
-- ver en Supabase cuánto cuesta la IA por usuario/mes frente al precio de Premium.

create table if not exists ai_calls (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  modelo text not null,
  tokens_entrada integer not null,
  tokens_salida integer not null,
  costo_estimado_usd numeric(10, 6) not null,
  created_at timestamptz not null default now()
);

create index if not exists ai_calls_user_id_idx on ai_calls (user_id);
create index if not exists ai_calls_created_at_idx on ai_calls (created_at);

alter table ai_calls enable row level security;

-- Solo el dueño puede leer su propio historial de costo; la escritura la hace
-- siempre el servidor con la service role (nunca el cliente).
create policy "ai_calls_select_own" on ai_calls
  for select using ((select auth.uid()) = user_id);
