"use client";
import { useState } from "react";
import Link from "next/link";
import {
  TrendingUp, TrendingDown, Users, DollarSign, ShoppingCart, Activity,
  Eye, MoreVertical, Search, Download, Filter, ChevronRight, ChevronLeft,
  ArrowUpRight, Wallet, CreditCard, Crown, Mail, Copy, X, Star
} from "lucide-react";
import {
  AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Legend
} from "recharts";

// ── Mock data ─────────────────────────────────────────────────
const kpis = [
  { label: "Usuarios Activos",      value: "342",       change: "+15.7%", up: true,  icon: Users,       iconBg: "bg-orange-500/15",  iconText: "text-orange-400", gradient: "from-orange-500 to-red-500" },
  { label: "Ingresos Pendientes",   value: "€2,850.75", change: "+12.4%", up: true,  icon: DollarSign,  iconBg: "bg-blue-500/15",    iconText: "text-blue-400",   gradient: "from-blue-500 to-indigo-600" },
  { label: "Ingresos Mes",          value: "€18,540",   change: "+18.9%", up: true,  icon: Wallet,      iconBg: "bg-green-500/15",   iconText: "text-green-400",  gradient: "from-green-500 to-emerald-600" },
  { label: "Clicks (Mes)",          value: "24,842",    change: "+9.2%",  up: true,  icon: Activity,    iconBg: "bg-purple-500/15",  iconText: "text-purple-400", gradient: "from-purple-500 to-fuchsia-600" },
  { label: "Conversiones",          value: "1,248",     change: "+13.1%", up: true,  icon: ShoppingCart,iconBg: "bg-pink-500/15",    iconText: "text-pink-400",   gradient: "from-pink-500 to-rose-600" },
];

const revenueData = [
  { name: "Ene", ingresos: 8400,  comisiones: 1200 },
  { name: "Feb", ingresos: 9200,  comisiones: 1450 },
  { name: "Mar", ingresos: 10100, comisiones: 1680 },
  { name: "Abr", ingresos: 12300, comisiones: 2050 },
  { name: "May", ingresos: 14800, comisiones: 2480 },
  { name: "Jun", ingresos: 16200, comisiones: 2710 },
  { name: "Jul", ingresos: 18540, comisiones: 2850 },
];

const channelData = [
  { name: "Afiliados",      value: 42, color: "#22c55e" },
  { name: "Orgánico",       value: 28, color: "#06b6d4" },
  { name: "Social Media",   value: 18, color: "#a855f7" },
  { name: "Email",          value: 12, color: "#f59e0b" },
];

const topCategories = [
  { name: "Video IA",     ingresos: 5240 },
  { name: "Editor",       ingresos: 4180 },
  { name: "Voz IA",       ingresos: 3650 },
  { name: "Imagen",       ingresos: 2980 },
  { name: "Automatiz.",   ingresos: 2410 },
];

const affiliates = [
  { id: 1, name: "Juan Pérez",      email: "juanperez@gmail.com",        code: "JUANP2026",  clicks: 1245, conv: 78, pending: 312.80, total: 2450.30, status: "Activo",    color: "from-orange-400 to-red-500" },
  { id: 2, name: "María González",  email: "mariagonzalez@outlook.com",  code: "MARIAG2026", clicks: 980,  conv: 62, pending: 248.15, total: 1980.20, status: "Activo",    color: "from-pink-400 to-rose-500" },
  { id: 3, name: "Roberto Castro",  email: "robertocastro@gmail.com",    code: "ROBERTO26", clicks: 756,  conv: 45, pending: 180.45, total: 1450.75, status: "Activo",    color: "from-emerald-400 to-teal-500" },
  { id: 4, name: "Lucía Andrade",   email: "lucia.andrade@proton.me",    code: "LUCIA2026",  clicks: 624,  conv: 39, pending: 156.20, total: 980.40,  status: "Activo",    color: "from-cyan-400 to-blue-500" },
  { id: 5, name: "Diego Villalobos",email: "diegovilla@icloud.com",      code: "DIEGO2026",  clicks: 512,  conv: 31, pending: 124.00, total: 812.60,  status: "Activo",    color: "from-violet-400 to-purple-500" },
  { id: 6, name: "Ana Fernández",   email: "anafernandez@gmail.com",     code: "ANAF2026",   clicks: 310,  conv: 18, pending: 72.00,  total: 420.30,  status: "Pendiente", color: "from-amber-400 to-orange-500" },
  { id: 7, name: "Sergio Morales",  email: "sergiomorales@live.com",     code: "SERGIO2026", clicks: 150,  conv: 6,  pending: 18.45,  total: 98.75,   status: "Inactivo",  color: "from-slate-400 to-slate-500" },
];

