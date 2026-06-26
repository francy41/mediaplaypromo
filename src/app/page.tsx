"use client";
import Link from "next/link";
import { useState } from "react";
import {
  ArrowRight, Menu, X, Sparkles, Sun, Moon, Play, Search,
  Zap, ShieldCheck, Users, Rocket, Bookmark, Star,
} from "lucide-react";
import { CATEGORIES } from "@/lib/categories";
import { ThemeToggle } from "@/components/ThemeToggle";
import { useTheme } from "@/lib/theme-context";
import { MobileBottomNav } from "@/components/MobileBottomNav";
import { useStats, formatCount } from "@/lib/stats";
import { SocialLinks } from "@/components/SocialLinks";
import { BrandLogo } from "@/components/BrandLogo";

/* ── Showcase placeholders (gradientes, sin assets externos) ── */
const HERO_VIDEOS = [
  { title: "Cyberpunk City",   dur: "00:06", g: "from-fuchsia-600 via-purple-600 to-indigo-800" },
  { title: "Cinematic Space",  dur: "00:07", g: "from-slate-600 via-indigo-800 to-black" },
  { title: "Night Drive",      dur: "00:05", g: "from-blue-600 via-cyan-700 to-slate-900" },
  { title: "Samurai Legacy",   dur: "00:06", g: "from-red-600 via-rose-800 to-black" },
  { title: "Surreal Dream",    dur: "00:05", g: "from-violet-600 via-fuchsia-700 to-slate-900" },
  { title: "Portrait Film",    dur: "00:04", g: "from-amber-500 via-rose-700 to-purple-800" },
];

const SAMPLE_VIDEOS = [
  { title: "Cyberpunk Runway", dur: "00:07", badge: "Popular", g: "from-fuchsia-600 to-purple-800" },
  { title: "Epic Nature",      dur: "00:06", badge: "Nuevo",   g: "from-emerald-600 to-teal-800" },
  { title: "Car Commercial",   dur: "00:06", badge: "Popular", g: "from-slate-600 to-blue-900" },
  { title: "Fantasy World",    dur: "00:06", badge: "Nuevo",   g: "from-indigo-600 to-violet-800" },
  { title: "Product Showcase", dur: "00:06", badge: "",        g: "from-amber-500 to-orange-700" },
  { title: "AI Short Film",    dur: "00:06", badge: "",        g: "from-rose-600 to-red-800" },
];

const FEATURES = [
  { title: "Rápido",       desc: "Genera en segundos",    icon: Zap,        color: "text-yellow-400", bg: "from-yellow-500/15 to-orange-500/5", border: "border-yellow-500/20" },
  { title: "Profesional",  desc: "Calidad de estudio",    icon: Star,       color: "text-blue-400",   bg: "from-blue-500/15 to-cyan-500/5",     border: "border-blue-500/20" },
  { title: "Seguro",       desc: "Tus datos protegidos",  icon: ShieldCheck,color: "text-green-400",  bg: "from-green-500/15 to-emerald-500/5", border: "border-green-500/20" },
  { title: "Colaborativo", desc: "Trabaja en equipo",     icon: Users,      color: "text-fuchsia-400",bg: "from-fuchsia-500/15 to-pink-500/5",  border: "border-fuchsia-500/20" },
];

