"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { cn } from "@/lib/utils";
import { CATEGORIES } from "@/lib/categories";
import {
  LayoutDashboard, BarChart2, Users, UserCheck, Receipt,
  ShoppingBag, Zap, Scale, Bell, Settings, ChevronLeft,
  ChevronRight, Globe, MessageSquare, Star, Shield,
  Video, Film, Mic, Image, BookOpen, Layout, ChevronDown, GalleryHorizontal,
  Bot, Filter, Mail, CalendarClock, Briefcase, Sparkles, Palette, Radio, Layers, Package
} from "lucide-react";

const mainNav = [
  { label: "Dashboard",      href: "/dashboard",          icon: LayoutDashboard, iconBg: "bg-orange-500/20",  iconColor: "text-orange-400" },
  { label: "Analíticas",     href: "/analytics",          icon: BarChart2,       iconBg: "bg-blue-500/20",    iconColor: "text-blue-400" },
  { label: "Clientes",       href: "/clients",            icon: Users,           iconBg: "bg-cyan-500/20",    iconColor: "text-cyan-400" },
  { label: "Afiliados",      href: "/affiliate",          icon: UserCheck,       iconBg: "bg-purple-500/20",  iconColor: "text-purple-400" },
  { label: "Facturación",    href: "/billing/invoices",   icon: Receipt,         iconBg: "bg-green-500/20",   iconColor: "text-green-400" },
  { label: "Licencias",      href: "/licenses",           icon: Scale,           iconBg: "bg-indigo-500/20",  iconColor: "text-indigo-400" },
  { label: "Notificaciones", href: "/notifications",      icon: Bell,            iconBg: "bg-red-500/20",     iconColor: "text-red-400",   badge: 12 },
  { label: "Ajustes",        href: "/settings",           icon: Settings,        iconBg: "bg-slate-500/20",   iconColor: "text-slate-400" },
];

const categoryIconMap: Record<string, React.ElementType> = {
  "generador-video":  Video,
  "editor-video":     Film,
  "automatizaciones": Zap,
  "generador-voz":    Mic,
  "generador-imagen": Image,
  "cursos-prompt":    BookOpen,
  "venta-cursos":     ShoppingBag,
  "venta-paginas":    Layout,
  "afiliados":        UserCheck,
  "marca-blanca":     Globe,
};

