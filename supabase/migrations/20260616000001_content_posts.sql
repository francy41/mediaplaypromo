-- ============================================================
-- CONTENT POSTS — planificador de contenido (carpeta + cola)
-- Cada video entra como "queued", se programa (scheduled) y se publica
-- (published) en redes vía GoHighLevel Social Planner.
-- ============================================================
create table if not exists public.content_posts (
  id uuid primary key default gen_random_uuid(),
  title text,
  video_url text not null,
  caption text,
  platforms text[] not null default '{}',
  scheduled_at timestamptz,
  status text not null default 'queued' check (status in ('queued', 'scheduled', 'published', 'failed')),
  ghl_post_id text,
  error text,
  created_at timestamptz not null default now(),
  published_at timestamptz
);

create index if not exists idx_content_status on public.content_posts (status);
create index if not exists idx_content_sched on public.content_posts (scheduled_at);

-- Solo el service role (servidor) accede.
alter table public.content_posts enable row level security;