function CategorySidebar({ onItemClick }: { onItemClick?: () => void }) {
  const cats = CATEGORIES.filter((c) => c.enabled);
  return (
    <nav className="category-sidebar-nav h-full flex flex-col bg-gradient-to-b from-[#0b0d12] via-[#0a0c10] to-[#080a0e] relative">
      <div className="pointer-events-none absolute -top-24 -left-10 w-56 h-56 bg-violet-500/10 rounded-full blur-3xl" />
      <div className="pointer-events-none absolute bottom-24 -right-10 w-48 h-48 bg-fuchsia-500/10 rounded-full blur-3xl" />

      <div className="relative px-3.5 py-3 border-b border-white/10 bg-gradient-to-br from-violet-500/5 via-transparent to-fuchsia-500/5 flex-shrink-0">
        <div className="flex items-center gap-1.5 mb-1">
          <div className="w-5 h-5 rounded-md bg-gradient-to-br from-violet-400 to-fuchsia-600 flex items-center justify-center shadow shadow-violet-500/30">
            <Sparkles className="w-2.5 h-2.5 text-white" />
          </div>
          <p className="text-transparent bg-clip-text bg-gradient-to-r from-violet-300 to-fuchsia-400 text-[10px] font-black uppercase tracking-[0.18em]">
            Herramientas
          </p>
        </div>
        <p className="text-white/85 text-[12px] font-bold leading-tight">
          {cats.length} herramientas <span className="text-violet-400">IA</span>
        </p>
      </div>

      <div className="relative flex-1 overflow-y-auto py-2 px-1.5 space-y-0.5 scrollbar-hide">
        {cats.map((cat) => {
          const Icon = cat.icon;
          return (
            <Link
              key={cat.slug}
              href={`/categories/${cat.slug}`}
              onClick={onItemClick}
              className="relative flex items-center gap-2 px-2 py-1.5 rounded-lg text-white/65 hover:text-white hover:bg-white/[0.06] transition-all duration-200 group overflow-hidden"
            >
              <div className={`absolute inset-0 bg-gradient-to-r ${cat.bgCard} opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none rounded-lg`} />
              <div className={`absolute left-0 top-1/2 -translate-y-1/2 h-0 group-hover:h-5 w-[2px] rounded-r-full bg-gradient-to-b ${cat.gradient} transition-all duration-300`} />
              <div className={`relative w-7 h-7 rounded-lg bg-gradient-to-br ${cat.gradient} flex items-center justify-center flex-shrink-0 shadow-md ${cat.glowColor} group-hover:scale-105 transition-transform duration-300 ring-1 ring-white/15`}>
                <Icon className="w-3.5 h-3.5 text-white drop-shadow" />
              </div>
              <span className="relative text-[12px] font-semibold leading-tight truncate flex-1 text-white/85 group-hover:text-white">
                {cat.title}
              </span>
              {cat.premium && (
                <span className="relative text-[8px] font-black bg-gradient-to-r from-yellow-400 to-orange-500 text-black rounded-full px-1.5 py-px flex-shrink-0 shadow shadow-orange-500/30">
                  PRO
                </span>
              )}
            </Link>
          );
        })}
      </div>

      <div className="relative px-2.5 pt-2 pb-3 border-t border-white/10 bg-gradient-to-t from-violet-500/5 to-transparent space-y-2 flex-shrink-0">
        <Link
          href="/register"
          onClick={onItemClick}
          className="group flex items-center justify-center gap-1.5 bg-gradient-to-r from-violet-500 to-fuchsia-600 hover:from-violet-400 hover:to-fuchsia-500 text-white font-bold text-[11px] px-3 py-2 rounded-lg transition-all shadow-md shadow-violet-500/30 hover:shadow-violet-500/50 hover:-translate-y-0.5"
        >
          <Sparkles className="w-3 h-3" />
          Crear cuenta
          <ArrowRight className="w-3 h-3 group-hover:translate-x-0.5 transition-transform" />
        </Link>
        <SidebarThemeSwitcher />
      </div>
    </nav>
  );
}

function SidebarThemeSwitcher() {
  const { theme, setTheme } = useTheme();
  return (
    <div className="flex items-center gap-1 bg-white/[0.04] border border-white/10 rounded-xl p-1 theme-toggle-btn">
      <button
        onClick={() => setTheme("light")}
        className={`flex-1 flex items-center justify-center gap-1.5 py-1.5 rounded-lg text-[11px] font-bold transition-all ${
          theme === "light" ? "bg-gradient-to-r from-yellow-300 to-orange-400 text-black shadow-md" : "text-white/55 hover:text-white"
        }`}
      >
        <Sun className="w-3.5 h-3.5" /> Claro
      </button>
      <button
        onClick={() => setTheme("dark")}
        className={`flex-1 flex items-center justify-center gap-1.5 py-1.5 rounded-lg text-[11px] font-bold transition-all ${
          theme === "dark" ? "bg-gradient-to-r from-violet-500 to-fuchsia-600 text-white shadow-md" : "text-white/55 hover:text-white"
        }`}
      >
        <Moon className="w-3.5 h-3.5" /> Oscuro
      </button>
    </div>
  );
}

