"use client";
import { Check, ArrowRight, Sparkles } from "lucide-react";
import type { SubProduct } from "@/lib/products";

interface Props {
  subProduct: SubProduct;
}

/** Mapa de temas → colores Tailwind */
const THEME_STYLES = {
  blue: {
    bgGradient: "from-[#070d1f] via-[#0a1530] to-[#050b1c]",
    titleAccent: "text-yellow-400",
    accentBar: "bg-yellow-400",
    boxBg: "from-yellow-300 via-yellow-400 to-orange-500",
    iconBox: "from-cyan-400 to-blue-600",
    iconBoxBorder: "border-cyan-500/30",
    cardBorder: "border-blue-500/25",
    cardBg: "from-blue-500/10 to-cyan-500/5",
    ctaBg: "bg-yellow-400 hover:bg-yellow-300 text-black",
    glowOrb: "bg-blue-500/30",
    glowOrb2: "bg-cyan-500/20",
    accentText: "text-cyan-400",
    boxRing: "ring-yellow-400/30",
  },
  red: {
    bgGradient: "from-[#1a0606] via-[#2c0a0a] to-[#0d0303]",
    titleAccent: "text-red-500",
    accentBar: "bg-red-500",
    boxBg: "from-red-500 via-red-600 to-rose-700",
    iconBox: "from-red-500 to-rose-600",
    iconBoxBorder: "border-red-500/30",
    cardBorder: "border-red-500/25",
    cardBg: "from-red-500/10 to-rose-500/5",
    ctaBg: "bg-red-600 hover:bg-red-500 text-white",
    glowOrb: "bg-red-500/30",
    glowOrb2: "bg-rose-500/20",
    accentText: "text-red-400",
    boxRing: "ring-red-500/30",
  },
  purple: {
    bgGradient: "from-[#0d0620] via-[#1a0c3a] to-[#08041a]",
    titleAccent: "text-violet-400",
    accentBar: "bg-violet-500",
    boxBg: "from-violet-500 via-purple-600 to-fuchsia-700",
    iconBox: "from-violet-500 to-purple-700",
    iconBoxBorder: "border-violet-500/30",
    cardBorder: "border-violet-500/25",
    cardBg: "from-violet-500/10 to-purple-500/5",
    ctaBg: "bg-violet-600 hover:bg-violet-500 text-white",
    glowOrb: "bg-violet-500/30",
    glowOrb2: "bg-purple-500/20",
    accentText: "text-violet-400",
    boxRing: "ring-violet-500/30",
  },
  orange: {
    bgGradient: "from-[#1a0a04] via-[#2c1408] to-[#0d0502]",
    titleAccent: "text-orange-400",
    accentBar: "bg-orange-500",
    boxBg: "from-orange-400 via-orange-500 to-red-600",
    iconBox: "from-orange-400 to-red-500",
    iconBoxBorder: "border-orange-500/30",
    cardBorder: "border-orange-500/25",
    cardBg: "from-orange-500/10 to-red-500/5",
    ctaBg: "bg-orange-500 hover:bg-orange-400 text-black",
    glowOrb: "bg-orange-500/30",
    glowOrb2: "bg-red-500/20",
    accentText: "text-orange-400",
    boxRing: "ring-orange-400/30",
  },
} as const;

