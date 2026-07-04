"use client";
import Link from "next/link";
import { useState } from "react";
import {
  Crown, ArrowRight, TrendingUp, TrendingDown, Users, DollarSign,
  Activity, Sparkles, Globe, ShieldCheck, Eye, X, ArrowUpRight,
  CheckCircle2, AlertCircle, Server, Wallet, Search, Filter, Download, MoreVertical, Clapperboard
} from "lucide-react";
import {
  AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid
} from "recharts";
import { ADMIN_MODULES, MODULE_GROUPS, modulesByGroup } from "@/lib/admin-modules";
import { useAuth } from "@/lib/auth-context";

// ── Executive KPIs ───────────────────────────────────────────
const kpis = [
  { label: "MRR Global",          value: "€24,580", change: "+22.4%", up: true,  icon: DollarSign, iconBg: "bg-green-500/15",  iconText: "text-green-400",  gradient: "from-green-500 to-emerald-600" },
  { label: "Usuarios Totales",    value: "1,847",   change: "+18.2%", up: true,  icon: Users,      iconBg: "bg-cyan-500/15",   iconText: "text-cyan-400",   gradient: "from-cyan-500 to-blue-600" },
  { label: "Tenants Activos",     value: "34",      change: "+25.0%", up: true,  icon: Globe,      iconBg: "bg-fuchsia-500/15",iconText: "text-fuchsia-400",gradient: "from-fuchsia-500 to-purple-600" },
  { label: "AI Credits Usados",   value: "182K",    change: "+34.7%", up: true,  icon: Sparkles,   iconBg: "bg-violet-500/15", iconText: "text-violet-400", gradient: "from-violet-500 to-purple-600" },
  { label: "Payouts Pendientes",  value: "€3,420",  change: "-8.1%",  up: false, icon: Wallet,     iconBg: "bg-orange-500/15", iconText: "text-orange-400", gradient: "from-orange-500 to-red-500" },
];

// ── Revenue Trend ────────────────────────────────────────────
const revenueData = [
  { name: "Ene", mrr: 12400, tenants: 18 },
  { name: "Feb", mrr: 14200, tenants: 21 },
  { name: "Mar", mrr: 16100, tenants: 24 },
  { name: "Abr", mrr: 18900, tenants: 27 },
  { name: "May", mrr: 21400, tenants: 30 },
  { name: "Jun", mrr: 23100, tenants: 32 },
  { name: "Jul", mrr: 24580, tenants: 34 },
];

// ── Module Usage Distribution ────────────────────────────────
const moduleUsage = [
  { name: "Generador Video", value: 28, color: "#ec4899" },
  { name: "Editor Video",    value: 22, color: "#a855f7" },
  { name: "Automatizaciones",value: 18, color: "#f59e0b" },
  { name: "Generador Voz",   value: 14, color: "#06b6d4" },
  { name: "Otros",           value: 18, color: "#10b981" },
];

// ── Top Tenants ──────────────────────────────────────────────
const topTenants = [
  { name: "Agencia Pixel", mrr: 4200 },
  { name: "CreatorHub",    mrr: 3800 },
  { name: "MarketingPro",  mrr: 3100 },
  { name: "VideoForge",    mrr: 2600 },
  { name: "AdsLab",        mrr: 2200 },
];

