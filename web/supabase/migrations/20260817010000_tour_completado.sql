-- Recorrido guiado inicial (Fase 6). Un solo flag por usuario: si ya lo vio
-- (o lo saltó), no se le vuelve a mostrar. Vive en profiles porque es una
-- preferencia de la cuenta, no algo que dependa del dispositivo.
alter table public.profiles add column if not exists tour_completado boolean not null default false;
