"use client";
import { usePathname, useRouter } from "next/navigation";
import { Search, Bell, ChevronRight, Plus, FileText, LogOut, Crown, Settings, LayoutDashboard } from "lucide-react";
import { useState, useRef, useEffect } from "react";
import { useAuth } from "@/lib/auth-context";
import { getCategoryBySlug } from "@/lib/categories";
import { ThemeToggle } from "@/components/ThemeToggle";

function getBreadcrumb(pathname: string) {
  const staticMap: Record<string, { title: string; crumbs: string[] }> = {
    "/dashboard":             { title: "Dashboard",             crumbs: ["Inicio"] },
    "/analytics":             { title: "Analíticas",            crumbs: ["Inicio", "Analíticas"] },
    "/clients":               { title: "Clientes",              crumbs: ["Inicio", "Clientes"] },
    "/affiliate":             { title: "Programa de Afiliados", crumbs: ["Inicio", "Afiliados"] },
    "/billing/invoices":      { title: "Facturación",           crumbs: ["Inicio", "Facturación"] },
    "/billing/subscription":  { title: "Suscripción",           crumbs: ["Inicio", "Facturación", "Suscripción"] },
    "/products":              { title: "Tienda",                crumbs: ["Inicio", "Tienda"] },
    "/automations":           { title: "Automatizaciones",      crumbs: ["Inicio", "Automatizaciones"] },
    "/marketplace":           { title: "Marketplace",           crumbs: ["Inicio", "Marketplace"] },
    "/licenses":              { title: "Licencias",             crumbs: ["Inicio", "Licencias"] },
    "/notifications":         { title: "Notificaciones",        crumbs: ["Inicio", "Notificaciones"] },
    "/settings":              { title: "Ajustes",               crumbs: ["Inicio", "Ajustes"] },
    "/settings/security":     { title: "Seguridad",             crumbs: ["Inicio", "Ajustes", "Seguridad"] },
    "/admin/categories":      { title: "Gestión de Categorías", crumbs: ["Inicio", "SuperAdmin", "Categorías"] },
  };

  if (staticMap[pathname]) return staticMap[pathname];

  // Dynamic category pages
  const catMatch = pathname.match(/^\/categories\/([^/]+)/);
  if (catMatch) {
    const cat = getCategoryBySlug(catMatch[1]);
    if (cat) return { title: cat.title, crumbs: ["Inicio", "Herramientas AI", cat.title] };
  }

  return { title: "Panel", crumbs: ["Inicio"] };
}

const pageActions: Record<string, { label: string; icon: "plus" | "doc" }[]> = {
  "/affiliate":        [{ label: "Documentación", icon: "doc" }, { label: "Nuevo Afiliado", icon: "plus" }],
  "/clients":          [{ label: "Nuevo Cliente",  icon: "plus" }],
  "/billing/invoices": [{ label: "Nueva Factura",  icon: "plus" }],
  "/admin/categories": [{ label: "Nueva Categoría",icon: "plus" }],
  "/products":         [{ label: "Nuevo Producto", icon: "plus" }],
};

