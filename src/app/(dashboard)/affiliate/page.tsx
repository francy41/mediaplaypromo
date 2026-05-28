"use client";
import { useState } from "react";
import {
  Search, Filter, Download as DownloadIcon, Eye, MoreHorizontal,
  UserCheck, DollarSign, TrendingUp, ArrowUpRight, ChevronRight,
  Award, Copy, ExternalLink
} from "lucide-react";

const affiliates = [
  { name: "Juan Pérez",      email: "juanperez@gmail.com",           code: "JUANP2026",   clicks: 1245, conv: 78,  pending: "$312.80",  total: "$2,450.30", status: "Activo",    plan: "Pro" },
  { name: "María González",  email: "mariagonzalez@outlook.com",     code: "MARIAG2026",  clicks: 980,  conv: 62,  pending: "$248.15",  total: "$1,980.20", status: "Activo",    plan: "Pro" },
  { name: "Roberto Castro",  email: "robertocastro@gmail.com",       code: "ROBERTO2026", clicks: 756,  conv: 45,  pending: "$180.45",  total: "$1,450.75", status: "Activo",    plan: "Agencia" },
  { name: "Lucia Andrade",   email: "lucia.andrade@proton.me",       code: "LUCIA2026",   clicks: 624,  conv: 39,  pending: "$156.20",  total: "$980.40",   status: "Activo",    plan: "Pro" },
  { name: "Diego Villalobos",email: "diegovilla@icloud.com",         code: "DIEGO2026",   clicks: 512,  conv: 31,  pending: "$124.00",  total: "$812.60",   status: "Activo",    plan: "Pro" },
  { name: "Ana Fernández",   email: "anafernandez@gmail.com",        code: "ANAF2026",    clicks: 310,  conv: 18,  pending: "$72.00",   total: "$420.30",   status: "Pendiente", plan: "Básico" },
  { name: "Sergio Morales",  email: "sergiomorales@live.com",        code: "SERGIO2026",  clicks: 150,  conv: 6,   pending: "$18.45",   total: "$98.75",    status: "Inactivo",  plan: "Básico" },
  { name: "Carla Ramírez",   email: "carlaramirez@outlook.com",      code: "CARLA2026",   clicks: 98,   conv: 3,   pending: "$9.20",    total: "$45.10",    status: "Inactivo",  plan: "Básico" },
];

const statusStyle: Record<string, string> = {
  Activo:    "bg-green-500/15 text-green-400 border-green-500/20",
  Pendiente: "bg-yellow-500/15 text-yellow-400 border-yellow-500/20",
  Inactivo:  "bg-white/5 text-white/40 border-white/10",
};

const avatarColors = [
  "from-orange-400 to-red-500",
  "from-blue-400 to-indigo-600",
  "from-green-400 to-teal-600",
  "from-purple-400 to-pink-600",
  "from-yellow-400 to-orange-500",
  "from-cyan-400 to-blue-500",
  "from-pink-400 to-rose-600",
  "from-teal-400 to-green-600",
];