export function YFAutoClipDeepSections({ subProduct }: Props) {
  if (!subProduct.deep) return null;

  const deep = subProduct.deep;
  const t = THEME_STYLES[deep.theme];
  const Icon = subProduct.icon;

  // Mapeo de tema → color de fondo base (para style inline que protege del light-mode flip)
  const bgBase = {
    blue:   "#070d1f",
    red:    "#1a0606",
    purple: "#0d0620",
    orange: "#1a0a04",
  }[deep.theme];

  return (
    <section
      className={`cinematic-dark relative overflow-hidden rounded-3xl border ${t.iconBoxBorder} bg-gradient-to-br ${t.bgGradient}`}
      style={{ backgroundColor: bgBase, color: "white" }}
    >
      {/* Decorative orbs */}
      <div className={`absolute -top-32 -right-32 w-96 h-96 ${t.glowOrb} rounded-full blur-3xl pointer-events-none float-slow`} />
      <div className={`absolute -bottom-32 -left-32 w-80 h-80 ${t.glowOrb2} rounded-full blur-3xl pointer-events-none float-soft`} />
      <div className="particles-bg" />

      {/* ── BLOCK 1: Hero del subproducto con box 3D ── */}
      <div className="relative grid grid-cols-1 lg:grid-cols-[1fr_auto] gap-6 lg:gap-10 p-6 sm:p-10 lg:p-14 items-center">
        <div className="space-y-5 min-w-0">
          {/* Tag superior */}
          <div className="text-white/65 text-[10px] sm:text-xs font-bold tracking-[0.25em] uppercase">
            YF AUTO CLIP
          </div>

          {/* Headline gigante */}
          <h2 className="text-4xl sm:text-5xl lg:text-7xl font-black leading-[0.95] tracking-tight">
            <span className="text-white block">{deep.headline.split(" ").slice(0, 2).join(" ")}</span>
            <span className={`${t.titleAccent} block`}>{deep.headline.split(" ").slice(2).join(" ") || ""}</span>
          </h2>

          {/* Subtítulo gradient */}
          {deep.headlineAccent && (
            <p className="text-white text-base sm:text-xl lg:text-2xl font-black tracking-tight max-w-xl">
              <span className={t.accentText}>{deep.headlineAccent}</span>
            </p>
          )}

          {/* Descripción */}
          <p className="text-white/65 text-sm sm:text-base max-w-md leading-relaxed">
            {deep.description}
          </p>
        </div>

        {/* 3D Box visual */}
        <div className="relative flex items-center justify-center lg:justify-end">
          <div className="relative w-48 sm:w-56 lg:w-64 aspect-[3/4]">
            {/* Box principal */}
            <div className={`relative w-full h-full rounded-3xl bg-gradient-to-br ${t.boxBg} shadow-2xl ring-2 ${t.boxRing} overflow-hidden`}>
              {/* Glow inside */}
              <div className="absolute inset-0 bg-gradient-to-br from-white/20 via-transparent to-transparent" />
              {/* Logo YF */}
              <div className="absolute top-4 left-1/2 -translate-x-1/2 text-center">
                <p className="text-white text-[11px] font-bold tracking-[0.25em] uppercase opacity-90">YF AUTO CLIP</p>
              </div>
              {/* Centro - icono grande */}
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="text-center">
                  <p className="text-white font-black text-6xl tracking-tighter drop-shadow-2xl">YF</p>
                  <p className="text-white/90 text-[10px] font-bold tracking-[0.3em] uppercase mt-1">Auto Clip</p>
                </div>
              </div>
              {/* Bottom badge con nombre del subproducto */}
              <div className="absolute bottom-5 left-4 right-4">
                <div className="bg-black/40 backdrop-blur border border-white/30 rounded-lg py-2 text-center">
                  <p className="text-white text-[10px] sm:text-xs font-black tracking-widest uppercase">{subProduct.name}</p>
                </div>
              </div>
            </div>

            {/* Floating icon decorativo */}
            <div className={`absolute -top-4 -right-4 w-16 h-16 rounded-full bg-gradient-to-br ${t.iconBox} flex items-center justify-center shadow-xl ring-2 ring-white/30 float-soft`}>
              <Icon className="w-7 h-7 text-white drop-shadow" />
            </div>
          </div>
        </div>
      </div>

      {/* ── BLOCK 2: 5 features con iconos ── */}
      <div className="relative border-t border-white/8 px-6 sm:px-10 lg:px-14 py-8 sm:py-10">
        <div className={`glass-card rounded-2xl border ${t.cardBorder} bg-gradient-to-br ${t.cardBg} p-5 sm:p-6`}>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4 sm:gap-6">
            {deep.featuresWithIcons.map((f) => {
              const FIcon = f.icon;
              return (
                <div key={f.title} className="relative">
                  <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${t.iconBox} flex items-center justify-center mb-2.5 shadow-lg ring-1 ring-white/15`}>
                    <FIcon className="w-5 h-5 text-white" />
                  </div>
                  <h3 className="text-white font-black text-[11px] sm:text-xs mb-1 tracking-wider uppercase">{f.title}</h3>
                  <p className="text-white/55 text-[10px] sm:text-[11px] leading-snug">{f.description}</p>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* ── BLOCK 3: "Por qué usar" (5 columnas) ── */}
      {deep.why && (
        <div className="relative px-6 sm:px-10 lg:px-14 pb-8">
          <div className="text-center mb-6 sm:mb-7">
            <h3 className="text-white font-black text-xl sm:text-2xl lg:text-3xl tracking-tight">
              ¿POR QUÉ USAR <span className={t.titleAccent}>{subProduct.name}</span>?
            </h3>
          </div>

          <div className={`bg-black/30 backdrop-blur border ${t.cardBorder} rounded-2xl p-5 sm:p-6`}>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4 sm:gap-6">
              {deep.why.map((w) => {
                const WIcon = w.icon;
                return (
                  <div key={w.title} className="text-center">
                    <div className={`w-10 h-10 mx-auto rounded-xl bg-gradient-to-br ${t.iconBox} flex items-center justify-center mb-2 shadow-lg`}>
                      <WIcon className="w-5 h-5 text-white" />
                    </div>
                    <h4 className="text-white font-black text-[10px] sm:text-xs uppercase tracking-wider mb-1 leading-tight">{w.title}</h4>
                    <p className="text-white/50 text-[10px] leading-snug">{w.description}</p>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* ── BLOCK 4: Workflow "Así de fácil" con flechas ── */}
      <div className="relative px-6 sm:px-10 lg:px-14 pb-8">
        <div className={`bg-gradient-to-r from-white/[0.03] via-white/[0.05] to-white/[0.03] border ${t.cardBorder} rounded-2xl p-5 sm:p-6`}>
          <div className="flex items-center gap-2 mb-4">
            <span className={`text-[10px] sm:text-xs font-black uppercase tracking-[0.2em] ${t.accentText}`}>ASÍ DE FÁCIL:</span>
            <div className={`flex-1 h-px ${t.accentBar}`} />
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-2 items-center">
            {deep.workflow.map((s, i) => {
              const SIcon = s.icon;
              const isLast = i === deep.workflow.length - 1;
              return (
                <div key={i} className="flex items-center gap-2 sm:gap-1">
                  <div className="flex-1 flex items-center gap-2.5 min-w-0">
                    <div className={`w-9 h-9 sm:w-10 sm:h-10 rounded-full bg-gradient-to-br ${t.iconBox} flex items-center justify-center shadow-lg flex-shrink-0`}>
                      <SIcon className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
                    </div>
                    <span className="text-white font-black text-[10px] sm:text-xs uppercase tracking-wider leading-tight">{s.title}</span>
                  </div>
                  {!isLast && (
                    <ArrowRight className={`hidden sm:block w-4 h-4 ${t.accentText} flex-shrink-0`} />
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* ── BLOCK 5: Ideal para + CTA ── */}
      <div className="relative px-6 sm:px-10 lg:px-14 pb-8 sm:pb-10">
        <div className="grid grid-cols-1 lg:grid-cols-[1fr_auto] gap-5 items-center">
          {deep.idealFor && (
            <div className={`glass-card border ${t.cardBorder} rounded-2xl p-5 bg-gradient-to-br ${t.cardBg}`}>
              <p className={`text-[10px] font-black uppercase tracking-[0.2em] ${t.accentText} mb-3`}>IDEAL PARA:</p>
              <ul className="grid grid-cols-2 gap-x-3 gap-y-1.5">
                {deep.idealFor.map((item) => (
                  <li key={item} className="flex items-center gap-1.5 text-white/80 text-xs">
                    <Check className={`w-3 h-3 ${t.accentText} flex-shrink-0`} />
                    {item}
                  </li>
                ))}
              </ul>
            </div>
          )}

          <button
            onClick={() => document.getElementById("prices")?.scrollIntoView({ behavior: "smooth" })}
            className={`shine-btn inline-flex items-center justify-center gap-2 ${t.ctaBg} font-black text-sm sm:text-base px-6 py-3.5 rounded-2xl shadow-2xl transition-all hover:-translate-y-0.5 hover:scale-[1.02] uppercase tracking-wider whitespace-nowrap`}
          >
            {deep.ctaText} <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </section>
  );
}
