# Supabase — MediaPlayPromo

**Project**: `osearkjjulupmznvkzaw`
**Dashboard**: https://supabase.com/dashboard/project/osearkjjulupmznvkzaw

## Estructura

```
supabase/
├── config.toml                 # Configuración del proyecto
└── migrations/
    ├── 20260528000001_init_schema.sql      # Tablas + RLS + triggers
    └── 20260528000002_seed_categories.sql  # 18 categorías iniciales
```

## Tablas creadas

| Tabla | Propósito |
|---|---|
| `profiles` | Extiende `auth.users` con role + plan |
| `categories` | Las 18 categorías AI (editables por SuperAdmin) |
| `banners` | Hero slider del homepage |
| `affiliates` | Red de afiliados con códigos referral únicos |
| `referrals` | Tracking de conversiones por afiliado |
| `subscriptions` | Suscripciones Stripe |
| `tenants` | White-label multi-tenant |
| `payments` | Histórico de pagos (Stripe/PayPal/Crypto) |
| `audit_log` | Registro inmutable de acciones admin |

## Roles & Permisos

Trigger auto-promueve a `solfamendez41@gmail.com` → `role='superadmin'` al primer signup.

Roles disponibles: `user`, `seller`, `agency`, `affiliate`, `admin`, `superadmin`.

Planes: `free`, `starter`, `pro`, `enterprise`.

## RLS (Row Level Security)

- **profiles**: usuarios leen el suyo; superadmin lee todos
- **categories**: lectura pública; escritura solo superadmin
- **banners**: lectura pública si `enabled`; escritura solo superadmin
- **affiliates/subscriptions/tenants/payments**: dueño + superadmin
- **audit_log**: solo superadmin

## GitHub Integration

Cuando conectes este repo en Supabase Dashboard → Integrations → GitHub:

1. Cada push a `main` que toque `supabase/migrations/*` se ejecuta automáticamente en tu DB
2. Los nombres de archivos siguen `YYYYMMDDHHMMSS_description.sql` (timestamps únicos)
3. Migraciones son **idempotentes** — usan `create if not exists` y `on conflict do nothing`

## Variables de entorno

Necesarias en Vercel + local:

```bash
NEXT_PUBLIC_SUPABASE_URL=https://osearkjjulupmznvkzaw.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGc... (de Supabase → Settings → API)
SUPABASE_SERVICE_ROLE_KEY=eyJhbGc... (NUNCA commitear, solo server)
```