export default function AffiliatePage() {
  const [selected, setSelected] = useState<typeof affiliates[0] | null>(affiliates[0]);
  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("Todos");

  const filtered = affiliates.filter((a) => {
    const q = query.toLowerCase();
    const matchQ = !q || a.name.toLowerCase().includes(q) || a.email.toLowerCase().includes(q);
    const matchS = statusFilter === "Todos" || a.status === statusFilter;
    return matchQ && matchS;
  });

  return (
    <div className="space-y-6">

      {/* ── Stat Cards ── */}
      <div className="grid grid-cols-5 gap-4">
        {[
          { label: "Afiliados Activos",       value: "342",       icon: UserCheck, bg: "bg-orange-500/20", color: "text-orange-400", change: "+15.7%" },
          { label: "Comisiones Pendientes",   value: "$2,850.75", icon: DollarSign,bg: "bg-blue-500/20",   color: "text-blue-400",   change: "+12.4%" },
          { label: "Comisiones Pagadas (Mes)",value: "$18,540.30",icon: TrendingUp, bg: "bg-green-500/20", color: "text-green-400",  change: "+18.9%" },
          { label: "Clicks (Mes)",            value: "24,842",    icon: Eye,        bg: "bg-purple-500/20",color: "text-purple-400", change: "+9.2%" },
          { label: "Conversiones (Mes)",      value: "1,248",     icon: Award,      bg: "bg-orange-500/20",color: "text-orange-500", change: "+13.1%" },
        ].map((s) => {
          const Icon = s.icon;
          return (
            <div key={s.label} className="bg-[#0f1219] border border-white/8 rounded-2xl p-5">
              <div className={`w-10 h-10 rounded-xl ${s.bg} flex items-center justify-center mb-4`}>
                <Icon className={`w-5 h-5 ${s.color}`} />
              </div>
              <p className="text-white/50 text-xs mb-1">{s.label}</p>
              <p className="text-white font-bold text-xl leading-none mb-2">{s.value}</p>
              <div className="flex items-center gap-1">
                <ArrowUpRight className="w-3 h-3 text-green-400" />
                <span className="text-green-400 text-xs font-semibold">{s.change}</span>
                <span className="text-white/30 text-[10px]">vs el mes pasado</span>
              </div>
            </div>
          );
        })}
      </div>

      {/* ── Table + Detail Panel ── */}
      <div className="flex gap-5">
        <div className={`bg-[#0f1219] border border-white/8 rounded-2xl transition-all duration-300 ${selected ? "flex-1 min-w-0" : "w-full"}`}>

          {/* Toolbar */}
          <div className="flex items-center gap-3 p-5 border-b border-white/8 flex-wrap">
            <h2 className="text-white font-semibold mr-1">Afiliados</h2>
            {/* Search */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-white/30" />
              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Buscar afiliado..."
                className="bg-white/5 border border-white/10 rounded-xl pl-8 pr-3 py-1.5 text-xs text-white placeholder:text-white/30 focus:outline-none focus:border-orange-500/40 w-44 transition-all"
              />
            </div>
            {/* Filters */}
            {[
              { label: "Estado", options: ["Todos","Activo","Pendiente","Inactivo"], value: statusFilter, set: setStatusFilter },
              { label: "Plan referido", options: ["Todos","Pro","Agencia","Básico"], value: "Todos", set: () => {} },
              { label: "Fecha registro", options: ["Todos","Este mes","Últimos 3 meses"], value: "Todos", set: () => {} },
            ].map((f) => (
              <select
                key={f.label}
                value={f.value}
                onChange={(e) => f.set(e.target.value)}
                className="bg-white/5 border border-white/10 rounded-xl px-3 py-1.5 text-xs text-white/60 focus:outline-none focus:border-orange-500/40"
              >
                {f.options.map((o) => <option key={o}>{o}</option>)}
              </select>
            ))}
            <button className="flex items-center gap-1.5 bg-white/5 border border-white/10 hover:bg-white/10 rounded-xl px-3 py-1.5 text-xs text-white/60 transition-colors">
              <Filter className="w-3 h-3" /> Más filtros
            </button>
            <button className="ml-auto flex items-center gap-1.5 bg-white/5 border border-white/10 hover:bg-white/10 rounded-xl px-3 py-1.5 text-xs text-white/60 transition-colors">
              <DownloadIcon className="w-3 h-3" /> Exportar
            </button>
          </div>

          {/* Column headers */}
          <div className="grid grid-cols-[2fr_1.6fr_0.7fr_0.6fr_0.8fr_0.8fr_0.7fr_0.4fr] gap-3 px-5 py-2.5 border-b border-white/5">
            {["Afiliado","Código / Enlace","Clicks","Conversiones","Comisión Pendiente","Comisión Total","Estado","Acciones"].map((h) => (
              <span key={h} className="text-white/30 text-[10px] font-semibold uppercase tracking-wider">{h}</span>
            ))}
          </div>

          {/* Rows */}
          <div className="divide-y divide-white/5">
            {filtered.map((aff, idx) => (
              <div
                key={aff.email}
                onClick={() => setSelected(selected?.email === aff.email ? null : aff)}
                className={`grid grid-cols-[2fr_1.6fr_0.7fr_0.6fr_0.8fr_0.8fr_0.7fr_0.4fr] gap-3 px-5 py-3.5 cursor-pointer transition-all ${
                  selected?.email === aff.email
                    ? "bg-orange-500/5 border-l-2 border-orange-500"
                    : "hover:bg-white/3"
                }`}
              >
                <div className="flex items-center gap-2.5 min-w-0">
                  <div className={`w-8 h-8 rounded-full bg-gradient-to-br ${avatarColors[idx % avatarColors.length]} flex items-center justify-center text-[10px] font-bold text-white flex-shrink-0`}>
                    {aff.name.split(" ").map((n) => n[0]).join("").slice(0, 2)}
                  </div>
                  <div className="min-w-0">
                    <p className="text-white text-xs font-semibold truncate">{aff.name}</p>
                    <p className="text-white/35 text-[10px] truncate">{aff.email}</p>
                  </div>
                </div>
                <div className="flex flex-col justify-center gap-0.5 min-w-0">
                  <div className="flex items-center gap-1">
                    <span className="bg-white/8 text-white/70 text-[10px] font-mono px-1.5 py-0.5 rounded">{aff.code}</span>
                    <button onClick={(e) => { e.stopPropagation(); navigator.clipboard.writeText(aff.code); }} className="text-white/30 hover:text-white/60">
                      <Copy className="w-2.5 h-2.5" />
                    </button>
                  </div>
                  <span className="text-orange-400 text-[9px] truncate">nexus.com/?ref={aff.code.toLowerCase()} ↗</span>
                </div>
                <div className="flex items-center text-white/70 text-xs">{aff.clicks.toLocaleString()}</div>
                <div className="flex items-center text-white/70 text-xs">{aff.conv}</div>
                <div className="flex items-center text-orange-400 text-xs font-semibold">{aff.pending}</div>
                <div className="flex items-center text-white/70 text-xs">{aff.total}</div>
                <div className="flex items-center">
                  <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border ${statusStyle[aff.status]}`}>
                    {aff.status}
                  </span>
                </div>
                <div className="flex items-center gap-1">
                  <button className="w-6 h-6 rounded-lg hover:bg-white/10 flex items-center justify-center text-white/40 hover:text-white transition-colors">
                    <Eye className="w-3 h-3" />
                  </button>
                  <button className="w-6 h-6 rounded-lg hover:bg-white/10 flex items-center justify-center text-white/40 hover:text-white transition-colors">
                    <MoreHorizontal className="w-3 h-3" />
                  </button>
                </div>
              </div>
            ))}
          </div>

          {/* Pagination */}
          <div className="flex items-center justify-between px-5 py-3.5 border-t border-white/8">
            <span className="text-white/35 text-xs">Mostrando 1 a {filtered.length} de 342 afiliados</span>
            <div className="flex items-center gap-1">
              {[1,2,3,"...",43].map((p, i) => (
                <button key={i} className={`w-7 h-7 rounded-lg text-xs font-medium transition-colors ${p === 1 ? "bg-orange-500 text-white" : "text-white/40 hover:bg-white/8 hover:text-white"}`}>
                  {p}
                </button>
              ))}
              <button className="w-7 h-7 rounded-lg text-white/40 hover:bg-white/8 hover:text-white flex items-center justify-center">
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>
            <select className="bg-white/5 border border-white/10 rounded-lg px-2 py-1 text-xs text-white/50 focus:outline-none">
              <option>8 por página</option><option>15 por página</option><option>25 por página</option>
            </select>
          </div>
        </div>

        {/* Detail Panel */}
        {selected && (
          <div className="w-72 flex-shrink-0 bg-[#0f1219] border border-white/8 rounded-2xl p-5 space-y-5">
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-3">
                <div className={`w-10 h-10 rounded-full bg-gradient-to-br ${avatarColors[affiliates.findIndex(a => a.email === selected.email) % avatarColors.length]} flex items-center justify-center text-sm font-bold text-white`}>
                  {selected.name.split(" ").map((n) => n[0]).join("").slice(0, 2)}
                </div>
                <div>
                  <p className="text-white font-semibold text-sm">{selected.name}</p>
                  <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border ${statusStyle[selected.status]}`}>
                    {selected.status}
                  </span>
                </div>
              </div>
              <button onClick={() => setSelected(null)} className="text-white/30 hover:text-white transition-colors text-lg">×</button>
            </div>

            <div>
              <p className="text-white/40 text-[10px] font-semibold uppercase tracking-wider mb-3">Información del afiliado</p>
              <div className="space-y-2">
                {[
                  ["Email",                   selected.email],
                  ["Código",                  selected.code],
                  ["Enlace",                  `nexus.com/?ref=${selected.code.toLowerCase()}`],
                  ["Fecha de registro",       "12 Abr 2026"],
                  ["Plan referido más común", selected.plan],
                ].map(([k, v]) => (
                  <div key={k} className="flex items-start justify-between gap-2">
                    <span className="text-white/35 text-[10px] flex-shrink-0">{k}</span>
                    <span className="text-white/70 text-[10px] text-right truncate max-w-[145px]">{v}</span>
                  </div>
                ))}
              </div>
            </div>

            <div>
              <p className="text-white/40 text-[10px] font-semibold uppercase tracking-wider mb-3">Resumen de rendimiento</p>
              <div className="space-y-2">
                {[
                  ["Clicks totales",       "12,450"],
                  ["Conversiones totales", "780"],
                  ["Tasa de conversión",   "6.27%"],
                  ["Clientes referidos",   "342"],
                ].map(([k, v]) => (
                  <div key={k} className="flex items-center justify-between">
                    <span className="text-white/35 text-[10px]">{k}</span>
                    <span className="text-white/80 text-[10px] font-semibold">{v}</span>
                  </div>
                ))}
              </div>
            </div>

            <div>
              <p className="text-white/40 text-[10px] font-semibold uppercase tracking-wider mb-3">Comisiones</p>
              <div className="space-y-1.5">
                {[
                  ["Pendiente",      selected.pending, "text-orange-400"],
                  ["Aprobada",       "$1,250.50",      "text-white/60"],
                  ["Pagada",         "$2,450.30",      "text-white/60"],
                  ["Total generada", "$4,013.60",      "text-white font-semibold"],
                ].map(([k, v, cls]) => (
                  <div key={k} className="flex items-center justify-between">
                    <span className="text-white/35 text-[10px]">{k}</span>
                    <span className={`text-[10px] ${cls}`}>{v}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="space-y-2 pt-1 border-t border-white/8">
              <button className="w-full bg-orange-500 hover:bg-orange-400 text-white text-xs font-bold py-2.5 rounded-xl transition-colors flex items-center justify-center gap-2">
                <DollarSign className="w-3.5 h-3.5" /> Pagar comisión
              </button>
              <button className="w-full bg-white/5 border border-white/10 hover:bg-white/10 text-white/60 text-xs py-2 rounded-xl transition-colors">
                Ver historial
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
