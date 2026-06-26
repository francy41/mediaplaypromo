"use client";
import Link from "next/link";
import {
  TrendingUp, TrendingDown, Users, DollarSign, Zap, Layers,
  Video, Image as ImageIcon, Mic, Sparkles, Upload, LayoutGrid,
  Download, Calendar, MoreVertical, ArrowUpRight, Play,
  Clapperboard, ArrowRight,
} from "lucide-react";
import {
  AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell,
  RadarChart, Radar, PolarGrid, PolarAngleAxis,
  XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid,
} from "recharts";

/* ── Tokens premium ── */
const CARD = "rounded-[20px] border border-white/[0.06] bg-[#111217]";

/* ── Mock data ── */
const kpis = [
  { label: "Videos generados", value: "342",       change: "+18.6%", up: true,  icon: Video,      grad: "from-violet-500 to-purple-600", tint: "bg-violet-500/15", text: "text-violet-300" },
  { label: "Ingresos totales", value: "$2,850.75", change: "+24.3%", up: true,  icon: DollarSign, grad: "from-cyan-500 to-blue-600",     tint: "bg-cyan-500/15",   text: "text-cyan-300" },
  { label: "Créditos usados",  value: "18,540",    change: "-8.7%",  up: false, icon: Zap,        grad: "from-emerald-500 to-teal-600",  tint: "bg-emerald-500/15",text: "text-emerald-300" },
  { label: "Proyectos activos",value: "24,842",    change: "+15.2%", up: true,  icon: Layers,     grad: "from-fuchsia-500 to-pink-600",  tint: "bg-fuchsia-500/15",text: "text-fuchsia-300" },
  { label: "Miembros",         value: "1,248",     change: "+7.3%",  up: true,  icon: Users,      grad: "from-amber-500 to-orange-600",  tint: "bg-amber-500/15",  text: "text-amber-300" },
];

const revenueData = [
  { name: "Ene", ingresos: 4200, comisiones: 1100 },
  { name: "Feb", ingresos: 5100, comisiones: 1400 },
  { name: "Mar", ingresos: 6300, comisiones: 1750 },
  { name: "Abr", ingresos: 7100, comisiones: 2050 },
  { name: "May", ingresos: 8540, comisiones: 2850 },
  { name: "Jun", ingresos: 9200, comisiones: 3100 },
];

const channelData = [
  { name: "Directo",       value: 40.2, color: "#a855f7" },
  { name: "Búsqueda",      value: 28.5, color: "#06b6d4" },
  { name: "Redes sociales",value: 18.7, color: "#ec4899" },
  { name: "Referidos",     value: 7.4,  color: "#22c55e" },
  { name: "Email",         value: 5.2,  color: "#f59e0b" },
];

const quickActions = [
  { label: "Crear video",   icon: Video,      href: "/categories/generador-video",  grad: "from-violet-500 to-purple-600" },
  { label: "Crear imagen",  icon: ImageIcon,  href: "/categories/generador-imagen", grad: "from-cyan-500 to-blue-600" },
  { label: "Crear audio",   icon: Mic,        href: "/categories/generador-voz",    grad: "from-fuchsia-500 to-pink-600" },
  { label: "Herramientas IA",icon: Sparkles,  href: "/categories/automatizaciones", grad: "from-emerald-500 to-teal-600" },
  { label: "Subir archivos",icon: Upload,     href: "/content",                     grad: "from-amber-500 to-orange-600" },
  { label: "Plantillas",    icon: LayoutGrid, href: "/admin/templates",             grad: "from-blue-500 to-indigo-600" },
];

const topCategories = [
  { name: "Marketing",     ingresos: 6540 },
  { name: "Redes",         ingresos: 4230 },
  { name: "Publicidad",    ingresos: 3120 },
  { name: "Música",        ingresos: 2450 },
  { name: "Educación",     ingresos: 1860 },
];

const radarData = [
  { tipo: "Videos",     value: 85 },
  { tipo: "Imágenes",   value: 75 },
  { tipo: "Audios",     value: 60 },
  { tipo: "IA Tools",   value: 90 },
  { tipo: "Plantillas", value: 70 },
];

