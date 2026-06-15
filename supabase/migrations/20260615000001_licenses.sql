-- ============================================================
-- LICENSES — clave de licencia única por compra
-- Permite entregar una clave al comprador y revocarla en caso de
-- reembolso/contracargo (el software la valida online).
-- ============================================================
create table if not exists public.licenses (
  id uuid primary key default gen_random_uuid(),
  license_key text not null unique,
  product_slug text,
  product_name text,
  tier_id text,
  email text,
  stripe_session_id text unique,
  status text not null default 'active' check (status in ('active', 'revoked')),
  max_activations int not null default 3,
  activation_count int not null default 0,
  created_at timestamptz not null default now(),
  last_validated_at timestamptz
);

create index if not exists idx_licenses_email on public.licenses (email);
create index if not exists idx_licenses_status on public.licenses (status);

-- Solo el service role (servidor) accede; sin políticas públicas.
alter table public.licenses enable row level security;