/* ── Tarjeta de video portrait (hero carousel) ── */
function VideoCard({ title, dur, g, portrait }: { title: string; dur: string; g: string; portrait?: boolean }) {
  return (
    <div className={`group relative ${portrait ? "w-[150px] sm:w-[170px] aspect-[9/16]" : "aspect-video"} rounded-2xl overflow-hidden border border-white/10 flex-shrink-0 cursor-pointer`}>
      <div className={`absolute inset-0 bg-gradient-to-br ${g}`} />
      <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-black/10" />
      {/* grain / shimmer */}
      <div className="absolute inset-0 opacity-0 group-hover:opacity-100 bg-gradient-to-br from-transparent via-white/10 to-transparent transition-opacity duration-500" />
      {/* play */}
      <div className="absolute inset-0 flex items-center justify-center">
        <div className="w-11 h-11 rounded-full bg-black/40 backdrop-blur border border-white/30 flex items-center justify-center group-hover:scale-110 group-hover:bg-black/60 transition-all">
          <Play className="w-4 h-4 text-white fill-white ml-0.5" />
        </div>
      </div>
      {/* footer */}
      <div className="absolute bottom-0 left-0 right-0 p-2.5 flex items-end justify-between">
        <span className="text-white text-[11px] font-bold drop-shadow leading-tight">{title}</span>
        <span className="text-white/80 text-[10px] font-semibold bg-black/40 rounded px-1.5 py-0.5 backdrop-blur">{dur}</span>
      </div>
    </div>
  );
}

