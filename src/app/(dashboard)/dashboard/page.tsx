"use client";
import { useState, useRef } from "react";
import Link from "next/link";
import {
  Video, Film, Zap, Mic, Image, BookOpen, ShoppingBag,
  Layout, Users, Globe, Search, ChevronRight, ChevronLeft,
  Star, TrendingUp, Sparkles, Play, Award, Crown,
  BarChart2, MessageSquare, Settings, Download
} from "lucide-react";
import { CATEGORIES } from "@/lib/categories";

// ── Top pill nav ─────────────────────────────────────────────
const topPills = [
  { label: "Video IA",    href: "/categories/generador-video",  color: "bg-pink-500 hover:bg-pink-400",    text: "text-white" },
  { label: "Playlist",    href: "/categories/editor-video",     color: "bg-fuchsia-500 hover:bg-fuchsia-400", text: "text-white" },
  { label: "Automatizar", href: "/categories/automatizaciones",  color: "bg-white/10 hover:bg-white/20 border border-white/20", text: "text-white/80" },
  { label: "Abierto",     href: "/categories/generador-imagen",  color: "bg-green-500 hover:bg-green-400",  text: "text-white" },
  { label: "En Directo",  href: "/affiliate",                   color: "bg-[#1a1d25] hover:bg-white/10 border border-white/10", text: "text-white/70" },
];

// ── Ticker items ─────────────────────────────────────────────
const tickerItems = [
  { initials: "VG", name: "Video Generator Pro", tag: "IA • Nuevo", color: "from-pink-500 to-rose-600" },
  { initials: "EV", name: "Editor de Video HD",  tag: "IA • Popular", color: "from-violet-500 to-purple-600" },
  { initials: "AZ", name: "Auto Clip Suite",     tag: "Herramienta", color: "from-cyan-500 to-blue-600" },
  { initials: "VX", name: "VoiceClone AI",       tag: "Voz • Beta", color: "from-amber-500 to-orange-600" },
  { initials: "IM", name: "ImageAI Studio",      tag: "Imágenes",  color: "from-emerald-500 to-teal-600" },
  { initials: "PM", name: "Prompt Master",       tag: "Cursos",    color: "from-blue-500 to-indigo-600" },
  { initials: "MB", name: "Marca Blanca Pro",    tag: "SaaS",      color: "from-slate-400 to-gray-500" },
  { initials: "AF", name: "Afiliados 30%",       tag: "Comisiones",color: "from-green-500 to-emerald-600" },
  { initials: "CR", name: "Cursos Premium",      tag: "Academia",  color: "from-orange-500 to-red-600" },
  { initials: "LP", name: "Landing Pages",       tag: "Templates", color: "from-fuchsia-500 to-pink-600" },
];

// ── Hero slides ───────────────────────────────────────────────
const heroSlides = [
  {
    title: "CREA. AUTOMATIZA.", accent: "DOMINA TU NEGOCIO.",
    sub: "10 herramientas de IA para creadores y agencias.",
    cta: "Ver Herramientas", href: "/categories/generador-video",
    badge: "🤖 Suite de IA Completa",
    bg: "from-pink-600/40 via-purple-700/30 to-[#0a0b10]",
    orb1: "bg-pink-500/30", orb2: "bg-purple-500/20",
  },
  {
    title: "GANA EL 30%", accent: "DE POR VIDA.",
    sub: "Comisiones recurrentes automáticas con Stripe y PayPal.",
    cta: "Unirme al Programa", href: "/affiliate",
    badge: "💰 Programa de Afiliados",
    bg: "from-green-600/40 via-teal-700/30 to-[#0a0b10]",
    orb1: "bg-green-500/30", orb2: "bg-teal-500/20",
  },
  {
    title: "TU PROPIA", accent: "PLATAFORMA SAAS.",
    sub: "Dominio propio, branding completo, clientes bajo tu marca.",
    cta: "Configurar Marca", href: "/categories/marca-blanca",
    badge: "🏷️ Marca Blanca",
    bg: "from-violet-600/40 via-indigo-700/30 to-[#0a0b10]",
    orb1: "bg-violet-500/30", orb2: "bg-indigo-500/20",
  },
];

