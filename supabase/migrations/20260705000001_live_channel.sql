-- ============================================================
-- CANAL EN DIRECTO — playlist 24/7 sincronizada por reloj.
-- Los videos (subidos por el admin a Storage) se reproducen en
-- bucle y el bloque se REINICIA cada `block_minutes` (por defecto
-- 30 min): a las :00 y :30 el canal vuelve al primer video.
-- ============================================================

-- Config global del canal (una sola fila, id=1).
create table if not exists public.live_channel_config (
  id          int  primary key default 1,
  title       text not null default 'Canal en Directo',
  block_minutes int not null default 30 check (block_minutes between 1 and 720),
  enabled     boolean not null default true,
  updated_at  timestamptz not null default now(),
  constraint live_channel_config_singleton check (id = 1)
);

insert into public.live_channel_config (id) values (1)
  on conflict (id) do nothing;

-- Items de la lista de reproducción.
create table if not exists public.live_channel_items (
  id               uuid primary key default gen_random_uuid(),
  title            text not null default 'Sin título',
  video_url        text not null,
  storage_path     text,                    -- ruta dentro del bucket (para poder borrar el archivo)
  duration_seconds numeric not null check (duration_seconds > 0),
  position         int not null default 0,  -- orden dentro de la lista
  enabled          boolean not null default true,
  created_at       timestamptz not null default now()
);

create index if not exists idx_live_items_pos on public.live_channel_items (position);
create index if not exists idx_live_items_enabled on public.live_channel_items (enabled);

-- RLS: lectura pública (para el reproductor), escritura solo service role.
alter table public.live_channel_config enable row level security;
alter table public.live_channel_items  enable row level security;

drop policy if exists live_config_read on public.live_channel_config;
create policy live_config_read on public.live_channel_config
  for select using (true);

drop policy if exists live_items_read on public.live_channel_items;
create policy live_items_read on public.live_channel_items
  for select using (enabled = true);

-- (El servidor usa la service role key, que ignora RLS para escribir.)

-- ============================================================
-- Storage: bucket público para los videos del canal.
-- ============================================================
insert into storage.buckets (id, name, public)
  values ('live-videos', 'live-videos', true)
  on conflict (id) do nothing;

-- Lectura pública de los objetos del bucket.
drop policy if exists live_videos_public_read on storage.objects;
create policy live_videos_public_read on storage.objects
  for select using (bucket_id = 'live-videos');
