"use client";
import Link from "next/link";
import { Crown, ArrowRight, Activity, TrendingUp, Users, DollarSign } from "lucide-react";
import { ADMIN_MODULES, MODULE_GROUPS, modulesByGroup } from "@/lib/admin-modules";
import { useAuth } from "@/lib/auth-context";
import { KPIGrid } from "@/components/admin/AdminShell";

export default function SuperAdminHub() {
  const { user } = useAuth();
  const grouped = modulesByGroup();

  if (user && user.role !== "superadmin") {
    return (
      <div className="bg-red-500/10 border border-red-500/20 rounded-2xl p-8 text-center max-w-md mx-auto">
        <p className="text-red-400 font-bold">Acceso restringido a SuperAdmin.</p>
      </div>
    );
  }

  const totalModules = ADMIN_MODULES.length;
  const liveModules = ADMIN_MODULES.filter((m) => m.status === "live").length;
  const betaModules = ADMIN_MODULES.filter((m) => m.status === "beta").length;
  const soonModules = ADMIN_MODULES.filter((m) => m.status === "soon").length;

  return (
    <div className="space-y-7 pb-10">
      {/* Hero */}
      <div className="glass-card relative overflow-hidden rounded-3xl border border-fuchsia-500/30 p-7 sm:p-9">
        <div className="absolute -top-24 -right-24 w-96 h-96 bg-gradient-to-br from-fuchsia-500 to-purple-600 opacity-20 rounded-full blur-3xl pointer-events-none float-slow" />
        <div className="absolute -bottom-24 -left-24 w-72 h-72 bg-gradient-to-br from-cyan-500 to-blue-600 opacity-15 rounded-full blur-3xl pointer-events-none float-soft" />
        <div className="particles-bg" />

        <div className="relative">
          <div className="inline-flex items-center gap-2 bg-gradient-to-r from-fuchsia-500/15 to-purple-500/15 border border-fuchsia-500/30 rounded-full px-3 py-1 text-[10px] font-black uppercase tracking-[0.2em] text-fuchsia-300 mb-4">
            <Crown className="w-3 h-3" />
            SUPERADMIN CONTROL HUB
          </div>
          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-black text-white leading-tight mb-3">
            Control total de{" "}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-fuchsia-400 to-purple-400">MediaPlayPromo</span>
          </h1>
          <p className="text-white/55 text-sm sm:text-base max-w-2xl">
            Dashboard centralizado de toda la plataforma. {totalModules} módulos conectados — categorías, banners, marketplace, afiliados, white-label, pagos, AI tools, usuarios y más.
          </p>
        </div>
      </div>

      {/* KPI Strip */}
      <KPIGrid
        kpis={[
          { label: "Módulos Totales", value: totalModules, sublabel: "Sistema modular", gradient: "from-cyan-500 to-blue-600" },
          { label: "En Producción", value: liveModules, sublabel: "Funcionando", gradient: "from-green-500 to-emerald-600" },
          { label: "En Beta", value: betaModules, sublabel: "UI lista", gradient: "from-yellow-500 to-orange-500" },
          { label: "En Desarrollo", value: soonModules, sublabel: "Roadmap", gradient: "from-fuchsia-500 to-purple-600" },
        ]}
      />

      {/* Revenue KPIs (mock, ready for backend) */}
      <div>
        <h2 className="text-white/85 font-bold text-base mb-3 flex items-center gap-2">
          <TrendingUp className="w-4 h-4 text-green-400" /> Métricas Globales
        </h2>
        <KPIGrid
          kpis={[
            { label: "MRR Total", value: "$0", sublabel: "Conecta Stripe", gradient: "from-green-500 to-emerald-600" },
            { label: "Usuarios", value: 1, sublabel: "SuperAdmin", gradient: "from-cyan-500 to-blue-600" },
            { label: "Tenants White-Label", value: 0, sublabel: "Activa el módulo", gradient: "from-fuchsia-500 to-purple-600" },
            { label: "Comisiones Pendientes", value: "$0", sublabel: "Afiliados", gradient: "from-amber-500 to-orange-500" },
          ]}
        />
      </div>

      {/* Modules grouped */}
      {MODULE_GROUPS.map((group) => {
        const items = grouped[group];
        if (!items || items.length === 0) return null;
        return (
          <section key={group}>
            <div className="flex items-end justify-between mb-3">
              <h2 className="text-white/85 font-bold text-base">{group}</h2>
              <p className="text-white/35 text-xs">{items.length} módulos</p>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
              {items.map((m) => {
                const Icon = m.icon;
                const statusBadge =
                  m.status === "live" ? { bg: "bg-green-500/15", text: "text-green-400", border: "border-green-500/25", label: "LIVE" }
                  : m.status === "beta" ? { bg: "bg-yellow-500/15", text: "text-yellow-400", border: "border-yellow-500/25", label: "BETA" }
                  : { bg: "bg-white/8", text: "text-white/40", border: "border-white/15", label: "SOON" };
                return (
                  <Link
                    key={m.id}
                    href={m.href}
                    className="glass-card hover-lift group relative overflow-hidden rounded-2xl border border-white/10 p-5 block"
                  >
                    <div className="flex items-start justify-between mb-4">
                      <div className={`icon-ring w-11 h-11 rounded-xl ${m.iconBg} flex items-center justify-center ring-1 ring-white/10 group-hover:scale-105 transition-transform`}>
                        <Icon className={`w-5 h-5 ${m.iconText}`} />
                      </div>
                      <span className={`text-[9px] font-black px-1.5 py-0.5 rounded-full ${statusBadge.bg} ${statusBadge.text} border ${statusBadge.border}`}>
                        {statusBadge.label}
                      </span>
                    </div>
                    <h3 className="text-white font-bold text-sm mb-1 leading-tight">{m.title}</h3>
                    <p className="text-white/45 text-xs leading-snug line-clamp-2">{m.description}</p>
                    {m.kpi && (
                      <div className="mt-3 flex items-center justify-between pt-3 border-t border-white/8">
                        <span className="text-white/35 text-[10px] uppercase tracking-wider">{m.kpi.label}</span>
                        <span className="text-white font-bold text-sm">{m.kpi.value}</span>
                      </div>
                    )}
                    <div className="absolute bottom-3 right-3 opacity-0 group-hover:opacity-100 transition-opacity">
                      <ArrowRight className="w-4 h-4 text-white/40" />
                    </div>
                  </Link>
                );
              })}
            </div>
          </section>
        );
      })}

      {/* Quick actions footer */}
      <div className="glass-card rounded-2xl border border-white/10 p-6">
        <h3 className="text-white font-bold text-base mb-3 flex items-center gap-2">
          <Activity className="w-4 h-4 text-cyan-400" /> Acceso Rápido
        </h3>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
          {[
            { label: "+ Nueva Categoría", href: "/admin/categories" },
            { label: "+ Nuevo Banner", href: "/admin/banners" },
            { label: "Ver homepage", href: "/" },
            { label: "Logout", href: "/login" },
          ].map((a) => (
            <Link key={a.label} href={a.href} className="bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl px-3 py-2 text-xs text-white/75 hover:text-white text-center font-semibold transition-colors">
              {a.label}
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