const recentProjects = [
  { title: "Promo Verano 2024",  type: "Video", tag: "4K", time: "Hoy, 10:30 AM", icon: Video,     grad: "from-amber-500 to-orange-600" },
  { title: "Campaña Sneakers",   type: "Imagen", tag: "",   time: "2h atrás",      icon: ImageIcon, grad: "from-pink-500 to-rose-600" },
  { title: "Audio Corporativo",  type: "Audio",  tag: "",   time: "5h atrás",      icon: Mic,       grad: "from-cyan-500 to-blue-600" },
  { title: "Anuncio Facebook",   type: "Video",  tag: "4K", time: "Ayer, 4:45 PM", icon: Video,     grad: "from-fuchsia-500 to-purple-600" },
  { title: "Portada Podcast",    type: "Imagen", tag: "",   time: "Ayer, 11:20 AM",icon: ImageIcon, grad: "from-violet-500 to-indigo-600" },
];

const videoPerf = [
  { title: "Lanzamiento Producto", cat: "Marketing",  views: "125,430", rev: "$1,250.75", com: "$375.23", ctr: "4.25%", conv: "3,254", grad: "from-violet-500 to-purple-600" },
  { title: "Oferta Especial 2x1",  cat: "Publicidad", views: "98,765",  rev: "$980.50",   com: "$245.12", ctr: "3.91%", conv: "2,876", grad: "from-cyan-500 to-blue-600" },
  { title: "Tutorial Completo",    cat: "Educación",  views: "76,543",  rev: "$765.30",   com: "$191.32", ctr: "4.60%", conv: "3,522", grad: "from-emerald-500 to-teal-600" },
];

const tooltipStyle = { background: "#111217", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 14, fontSize: 12 };

