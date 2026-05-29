"use client";
import Link from "next/link";
import { useState } from "react";
import { Check, X, Crown, ArrowRight, Star, Sparkles, TrendingUp } from "lucide-react";
import { PLANS } from "@/lib/pricing";

interface Props {
  /** Si está embebido en homepage, evita doble título */
  embedded?: boolean;
  /** Mostrar el badge de ROI/margen */
  showMargin?: boolean;
}

export function PricingPlans({ embedded = false, showMargin = true }: Props) {
  const [yearly, setYearly] = useState(true);

  const formatPrice = (monthly: number | null, yearlyP: number | null) => {
    if (monthly === null) return "Custom";
    if (monthly === 0) return "Gratis";
    if (yearly && yearlyP) return `€${(yearlyP / 12).toFixed(0)}`;
    return `€${monthly}`;
  };

  return (
    <section className="px-4 sm:px-6 lg:px-8 py-12 sm:py-16 lg:py-20 max-w-7xl mx-auto">
      {!embedded && (
        <div className="text-center mb-10">
          <div className="inline-flex items-center gap-2 bg-cyan-500/10 border border-cyan-500/20 rounded-full px-3 py-1 text-[11px] sm:text-xs text-cyan-400 mb-4 font-bold tracking-wider uppercase">
            <Sparkles className="w-3 h-3" /> Planes flexibles
          </div>
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-black leading-tight mb-3">
            Elige el plan que{" "}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-blue-500">se adapte a ti</span>
          </h2>
          <p className="text-white/55 text-sm sm:text-base max-w-2xl mx-auto">
            Empieza gratis. Sube de plan cuando lo necesites. Cancela cuando quieras — sin permanencia.
          </p>
        </div>
      )}

      {/* Toggle */}
      <div className="flex justify-center mb-8">
        <div className="inline-flex items-center gap-1 bg-white/5 border border-white/10 rounded-2xl p-1">
          <button
            onClick={() => setYearly(false)}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
              !yearly ? "bg-white text-black shadow-lg" : "text-white/55 hover:text-white"
            }`}
          >
            Mensual
          </button>
          <button
            onClick={() => setYearly(true)}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 ${
              yearly ? "bg-gradient-to-r from-cyan-500 to-blue-600 text-white shadow-lg" : "text-white/55 hover:text-white"
            }`}
          >
            Anual <span className="bg-green-500/20 text-green-300 text-[9px] font-black px-1.5 py-0.5 rounded-full">-17%</span>
          </button>
        </div>
      </div>

      {/* Plans grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {PLANS.map((p) => {
          const price = formatPrice(p.priceMonthly, p.priceYearly);
          const billing = p.priceMonthly === null
            ? ""
            : p.priceMonthly === 0
              ? ""
              : yearly
                ? "/mes facturado anual"
                : "/mes";

          return (
            <div
              key={p.id}
              className={`glass-card relative overflow-hidden rounded-3xl border-2 p-6 ${p.borderColor} ${
                p.popular ? "shadow-2xl shadow-cyan-500/20 scale-100 sm:scale-105" : ""
              }`}
            >
              {p.popular && (
                <div className="absolute top-0 left-1/2 -translate-x-1/2 bg-gradient-to-r from-cyan-500 to-blue-600 text-white text-[10px] font-black px-3 py-1 rounded-b-xl uppercase tracking-widest">
                  ⭐ Más popular
                </div>
              )}
              <div className={`absolute -top-10 -right-10 w-32 h-32 bg-gradient-to-br ${p.gradient} opacity-20 rounded-full blur-3xl pointer-events-none float-soft`} />

              <div className="relative">
                <h3 className={`text-xl font-black ${p.textAccent}`}>{p.name}</h3>
                <p className="text-white/50 text-xs mt-1 mb-5">{p.tagline}</p>

                <div className="mb-5">
                  <div className="flex items-baseline gap-1">
                    <span className="text-white font-black text-4xl sm:text-5xl">{price}</span>
                    {billing && <span className="text-white/45 text-xs">{billing}</span>}
                  </div>
                  {yearly && p.priceYearly && p.priceYearly > 0 && (
                    <p className="text-white/35 text-[10px] mt-1">Total €{p.priceYearly}/año</p>
                  )}
                </div>

                {/* Credits highlight */}
                <div className="bg-white/5 border border-white/10 rounded-2xl p-3 mb-5 text-center">
                  <p className="text-[10px] uppercase tracking-wider text-white/45 font-bold">Créditos</p>
                  <p className="text-white font-black text-2xl mt-0.5">
                    {p.credits === -1 ? "∞" : p.credits.toLocaleString()}
                  </p>
                  <p className="text-white/40 text-[10px]">por mes</p>
                </div>

                <Link
                  href={p.id === "enterprise" ? "/contact" : "/register"}
                  className={`shine-btn w-full inline-flex items-center justify-center gap-2 bg-gradient-to-r ${p.gradient} hover:opacity-95 text-white font-bold text-sm px-5 py-3 rounded-xl shadow-lg transition-all hover:-translate-y-0.5 mb-5`}
                >
                  {p.cta} <ArrowRight className="w-4 h-4" />
                </Link>

                <ul className="space-y-2">
                  {p.features.map((f) => (
                    <li key={f} className="flex items-start gap-2 text-xs">
                      <Check className="w-3.5 h-3.5 text-green-400 flex-shrink-0 mt-0.5" />
                      <span className="text-white/75">{f}</span>
                    </li>
                  ))}
                  {p.notIncluded?.map((f) => (
                    <li key={f} className="flex items-start gap-2 text-xs">
                      <X className="w-3.5 h-3.5 text-white/25 flex-shrink-0 mt-0.5" />
                      <span className="text-white/35 line-through">{f}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          );
        })}
      </div>

      {/* ROI strip */}
      {showMargin && (
        <div className="mt-10 glass-card rounded-3xl border border-green-500/30 p-6 sm:p-8 text-center max-w-4xl mx-auto">
          <div className="inline-flex items-center gap-2 bg-green-500/10 border border-green-500/20 rounded-full px-3 py-1 text-[11px] font-bold tracking-wider uppercase text-green-400 mb-3">
            <TrendingUp className="w-3 h-3" /> Tu inversión se paga sola
          </div>
          <h3 className="text-xl sm:text-2xl font-black mb-2">
            1 video con IA = ahorras <span className="text-green-400">€200-500</span> en producción
          </h3>
          <p className="text-white/55 text-sm max-w-2xl mx-auto">
            Un videógrafo cobra €300-500 por un anuncio de 10 segundos. Con Pro generas{" "}
            <strong className="text-white">25 videos al mes</strong> por €29. ROI = <strong className="text-green-400">×250</strong>.
          </p>
        </div>
      )}
    </section>
  );
}
