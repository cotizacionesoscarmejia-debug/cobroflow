-- Meta mensual (Premium) — cuánto quiere cobrar el usuario cada mes, para
-- medir progreso. Una sola columna nullable, no una tabla nueva: es un solo
-- número por cuenta, no un historial (si algún día se necesita metas por
-- mes/año, se amplía entonces).
alter table public.profiles add column if not exists meta_mensual numeric(12, 2);
