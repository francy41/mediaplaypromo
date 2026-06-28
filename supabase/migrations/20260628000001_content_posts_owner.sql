-- ============================================================
-- CONTENT POSTS — aislamiento por administrador
-- Cada post pertenece a un "owner": "super" (SuperAdmin) o el id de un
-- administrador del Planificador. Los posts antiguos pasan a ser del super.
-- ============================================================
alter table public.content_posts add column if not exists owner_id text;

update public.content_posts set owner_id = 'super' where owner_id is null;

create index if not exists idx_content_owner on public.content_posts (owner_id);