// ── Audit Log entries ────────────────────────────────────────
const auditEntries = [
  { id: 1, actor: "Solfa Mendez",    action: "Aprobó payout",          target: "Juan Pérez €312.80",      time: "hace 2 min",  type: "payout",   icon: Wallet,      color: "text-green-400",  bg: "bg-green-500/10" },
  { id: 2, actor: "Solfa Mendez",    action: "Creó categoría",         target: "AI Chatbots",             time: "hace 18 min", type: "category", icon: Sparkles,    color: "text-cyan-400",   bg: "bg-cyan-500/10" },
  { id: 3, actor: "Sistema",         action: "Tenant onboarded",       target: "agencia-pixel.com",       time: "hace 1 h",    type: "tenant",   icon: Globe,       color: "text-fuchsia-400",bg: "bg-fuchsia-500/10" },
  { id: 4, actor: "Solfa Mendez",    action: "Editó banner",           target: "Marca Blanca SaaS",       time: "hace 2 h",    type: "banner",   icon: Eye,         color: "text-violet-400", bg: "bg-violet-500/10" },
  { id: 5, actor: "Stripe Webhook",  action: "Pago confirmado",        target: "Plan Pro · €99",          time: "hace 3 h",    type: "payment",  icon: DollarSign,  color: "text-green-400",  bg: "bg-green-500/10" },
  { id: 6, actor: "Solfa Mendez",    action: "Suspendió afiliado",     target: "fakeuser@spam.com",       time: "hace 5 h",    type: "user",     icon: AlertCircle, color: "text-red-400",    bg: "bg-red-500/10" },
  { id: 7, actor: "Sistema",         action: "Backup automático",      target: "DB snapshot · 2.4 GB",    time: "hace 12 h",   type: "system",   icon: ShieldCheck, color: "text-blue-400",   bg: "bg-blue-500/10" },
];

