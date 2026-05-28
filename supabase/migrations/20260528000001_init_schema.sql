-- ============================================================
-- MediaPlayPromo — Initial schema
-- Tables: profiles, categories, banners, affiliates, referrals,
-- subscriptions, tenants, payments, audit_log
-- ============================================================

-- Helper: updated_at trigger
create or replace function public.set_updated_at()
returns trigger language plpgsql as $$
begin new.updated_at = now(); return new; end;
$$;

-- ============================================================
-- PROFILES (extends auth.users)
-- ============================================================
create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text not null unique,
  name text,
  avatar_url text,
  role text not null default 'user' check (role in ('user', 'seller', 'agency', 'affiliate', 'admin', 'superadmin')),
  plan text not null default 'free' check (plan in ('free', 'starter', 'pro', 'enterprise')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create trigger trg_profiles_updated before update on public.profiles
  for each row execute function public.set_updated_at();

-- Auto-create profile on signup
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer as $$
begin
  insert into public.profiles (id, email, name)
  values (new.id, new.email, coalesce(new.raw_user_meta_data->>'name', split_part(new.email, '@', 1)));
  return new;
end;
$$;
drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created after insert on auth.users
  for each row execute function public.handle_new_user();

-- ============================================================
-- CATEGORIES (the 18 AI categories)
-- ============================================================
create table if not exists public.categories (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  title text not null,
  subtitle text,
  icon text,
  gradient text,
  glow_color text,
  border_color text,
  text_accent text,
  bg_card text,
  enabled boolean not null default true,
  show_sidebar boolean not null default true,
  show_homepage boolean not null default true,
  premium boolean not null default false,
  order_index int not null default 0,
  tags text[] default '{}',
  tools jsonb default '[]'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists idx_categories_order on public.categories(order_index);
create trigger trg_categories_updated before update on public.categories
  for each row execute function public.set_updated_at();

-- ============================================================
-- BANNERS (homepage slider)
-- ============================================================
create table if not exists public.banners (
  id uuid primary key default gen_random_uuid(),
  enabled boolean not null default true,
  order_index int not null default 0,
  badge text,
  title text not null,
  accent text,
  subtitle text,
  cta_label text,
  cta_href text,
  secondary_label text,
  secondary_href text,
  gradient_from text default 'cyan-400',
  gradient_to text default 'blue-500',
  image_url text,
  video_url text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists idx_banners_order on public.banners(order_index);
create trigger trg_banners_updated before update on public.banners
  for each row execute function public.set_updated_at();

-- ============================================================
-- AFFILIATES
-- ============================================================
create table if not exists public.affiliates (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  code text not null unique,
  referral_url text generated always as ('https://mediaplaypromo.com/?ref=' || code) stored,
  commission_pct numeric(5,2) not null default 30.00,
  is_recurring boolean not null default true,
  status text not null default 'active' check (status in ('active', 'paused', 'banned')),
  total_clicks int not null default 0,
  total_conversions int not null default 0,
  total_earned numeric(12,2) not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists idx_affiliates_user on public.affiliates(user_id);
create index if not exists idx_affiliates_code on public.affiliates(code);
create trigger trg_affiliates_updated before update on public.affiliates
  for each row execute function public.set_updated_at();

create table if not exists public.referrals (
  id uuid primary key default gen_random_uuid(),
  affiliate_id uuid not null references public.affiliates(id) on delete cascade,
  referred_user_id uuid references public.profiles(id) on delete set null,
  status text not null default 'pending' check (status in ('pending', 'approved', 'paid', 'rejected')),
  commission_amount numeric(10,2),
  created_at timestamptz not null default now()
);
create index if not exists idx_referrals_affiliate on public.referrals(affiliate_id);

-- ============================================================
-- SUBSCRIPTIONS
-- ============================================================
create table if not exists public.subscriptions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  plan text not null check (plan in ('free', 'starter', 'pro', 'enterprise')),
  status text not null default 'active' check (status in ('active', 'past_due', 'canceled', 'paused')),
  stripe_subscription_id text unique,
  stripe_customer_id text,
  current_period_start timestamptz,
  current_period_end timestamptz,
  cancel_at_period_end boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists idx_subscriptions_user on public.subscriptions(user_id);
create trigger trg_subscriptions_updated before update on public.subscriptions
  for each row execute function public.set_updated_at();

-- ============================================================
-- WHITE-LABEL TENANTS
-- ============================================================
create table if not exists public.tenants (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references public.profiles(id) on delete cascade,
  name text not null,
  slug text not null unique,
  domain text unique,
  ssl_status text not null default 'pending' check (ssl_status in ('pending', 'provisioning', 'active', 'failed')),
  logo_url text,
  primary_color text default '#06b6d4',
  brand_settings jsonb default '{}'::jsonb,
  plan text not null default 'starter' check (plan in ('starter', 'agency', 'enterprise')),
  status text not null default 'active' check (status in ('active', 'suspended', 'pending')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists idx_tenants_domain on public.tenants(domain);
create trigger trg_tenants_updated before update on public.tenants
  for each row execute function public.set_updated_at();

-- ============================================================
-- PAYMENTS
-- ============================================================
create table if not exists public.payments (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references public.profiles(id) on delete set null,
  tenant_id uuid references public.tenants(id) on delete set null,
  amount numeric(12,2) not null,
  currency text not null default 'EUR',
  provider text not null check (provider in ('stripe', 'paypal', 'crypto')),
  provider_payment_id text,
  status text not null default 'pending' check (status in ('pending', 'completed', 'failed', 'refunded')),
  description text,
  metadata jsonb default '{}'::jsonb,
  created_at timestamptz not null default now()
);
create index if not exists idx_payments_user on public.payments(user_id);
create index if not exists idx_payments_status on public.payments(status);

-- ============================================================
-- AUDIT LOG (immutable record of admin actions)
-- ============================================================
create table if not exists public.audit_log (
  id uuid primary key default gen_random_uuid(),
  actor_id uuid references public.profiles(id) on delete set null,
  action text not null,
  resource_type text,
  resource_id text,
  metadata jsonb default '{}'::jsonb,
  ip_address inet,
  created_at timestamptz not null default now()
);
create index if not exists idx_audit_actor on public.audit_log(actor_id);
create index if not exists idx_audit_created on public.audit_log(created_at desc);

-- ============================================================
-- ROW LEVEL SECURITY
-- ============================================================
alter table public.profiles      enable row level security;
alter table public.categories    enable row level security;
alter table public.banners       enable row level security;
alter table public.affiliates    enable row level security;
alter table public.referrals     enable row level security;
alter table public.subscriptions enable row level security;
alter table public.tenants       enable row level security;
alter table public.payments      enable row level security;
alter table public.audit_log     enable row level security;

-- Helper: is current user superadmin?
create or replace function public.is_superadmin()
returns boolean language sql security definer stable as $$
  select exists (select 1 from public.profiles where id = auth.uid() and role = 'superadmin');
$$;

-- Profiles: users read own + superadmin reads all
create policy "profiles read own" on public.profiles for select using (auth.uid() = id or public.is_superadmin());
create policy "profiles update own" on public.profiles for update using (auth.uid() = id or public.is_superadmin());

-- Categories: public read; superadmin write
create policy "categories public read" on public.categories for select using (true);
create policy "categories admin write" on public.categories for all using (public.is_superadmin()) with check (public.is_superadmin());

-- Banners: public read enabled; superadmin write
create policy "banners public read enabled" on public.banners for select using (enabled or public.is_superadmin());
create policy "banners admin write" on public.banners for all using (public.is_superadmin()) with check (public.is_superadmin());

-- Affiliates: owner read/update; superadmin all
create policy "affiliates owner read" on public.affiliates for select using (auth.uid() = user_id or public.is_superadmin());
create policy "affiliates admin write" on public.affiliates for all using (public.is_superadmin()) with check (public.is_superadmin());

-- Subscriptions: owner read; superadmin all
create policy "subscriptions owner read" on public.subscriptions for select using (auth.uid() = user_id or public.is_superadmin());

-- Tenants: owner read/update; superadmin all
create policy "tenants owner read" on public.tenants for select using (auth.uid() = owner_id or public.is_superadmin());
create policy "tenants admin write" on public.tenants for all using (public.is_superadmin()) with check (public.is_superadmin());

-- Payments: owner read; superadmin all
create policy "payments owner read" on public.payments for select using (auth.uid() = user_id or public.is_superadmin());

-- Audit log: superadmin only
create policy "audit superadmin only" on public.audit_log for select using (public.is_superadmin());

-- ============================================================
-- SEED — SuperAdmin role for solfamendez41@gmail.com (after signup)
-- ============================================================
-- This runs after the user signs up via the app. The handle_new_user
-- trigger creates a profile with role='user'. We promote on first match.
create or replace function public.promote_superadmin()
returns trigger language plpgsql security definer as $$
begin
  if new.email = 'solfamendez41@gmail.com' then
    update public.profiles set role = 'superadmin', plan = 'enterprise', name = 'Solfa Mendez'
    where id = new.id;
  end if;
  return new;
end;
$$;
drop trigger if exists trg_promote_superadmin on public.profiles;
create trigger trg_promote_superadmin after insert on public.profiles
  for each row execute function public.promote_superadmin();