export function Sidebar() {
  const pathname  = usePathname();
  const [collapsed, setCollapsed]     = useState(false);
  const [aiExpanded, setAiExpanded]   = useState(true);

  const sidebarWidth = collapsed ? "w-[68px]" : "w-[230px]";

  return (
    <>
      {/* Sidebar — hidden on mobile (use bottom nav + drawer hamburger instead) */}
      <aside className={cn(
        "hidden md:flex sticky top-0 h-screen bg-[#0c0e14] border-r border-white/8 flex-col z-40 transition-all duration-300 overflow-hidden flex-shrink-0",
        sidebarWidth
      )}>

        {/* Logo */}
        <div className={cn(
          "flex items-center gap-3 border-b border-white/8 h-16 flex-shrink-0 transition-all",
          collapsed ? "px-4 justify-center" : "px-4"
        )}>
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-orange-400 to-orange-600 flex items-center justify-center font-black text-white text-xs flex-shrink-0 shadow-lg shadow-orange-500/30">
            M
          </div>
          {!collapsed && (
            <div className="min-w-0">
              <div className="text-white font-bold text-sm leading-none tracking-wide">MEDIAPLAY</div>
              <div className="text-orange-400 text-[9px] font-semibold tracking-[0.2em] leading-none mt-0.5">PROMO.COM</div>
            </div>
          )}
        </div>

        {/* Scrollable nav */}
        <nav className="flex-1 overflow-y-auto py-3 px-2 space-y-0.5 scrollbar-hide">

          {/* ── Main ── */}
          {!collapsed && (
            <p className="text-white/25 text-[9px] font-bold uppercase tracking-[0.15em] px-2 py-1.5 mt-1">Principal</p>
          )}
          {mainNav.map((item) => {
            const Icon  = item.icon;
            const active = pathname === item.href || (item.href !== "/dashboard" && pathname.startsWith(item.href));
            return (
              <Link
                key={item.href}
                href={item.href}
                title={collapsed ? item.label : undefined}
                className={cn(
                  "flex items-center gap-3 rounded-xl transition-all duration-150 group relative",
                  collapsed ? "px-2 py-2 justify-center" : "px-2.5 py-2",
                  active ? "bg-white/8 text-white" : "text-white/45 hover:text-white/80 hover:bg-white/5"
                )}
              >
                <div className={cn(
                  "w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0 transition-all",
                  item.iconBg, item.iconColor,
                  active && "ring-1 ring-white/20"
                )}>
                  <Icon className="w-3.5 h-3.5" />
                </div>
                {!collapsed && <span className="text-[13px] font-medium truncate">{item.label}</span>}
                {!collapsed && item.badge && (
                  <span className="ml-auto bg-red-500 text-white text-[9px] font-bold rounded-full min-w-[16px] h-4 flex items-center justify-center px-1">
                    {item.badge}
                  </span>
                )}
                {collapsed && item.badge && (
                  <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full border-2 border-[#0c0e14]" />
                )}
              </Link>
            );
          })}

          {/* ── AI Tools ── */}
          <div className="mt-3">
            {!collapsed ? (
              <button
                onClick={() => setAiExpanded(!aiExpanded)}
                className="w-full flex items-center justify-between px-2 py-1.5 text-white/25 hover:text-white/50 transition-colors"
              >
                <span className="text-[9px] font-bold uppercase tracking-[0.15em]">Herramientas AI</span>
                <ChevronDown className={cn("w-3 h-3 transition-transform duration-200", aiExpanded ? "rotate-0" : "-rotate-90")} />
              </button>
            ) : (
              <div className="border-t border-white/8 my-2" />
            )}

            {(aiExpanded || collapsed) && CATEGORIES.filter(c => c.showSidebar && c.enabled).map((cat) => {
              const Icon   = cat.icon;
              const href   = `/categories/${cat.slug}`;
              const active = pathname === href || pathname.startsWith(href);
              return (
                <Link
                  key={cat.slug}
                  href={href}
                  title={collapsed ? cat.title : undefined}
                  className={cn(
                    "flex items-center gap-3 rounded-xl transition-all duration-150 group relative",
                    collapsed ? "px-2 py-2 justify-center" : "px-2.5 py-2",
                    active
                      ? "bg-gradient-to-r " + cat.bgCard + " text-white border border-white/10"
                      : "text-white/40 hover:text-white/75 hover:bg-white/5"
                  )}
                >
                  <div className={cn(
                    "w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0 bg-gradient-to-br transition-all",
                    cat.gradient,
                    "opacity-80",
                    active && "opacity-100 shadow-md"
                  )}>
                    <Icon className="w-3.5 h-3.5 text-white" />
                  </div>
                  {!collapsed && (
                    <div className="min-w-0 flex-1">
                      <span className="text-[12px] font-medium truncate block">{cat.title}</span>
                    </div>
                  )}
                  {!collapsed && cat.premium && (
                    <span className="ml-auto text-[8px] font-bold bg-gradient-to-r from-yellow-400 to-orange-500 bg-clip-text text-transparent border border-yellow-500/30 rounded-full px-1.5 py-0.5 flex-shrink-0">
                      PRO
                    </span>
                  )}
                </Link>
              );
            })}
          </div>

          {/* ── Admin (SuperAdmin only) ── */}
          <div className="mt-3">
            {!collapsed && (
              <div className="px-2 py-1.5 flex items-center justify-between">
                <p className="text-white/25 text-[9px] font-bold uppercase tracking-[0.15em]">SuperAdmin</p>
                <Link href="/admin" className="text-[9px] text-fuchsia-400 hover:text-fuchsia-300 font-bold uppercase tracking-wider">Hub</Link>
              </div>
            )}
            {[
              { label: "Control Hub",        href: "/admin",            icon: Star,    iconBg: "bg-fuchsia-500/20", iconColor: "text-fuchsia-400" },
              { label: "Batch Generator",    href: "/admin/batch",      icon: Layers,  iconBg: "bg-fuchsia-500/20", iconColor: "text-fuchsia-300" },
              { label: "Productos",          href: "/admin/products",   icon: Package, iconBg: "bg-violet-500/20", iconColor: "text-violet-400" },
              { label: "Categorías",         href: "/admin/categories", icon: Settings, iconBg: "bg-orange-500/20", iconColor: "text-orange-400" },
              { label: "Banners",            href: "/admin/banners",    icon: GalleryHorizontal, iconBg: "bg-cyan-500/20", iconColor: "text-cyan-400" },
              { label: "Usuarios",           href: "/admin/users",      icon: Users,    iconBg: "bg-blue-500/20",   iconColor: "text-blue-400" },
              { label: "Afiliados",          href: "/admin/affiliates", icon: UserCheck, iconBg: "bg-green-500/20", iconColor: "text-green-400" },
              { label: "White Label",        href: "/admin/whitelabel", icon: Globe,    iconBg: "bg-purple-500/20", iconColor: "text-purple-400" },
              { label: "Pagos",              href: "/admin/payments",   icon: Receipt,  iconBg: "bg-emerald-500/20", iconColor: "text-emerald-400" },
              { label: "Analytics",          href: "/admin/analytics",  icon: BarChart2, iconBg: "bg-indigo-500/20", iconColor: "text-indigo-400" },
              { label: "Seguridad",          href: "/settings/security", icon: Shield,  iconBg: "bg-red-500/20",    iconColor: "text-red-400" },
            ].map((item) => {
              const Icon = item.icon;
              const active = pathname.startsWith(item.href);
              return (
                <Link key={item.href} href={item.href} title={collapsed ? item.label : undefined}
                  className={cn(
                    "flex items-center gap-3 rounded-xl transition-all duration-150",
                    collapsed ? "px-2 py-2 justify-center" : "px-2.5 py-2",
                    active ? "bg-white/8 text-white" : "text-white/40 hover:text-white/75 hover:bg-white/5"
                  )}
                >
                  <div className={cn("w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0", item.iconBg, item.iconColor)}>
                    <Icon className="w-3.5 h-3.5" />
                  </div>
                  {!collapsed && <span className="text-[13px] font-medium truncate">{item.label}</span>}
                </Link>
              );
            })}
          </div>
        </nav>

        {/* Collapse toggle */}
        <div className="p-2 border-t border-white/8 flex-shrink-0">
          <button
            onClick={() => setCollapsed(!collapsed)}
            className={cn(
              "flex items-center gap-2.5 w-full rounded-xl py-2.5 text-white/30 hover:text-white/60 hover:bg-white/5 transition-all text-[13px]",
              collapsed ? "justify-center px-2" : "px-3"
            )}
          >
            {collapsed
              ? <ChevronRight className="w-4 h-4 flex-shrink-0" />
              : <><ChevronLeft className="w-4 h-4 flex-shrink-0" /><span className="font-medium">Colapsar</span></>
            }
          </button>
        </div>
      </aside>

    </>
  );
}