export default function LandingPage() {
  const [menuOpen, setMenuOpen] = useState(false);
  const { total } = useStats();
  const tools = CATEGORIES.filter((c) => c.enabled);

  return (
    <div className="min-h-screen bg-[#070809] text-white">
      {/* Top Nav */}
      <nav className="fixed top-0 left-0 right-0 h-16 bg-[#070809]/85 backdrop-blur border-b border-white/8 flex items-center px-4 sm:px-6 lg:px-8 z-50 gap-3">
        <button
          aria-label="Menú"
          onClick={() => setMenuOpen(true)}
          className="lg:hidden w-9 h-9 rounded-lg bg-white/5 border border-white/10 flex items-center justify-center hover:bg-white/10 transition-colors flex-shrink-0"
        >
          <Menu className="w-4 h-4 text-white" />
        </button>
        <div className="flex items-center gap-2.5 flex-shrink-0">
          <BrandLogo className="w-9 h-9 drop-shadow-lg" />
          <div className="hidden sm:block">
            <div className="text-white font-bold text-sm leading-none">MediaPlay<span className="font-medium text-white/80">Promo</span></div>
            <div className="text-white/35 text-[9px] font-semibold tracking-widest leading-none mt-0.5">.COM</div>
          </div>
        </div>

        {/* Search (decorativa → /register) */}
        <Link href="/register" className="hidden md:flex items-center gap-2 flex-1 max-w-md mx-auto bg-white/5 border border-white/10 hover:border-white/20 rounded-xl px-3 py-2 text-white/40 text-sm transition-colors">
          <Search className="w-4 h-4" />
          <span className="flex-1">Buscar herramientas, plantillas, estilos...</span>
          <kbd className="text-[10px] bg-white/10 border border-white/15 rounded px-1.5 py-0.5 font-mono">Ctrl K</kbd>
        </Link>

        <div className="ml-auto flex items-center gap-1.5 sm:gap-3 flex-shrink-0">
          <Link href="/pricing" className="hidden sm:inline-flex items-center text-white/60 hover:text-white text-sm transition-colors px-2 font-medium">
            Precios
          </Link>
          <ThemeToggle compact />
          <Link href="/login" className="hidden sm:inline-flex items-center text-white/60 hover:text-white text-sm transition-colors px-2">
            Iniciar sesión
          </Link>
          <Link
            href="/register"
            className="bg-gradient-to-r from-violet-500 to-fuchsia-600 hover:opacity-90 text-white font-semibold text-[11px] sm:text-sm px-3 sm:px-4 py-2 rounded-lg transition-all whitespace-nowrap shadow-lg shadow-violet-500/30"
          >
            Actualiza tu plan
          </Link>
        </div>
      </nav>

      {/* Desktop sidebar */}
      <aside className="hidden lg:flex fixed top-16 left-0 w-56 xl:w-60 h-[calc(100vh-4rem)] border-r border-white/10 shadow-2xl shadow-black/60 z-40">
        <CategorySidebar />
      </aside>

      {/* Mobile drawer */}
      {menuOpen && (
        <>
          <div className="lg:hidden fixed inset-0 bg-black/60 backdrop-blur-sm z-50" onClick={() => setMenuOpen(false)} />
          <aside className="lg:hidden fixed top-0 left-0 w-72 max-w-[85vw] h-full bg-[#0a0c0f] border-r border-white/10 z-50 flex flex-col animate-in slide-in-from-left duration-200">
            <div className="flex items-center justify-between px-4 h-16 border-b border-white/8">
              <div className="flex items-center gap-2.5">
                <BrandLogo className="w-8 h-8" />
                <div className="text-white font-bold text-sm">MediaPlay<span className="font-medium text-white/80">Promo</span></div>
              </div>
              <button aria-label="Cerrar" onClick={() => setMenuOpen(false)} className="w-8 h-8 rounded-lg hover:bg-white/10 flex items-center justify-center">
                <X className="w-4 h-4 text-white" />
              </button>
            </div>
            <div className="flex-1 overflow-hidden">
              <CategorySidebar onItemClick={() => setMenuOpen(false)} />
            </div>
          </aside>
        </>
      )}

      {/* Main */}
      <div className="lg:pl-56 xl:pl-60">
        <div className="px-4 sm:px-6 lg:px-8 py-5 sm:py-7 max-w-[1400px] mx-auto space-y-10 sm:space-y-14">

          {/* ── HERO ── */}
          <section className="relative overflow-hidden rounded-3xl border border-violet-500/25 bg-gradient-to-br from-[#160a2e] via-[#1a0b33] to-[#0c0618] p-6 sm:p-8 lg:p-10">
            <div className="absolute -top-24 -right-16 w-96 h-96 bg-fuchsia-500/20 rounded-full blur-3xl pointer-events-none" />
            <div className="absolute -bottom-24 -left-16 w-80 h-80 bg-violet-500/20 rounded-full blur-3xl pointer-events-none" />
            <div className="relative grid lg:grid-cols-[1fr_auto] gap-8 items-center">
              {/* Text */}
              <div className="max-w-xl">
                <span className="inline-flex items-center gap-1.5 bg-white/10 border border-white/15 rounded-full px-2.5 py-1 text-[10px] sm:text-[11px] font-bold text-violet-200 mb-4">
                  <span className="bg-gradient-to-r from-violet-400 to-fuchsia-400 text-transparent bg-clip-text font-black">NUEVO</span>
                  Plataforma todo en uno con IA
                </span>
                <h1 className="text-4xl sm:text-5xl lg:text-6xl font-black leading-[0.95] tracking-tight">
                  TU EQUIPO INVISIBLE<br />
                  <span className="text-transparent bg-clip-text bg-gradient-to-r from-violet-400 via-fuchsia-400 to-pink-400">TRABAJA POR TI.</span>
                </h1>
                <p className="text-white/60 text-sm sm:text-base mt-4 max-w-md">
                  Crea videos, imágenes, audios y campañas increíbles con inteligencia artificial. Rápido, fácil y profesional.
                </p>
                <div className="flex flex-wrap items-center gap-3 mt-6">
                  <Link href="/register" className="shine-btn inline-flex items-center gap-2 bg-gradient-to-r from-violet-500 to-fuchsia-600 hover:opacity-90 text-white font-bold text-sm px-5 py-3 rounded-xl shadow-lg shadow-violet-500/30 transition-all hover:-translate-y-0.5">
                    <Sparkles className="w-4 h-4" /> Comenzar ahora <ArrowRight className="w-4 h-4" />
                  </Link>
                  <Link href="/categories/generador-video" className="inline-flex items-center gap-2 bg-white/5 border border-white/15 hover:bg-white/10 text-white font-semibold text-sm px-5 py-3 rounded-xl transition-colors">
                    <Play className="w-4 h-4" /> Explorar herramientas
                  </Link>
                </div>
                <div className="flex items-center gap-3 mt-6">
                  <div className="flex -space-x-2">
                    {["from-fuchsia-400 to-purple-500", "from-cyan-400 to-blue-500", "from-amber-400 to-orange-500", "from-emerald-400 to-teal-500", "from-pink-400 to-rose-500"].map((g, i) => (
                      <div key={i} className={`w-7 h-7 rounded-full bg-gradient-to-br ${g} ring-2 ring-[#160a2e]`} />
                    ))}
                  </div>
                  <p className="text-white/55 text-xs"><span className="text-white font-bold">+2.5K creadores</span> ya están creando</p>
                </div>
              </div>

              {/* Video carousel */}
              <div className="relative -mx-2 lg:mx-0">
                <div className="flex gap-3 overflow-x-auto scrollbar-hide px-2 pb-2 lg:max-w-[560px]">
                  {HERO_VIDEOS.map((v) => (
                    <VideoCard key={v.title} title={v.title} dur={v.dur} g={v.g} portrait />
                  ))}
                </div>
              </div>
            </div>
          </section>

          {/* ── HERRAMIENTAS ── */}
          <section>
            <div className="flex items-end justify-between mb-5 gap-3">
              <div>
                <h2 className="text-xl sm:text-2xl font-black">Todas las herramientas que necesitas</h2>
                <p className="text-white/45 text-sm mt-0.5">{tools.length} herramientas de IA en una sola plataforma</p>
              </div>
              <Link href="/register" className="hidden sm:inline-flex items-center gap-1 text-violet-400 hover:text-violet-300 text-sm font-semibold whitespace-nowrap">
                Ver todas <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
              {tools.map((cat) => {
                const Icon = cat.icon;
                return (
                  <Link
                    key={cat.slug}
                    href={`/categories/${cat.slug}`}
                    className="group relative overflow-hidden flex items-center gap-3 rounded-2xl border border-white/10 bg-white/[0.03] hover:bg-white/[0.06] hover:border-white/20 p-3.5 transition-all hover:-translate-y-0.5"
                  >
                    <div className={`absolute inset-0 bg-gradient-to-r ${cat.bgCard} opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none`} />
                    <div className={`relative w-11 h-11 rounded-xl bg-gradient-to-br ${cat.gradient} flex items-center justify-center flex-shrink-0 shadow-lg ${cat.glowColor} ring-1 ring-white/15 group-hover:scale-105 transition-transform`}>
                      <Icon className="w-5 h-5 text-white drop-shadow" />
                    </div>
                    <div className="relative min-w-0 flex-1">
                      <h3 className="text-white font-bold text-[13px] leading-tight truncate">{cat.title}</h3>
                      <p className="text-white/45 text-[11px] leading-tight truncate">{cat.subtitle}</p>
                    </div>
                    {cat.premium && (
                      <span className="relative text-[8px] font-black bg-gradient-to-r from-yellow-400 to-orange-500 text-black rounded-full px-1.5 py-0.5 flex-shrink-0">PRO</span>
                    )}
                  </Link>
                );
              })}
            </div>
          </section>

          {/* ── VIDEOS DE MUESTRA ── */}
          <section>
            <div className="flex items-end justify-between mb-5 gap-3">
              <div>
                <h2 className="text-xl sm:text-2xl font-black">Videos de muestra</h2>
                <p className="text-white/45 text-sm mt-0.5">Hechos 100% con IA en la plataforma</p>
              </div>
              <Link href="/register" className="hidden sm:inline-flex items-center gap-1 text-violet-400 hover:text-violet-300 text-sm font-semibold whitespace-nowrap">
                Ver más videos <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
              {SAMPLE_VIDEOS.map((v) => (
                <div key={v.title} className="group relative aspect-[4/5] rounded-2xl overflow-hidden border border-white/10 cursor-pointer">
                  <div className={`absolute inset-0 bg-gradient-to-br ${v.g}`} />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-transparent to-black/10" />
                  {v.badge && (
                    <span className={`absolute top-2 left-2 text-[9px] font-black px-2 py-0.5 rounded-full ${v.badge === "Popular" ? "bg-fuchsia-500 text-white" : "bg-cyan-500 text-black"}`}>
                      {v.badge}
                    </span>
                  )}
                  <button className="absolute top-2 right-2 w-7 h-7 rounded-lg bg-black/40 backdrop-blur border border-white/20 flex items-center justify-center text-white/70 hover:text-white opacity-0 group-hover:opacity-100 transition-opacity">
                    <Bookmark className="w-3.5 h-3.5" />
                  </button>
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="w-11 h-11 rounded-full bg-black/40 backdrop-blur border border-white/30 flex items-center justify-center group-hover:scale-110 transition-transform">
                      <Play className="w-4 h-4 text-white fill-white ml-0.5" />
                    </div>
                  </div>
                  <div className="absolute bottom-0 left-0 right-0 p-2.5 flex items-end justify-between">
                    <span className="text-white text-[11px] font-bold drop-shadow leading-tight">{v.title}</span>
                    <span className="text-white/80 text-[10px] font-semibold bg-black/40 rounded px-1.5 py-0.5 backdrop-blur">{v.dur}</span>
                  </div>
                </div>
              ))}
            </div>
          </section>

          {/* ── FEATURES ── */}
          <section className="grid lg:grid-cols-[1.2fr_2fr] gap-3">
            <div className="relative overflow-hidden rounded-3xl border border-violet-500/25 bg-gradient-to-br from-[#160a2e] to-[#0c0618] p-6 flex flex-col justify-center">
              <div className="absolute -top-16 -right-12 w-56 h-56 bg-violet-500/20 rounded-full blur-3xl pointer-events-none" />
              <div className="relative">
                <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-violet-500 to-fuchsia-600 flex items-center justify-center shadow-lg shadow-violet-500/30 mb-4">
                  <Rocket className="w-6 h-6 text-white" />
                </div>
                <h2 className="text-2xl font-black leading-tight">Potencia tu creatividad<br /><span className="text-transparent bg-clip-text bg-gradient-to-r from-violet-400 to-fuchsia-400">sin límites</span></h2>
                <p className="text-white/55 text-sm mt-2 mb-5">Miles de creadores confían en MediaPlayPromo para crear contenido profesional en minutos.</p>
                <Link href="/register" className="inline-flex items-center gap-2 bg-gradient-to-r from-violet-500 to-fuchsia-600 hover:opacity-90 text-white font-bold text-sm px-5 py-2.5 rounded-xl shadow-lg shadow-violet-500/30 transition-all">
                  <Sparkles className="w-4 h-4" /> Empezar gratis
                </Link>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              {FEATURES.map((f) => {
                const Icon = f.icon;
                return (
                  <div key={f.title} className={`rounded-2xl border ${f.border} bg-gradient-to-br ${f.bg} p-5 flex flex-col justify-center`}>
                    <Icon className={`w-7 h-7 ${f.color} mb-3`} />
                    <h3 className="text-white font-bold text-base">{f.title}</h3>
                    <p className="text-white/50 text-sm mt-0.5">{f.desc}</p>
                  </div>
                );
              })}
            </div>
          </section>

          {/* counter strip */}
          <p className="text-center text-white/45 text-xs">
            <span className="text-white font-bold text-base">{formatCount(total)}</span> generaciones realizadas en la plataforma
            <span className="inline-block w-1.5 h-1.5 rounded-full bg-green-400 ml-2 animate-pulse" />
          </p>
        </div>

        {/* Footer */}
        <footer className="border-t border-white/8 px-4 sm:px-6 lg:px-8 py-8 mt-6">
          <div className="max-w-6xl mx-auto flex flex-col items-center gap-5">
            <div className="text-center">
              <p className="text-white/45 text-xs font-semibold mb-3">Síguenos en redes</p>
              <SocialLinks variant="footer" className="justify-center" />
            </div>
            <div className="flex flex-wrap items-center justify-center gap-x-4 gap-y-1.5 text-[11px] text-white/40">
              <Link href="/pricing" className="hover:text-white transition-colors">Precios</Link>
              <Link href="/terms" className="hover:text-white transition-colors">Términos</Link>
              <Link href="/privacy" className="hover:text-white transition-colors">Privacidad</Link>
              <Link href="/refunds" className="hover:text-white transition-colors">Reembolsos</Link>
              <Link href="/cookies" className="hover:text-white transition-colors">Cookies</Link>
              <Link href="/legal" className="hover:text-white transition-colors">Aviso Legal</Link>
            </div>
            <p className="text-white/30 text-xs">© 2025 MediaPlayPromo.com — Todos los derechos reservados</p>
          </div>
        </footer>
      </div>

      <MobileBottomNav onOpenCategories={() => setMenuOpen(true)} variant="public" />
    </div>
  );
}