// ── Sponsors/Partners ────────────────────────────────────────
const sponsors = [
  { initials: "YF", color: "from-cyan-400 to-blue-600",     name: "YF Auto Clip" },
  { initials: "MP", color: "from-pink-400 to-rose-600",     name: "MediaPro" },
  { initials: "AI", color: "from-purple-400 to-violet-600", name: "AI Studio" },
  { initials: "DM", color: "from-orange-400 to-red-500",    name: "Digital MKT" },
  { initials: "SB", color: "from-green-400 to-teal-600",    name: "SocialBoost" },
  { initials: "CP", color: "from-yellow-400 to-orange-500", name: "ClickPro" },
  { initials: "WL", color: "from-slate-400 to-gray-600",    name: "WhiteLabel" },
  { initials: "VS", color: "from-fuchsia-400 to-pink-600",  name: "VideoSuite" },
];

// ── Main category grid ────────────────────────────────────────
const mainGrid = [
  ...CATEGORIES.map(c => ({ slug: `/categories/${c.slug}`, title: c.title, icon: c.icon, gradient: c.gradient, type: "category" as const })),
  { slug: "/marketplace", title: "Marketplace",  icon: ShoppingBag, gradient: "from-orange-400 to-red-500",    type: "page" as const },
  { slug: "/analytics",   title: "Analytics",    icon: BarChart2,   gradient: "from-blue-400 to-indigo-600",   type: "page" as const },
];

