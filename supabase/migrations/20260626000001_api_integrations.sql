-- ============================================================
-- API INTEGRATIONS — claves de API de proveedores externos
-- Centraliza las credenciales (MUAPI, NVIDIA, …) que el servidor
-- lee con getIntegration(). Si no hay fila, el código cae al .env.
-- Server-only: RLS activo sin políticas públicas → solo service_role.
-- ============================================================
create table if not exists public.api_integrations (
  provider   text primary key,
  label      text,
  base_url   text,
  api_key    text,
  enabled    boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Solo el service role (servidor) accede; sin políticas públicas.
alter table public.api_integrations enable row level security;
