"use client";
import { useState } from "react";
import Link from "next/link";
import {
  Search, ChevronRight, ChevronLeft,
  Star, Sparkles, Play, BarChart2
} from "lucide-react";
import { CATEGORIES } from "@/lib/categories";


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

// ── Main category grid ────────────────────────────────────────
const mainGrid = [
  ...CATEGORIES.map(c => ({ slug: `/categories/${c.slug}`, title: c.title, icon: c.icon, gradient: c.gradient, type: "category" as const })),
  { slug: "/analytics",   title: "Analytics",    icon: BarChart2,   gradient: "from-blue-400 to-indigo-600",   type: "page" as const },
];

export default function DashboardPage() {
  const [slide, setSlide] = useState(0);

  const prevSlide = () => setSlide(s => (s - 1 + heroSlides.length) % heroSlides.length);
  const nextSlide = () => setSlide(s => (s + 1) % heroSlides.length);

  const hero = heroSlides[slide];

  return (
    <div className="space-y-0 -mt-6 -mx-6">

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