export default function DashboardPage() {
  const [slide, setSlide] = useState(0);
  const tickerRef = useRef<HTMLDivElement>(null);

  const prevSlide = () => setSlide(s => (s - 1 + heroSlides.length) % heroSlides.length);
  const nextSlide = () => setSlide(s => (s + 1) % heroSlides.length);

  const scrollTicker = (dir: "left" | "right") => {
    if (!tickerRef.current) return;
    tickerRef.current.scrollBy({ left: dir === "left" ? -240 : 240, behavior: "smooth" });
  };

  const hero = heroSlides[slide];

  return (
    <div className="space-y-0 -mt-6 -mx-6">

      {/* ── Top Quick-Nav Pills ── */}
      <div className="sticky top-0 z-20 bg-[#080a0f]/90 backdrop-blur border-b border-white/6 px-6 py-2.5 flex items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          {topPills.map((p) => (
            <Link key={p.href} href={p.href}
              className={`${p.color} ${p.text} text-xs font-semibold px-3.5 py-1.5 rounded-full transition-all whitespace-nowrap`}>
              {p.label}
            </Link>
          ))}
        </div>
        <div className="flex items-center gap-1.5 ml-auto">
          <div className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
          <span className="text-white/40 text-xs">En línea</span>
        </div>
      </div>

      {/* ── Ticker Strip ── */}
      <div className="relative border-b border-white/6 bg-[#0a0b10]/60">
        <button onClick={() => scrollTicker("left")}
          className="absolute left-0 top-0 bottom-0 z-10 px-2 bg-gradient-to-r from-[#080a0f] to-transparent flex items-center">
          <ChevronLeft className="w-4 h-4 text-white/40 hover:text-white transition-colors" />
        </button>

        <div ref={tickerRef}
          className="flex items-center gap-3 overflow-x-auto scrollbar-hide px-8 py-2.5"
          style={{ scrollbarWidth: "none" }}>
          {[...tickerItems, ...tickerItems].map((t, i) => (
            <div key={i}
              className="flex items-start gap-2.5 flex-shrink-0 cursor-pointer group hover:bg-white/5 rounded-xl px-3 py-1.5 transition-all">
              <div className={`w-8 h-8 rounded-full bg-gradient-to-br ${t.color} flex items-center justify-center text-[10px] font-black text-white flex-shrink-0`}>
                {t.initials}
              </div>
              <div className="min-w-0">
                <p className="text-white/80 text-[11px] font-semibold leading-none whitespace-nowrap group-hover:text-white transition-colors">{t.name}</p>
                <p className="text-white/35 text-[9px] mt-0.5 whitespace-nowrap">{t.tag}</p>
              </div>
            </div>
          ))}
        </div>

        <button onClick={() => scrollTicker("right")}
          className="absolute right-0 top-0 bottom-0 z-10 px-2 bg-gradient-to-l from-[#080a0f] to-transparent flex items-center">
          <ChevronRight className="w-4 h-4 text-white/40 hover:text-white transition-colors" />
        </button>
      </div>

      {/* ── Hero Banner Slider ── */}
      <div className={`relative overflow-hidden min-h-[220px] bg-gradient-to-br ${hero.bg}`}>
        {/* Orbs */}
        <div className={`absolute -top-16 -right-16 w-72 h-72 ${hero.orb1} rounded-full blur-3xl`} />
        <div className={`absolute bottom-0 left-1/4 w-56 h-56 ${hero.orb2} rounded-full blur-3xl`} />

        {/* Prev/Next */}
        <button onClick={prevSlide}
          className="absolute left-4 top-1/2 -translate-y-1/2 z-10 w-8 h-8 bg-black/30 backdrop-blur border border-white/10 rounded-full flex items-center justify-center hover:bg-black/50 transition-all">
          <ChevronLeft className="w-4 h-4 text-white" />
        </button>
        <button onClick={nextSlide}
          className="absolute right-4 top-1/2 -translate-y-1/2 z-10 w-8 h-8 bg-black/30 backdrop-blur border border-white/10 rounded-full flex items-center justify-center hover:bg-black/50 transition-all">
          <ChevronRight className="w-4 h-4 text-white" />
        </button>

        <div className="relative z-10 px-14 py-10">
          <div className="inline-flex items-center gap-2 bg-white/10 backdrop-blur border border-white/15 rounded-full px-3 py-1 text-xs text-white/80 mb-3">
            <Sparkles className="w-3 h-3 text-yellow-400" />{hero.badge}
          </div>
          <h2 className="text-4xl font-black text-white leading-tight mb-1">
            {hero.title}{" "}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-pink-400 to-fuchsia-400">
              {hero.accent}
            </span>
          </h2>
          <p className="text-white/50 text-sm mb-5 max-w-xl">{hero.sub}</p>
          <div className="flex items-center gap-3">
            <Link href={hero.href}
              className="inline-flex items-center gap-2 bg-pink-500 hover:bg-pink-400 text-white font-bold text-sm px-6 py-2.5 rounded-full transition-all shadow-lg shadow-pink-500/25 hover:-translate-y-0.5">
              {hero.cta} <ChevronRight className="w-4 h-4" />
            </Link>
            <button className="inline-flex items-center gap-2 bg-white/10 border border-white/15 hover:bg-white/15 text-white text-sm px-5 py-2.5 rounded-full transition-all">
              <Play className="w-3.5 h-3.5" /> Ver demo
            </button>
          </div>
        </div>

        {/* Slide dots */}
        <div className="absolute bottom-4 right-6 flex items-center gap-1.5">
          {heroSlides.map((_, i) => (
            <button key={i} onClick={() => setSlide(i)}
              className={`rounded-full transition-all duration-300 ${i === slide ? "w-5 h-2 bg-pink-400" : "w-2 h-2 bg-white/25 hover:bg-white/50"}`} />
          ))}
        </div>
      </div>

      {/* ── Patrocinadores / Socios ── */}
      <div className="px-6 py-3 border-b border-white/6 bg-[#0a0b10]/40">
        <div className="flex items-center justify-between mb-2">
          <span className="text-white/25 text-[9px] font-bold uppercase tracking-widest">PATROCINADORES</span>
          <button className="text-pink-400 text-[10px] hover:underline">Ver todos</button>
        </div>
        <div className="flex items-center gap-3 overflow-x-auto scrollbar-hide pb-1">
          {[...sponsors, ...sponsors].map((s, i) => (
            <div key={i} className="flex flex-col items-center gap-1.5 flex-shrink-0 cursor-pointer group">
              <div className={`w-10 h-10 rounded-full bg-gradient-to-br ${s.color} flex items-center justify-center text-[10px] font-black text-white border-2 border-transparent group-hover:border-white/30 transition-all`}>
                {s.initials}
              </div>
              <span className="text-white/35 text-[9px] whitespace-nowrap group-hover:text-white/60 transition-colors">{s.name}</span>
            </div>
          ))}
        </div>
      </div>

      {/* ── Search Bar ── */}
      <div className="px-6 py-4 bg-[#080a0f]">
        <div className="flex gap-2 max-w-2xl">
          <div className="relative flex-1">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30" />
            <input
              placeholder="Herramientas IA, cursos, afiliados, marca blanca..."
              className="w-full bg-white/6 border border-white/10 rounded-full pl-10 pr-4 py-3 text-sm text-white placeholder:text-white/30 focus:outline-none focus:border-pink-500/50 focus:bg-white/8 transition-all"
            />
          </div>
          <button className="bg-pink-500 hover:bg-pink-400 text-white font-bold px-6 py-3 rounded-full text-sm transition-all shadow-md shadow-pink-500/20 whitespace-nowrap">
            Buscar
          </button>
        </div>
      </div>

      {/* ── MediaPlay Now header ── */}
      <div className="px-6 py-3 text-center border-t border-white/5">
        <p className="text-white/60 text-sm">
          <span className="text-pink-400">🎯</span>{" "}
          <span className="font-bold text-white">MediaPlay Now</span>
        </p>
        <p className="text-white/30 text-xs mt-0.5">Todo el poder del marketing IA, en un solo lugar</p>
      </div>

      {/* ── PRINCIPALES Grid ── */}
      <div className="px-6 pb-8">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Star className="w-4 h-4 text-yellow-400 fill-yellow-400" />
            <span className="text-white font-bold text-sm tracking-wide">PRINCIPALES</span>
          </div>
          <Link href="/admin/categories" className="text-pink-400 text-xs hover:underline flex items-center gap-1">
            Ver todas <ChevronRight className="w-3 h-3" />
          </Link>
        </div>

        <div className="grid grid-cols-4 gap-3 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-6">
          {mainGrid.map((item) => {
            const Icon = item.icon;
            return (
              <Link key={item.slug} href={item.slug}>
                <div className="group flex flex-col items-center justify-center gap-2.5 bg-[#0f1219] border border-white/8 hover:border-pink-500/30 rounded-2xl p-4 cursor-pointer transition-all duration-200 hover:-translate-y-0.5 hover:bg-[#141720] aspect-square">
                  <div className={`w-11 h-11 rounded-2xl bg-gradient-to-br ${item.gradient} flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform duration-200`}>
                    <Icon className="w-5 h-5 text-white" />
                  </div>
                  <span className="text-white/70 text-[11px] font-medium text-center leading-tight group-hover:text-white transition-colors">
                    {item.title}
                  </span>
                </div>
              </Link>
            );
          })}
        </div>

        {/* Ver todas button */}
        <div className="flex justify-center mt-5">
          <Link href="/admin/categories"
            className="flex items-center gap-2 text-white/40 hover:text-white/70 text-xs transition-colors border border-white/10 hover:border-white/20 px-5 py-2.5 rounded-full">
            <Search className="w-3.5 h-3.5" /> Ver todas las categorías
          </Link>
        </div>
      </div>

    </div>
  );
}