export function Header() {
  const pathname = usePathname();
  const router   = useRouter();
  const { user, logout } = useAuth();

  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const { title, crumbs } = getBreadcrumb(pathname);
  const actions = pageActions[pathname] ?? [];

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) setMenuOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const handleLogout = () => { logout(); router.push("/login"); };
  const initials = user?.name.split(" ").map(n => n[0]).join("").toUpperCase().slice(0,2) ?? "SM";

  return (
    <header className="sticky top-0 w-full h-16 bg-[#0c0e14]/95 backdrop-blur-md border-b border-white/8 flex items-center px-5 gap-3 z-30 flex-shrink-0">

      {/* Title + breadcrumb */}
      <div className="flex-1 min-w-0">
        <h1 className="text-white font-bold text-[15px] leading-none truncate">{title}</h1>
        <div className="flex items-center gap-1 mt-0.5">
          {crumbs.map((c, i) => (
            <span key={i} className="flex items-center gap-1">
              {i > 0 && <ChevronRight className="w-2.5 h-2.5 text-white/20" />}
              <span className={`text-[11px] ${i === crumbs.length - 1 ? "text-white/35" : "text-white/20"}`}>{c}</span>
            </span>
          ))}
        </div>
      </div>

      {/* Search */}
      <div className="relative w-48 hidden sm:block">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-white/25" />
        <input
          placeholder="Buscar..."
          className="w-full bg-white/5 border border-white/10 rounded-xl pl-8 pr-3 py-2 text-xs text-white placeholder:text-white/25 focus:outline-none focus:border-orange-500/40 transition-all"
        />
      </div>

      {/* Action buttons */}
      {actions.map((a, i) => (
        <button key={i} className={cn(
          "hidden md:flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold transition-all whitespace-nowrap",
          i === actions.length - 1
            ? "bg-orange-500 hover:bg-orange-400 text-white shadow-lg shadow-orange-500/20"
            : "bg-white/5 border border-white/10 hover:bg-white/10 text-white/60"
        )}>
          {a.icon === "plus" ? <Plus className="w-3.5 h-3.5" /> : <FileText className="w-3.5 h-3.5" />}
          {a.label}
        </button>
      ))}

      {/* Theme toggle */}
      <ThemeToggle compact />

      {/* Bell */}
      <button className="relative w-9 h-9 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center hover:bg-white/10 transition-colors flex-shrink-0">
        <Bell className="w-4 h-4 text-white/50" />
        <span className="absolute -top-1 -right-1 bg-orange-500 text-white text-[9px] font-bold rounded-full min-w-[16px] h-[16px] flex items-center justify-center px-0.5">12</span>
      </button>

      {/* User dropdown */}
      <div className="relative flex-shrink-0" ref={menuRef}>
        <button onClick={() => setMenuOpen(!menuOpen)}
          className="flex items-center gap-2.5 pl-3 border-l border-white/10 hover:opacity-80 transition-opacity"
        >
          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-orange-400 to-purple-600 flex items-center justify-center text-xs font-bold text-white flex-shrink-0 ring-2 ring-orange-500/30">
            {initials}
          </div>
          <div className="text-left hidden md:block">
            <div className="text-white text-xs font-semibold leading-none">{user?.name ?? "Solfa Mendez"}</div>
            <div className="flex items-center gap-1 mt-0.5">
              <Crown className="w-2.5 h-2.5 text-orange-400" />
              <span className="text-orange-400 text-[10px] font-medium">{user?.plan ?? "Enterprise"}</span>
            </div>
          </div>
        </button>

        {menuOpen && (
          <div className="absolute right-0 top-full mt-2 w-64 bg-[#0f1219] border border-white/10 rounded-2xl shadow-2xl shadow-black/60 overflow-hidden z-50 animate-in fade-in slide-in-from-top-2 duration-150">
            <div className="px-4 py-4 border-b border-white/8 bg-gradient-to-br from-orange-500/5 to-purple-500/5">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-orange-400 to-purple-600 flex items-center justify-center text-sm font-bold text-white ring-2 ring-orange-500/30">
                  {initials}
                </div>
                <div className="min-w-0">
                  <p className="text-white font-semibold text-sm truncate">{user?.name ?? "Solfa Mendez"}</p>
                  <p className="text-white/40 text-[11px] truncate">{user?.email ?? "solfamendez41@gmail.com"}</p>
                  <div className="flex items-center gap-1 mt-1">
                    <span className="bg-orange-500/20 text-orange-400 text-[9px] font-bold px-1.5 py-0.5 rounded-full border border-orange-500/20">SUPERADMIN</span>
                    <span className="bg-purple-500/20 text-purple-400 text-[9px] font-bold px-1.5 py-0.5 rounded-full border border-purple-500/20">{user?.plan ?? "Enterprise"}</span>
                  </div>
                </div>
              </div>
            </div>
            <div className="p-2">
              {[
                { label: "Dashboard",    icon: LayoutDashboard, href: "/dashboard" },
                { label: "Mi Perfil",    icon: Crown,            href: "/settings" },
                { label: "SuperAdmin",   icon: Settings,         href: "/admin/categories" },
              ].map((item) => {
                const Icon = item.icon;
                return (
                  <button key={item.label} onClick={() => { setMenuOpen(false); router.push(item.href); }}
                    className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-white/55 hover:text-white hover:bg-white/5 transition-all text-sm"
                  >
                    <Icon className="w-4 h-4" />
                    {item.label}
                  </button>
                );
              })}
            </div>
            <div className="p-2 border-t border-white/8">
              <button onClick={handleLogout}
                className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-red-400 hover:text-red-300 hover:bg-red-500/10 transition-all text-sm"
              >
                <LogOut className="w-4 h-4" />
                Cerrar sesión
              </button>
            </div>
          </div>
        )}
      </div>
    </header>
  );
}

// tiny cn helper so no extra import needed in this file
function cn(...cls: (string | boolean | undefined)[]) {
  return cls.filter(Boolean).join(" ");
}
