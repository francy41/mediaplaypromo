import type { LucideIcon } from "lucide-react";
import {
  LayoutGrid, Image as ImageIcon, Users, ShoppingBag, UserCheck, Globe,
  CreditCard, Sparkles, Film, FolderTree, BarChart3, Settings, Shield, Bell,
  Database, Mail, Bot, FileText, Palette, Activity, Server, Lock, Layers, Package, Plug, Clapperboard
} from "lucide-react";

export interface AdminModule {
  id: string;
  title: string;
  description: string;
  href: string;
  icon: LucideIcon;
  group: "Contenido" | "Comercio" | "Usuarios" | "Sistema" | "Analytics";
  iconBg: string;
  iconText: string;
  status: "live" | "beta" | "soon";
  kpi?: { label: string; value: string | number };
}

export const ADMIN_MODULES: AdminModule[] = [
  // ── Contenido ──
  { id: "editor", title: "Mega Editor de Video IA", description: "Crea videos largos con IA: guión, clips reales, transiciones, voz y montaje", href: "/editor",
    icon: Clapperboard, group: "Contenido", iconBg: "bg-violet-500/15", iconText: "text-violet-400",
    status: "beta", kpi: { label: "IA", value: "Auto" } },
  { id: "cats", title: "Categorías", description: "CRUD de las 18 categorías IA", href: "/admin/categories",
    icon: FolderTree, group: "Contenido", iconBg: "bg-orange-500/15", iconText: "text-orange-400",
    status: "live", kpi: { label: "Total", value: 18 } },
  { id: "banners", title: "Banners Homepage", description: "Editor del hero slider", href: "/admin/banners",
    icon: ImageIcon, group: "Contenido", iconBg: "bg-cyan-500/15", iconText: "text-cyan-400",
    status: "live", kpi: { label: "Activos", value: 6 } },
  { id: "batch", title: "Batch AI Generator", description: "Generación masiva de videos/imágenes — admin a coste, usuario +30%", href: "/admin/batch",
    icon: Layers, group: "Contenido", iconBg: "bg-fuchsia-500/15", iconText: "text-fuchsia-400",
    status: "live", kpi: { label: "Margen", value: "30%" } },
  { id: "products", title: "Productos", description: "Catálogo de productos por categoría · subcategorías · portadas", href: "/admin/products",
    icon: Package, group: "Contenido", iconBg: "bg-violet-500/15", iconText: "text-violet-400",
    status: "live", kpi: { label: "Total", value: 2 } },
  { id: "homepage", title: "Page Builder", description: "Edita secciones del homepage", href: "/admin/homepage",
    icon: LayoutGrid, group: "Contenido", iconBg: "bg-violet-500/15", iconText: "text-violet-400",
    status: "beta", kpi: { label: "Secciones", value: 7 } },
  { id: "media", title: "Media Library", description: "Imágenes, videos, reels, AI media", href: "/admin/media",
    icon: Film, group: "Contenido", iconBg: "bg-pink-500/15", iconText: "text-pink-400",
    status: "soon", kpi: { label: "Assets", value: "0" } },
  { id: "stock", title: "Banco de Medios", description: "Fotos y videos reales de stock (Pexels) — buscar y usar. Solo SuperAdmin", href: "/stock",
    icon: ImageIcon, group: "Contenido", iconBg: "bg-emerald-500/15", iconText: "text-emerald-400",
    status: "live", kpi: { label: "Fuente", value: "Pexels" } },
  { id: "templates", title: "Plantillas", description: "Templates premium globales", href: "/admin/templates",
    icon: Palette, group: "Contenido", iconBg: "bg-fuchsia-500/15", iconText: "text-fuchsia-400",
    status: "soon", kpi: { label: "Pack", value: "5k" } },

  // ── Comercio ──
  { id: "payments", title: "Pagos & Stripe", description: "Stripe, PayPal, suscripciones, payouts", href: "/admin/payments",
    icon: CreditCard, group: "Comercio", iconBg: "bg-green-500/15", iconText: "text-green-400",
    status: "beta", kpi: { label: "MRR", value: "$0" } },
  { id: "affiliates", title: "Afiliados", description: "Red, comisiones, payouts y leaderboard", href: "/admin/affiliates",
    icon: UserCheck, group: "Comercio", iconBg: "bg-emerald-500/15", iconText: "text-emerald-400",
    status: "beta", kpi: { label: "Comisión", value: "30%" } },
  { id: "whitelabel", title: "Marca Blanca", description: "Tenants, dominios, branding multi-tenant", href: "/admin/whitelabel",
    icon: Globe, group: "Comercio", iconBg: "bg-purple-500/15", iconText: "text-purple-400",
    status: "beta", kpi: { label: "Tenants", value: 0 } },
  { id: "subscriptions", title: "Suscripciones", description: "Planes, precios, billing recurrente", href: "/admin/subscriptions",
    icon: Activity, group: "Comercio", iconBg: "bg-blue-500/15", iconText: "text-blue-400",
    status: "soon", kpi: { label: "Planes", value: 4 } },

  // ── Usuarios ──
  { id: "users", title: "Usuarios", description: "Cuentas, roles, permisos y suspensión", href: "/admin/users",
    icon: Users, group: "Usuarios", iconBg: "bg-cyan-500/15", iconText: "text-cyan-400",
    status: "beta", kpi: { label: "Total", value: 1 } },
  { id: "sellers", title: "Vendedores", description: "Sellers, agencias y verificación", href: "/admin/sellers",
    icon: UserCheck, group: "Usuarios", iconBg: "bg-yellow-500/15", iconText: "text-yellow-400",
    status: "soon", kpi: { label: "Activos", value: 0 } },
  { id: "notifications", title: "Notificaciones", description: "Broadcast push/email a usuarios", href: "/admin/notifications",
    icon: Bell, group: "Usuarios", iconBg: "bg-red-500/15", iconText: "text-red-400",
    status: "soon", kpi: { label: "Enviadas", value: 0 } },

  // ── Sistema ──
  { id: "integrations", title: "Integraciones / APIs", description: "Claves de API de proveedores (MUAPI, NVIDIA…) en un solo sitio, seguras con RLS", href: "/integrations",
    icon: Plug, group: "Sistema", iconBg: "bg-indigo-500/15", iconText: "text-indigo-400",
    status: "live", kpi: { label: "Server-only", value: "RLS" } },
  { id: "ai-tools", title: "AI Tools & API", description: "Claves OpenAI, ElevenLabs, créditos", href: "/admin/ai-tools",
    icon: Sparkles, group: "Sistema", iconBg: "bg-violet-500/15", iconText: "text-violet-400",
    status: "soon", kpi: { label: "Providers", value: 0 } },
  { id: "automations", title: "Automatizaciones", description: "Workflows, Webhooks y triggers", href: "/admin/automations",
    icon: Bot, group: "Sistema", iconBg: "bg-amber-500/15", iconText: "text-amber-400",
    status: "soon", kpi: { label: "Flujos", value: 0 } },
  { id: "smtp", title: "SMTP / Email", description: "Servidor de correo y deliverability", href: "/admin/smtp",
    icon: Mail, group: "Sistema", iconBg: "bg-orange-500/15", iconText: "text-orange-400",
    status: "soon", kpi: { label: "Estado", value: "Off" } },
  { id: "domains", title: "Dominios & DNS", description: "Verificación, SSL y multi-tenant DNS", href: "/admin/domains",
    icon: Server, group: "Sistema", iconBg: "bg-teal-500/15", iconText: "text-teal-400",
    status: "soon", kpi: { label: "DNS", value: 1 } },
  { id: "security", title: "Seguridad", description: "Roles, 2FA, audit log", href: "/settings/security",
    icon: Shield, group: "Sistema", iconBg: "bg-red-500/15", iconText: "text-red-400",
    status: "live" },
  { id: "settings", title: "Ajustes Globales", description: "Branding, SEO, legal, integraciones", href: "/admin/settings",
    icon: Settings, group: "Sistema", iconBg: "bg-slate-500/15", iconText: "text-slate-400",
    status: "beta" },
  { id: "database", title: "Base de Datos", description: "Backups, migraciones, integridad", href: "/admin/database",
    icon: Database, group: "Sistema", iconBg: "bg-indigo-500/15", iconText: "text-indigo-400",
    status: "soon", kpi: { label: "Status", value: "Mock" } },
  { id: "audit", title: "Audit Log", description: "Registro de acciones admin", href: "/admin/audit",
    icon: Lock, group: "Sistema", iconBg: "bg-zinc-500/15", iconText: "text-zinc-400",
    status: "soon", kpi: { label: "Eventos", value: 0 } },

  // ── Analytics ──
  { id: "analytics", title: "Analytics Global", description: "Revenue, growth, conversiones", href: "/admin/analytics",
    icon: BarChart3, group: "Analytics", iconBg: "bg-blue-500/15", iconText: "text-blue-400",
    status: "beta", kpi: { label: "Visitas 7d", value: "—" } },
  { id: "reports", title: "Reportes", description: "Exports CSV/PDF, financieros", href: "/admin/reports",
    icon: FileText, group: "Analytics", iconBg: "bg-emerald-500/15", iconText: "text-emerald-400",
    status: "soon", kpi: { label: "Plantillas", value: 0 } },
];

export const MODULE_GROUPS = ["Contenido", "Comercio", "Usuarios", "Sistema", "Analytics"] as const;

export function modulesByGroup() {
  const out: Record<string, AdminModule[]> = {};
  for (const g of MODULE_GROUPS) out[g] = [];
  for (const m of ADMIN_MODULES) out[m.group].push(m);
  return out;
}