export default function DashboardPage() {
  const [selected, setSelected] = useState<number | null>(1);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("Todos");

  const filtered = affiliates.filter((a) => {
    const matchSearch = !search || a.name.toLowerCase().includes(search.toLowerCase()) || a.email.includes(search.toLowerCase());
    const matchStatus = statusFilter === "Todos" || a.status === statusFilter;
    return matchSearch && matchStatus;
  });

  const sel = affiliates.find((a) => a.id === selected);

  return (
    <div className="space-y-5 -mt-3 sm:-mt-4 lg:-mt-6">
      {/* ── Header ── */}
      <div>
        <h1 className="text-2xl sm:text-3xl font-black text-white">Dashboard</h1>
        <p className="text-white/45 text-sm mt-1">Resumen general de tu plataforma</p>
      </div>

      {/* ── KPI cards (5 en desktop, scroll horizontal en móvil) ── */}
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
              <h3 className="text-white font-bold text-base">Ingresos y Comisiones</h3>
              <p className="text-white/40 text-xs mt-0.5">Últimos 7 meses</p>
            </div>
            <div className="flex items-center gap-3 text-xs">
              <span className="flex items-center gap-1.5 text-white/70"><span className="w-2 h-2 rounded-full bg-cyan-400" /> Ingresos</span>
              <span className="flex items-center gap-1.5 text-white/70"><span className="w-2 h-2 rounded-full bg-pink-400" /> Comisiones</span>
            </div>
          </div>
          <div className="h-56 sm:h-64">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={revenueData} margin={{ top: 5, right: 5, left: -15, bottom: 0 }}>
                <defs>
                  <linearGradient id="gIngresos" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%"   stopColor="#06b6d4" stopOpacity={0.6} />
                    <stop offset="100%" stopColor="#06b6d4" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="gComisiones" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%"   stopColor="#ec4899" stopOpacity={0.6} />
                    <stop offset="100%" stopColor="#ec4899" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                <XAxis dataKey="name" stroke="rgba(255,255,255,0.35)" fontSize={11} tickLine={false} axisLine={false} />
                <YAxis stroke="rgba(255,255,255,0.35)" fontSize={11} tickLine={false} axisLine={false} />
                <Tooltip contentStyle={{ background: "#0f1219", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 12, fontSize: 12 }} />
                <Area type="monotone" dataKey="ingresos"   stroke="#06b6d4" strokeWidth={2} fill="url(#gIngresos)" />
                <Area type="monotone" dataKey="comisiones" stroke="#ec4899" strokeWidth={2} fill="url(#gComisiones)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Donut Chart — Traffic Channels */}
        <div className="glass-card rounded-2xl border border-white/10 p-4 sm:p-5">
          <h3 className="text-white font-bold text-base mb-1">Canales de Tráfico</h3>
          <p className="text-white/40 text-xs mb-4">Distribución últimos 30d</p>
          <div className="h-40 sm:h-44">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={channelData} dataKey="value" nameKey="name" innerRadius={45} outerRadius={70} paddingAngle={3}>
                  {channelData.map((c, i) => <Cell key={i} fill={c.color} />)}
                </Pie>
                <Tooltip contentStyle={{ background: "#0f1219", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 12, fontSize: 12 }} />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="space-y-1.5 mt-3">
            {channelData.map((c) => (
              <div key={c.name} className="flex items-center justify-between text-xs">
                <span className="flex items-center gap-2 text-white/70"><span className="w-2 h-2 rounded-full" style={{ background: c.color }} /> {c.name}</span>
                <span className="text-white font-bold">{c.value}%</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── Top Categories Bar Chart ── */}
      <div className="glass-card rounded-2xl border border-white/10 p-4 sm:p-5">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-white font-bold text-base">Top Categorías por Ingresos</h3>
            <p className="text-white/40 text-xs mt-0.5">Este mes</p>
          </div>
          <Link href="/admin/analytics" className="text-cyan-400 hover:text-cyan-300 text-xs font-semibold flex items-center gap-1">
            Ver detalle <ArrowUpRight className="w-3 h-3" />
          </Link>
        </div>
        <div className="h-48 sm:h-56">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={topCategories} margin={{ top: 5, right: 5, left: -15, bottom: 0 }}>
              <defs>
                <linearGradient id="gBar" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%"   stopColor="#a855f7" stopOpacity={0.9} />
                  <stop offset="100%" stopColor="#ec4899" stopOpacity={0.7} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
              <XAxis dataKey="name" stroke="rgba(255,255,255,0.35)" fontSize={11} tickLine={false} axisLine={false} />
              <YAxis stroke="rgba(255,255,255,0.35)" fontSize={11} tickLine={false} axisLine={false} />
              <Tooltip contentStyle={{ background: "#0f1219", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 12, fontSize: 12 }} />
              <Bar dataKey="ingresos" fill="url(#gBar)" radius={[8, 8, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* ── Afiliados table + detail panel ── */}
      <div className="grid grid-cols-1 xl:grid-cols-[1fr_360px] gap-4">
        {/* Table */}
        <div className="glass-card rounded-2xl border border-white/10 overflow-hidden">
          <div className="p-4 sm:p-5 border-b border-white/8">
            <div className="flex items-center justify-between flex-wrap gap-3 mb-4">
              <h3 className="text-white font-bold text-base">Afiliados Recientes</h3>
              <div className="flex items-center gap-2">
                <button className="inline-flex items-center gap-1.5 bg-white/5 border border-white/10 hover:bg-white/10 text-white text-xs font-semibold px-3 py-1.5 rounded-lg transition-colors">
                  <Filter className="w-3.5 h-3.5" /> Filtros
                </button>
                <button className="inline-flex items-center gap-1.5 bg-white/5 border border-white/10 hover:bg-white/10 text-white text-xs font-semibold px-3 py-1.5 rounded-lg transition-colors">
                  <Download className="w-3.5 h-3.5" /> Exportar
                </button>
              </div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-[1fr_auto_auto] gap-2">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-white/30" />
                <input
                  placeholder="Buscar afiliado..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="w-full bg-white/5 border border-white/10 rounded-lg pl-9 pr-3 py-2 text-xs text-white placeholder:text-white/30 focus:outline-none focus:border-cyan-500/40 transition-colors"
                />
              </div>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-cyan-500/40"
              >
                <option value="Todos">Estado: Todos</option>
                <option value="Activo">Activo</option>
                <option value="Pendiente">Pendiente</option>
                <option value="Inactivo">Inactivo</option>
              </select>
            </div>
          </div>

          {/* Desktop table */}
          <div className="hidden md:block overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-white/8 text-white/40 text-[10px] uppercase tracking-wider">
                  <th className="text-left px-5 py-3 font-bold">Afiliado</th>
                  <th className="text-left px-5 py-3 font-bold">Código</th>
                  <th className="text-right px-5 py-3 font-bold">Clicks</th>
                  <th className="text-right px-5 py-3 font-bold">Conv.</th>
                  <th className="text-right px-5 py-3 font-bold">Pendiente</th>
                  <th className="text-right px-5 py-3 font-bold">Total</th>
                  <th className="text-center px-5 py-3 font-bold">Estado</th>
                  <th className="text-right px-5 py-3 font-bold">Acciones</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((a) => (
                  <tr
                    key={a.id}
                    onClick={() => setSelected(a.id)}
                    className={`border-b border-white/5 hover:bg-white/3 cursor-pointer transition-colors ${selected === a.id ? "bg-white/3" : ""}`}
                  >
                    <td className="px-5 py-3.5">
                      <div className="flex items-center gap-3">
                        <div className={`w-8 h-8 rounded-full bg-gradient-to-br ${a.color} flex items-center justify-center text-white font-bold text-[10px] ring-1 ring-white/20`}>
                          {a.name.split(" ").map((n) => n[0]).join("").slice(0, 2)}
                        </div>
                        <div className="min-w-0">
                          <p className="text-white font-semibold truncate text-[13px]">{a.name}</p>
                          <p className="text-white/40 text-[11px] truncate">{a.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-5 py-3.5">
                      <span className="inline-flex items-center gap-1.5 bg-white/5 border border-white/10 text-white/70 text-[10px] font-mono font-semibold px-2 py-0.5 rounded-md">
                        {a.code}
                      </span>
                    </td>
                    <td className="px-5 py-3.5 text-right text-white font-semibold">{a.clicks.toLocaleString()}</td>
                    <td className="px-5 py-3.5 text-right text-white">{a.conv}</td>
                    <td className="px-5 py-3.5 text-right text-orange-400 font-bold">€{a.pending.toFixed(2)}</td>
                    <td className="px-5 py-3.5 text-right text-white font-semibold">€{a.total.toFixed(2)}</td>
                    <td className="px-5 py-3.5 text-center">
                      <StatusBadge status={a.status} />
                    </td>
                    <td className="px-5 py-3.5 text-right">
                      <div className="flex items-center justify-end gap-1">
                        <button onClick={(e) => { e.stopPropagation(); setSelected(a.id); }} className="w-7 h-7 rounded-md hover:bg-white/10 flex items-center justify-center text-white/45 hover:text-white transition-colors">
                          <Eye className="w-3.5 h-3.5" />
                        </button>
                        <button onClick={(e) => e.stopPropagation()} className="w-7 h-7 rounded-md hover:bg-white/10 flex items-center justify-center text-white/45 hover:text-white transition-colors">
                          <MoreVertical className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Mobile cards */}
          <div className="md:hidden divide-y divide-white/5">
            {filtered.map((a) => (
              <div key={a.id} onClick={() => setSelected(a.id)} className="px-4 py-3 hover:bg-white/3 transition-colors active:bg-white/5 cursor-pointer">
                <div className="flex items-center gap-3 mb-2">
                  <div className={`w-9 h-9 rounded-full bg-gradient-to-br ${a.color} flex items-center justify-center text-white font-bold text-xs ring-1 ring-white/20 flex-shrink-0`}>
                    {a.name.split(" ").map((n) => n[0]).join("").slice(0, 2)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-white font-semibold text-sm truncate">{a.name}</p>
                    <p className="text-white/40 text-[11px] truncate">{a.email}</p>
                  </div>
                  <StatusBadge status={a.status} />
                </div>
                <div className="grid grid-cols-4 gap-2 text-center pt-2 border-t border-white/5">
                  <div>
                    <p className="text-white/40 text-[9px] uppercase font-bold tracking-wide">Clicks</p>
                    <p className="text-white font-bold text-xs">{a.clicks.toLocaleString()}</p>
                  </div>
                  <div>
                    <p className="text-white/40 text-[9px] uppercase font-bold tracking-wide">Conv.</p>
                    <p className="text-white font-bold text-xs">{a.conv}</p>
                  </div>
                  <div>
                    <p className="text-white/40 text-[9px] uppercase font-bold tracking-wide">Pend.</p>
                    <p className="text-orange-400 font-bold text-xs">€{a.pending.toFixed(0)}</p>
                  </div>
                  <div>
                    <p className="text-white/40 text-[9px] uppercase font-bold tracking-wide">Total</p>
                    <p className="text-white font-bold text-xs">€{a.total.toFixed(0)}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Detail side panel — visible on xl+ as side, mobile as bottom sheet */}
        {sel && (
          <>
            {/* Desktop side panel */}
            <div className="hidden xl:block glass-card rounded-2xl border border-white/10 p-5 h-fit sticky top-20">
              <DetailContent sel={sel} onClose={() => setSelected(null)} />
            </div>

            {/* Mobile/tablet bottom sheet */}
            <div className="xl:hidden">
              {selected && (
                <>
                  <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40" onClick={() => setSelected(null)} />
                  <div className="fixed bottom-0 left-0 right-0 z-50 glass-card rounded-t-3xl border border-white/10 p-5 max-h-[85vh] overflow-y-auto animate-in slide-in-from-bottom duration-200">
                    <div className="w-12 h-1 rounded-full bg-white/20 mx-auto mb-4" />
                    <DetailContent sel={sel} onClose={() => setSelected(null)} />
                  </div>
                </>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  const map: Record<string, { bg: string; text: string; border: string }> = {
    Activo:    { bg: "bg-green-500/15",  text: "text-green-400",  border: "border-green-500/30" },
    Pendiente: { bg: "bg-yellow-500/15", text: "text-yellow-400", border: "border-yellow-500/30" },
    Inactivo:  { bg: "bg-white/8",       text: "text-white/45",   border: "border-white/15" },
  };
  const s = map[status] ?? map.Inactivo;
  return (
    <span className={`inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full ${s.bg} ${s.text} border ${s.border}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${status === "Activo" ? "bg-green-400" : status === "Pendiente" ? "bg-yellow-400" : "bg-white/40"}`} />
      {status}
    </span>
  );
}

function DetailContent({ sel, onClose }: { sel: typeof affiliates[0]; onClose: () => void }) {
  return (
    <>
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3 min-w-0">
          <div className={`w-11 h-11 rounded-full bg-gradient-to-br ${sel.color} flex items-center justify-center text-white font-bold text-sm ring-2 ring-white/20`}>
            {sel.name.split(" ").map((n) => n[0]).join("").slice(0, 2)}
          </div>
          <div className="min-w-0">
            <p className="text-white font-bold text-base truncate">{sel.name}</p>
            <StatusBadge status={sel.status} />
          </div>
        </div>
        <button onClick={onClose} className="w-8 h-8 rounded-lg hover:bg-white/10 flex items-center justify-center text-white/45 hover:text-white">
          <X className="w-4 h-4" />
        </button>
      </div>

      <div className="space-y-4">
        <section>
          <p className="text-white/40 text-[10px] font-bold uppercase tracking-wider mb-2">Información</p>
          <Row label="Email"   value={sel.email}    icon={Mail} />
          <Row label="Código"  value={sel.code}     mono copy />
          <Row label="Enlace"  value={`mediaplaypromo.com/?ref=${sel.code.toLowerCase()}`} copy small />
        </section>

        <section className="pt-3 border-t border-white/8">
          <p className="text-white/40 text-[10px] font-bold uppercase tracking-wider mb-2">Resumen</p>
          <Row label="Clicks totales"      value={sel.clicks.toLocaleString()} bold />
          <Row label="Conversiones"        value={sel.conv.toString()}         bold />
          <Row label="Tasa de conversión"  value={`${((sel.conv / sel.clicks) * 100).toFixed(2)}%`} bold accent />
        </section>

        <section className="pt-3 border-t border-white/8">
          <p className="text-white/40 text-[10px] font-bold uppercase tracking-wider mb-2">Comisiones</p>
          <Row label="Pendiente" value={`€${sel.pending.toFixed(2)}`} bold accent />
          <Row label="Pagada"    value={`€${(sel.total - sel.pending).toFixed(2)}`} bold />
          <Row label="Total"     value={`€${sel.total.toFixed(2)}`} bold large />
        </section>

        <div className="space-y-2 pt-3 border-t border-white/8">
          <button className="shine-btn w-full inline-flex items-center justify-center gap-2 bg-gradient-to-r from-orange-500 to-red-500 hover:opacity-90 text-white font-bold text-xs px-4 py-3 rounded-xl shadow-lg shadow-orange-500/30 transition-all">
            <DollarSign className="w-4 h-4" /> Pagar comisión
          </button>
          <button className="w-full inline-flex items-center justify-center gap-2 bg-white/5 hover:bg-white/10 border border-white/10 text-white/80 text-xs font-semibold px-4 py-2.5 rounded-xl transition-colors">
            <Activity className="w-3.5 h-3.5" /> Ver historial
          </button>
        </div>
      </div>
    </>
  );
}

function Row({ label, value, icon: Icon, mono, copy, bold, large, accent, small }: {
  label: string;
  value: string;
  icon?: React.ElementType;
  mono?: boolean;
  copy?: boolean;
  bold?: boolean;
  large?: boolean;
  accent?: boolean;
  small?: boolean;
}) {
  return (
    <div className="flex items-center justify-between py-1.5 gap-2">
      <span className={`text-white/55 ${small ? "text-[10px]" : "text-xs"} flex items-center gap-1.5 flex-shrink-0`}>
        {Icon && <Icon className="w-3 h-3 text-white/30" />}
        {label}
      </span>
      <span className={`${large ? "text-base font-black" : bold ? "text-sm font-bold" : "text-xs font-medium"} ${accent ? "text-orange-400" : "text-white"} ${mono ? "font-mono" : ""} ${small ? "text-[10px]" : ""} truncate flex items-center gap-1.5 min-w-0`}>
        {value}
        {copy && <Copy className="w-3 h-3 text-white/30 hover:text-white cursor-pointer flex-shrink-0" />}
      </span>
    </div>
  );
}
