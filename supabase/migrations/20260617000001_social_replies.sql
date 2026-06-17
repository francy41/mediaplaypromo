-- Auto DM / Social Responder config (singleton row)
create table if not exists public.social_autoresponder (
  id text primary key default 'singleton',
  enabled boolean not null default true,
  trigger_mode text not null default 'any',   -- 'any' | 'keyword'
  keywords text[] not null default '{}',
  message_template text not null default '',
  link_type text not null default 'product',  -- 'product' | 'community' | 'custom'
  custom_link text,
  product_slug text default 'yfautoclip-v2',
  updated_at timestamptz not null default now()
);

-- Log of automated replies sent
create table if not exists public.social_reply_log (
  id uuid primary key default gen_random_uuid(),
  contact_name text,
  contact_id text,
  platform text,
  incoming_message text,
  reply_sent text,
  status text not null default 'sent',
  error text,
  conversation_id text,
  created_at timestamptz not null default now()
);

-- RLS: solo service_role accede
alter table public.social_autoresponder enable row level security;
alter table public.social_reply_log enable row level security;
