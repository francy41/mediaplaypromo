"use client";
import Link from "next/link";
import { useState } from "react";
import { Check, X, Sparkles, ArrowRight, Star, Crown, ChevronDown } from "lucide-react";
import { PLANS, PRICING_FAQ } from "@/lib/pricing";
import { VideoPricingTable } from "@/components/VideoPricingTable";
import { ThemeToggle } from "@/components/ThemeToggle";
import { BrandLogo } from "@/components/BrandLogo";

export default function PricingPage() {
  const [yearly, setYearly] = useState(true);
  const [openFaq, setOpenFaq] = useState<number | null>(0);

  const formatPrice = (monthly: number | null, yearlyP: number | null) => {
    if (monthly === null) return "Custom";
    if (monthly === 0) return "Gratis";
    if (yearly && yearlyP) return `€${(yearlyP / 12).toFixed(0)}`;
    return `€${monthly}`;
  };

  return (
    <div className="min-h-screen bg-[#070809] text-white">
      {/* Top nav */}
      <nav className="fixed top-0 left-0 right-0 h-16 bg-[#070809]/85 backdrop-blur border-b border-white/8 flex items-center px-4 sm:px-6 lg:px-8 z-50">
        <Link href="/" className="flex items-center gap-2.5">
          <BrandLogo className="w-9 h-9 drop-shadow-lg" />
          <div>
            <div className="text-white font-bold text-sm leading-none">MediaPlay<span className="font-medium text-white/80">Promo</span></div>
            <div className="text-white/35 text-[9px] font-semibold tracking-widest leading-none mt-0.5">.COM</div>
          </div>
        </Link>
        <div className="ml-auto flex items-center gap-2 sm:gap-3">
          <ThemeToggle compact />
          <Link href="/login" className="hidden sm:inline text-white/60 hover:text-white text-sm">Iniciar sesión</Link>
          <Link href="/register" className="bg-cyan-500 hover:bg-cyan-400 text-black font-semibold text-xs sm:text-sm px-3 sm:px-4 py-2 rounded-lg transition-colors">Registrarse</Link>
        </div>
      </nav>

      {/* Hero */}
      <section className="pt-28 sm:pt-32 pb-10 sm:pb-12 px-4 sm:px-6 lg:px-8 text-center max-w-4xl mx-auto">
        <div className="inline-flex items-center gap-2 bg-cyan-500/10 border border-cyan-500/20 rounded-full px-3 py-1 text-[11px] sm:text-xs text-cyan-400 mb-5 font-bold tracking-wider uppercase">
          <Sparkles className="w-3 h-3" /> Planes flexibles
        </div>
        <h1 className="text-3xl sm:text-5xl lg:text-6xl font-black leading-tight mb-4">
          Elige el plan que{" "}
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-blue-500">se adapte a ti</span>
        </h1>
        <p className="text-white/55 text-base sm:text-lg max-w-2xl mx-auto">
          Empieza gratis. Sube de plan cuando lo necesites. Cancela cuando quieras — sin permanencia.
        </p>

        {/* Toggle anual/mensual */}
        <div className="inline-flex items-center gap-1 bg-white/5 border border-white/10 rounded-2xl p-1 mt-7">
          <button
            onClick={() => setYearly(false)}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${!yearly ? "bg-white text-black shadow-lg" : "text-white/55 hover:text-white"}`}
          >
            Mensual
          </button>
          <button
            onClick={() => setYearly(true)}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 ${yearly ? "bg-gradient-to-r from-cyan-500 to-blue-600 text-white shadow-lg" : "text-white/55 hover:text-white"}`}
          >
            Anual <span className="bg-green-500/20 text-green-300 text-[9px] font-black px-1.5 py-0.5 rounded-full">-17%</span>
          </button>
        </div>
      </section>

      {/* Plans grid */}
      <section className="px-4 sm:px-6 lg:px-8 pb-16 max-w-7xl mx-auto">
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
                className={`glass-card relative overflow-hidden rounded-3xl border-2 p-6 ${p.borderColor} ${p.popular ? "shadow-2xl shadow-cyan-500/20 scale-100 sm:scale-105" : ""}`}
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
      </section>

      {/* Video pricing per model */}
      <VideoPricingTable />

      {/* Comparison strip */}
      <section className="px-4 sm:px-6 lg:px-8 pb-16 max-w-5xl mx-auto">
        <div className="glass-card rounded-3xl border border-white/10 p-6 sm:p-8 text-center">
          <p className="text-white/45 text-[11px] uppercase tracking-widest font-bold mb-3">Tu inversión se paga sola</p>
          <h2 className="text-2xl sm:text-3xl font-black mb-3">
            Genera <span className="text-cyan-400">1 video</span> = ahorras <span className="text-green-400">€200-500</span> en producción
          </h2>
          <p className="text-white/55 text-sm max-w-2xl mx-auto">
            Un videógrafo cobra €300-500 por un anuncio de 10 segundos. Con Pro, generas <strong className="text-white">25 videos al mes</strong> por €29.
            ROI = <strong className="text-green-400">×250</strong>.
          </p>
        </div>
      </section>

      {/* Social proof */}
      <section className="px-4 sm:px-6 lg:px-8 pb-16 max-w-5xl mx-auto">
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {[
            { kpi: "12,400+", label: "Creadores activos" },
            { kpi: "98%",     label: "Satisfacción" },
            { kpi: "<24h",    label: "Soporte respuesta" },
            { kpi: "30 días", label: "Garantía devolución" },
          ].map((s) => (
            <div key={s.label} className="glass-card rounded-2xl border border-white/10 p-5 text-center">
              <p className="text-white font-black text-2xl sm:text-3xl">{s.kpi}</p>
              <p className="text-white/45 text-xs mt-1">{s.label}</p>
            </div>
          ))}
        </div>
      </section>

      {/* FAQ */}
      <section className="px-4 sm:px-6 lg:px-8 pb-20 max-w-3xl mx-auto">
        <h2 className="text-2xl sm:text-3xl font-black text-center mb-2">Preguntas frecuentes</h2>
        <p className="text-white/45 text-sm text-center mb-8">¿No encuentras tu respuesta? <Link href="/contact" className="text-cyan-400 hover:underline">Contáctanos</Link></p>

        <div className="space-y-2">
          {PRICING_FAQ.map((f, i) => (
            <div key={i} className="glass-card rounded-2xl border border-white/10 overflow-hidden">
              <button
                onClick={() => setOpenFaq(openFaq === i ? null : i)}
                className="w-full px-5 py-4 flex items-center justify-between gap-3 text-left hover:bg-white/3 transition-colors"
              >
                <span className="text-white font-bold text-sm">{f.q}</span>
                <ChevronDown className={`w-4 h-4 text-white/45 transition-transform flex-shrink-0 ${openFaq === i ? "rotate-180" : ""}`} />
              </button>
              {openFaq === i && (
                <div className="px-5 pb-4 text-white/65 text-sm leading-relaxed">{f.a}</div>
              )}
            </div>
          ))}
        </div>
      </section>

      {/* Final CTA */}
      <section className="px-4 sm:px-6 lg:px-8 pb-20 max-w-3xl mx-auto">
        <div className="glass-card rounded-3xl border border-cyan-500/30 p-8 sm:p-10 text-center relative overflow-hidden">
          <div className="absolute -top-20 -right-20 w-72 h-72 bg-cyan-500/20 rounded-full blur-3xl pointer-events-none" />
          <div className="absolute -bottom-20 -left-20 w-72 h-72 bg-fuchsia-500/20 rounded-full blur-3xl pointer-events-none" />
          <div className="relative">
            <Crown className="w-10 h-10 text-yellow-400 mx-auto mb-3" />
            <h2 className="text-3xl sm:text-4xl font-black mb-3">Empieza GRATIS hoy</h2>
            <p className="text-white/55 text-sm sm:text-base mb-6 max-w-xl mx-auto">
              10 créditos gratis cada mes. Sin tarjeta. Sin compromisos. Cancela cuando quieras.
            </p>
            <Link
              href="/register"
              className="shine-btn inline-flex items-center gap-2 bg-gradient-to-r from-cyan-500 to-blue-600 hover:opacity-95 text-white font-black text-base px-8 py-4 rounded-2xl shadow-2xl shadow-cyan-500/30 transition-all hover:-translate-y-0.5"
            >
              Crear cuenta gratis <ArrowRight className="w-5 h-5" />
            </Link>
            <p className="text-white/35 text-xs mt-4">⚡ Activación inmediata · Sin instalación</p>
          </div>
        </div>
      </section>

      <footer className="border-t border-white/8 px-4 sm:px-6 lg:px-8 py-6 text-center">
        <p className="text-white/30 text-xs">© 2025 MediaPlayPromo.com — Todos los derechos reservados</p>
      </footer>
    </div>
  );
}