export default function SuperAdminHub() {
  const { user } = useAuth();
  const grouped = modulesByGroup();
  const [selectedEntry, setSelectedEntry] = useState<number | null>(1);
  const [search, setSearch] = useState("");

  if (user && user.role !== "superadmin" && user.role !== "admin") {
    return (
      <div className="bg-red-500/10 border border-red-500/20 rounded-2xl p-8 text-center max-w-md mx-auto">
        <p className="text-red-400 font-bold">Acceso restringido.</p>
      </div>
    );
  }

  // Los admins ven todo el panel MENOS la pasarela de pago.
  const isSuper = !user || user.role === "superadmin";

  const filtered = auditEntries.filter((e) =>
    !search || e.actor.toLowerCase().includes(search.toLowerCase()) || e.action.toLowerCase().includes(search.toLowerCase())
  );
  const sel = auditEntries.find((e) => e.id === selectedEntry);

  const totalModules = ADMIN_MODULES.length;
  const liveModules  = ADMIN_MODULES.filter((m) => m.status === "live").length;
  const betaModules  = ADMIN_MODULES.filter((m) => m.status === "beta").length;
  const soonModules  = ADMIN_MODULES.filter((m) => m.status === "soon").length;

  return (
    <div className="space-y-5 -mt-3 sm:-mt-4 lg:-mt-6">
      {/* ── Hero ── */}
      <div className="glass-card relative overflow-hidden rounded-3xl border border-fuchsia-500/30 p-5 sm:p-7">
        <div className="absolute -top-24 -right-24 w-80 h-80 bg-gradient-to-br from-fuchsia-500 to-purple-600 opacity-20 rounded-full blur-3xl pointer-events-none float-slow" />
        <div className="absolute -bottom-24 -left-24 w-72 h-72 bg-gradient-to-br from-cyan-500 to-blue-600 opacity-15 rounded-full blur-3xl pointer-events-none float-soft" />
        <div className="particles-bg" />
        <div className="relative flex items-center justify-between flex-wrap gap-4">
          <div>
            <div className="inline-flex items-center gap-2 bg-gradient-to-r from-fuchsia-500/15 to-purple-500/15 border border-fuchsia-500/30 rounded-full px-2.5 py-1 text-[9px] sm:text-[10px] font-black uppercase tracking-[0.2em] text-fuchsia-300 mb-3">
              <Crown className="w-3 h-3" /> SUPERADMIN CONTROL HUB
            </div>
            <h1 className="text-2xl sm:text-3xl lg:text-4xl font-black text-white leading-tight">
              Control total de{" "}
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-fuchsia-400 to-purple-400">MediaPlayPromo</span>
            </h1>
            <p className="text-white/55 text-xs sm:text-sm mt-1">
              {totalModules} módulos · {liveModules} en producción · MRR €{kpis[0].value.replace("€", "")}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Link href="/admin/analytics" className="hidden sm:inline-flex items-center gap-1.5 bg-white/5 border border-white/10 hover:bg-white/10 text-white text-xs font-semibold px-3 py-2 rounded-xl transition-colors">
              <ArrowUpRight className="w-3.5 h-3.5" /> Analytics
            </Link>
            <Link href="/admin/users" className="inline-flex items-center gap-1.5 bg-gradient-to-r from-fuchsia-500 to-purple-600 text-white text-xs font-bold px-3 py-2 rounded-xl shadow-lg shadow-fuchsia-500/30 transition-all hover:-translate-y-0.5">
              <Users className="w-3.5 h-3.5" /> Usuarios
            </Link>
          </div>
        </div>
      </div>

      {/* ── ★ Featured: Mega Editor de Video IA ── */}
      <Link href="/editor" className="glass-card relative overflow-hidden rounded-3xl border border-violet-500/30 p-5 sm:p-6 flex items-center gap-4 group">
        <div className="absolute -top-16 -right-10 w-72 h-72 bg-gradient-to-br from-violet-500 to-fuchsia-600 opacity-20 rounded-full blur-3xl pointer-events-none" />
        <div className="relative w-14 h-14 rounded-2xl bg-gradient-to-br from-violet-500 to-fuchsia-600 flex items-center justify-center shadow-lg shadow-violet-500/40 flex-shrink-0">
          <Clapperboard className="w-7 h-7 text-white" />
        </div>
        <div className="relative flex-1 min-w-0">
          <span className="inline-flex items-center gap-1.5 bg-white/10 border border-white/15 rounded-full px-2 py-0.5 text-[9px] font-black uppercase tracking-wider text-violet-200 mb-1">NUEVO · IA</span>
          <h2 className="text-white font-black text-lg sm:text-xl leading-tight">Mega Editor de Video IA</h2>
          <p className="text-white/55 text-xs sm:text-sm">Prompt → guión, clips reales, transiciones, voz y montaje. Crea videos largos automáticamente.</p>
        </div>
        <div className="relative inline-flex items-center gap-1.5 bg-gradient-to-r from-violet-500 to-fuchsia-600 text-white text-xs font-bold px-4 py-2.5 rounded-xl shadow-lg shadow-violet-500/30 group-hover:-translate-y-0.5 transition-transform flex-shrink-0">
          Abrir <ArrowRight className="w-4 h-4" />
        </div>
      </Link>

      {/* ── KPI cards (5) ── */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">
        {kpis.map((k) => {
          const Icon = k.icon;
          return (
            <div key={k.label} className="glass-card hover-lift relative overflow-hidden rounded-2xl border border-white/10 p-4 sm:p-5">
              <div className={`absolute -top-6 -right-6 w-20 h-20 bg-gradient-to-br ${k.gradient} opacity-10 rounded-full blur-2xl pointer-events-none`} />
              <div className="relative flex items-start gap-3">
                <div className={`w-10 h-10 sm:w-11 sm:h-11 rounded-xl ${k.iconBg} flex items-center justify-center flex-shrink-0 ring-1 ring-white/5`}>
                  <Icon className={`w-5 h-5 ${k.iconText}`} />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-white/45 text-[10px] font-bold uppercase tracking-wider leading-tight truncate">{k.label}</p>
                  <p className="text-white font-black text-xl sm:text-2xl mt-0.5 leading-tight truncate">{k.value}</p>
                  <p className={`text-[10px] mt-1 flex items-center gap-1 font-semibold ${k.up ? "text-green-400" : "text-red-400"}`}>
                    {k.up ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
                    {k.change}
                    <span className="text-white/35 font-normal hidden sm:inline">vs mes pasado</span>
                  </p>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* ── Charts row ── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Revenue Area Chart */}
        <div className="glass-card lg:col-span-2 rounded-2xl border border-white/10 p-4 sm:p-5">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-white font-bold text-base">MRR Global y Tenants</h3>
              <p className="text-white/40 text-xs mt-0.5">Crecimiento últimos 7 meses</p>
            </div>
            <div className="flex items-center gap-3 text-xs">
              <span className="flex items-center gap-1.5 text-white/70"><span className="w-2 h-2 rounded-full bg-green-400" /> MRR €</span>
              <span className="flex items-center gap-1.5 text-white/70"><span className="w-2 h-2 rounded-full bg-fuchsia-400" /> Tenants</span>
            </div>
          </div>
          <div className="h-56 sm:h-64">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={revenueData} margin={{ top: 5, right: 5, left: -15, bottom: 0 }}>
                <defs>
                  <linearGradient id="gMRR" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%"   stopColor="#10b981" stopOpacity={0.6} />
                    <stop offset="100%" stopColor="#10b981" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="gTenants" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%"   stopColor="#ec4899" stopOpacity={0.6} />
                    <stop offset="100%" stopColor="#ec4899" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                <XAxis dataKey="name" stroke="rgba(255,255,255,0.35)" fontSize={11} tickLine={false} axisLine={false} />
                <YAxis yAxisId="left" stroke="rgba(255,255,255,0.35)" fontSize={11} tickLine={false} axisLine={false} />
                <YAxis yAxisId="right" orientation="right" stroke="rgba(255,255,255,0.35)" fontSize={11} tickLine={false} axisLine={false} />
                <Tooltip contentStyle={{ background: "#0f1219", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 12, fontSize: 12 }} />
                <Area yAxisId="left"  type="monotone" dataKey="mrr"     stroke="#10b981" strokeWidth={2} fill="url(#gMRR)" />
                <Area yAxisId="right" type="monotone" dataKey="tenants" stroke="#ec4899" strokeWidth={2} fill="url(#gTenants)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Donut Chart — Module Usage */}
        <div className="glass-card rounded-2xl border border-white/10 p-4 sm:p-5">
          <h3 className="text-white font-bold text-base mb-1">Uso por Módulo</h3>
          <p className="text-white/40 text-xs mb-4">Distribución 30d</p>
          <div className="h-40 sm:h-44">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={moduleUsage} dataKey="value" nameKey="name" innerRadius={45} outerRadius={70} paddingAngle={3}>
                  {moduleUsage.map((c, i) => <Cell key={i} fill={c.color} />)}
                </Pie>
                <Tooltip contentStyle={{ background: "#0f1219", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 12, fontSize: 12 }} />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="space-y-1.5 mt-3">
            {moduleUsage.map((c) => (
              <div key={c.name} className="flex items-center justify-between text-xs">
                <span className="flex items-center gap-2 text-white/70"><span className="w-2 h-2 rounded-full" style={{ background: c.color }} /> {c.name}</span>
                <span className="text-white font-bold">{c.value}%</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── Top Tenants Bar Chart ── */}
      <div className="glass-card rounded-2xl border border-white/10 p-4 sm:p-5">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-white font-bold text-base">Top Tenants White-Label por MRR</h3>
            <p className="text-white/40 text-xs mt-0.5">Mes en curso</p>
          </div>
          <Link href="/admin/whitelabel" className="text-fuchsia-400 hover:text-fuchsia-300 text-xs font-semibold flex items-center gap-1">
            Ver todos <ArrowUpRight className="w-3 h-3" />
          </Link>
        </div>
        <div className="h-48 sm:h-56">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={topTenants} margin={{ top: 5, right: 5, left: -15, bottom: 0 }}>
              <defs>
                <linearGradient id="gBarTenants" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%"   stopColor="#d946ef" stopOpacity={0.9} />
                  <stop offset="100%" stopColor="#a855f7" stopOpacity={0.7} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
              <XAxis dataKey="name" stroke="rgba(255,255,255,0.35)" fontSize={11} tickLine={false} axisLine={false} />
              <YAxis stroke="rgba(255,255,255,0.35)" fontSize={11} tickLine={false} axisLine={false} />
              <Tooltip contentStyle={{ background: "#0f1219", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 12, fontSize: 12 }} />
              <Bar dataKey="mrr" fill="url(#gBarTenants)" radius={[8, 8, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* ── Audit Log + Detail Panel ── */}
      <div className="grid grid-cols-1 xl:grid-cols-[1fr_360px] gap-4">
        <div className="glass-card rounded-2xl border border-white/10 overflow-hidden">
          <div className="p-4 sm:p-5 border-b border-white/8">
            <div className="flex items-center justify-between flex-wrap gap-3 mb-4">
              <h3 className="text-white font-bold text-base flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-fuchsia-400" /> Audit Log
              </h3>
              <div className="flex items-center gap-2">
                <button className="inline-flex items-center gap-1.5 bg-white/5 border border-white/10 hover:bg-white/10 text-white text-xs font-semibold px-3 py-1.5 rounded-lg transition-colors">
                  <Filter className="w-3.5 h-3.5" /> Tipo
                </button>
                <button className="inline-flex items-center gap-1.5 bg-white/5 border border-white/10 hover:bg-white/10 text-white text-xs font-semibold px-3 py-1.5 rounded-lg transition-colors">
                  <Download className="w-3.5 h-3.5" /> Exportar
                </button>
              </div>
            </div>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-white/30" />
              <input
                placeholder="Buscar evento o usuario..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full bg-white/5 border border-white/10 rounded-lg pl-9 pr-3 py-2 text-xs text-white placeholder:text-white/30 focus:outline-none focus:border-fuchsia-500/40 transition-colors"
              />
            </div>
          </div>

          {/* Desktop table */}
          <div className="hidden md:block overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-white/8 text-white/40 text-[10px] uppercase tracking-wider">
                  <th className="text-left px-5 py-3 font-bold">Tipo</th>
                  <th className="text-left px-5 py-3 font-bold">Actor</th>
                  <th className="text-left px-5 py-3 font-bold">Acción</th>
                  <th className="text-left px-5 py-3 font-bold">Target</th>
                  <th className="text-right px-5 py-3 font-bold">Cuando</th>
                  <th className="text-right px-5 py-3 font-bold"></th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((e) => {
                  const Icon = e.icon;
                  return (
                    <tr
                      key={e.id}
                      onClick={() => setSelectedEntry(e.id)}
                      className={`border-b border-white/5 hover:bg-white/3 cursor-pointer transition-colors ${selectedEntry === e.id ? "bg-white/3" : ""}`}
                    >
                      <td className="px-5 py-3.5">
                        <div className={`w-7 h-7 rounded-lg ${e.bg} flex items-center justify-center`}>
                          <Icon className={`w-3.5 h-3.5 ${e.color}`} />
                        </div>
                      </td>
                      <td className="px-5 py-3.5 text-white font-semibold text-[13px]">{e.actor}</td>
                      <td className="px-5 py-3.5 text-white/70 text-[13px]">{e.action}</td>
                      <td className="px-5 py-3.5 text-white/55 text-[13px] font-mono truncate max-w-[200px]">{e.target}</td>
                      <td className="px-5 py-3.5 text-right text-white/45 text-xs">{e.time}</td>
                      <td className="px-5 py-3.5 text-right">
                        <button onClick={(ev) => { ev.stopPropagation(); setSelectedEntry(e.id); }} className="w-7 h-7 rounded-md hover:bg-white/10 flex items-center justify-center text-white/45 hover:text-white">
                          <Eye className="w-3.5 h-3.5" />
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Mobile cards */}
          <div className="md:hidden divide-y divide-white/5">
            {filtered.map((e) => {
              const Icon = e.icon;
              return (
                <div key={e.id} onClick={() => setSelectedEntry(e.id)} className="px-4 py-3 hover:bg-white/3 active:bg-white/5 cursor-pointer">
                  <div className="flex items-start gap-3">
                    <div className={`w-9 h-9 rounded-xl ${e.bg} flex items-center justify-center flex-shrink-0`}>
                      <Icon className={`w-4 h-4 ${e.color}`} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-2">
                        <p className="text-white font-semibold text-sm truncate">{e.actor}</p>
                        <span className="text-white/40 text-[10px] flex-shrink-0">{e.time}</span>
                      </div>
                      <p className="text-white/70 text-xs mt-0.5">{e.action}</p>
                      <p className="text-white/45 text-[11px] font-mono truncate">{e.target}</p>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Detail panel */}
        {sel && (
          <>
            <div className="hidden xl:block glass-card rounded-2xl border border-white/10 p-5 h-fit sticky top-20">
              <EventDetail sel={sel} onClose={() => setSelectedEntry(null)} />
            </div>
            <div className="xl:hidden">
              {selectedEntry && (
                <>
                  <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40" onClick={() => setSelectedEntry(null)} />
                  <div className="fixed bottom-0 left-0 right-0 z-50 glass-card rounded-t-3xl border border-white/10 p-5 max-h-[85vh] overflow-y-auto animate-in slide-in-from-bottom duration-200">
                    <div className="w-12 h-1 rounded-full bg-white/20 mx-auto mb-4" />
                    <EventDetail sel={sel} onClose={() => setSelectedEntry(null)} />
                  </div>
                </>
              )}
            </div>
          </>
        )}
      </div>

      {/* ── Modules Catalog (grouped) ── */}
      {MODULE_GROUPS.map((group) => {
        // Los admins no ven la pasarela de pago (módulo "payments").
        const items = (grouped[group] ?? []).filter((m) => isSuper || m.id !== "payments");
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
                  <Link key={m.id} href={m.href} className="glass-card hover-lift group relative overflow-hidden rounded-2xl border border-white/10 p-5 block">
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
    </div>
  );
}

function EventDetail({ sel, onClose }: { sel: typeof auditEntries[0]; onClose: () => void }) {
  const Icon = sel.icon;
  return (
    <>
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3 min-w-0">
          <div className={`w-12 h-12 rounded-xl ${sel.bg} flex items-center justify-center flex-shrink-0`}>
            <Icon className={`w-6 h-6 ${sel.color}`} />
          </div>
          <div className="min-w-0">
            <p className="text-white font-bold text-base truncate">{sel.action}</p>
            <p className="text-white/45 text-xs truncate">{sel.time}</p>
          </div>
        </div>
        <button onClick={onClose} className="w-8 h-8 rounded-lg hover:bg-white/10 flex items-center justify-center text-white/45 hover:text-white">
          <X className="w-4 h-4" />
        </button>
      </div>

      <div className="space-y-4">
        <section>
          <p className="text-white/40 text-[10px] font-bold uppercase tracking-wider mb-2">Información</p>
          <DetailRow label="Actor"     value={sel.actor} />
          <DetailRow label="Acción"    value={sel.action} />
          <DetailRow label="Target"    value={sel.target} mono />
          <DetailRow label="Tipo"      value={sel.type.toUpperCase()} bold />
          <DetailRow label="Timestamp" value={sel.time} />
        </section>

        <section className="pt-3 border-t border-white/8">
          <p className="text-white/40 text-[10px] font-bold uppercase tracking-wider mb-2">Estado</p>
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-green-400" />
            <span className="text-white text-sm font-semibold">Confirmado</span>
          </div>
          <p className="text-white/40 text-xs mt-1">Registrado en audit log inmutable</p>
        </section>

        <div className="space-y-2 pt-3 border-t border-white/8">
          <button className="shine-btn w-full inline-flex items-center justify-center gap-2 bg-gradient-to-r from-fuchsia-500 to-purple-600 hover:opacity-90 text-white font-bold text-xs px-4 py-3 rounded-xl shadow-lg shadow-fuchsia-500/30 transition-all">
            <Eye className="w-4 h-4" /> Ver detalle completo
          </button>
          <button className="w-full inline-flex items-center justify-center gap-2 bg-white/5 hover:bg-white/10 border border-white/10 text-white/80 text-xs font-semibold px-4 py-2.5 rounded-xl transition-colors">
            <Activity className="w-3.5 h-3.5" /> Eventos relacionados
          </button>
        </div>
      </div>
    </>
  );
}

function DetailRow({ label, value, mono, bold }: { label: string; value: string; mono?: boolean; bold?: boolean }) {
  return (
    <div className="flex items-center justify-between py-1.5 gap-2">
      <span className="text-white/55 text-xs flex-shrink-0">{label}</span>
      <span className={`${bold ? "text-sm font-bold" : "text-xs font-medium"} text-white ${mono ? "font-mono" : ""} truncate min-w-0 text-right`}>
        {value}
      </span>
    </div>
  );
}