export default function DashboardPage() {
  return (
    <div className="space-y-5">
      {/* ── Header ── */}
      <div className="flex items-end justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight">Dashboard</h1>
          <p className="text-white/45 text-sm mt-1">Resumen general de tu plataforma</p>
        </div>
        <div className="flex items-center gap-2">
          <button className="inline-flex items-center gap-2 bg-[#111217] border border-white/[0.06] hover:bg-white/[0.04] text-white/80 text-xs font-semibold px-3 py-2 rounded-xl transition-colors">
            <Calendar className="w-3.5 h-3.5 text-white/50" /> 1 – 31 Mayo, 2024
          </button>
          <button className="inline-flex items-center gap-2 bg-gradient-to-r from-violet-500 to-fuchsia-600 hover:opacity-90 text-white text-xs font-bold px-3.5 py-2 rounded-xl shadow-lg shadow-violet-500/25 transition-all">
            <Download className="w-3.5 h-3.5" /> Exportar
          </button>
        </div>
      </div>

      {/* ── Mega Editor — hero grande arriba del todo ── */}
      <Link href="/editor" className="group block relative overflow-hidden rounded-[24px] border border-violet-500/25 bg-gradient-to-br from-violet-600/25 via-fuchsia-600/15 to-cyan-500/10 p-7 sm:p-10 hover:border-violet-400/50 transition-all">
        <div className="absolute -top-20 -right-12 w-80 h-80 bg-violet-500/25 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-28 left-1/4 w-80 h-80 bg-fuchsia-500/15 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute top-1/2 right-10 w-56 h-56 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="relative flex items-center gap-6 sm:gap-8 flex-wrap">
          <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-3xl bg-gradient-to-br from-violet-500 to-fuchsia-600 flex items-center justify-center shadow-2xl shadow-violet-500/40 ring-1 ring-white/20 flex-shrink-0 group-hover:scale-105 transition-transform">
            <Clapperboard className="w-10 h-10 sm:w-12 sm:h-12 text-white drop-shadow" />
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-3 flex-wrap">
              <span className="text-[11px] font-bold px-2.5 py-1 rounded-full bg-fuchsia-500/20 text-fuchsia-200 border border-fuchsia-400/30 tracking-wider">★ DESTACADO · NUEVO</span>
            </div>
            <h2 className="text-white font-black text-3xl sm:text-5xl tracking-tight mt-2 leading-[1.05]">Mega Editor de Video IA</h2>
            <p className="text-white/60 text-base sm:text-lg mt-3 max-w-2xl">Del prompt al MP4: genera escenas, voz, música y subtítulos automáticamente. Estilo CapCut, potenciado con IA.</p>
            <div className="flex items-center gap-2 flex-wrap mt-4">
              {["Texto → Video", "Voz + Música", "Subtítulos quemados", "NVIDIA · MUAPI · Pexels", "Render MP4 gratis"].map((t) => (
                <span key={t} className="text-[11px] sm:text-xs font-semibold text-white/75 bg-white/[0.06] border border-white/10 rounded-full px-3 py-1.5">{t}</span>
              ))}
            </div>
          </div>
          <span className="inline-flex items-center gap-2 bg-white text-[#111217] text-base font-bold px-7 py-3.5 rounded-2xl shadow-xl group-hover:gap-3.5 transition-all flex-shrink-0">
            Abrir editor <ArrowRight className="w-5 h-5" />
          </span>
        </div>
      </Link>

      {/* ── KPI cards ── */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">
        {kpis.map((k) => {
          const Icon = k.icon;
          return (
            <div key={k.label} className={`${CARD} hover-lift relative overflow-hidden p-4 sm:p-5`}>
              <div className={`absolute -top-8 -right-8 w-24 h-24 bg-gradient-to-br ${k.grad} opacity-[0.12] rounded-full blur-2xl pointer-events-none`} />
              <div className={`w-10 h-10 rounded-xl ${k.tint} flex items-center justify-center ring-1 ring-white/5 mb-3`}>
                <Icon className={`w-5 h-5 ${k.text}`} />
              </div>
              <p className="text-white/45 text-[10px] font-bold uppercase tracking-wider leading-tight">{k.label}</p>
              <p className="text-white font-black text-2xl mt-1 leading-tight">{k.value}</p>
              <p className={`text-[11px] mt-1.5 flex items-center gap-1 font-semibold ${k.up ? "text-emerald-400" : "text-red-400"}`}>
                {k.up ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
                {k.change} <span className="text-white/30 font-normal">vs abril</span>
              </p>
            </div>
          );
        })}
      </div>

      {/* ── Charts + quick actions + recent ── */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-4">
        {/* Ingresos y Comisiones */}
        <div className={`${CARD} xl:col-span-2 p-4 sm:p-5`}>
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-white font-bold text-base">Ingresos y Comisiones</h3>
              <p className="text-white/40 text-xs mt-0.5">Últimos 6 meses</p>
            </div>
            <div className="flex items-center gap-3 text-xs">
              <span className="flex items-center gap-1.5 text-white/70"><span className="w-2 h-2 rounded-full bg-violet-400" /> Ingresos</span>
              <span className="flex items-center gap-1.5 text-white/70"><span className="w-2 h-2 rounded-full bg-cyan-400" /> Comisiones</span>
            </div>
          </div>
          <div className="h-56 sm:h-64">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={revenueData} margin={{ top: 5, right: 5, left: -15, bottom: 0 }}>
                <defs>
                  <linearGradient id="gIng" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#a855f7" stopOpacity={0.5} /><stop offset="100%" stopColor="#a855f7" stopOpacity={0} /></linearGradient>
                  <linearGradient id="gCom" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#06b6d4" stopOpacity={0.5} /><stop offset="100%" stopColor="#06b6d4" stopOpacity={0} /></linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                <XAxis dataKey="name" stroke="rgba(255,255,255,0.35)" fontSize={11} tickLine={false} axisLine={false} />
                <YAxis stroke="rgba(255,255,255,0.35)" fontSize={11} tickLine={false} axisLine={false} />
                <Tooltip contentStyle={tooltipStyle} />
                <Area type="monotone" dataKey="ingresos"   stroke="#a855f7" strokeWidth={2.5} fill="url(#gIng)" />
                <Area type="monotone" dataKey="comisiones" stroke="#06b6d4" strokeWidth={2.5} fill="url(#gCom)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Acciones rápidas */}
        <div className={`${CARD} p-4 sm:p-5`}>
          <h3 className="text-white font-bold text-base mb-4">Acciones rápidas</h3>
          <div className="grid grid-cols-3 gap-2.5">
            {quickActions.map((a) => {
              const Icon = a.icon;
              return (
                <Link key={a.label} href={a.href} className="group flex flex-col items-center gap-2 rounded-2xl border border-white/[0.06] bg-white/[0.02] hover:bg-white/[0.05] p-3 transition-all hover:-translate-y-0.5">
                  <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${a.grad} flex items-center justify-center shadow-lg ring-1 ring-white/15 group-hover:scale-105 transition-transform`}>
                    <Icon className="w-5 h-5 text-white drop-shadow" />
                  </div>
                  <span className="text-white/70 text-[10px] font-semibold text-center leading-tight group-hover:text-white">{a.label}</span>
                </Link>
              );
            })}
          </div>
        </div>
      </div>

      {/* ── Row 2: donut + radar + recent ── */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-4">
        {/* Canales de Tráfico */}
        <div className={`${CARD} p-4 sm:p-5`}>
          <h3 className="text-white font-bold text-base mb-1">Canales de Tráfico</h3>
          <p className="text-white/40 text-xs mb-3">Distribución últimos 30d</p>
          <div className="h-40">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={channelData} dataKey="value" nameKey="name" innerRadius={45} outerRadius={68} paddingAngle={3}>
                  {channelData.map((c, i) => <Cell key={i} fill={c.color} />)}
                </Pie>
                <Tooltip contentStyle={tooltipStyle} />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="space-y-1.5 mt-3">
            {channelData.map((c) => (
              <div key={c.name} className="flex items-center justify-between text-xs">
                <span className="flex items-center gap-2 text-white/65"><span className="w-2 h-2 rounded-full" style={{ background: c.color }} /> {c.name}</span>
                <span className="text-white font-bold">{c.value}%</span>
              </div>
            ))}
          </div>
        </div>

        {/* Rendimiento por tipo (radar) */}
        <div className={`${CARD} p-4 sm:p-5`}>
          <h3 className="text-white font-bold text-base mb-1">Rendimiento por tipo</h3>
          <p className="text-white/40 text-xs mb-3">Uso por categoría de contenido</p>
          <div className="h-56">
            <ResponsiveContainer width="100%" height="100%">
              <RadarChart data={radarData} outerRadius="72%">
                <PolarGrid stroke="rgba(255,255,255,0.08)" />
                <PolarAngleAxis dataKey="tipo" tick={{ fill: "rgba(255,255,255,0.55)", fontSize: 11 }} />
                <Radar dataKey="value" stroke="#a855f7" strokeWidth={2} fill="#a855f7" fillOpacity={0.3} />
                <Tooltip contentStyle={tooltipStyle} />
              </RadarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Proyectos recientes */}
        <div className={`${CARD} p-4 sm:p-5`}>
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-white font-bold text-base">Proyectos recientes</h3>
            <Link href="/content" className="text-violet-400 hover:text-violet-300 text-xs font-semibold">Ver todos</Link>
          </div>
          <div className="space-y-1.5">
            {recentProjects.map((p) => {
              const Icon = p.icon;
              return (
                <div key={p.title} className="flex items-center gap-3 rounded-xl hover:bg-white/[0.03] p-2 transition-colors group cursor-pointer">
                  <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${p.grad} flex items-center justify-center flex-shrink-0 ring-1 ring-white/15`}>
                    <Icon className="w-5 h-5 text-white" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-white text-[13px] font-semibold truncate">{p.title}</p>
                    <div className="flex items-center gap-1.5 mt-0.5">
                      <span className="text-white/45 text-[10px] bg-white/5 border border-white/10 rounded px-1.5 py-px">{p.type}</span>
                      {p.tag && <span className="text-cyan-300 text-[10px] bg-cyan-500/10 border border-cyan-500/20 rounded px-1.5 py-px font-bold">{p.tag}</span>}
                    </div>
                  </div>
                  <span className="text-white/35 text-[10px] flex-shrink-0">{p.time}</span>
                  <button className="w-7 h-7 rounded-lg hover:bg-white/10 flex items-center justify-center text-white/35 hover:text-white opacity-0 group-hover:opacity-100 transition-all">
                    <MoreVertical className="w-3.5 h-3.5" />
                  </button>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* ── Top categorías (bar) ── */}
      <div className={`${CARD} p-4 sm:p-5`}>
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-white font-bold text-base">Top categorías por ingresos</h3>
            <p className="text-white/40 text-xs mt-0.5">Este mes</p>
          </div>
          <Link href="/admin/analytics" className="text-violet-400 hover:text-violet-300 text-xs font-semibold flex items-center gap-1">
            Ver detalle <ArrowUpRight className="w-3 h-3" />
          </Link>
        </div>
        <div className="h-52">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={topCategories} margin={{ top: 5, right: 5, left: -15, bottom: 0 }}>
              <defs>
                <linearGradient id="gBar" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#a855f7" stopOpacity={0.95} /><stop offset="100%" stopColor="#6366f1" stopOpacity={0.6} /></linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
              <XAxis dataKey="name" stroke="rgba(255,255,255,0.35)" fontSize={11} tickLine={false} axisLine={false} />
              <YAxis stroke="rgba(255,255,255,0.35)" fontSize={11} tickLine={false} axisLine={false} />
              <Tooltip contentStyle={tooltipStyle} cursor={{ fill: "rgba(255,255,255,0.03)" }} />
              <Bar dataKey="ingresos" fill="url(#gBar)" radius={[8, 8, 0, 0]} maxBarSize={64} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* ── Rendimiento por video (table) ── */}
      <div className={`${CARD} overflow-hidden`}>
        <div className="flex items-center justify-between p-4 sm:p-5 border-b border-white/[0.06]">
          <h3 className="text-white font-bold text-base flex items-center gap-2"><Play className="w-4 h-4 text-violet-400" /> Rendimiento por video</h3>
          <Link href="/content" className="text-violet-400 hover:text-violet-300 text-xs font-semibold flex items-center gap-1">
            Ver todos los videos <ArrowUpRight className="w-3 h-3" />
          </Link>
        </div>
        <div className="overflow-x-auto scrollbar-hide">
          <table className="w-full text-sm min-w-[760px]">
            <thead>
              <tr className="text-white/40 text-[10px] uppercase tracking-wider border-b border-white/[0.06]">
                <th className="text-left font-bold px-5 py-3">Video</th>
                <th className="text-right font-bold px-5 py-3">Vistas</th>
                <th className="text-right font-bold px-5 py-3">Ingresos</th>
                <th className="text-right font-bold px-5 py-3">Comisiones</th>
                <th className="text-right font-bold px-5 py-3">CTR</th>
                <th className="text-right font-bold px-5 py-3">Conversiones</th>
                <th className="text-center font-bold px-5 py-3">Estado</th>
              </tr>
            </thead>
            <tbody>
              {videoPerf.map((v) => (
                <tr key={v.title} className="border-b border-white/[0.04] hover:bg-white/[0.02] transition-colors">
                  <td className="px-5 py-3.5">
                    <div className="flex items-center gap-3">
                      <div className={`w-9 h-9 rounded-lg bg-gradient-to-br ${v.grad} flex items-center justify-center flex-shrink-0 ring-1 ring-white/15`}>
                        <Play className="w-4 h-4 text-white fill-white" />
                      </div>
                      <div className="min-w-0">
                        <p className="text-white font-semibold text-[13px] truncate">{v.title}</p>
                        <p className="text-white/40 text-[11px]">{v.cat}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-5 py-3.5 text-right text-white font-semibold">{v.views}</td>
                  <td className="px-5 py-3.5 text-right text-emerald-400 font-bold">{v.rev}</td>
                  <td className="px-5 py-3.5 text-right text-white/80">{v.com}</td>
                  <td className="px-5 py-3.5 text-right text-white/80">{v.ctr}</td>
                  <td className="px-5 py-3.5 text-right text-white/80">{v.conv}</td>
                  <td className="px-5 py-3.5 text-center">
                    <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-300 border border-emerald-500/25">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" /> Activo
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
