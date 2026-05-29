"use client";
import { useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import { Check, Star, ShoppingCart, Sparkles, Zap, Crown, Award, ArrowRight, Lock, LogIn, Hand, Rocket, Trophy } from "lucide-react";
import type { Product } from "@/lib/products";
import { useAuth } from "@/lib/auth-context";
import { YFAutoClipDeepSections } from "./YFAutoClipDeepSections";

interface Props {
  product: Product;
}

export function ProductShowcase({ product }: Props) {
  const router = useRouter();
  const pathname = usePathname();
  const { user } = useAuth();
  const [selectedPriceId, setSelectedPriceId] = useState<string | null>(
    product.prices.find((p) => p.popular)?.id ?? null
  );
  const [showLoginPrompt, setShowLoginPrompt] = useState<string | null>(null);

  const handleBuy = (priceId: string) => {
    if (!user) {
      // No logueado: mostrar prompt + redirigir a login con returnTo
      setShowLoginPrompt(priceId);
      return;
    }
    // Logueado: TODO Stripe checkout
    alert(`✅ Próximamente: checkout para ${priceId}\n\nUsuario: ${user.email}\nCuando Stripe esté conectado, esto abrirá Stripe Checkout con el precio ID: ${priceId}`);
  };

  const goToLogin = (priceId: string) => {
    const returnTo = `${pathname}?buy=${priceId}`;
    router.push(`/login?redirect=${encodeURIComponent(returnTo)}`);
  };

  return (
    <div className="space-y-6">

      {/* ═══════════════════════════════════════════════════════════
         HERO PRINCIPAL — estilo banner cinemático
         "CREA. EDITA. TRANSFORMA. DOMINA TU CONTENIDO."
         ═══════════════════════════════════════════════════════════ */}
      <section className="relative overflow-hidden rounded-3xl border border-violet-500/40 bg-gradient-to-br from-[#0d0620] via-[#1c0a3a] to-[#08041a]">
        {/* Orbs decorativos */}
        <div className="absolute -top-32 -right-32 w-96 h-96 bg-gradient-to-br from-violet-500 to-fuchsia-600 opacity-30 rounded-full blur-3xl pointer-events-none float-slow" />
        <div className="absolute top-1/3 -left-20 w-80 h-80 bg-gradient-to-br from-cyan-500 to-blue-600 opacity-20 rounded-full blur-3xl pointer-events-none float-soft" />
        <div className="absolute -bottom-32 right-1/4 w-72 h-72 bg-gradient-to-br from-pink-500 to-rose-600 opacity-15 rounded-full blur-3xl pointer-events-none float-slow" style={{ animationDelay: "3s" }} />
        <div className="particles-bg" />
        {/* Grid pattern overlay */}
        <div className="absolute inset-0 opacity-[0.05] pointer-events-none" style={{
          backgroundImage: "linear-gradient(rgba(255,255,255,0.5) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.5) 1px, transparent 1px)",
          backgroundSize: "60px 60px",
        }} />

        <div className="relative grid grid-cols-1 lg:grid-cols-[1fr_auto] gap-8 lg:gap-12 p-6 sm:p-10 lg:p-14 items-center">
          <div className="space-y-5 min-w-0">
            {/* Tag superior pequeño */}
            <p className="text-white/65 text-[10px] sm:text-xs font-bold tracking-[0.25em] uppercase">
              HERRAMIENTAS <span className="text-violet-400">PRO</span> QUE LLEVAN TU CONTENIDO AL SIGUIENTE NIVEL
            </p>

            {/* Mega título cinemático */}
            <h1 className="text-5xl sm:text-6xl lg:text-8xl font-black leading-[0.9] tracking-tighter">
              <span className="text-white block">CREA. EDITA.</span>
              <span className="text-white block">TRANSFORMA.</span>
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-violet-400 via-fuchsia-400 to-pink-400 block">DOMINA TU</span>
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-violet-400 via-fuchsia-400 to-pink-400 block">CONTENIDO.</span>
            </h1>

            <p className="text-white/65 text-sm sm:text-base max-w-md leading-relaxed">
              Todo lo que necesitas para automatizar, editar y destacar tu contenido como un verdadero profesional.
            </p>

            {/* CTA principal */}
            <button
              onClick={() => document.getElementById("prices")?.scrollIntoView({ behavior: "smooth" })}
              className="shine-btn inline-flex items-center gap-2 bg-gradient-to-r from-violet-500 via-purple-600 to-fuchsia-600 hover:opacity-95 text-white font-black text-sm sm:text-base px-7 py-4 rounded-2xl shadow-2xl shadow-violet-500/40 ring-1 ring-white/20 transition-all hover:-translate-y-0.5 hover:scale-[1.02] uppercase tracking-wide"
            >
              <Sparkles className="w-4 h-4" /> DESCUBRE EL PODER DE YF AUTO CLIP
            </button>

            {/* 3 features bottom */}
            <div className="grid grid-cols-3 gap-3 sm:gap-5 pt-4 max-w-lg">
              {[
                { icon: Hand, label: "FÁCIL DE USAR" },
                { icon: Rocket, label: "RENDIMIENTO PRO" },
                { icon: Trophy, label: "RESULTADOS REALES" },
              ].map((f) => {
                const FIcon = f.icon;
                return (
                  <div key={f.label} className="flex items-center gap-2">
                    <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center flex-shrink-0">
                      <FIcon className="w-3.5 h-3.5 text-white" />
                    </div>
                    <span className="text-white/85 font-bold text-[10px] sm:text-xs uppercase tracking-wider leading-tight">{f.label}</span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Box 3D del producto principal */}
          <div className="relative flex items-center justify-center lg:justify-end">
            <div className="relative w-56 sm:w-64 lg:w-72 aspect-[3/4]">
              <div className="relative w-full h-full rounded-3xl bg-gradient-to-br from-violet-600 via-purple-600 to-fuchsia-700 shadow-2xl ring-2 ring-violet-500/40 overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-br from-white/20 via-transparent to-transparent" />
                <div className="absolute top-5 left-1/2 -translate-x-1/2 text-center">
                  <p className="text-white text-xs font-bold tracking-[0.25em] uppercase opacity-90">YF AUTO CLIP</p>
                </div>
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="text-center">
                    <p className="text-white font-black text-7xl tracking-tighter drop-shadow-2xl">YF</p>
                    <p className="text-white/90 text-xs font-bold tracking-[0.3em] uppercase mt-1">Auto Clip</p>
                  </div>
                </div>
                <div className="absolute bottom-5 left-4 right-4 space-y-1.5">
                  {product.subProducts?.map((sp) => (
                    <div key={sp.name} className="bg-black/40 backdrop-blur border border-white/30 rounded-lg py-1.5 text-center">
                      <p className="text-white text-[10px] font-black tracking-widest uppercase">{sp.name}</p>
                    </div>
                  ))}
                </div>
              </div>
              {/* Floating sparkle */}
              <div className="absolute -top-4 -right-4 w-14 h-14 rounded-full bg-gradient-to-br from-yellow-300 to-orange-400 flex items-center justify-center shadow-xl ring-2 ring-white/30 float-soft">
                <Sparkles className="w-7 h-7 text-white drop-shadow" />
              </div>
            </div>
          </div>
        </div>

        {/* Stats strip */}
        {product.stats && (
          <div className="relative border-t border-white/8 px-6 sm:px-10 lg:px-14 py-5">
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-6">
              {product.stats.map((s) => (
                <div key={s.label} className="text-center">
                  <p className={`font-black text-xl sm:text-2xl ${product.textAccent}`}>{s.value}</p>
                  <p className="text-white/45 text-[9px] sm:text-[10px] uppercase tracking-wider font-bold mt-0.5">{s.label}</p>
                </div>
              ))}
            </div>
          </div>
        )}
      </section>

      {/* ═══════════════════════════════════════════════════════════
         "3 HERRAMIENTAS. INFINITAS POSIBILIDADES."
         ═══════════════════════════════════════════════════════════ */}
      {product.subProducts && (
        <div id="subproducts" className="space-y-6">
          <div className="text-center">
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-black text-white tracking-tighter leading-none">
              {product.subProducts.length} HERRAMIENTAS.{" "}
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-violet-400 via-fuchsia-400 to-pink-400">INFINITAS POSIBILIDADES.</span>
            </h2>
            <p className="text-white/45 text-sm mt-3 max-w-2xl mx-auto">Cada herramienta es poderosa por sí sola. Juntas, son imparables.</p>
          </div>

          {/* ── Cards iniciales de las 3 herramientas (resumen) ── */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {product.subProducts.map((sub) => {
              const Icon = sub.icon;
              return (
                <div key={sub.name} className={`glass-card hover-lift relative overflow-hidden rounded-2xl border ${sub.borderColor} bg-gradient-to-br ${sub.bgColor} p-5 sm:p-6`}>
                  <div className={`absolute -top-8 -right-8 w-32 h-32 bg-gradient-to-br ${sub.color} opacity-25 rounded-full blur-3xl`} />

                  <div className={`relative w-12 h-12 rounded-2xl bg-gradient-to-br ${sub.color} flex items-center justify-center shadow-xl mb-4 ring-1 ring-white/20`}>
                    <Icon className="w-6 h-6 text-white" />
                  </div>

                  <h3 className="relative text-white font-black text-lg mb-1.5 tracking-wide">{sub.name}</h3>
                  <p className="relative text-white/60 text-xs leading-relaxed mb-4">{sub.description}</p>

                  <ul className="relative space-y-1.5">
                    {sub.features.slice(0, 3).map((f) => (
                      <li key={f} className="flex items-start gap-2 text-xs">
                        <Check className="w-3 h-3 text-green-400 flex-shrink-0 mt-0.5" />
                        <span className="text-white/75">{f}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              );
            })}
          </div>

          {/* ── SECCIONES DEEP estilo banner (1 por sub-producto) ── */}
          <div className="space-y-6 pt-2">
            {product.subProducts.map((sub) => (
              sub.deep ? <YFAutoClipDeepSections key={sub.name} subProduct={sub} /> : null
            ))}
          </div>
        </div>
      )}

      {/* ═══════════════════════════════════════════════════════════
         BENEFICIOS GLOBALES — 4 columnas (Productividad / Velocidad / Impacto / Resultados)
         ═══════════════════════════════════════════════════════════ */}
      <div className="glass-card relative overflow-hidden rounded-3xl border border-white/10 p-6 sm:p-8">
        <div className="absolute -top-20 -right-20 w-72 h-72 bg-gradient-to-br from-violet-500 to-purple-600 opacity-15 rounded-full blur-3xl float-slow" />

        <div className="relative grid grid-cols-2 lg:grid-cols-4 gap-5 sm:gap-6">
          {product.benefits.slice(0, 4).map((b) => {
            const Icon = b.icon;
            return (
              <div key={b.title} className="text-center">
                <div className={`w-12 h-12 mx-auto rounded-2xl bg-gradient-to-br ${product.gradient} flex items-center justify-center shadow-xl mb-3 ring-1 ring-white/20`}>
                  <Icon className="w-6 h-6 text-white" />
                </div>
                <p className="text-violet-400 font-black text-2xl sm:text-3xl tracking-tighter">+</p>
                <h3 className="text-white font-black text-xs sm:text-sm uppercase tracking-wider mb-1">{b.title}</h3>
                <p className="text-white/45 text-[11px] leading-snug">{b.description}</p>
              </div>
            );
          })}
        </div>
      </div>

      {/* ── 3 PLANES DE SUSCRIPCIÓN ── */}
      <div id="prices" className="space-y-4 pt-2">
        <div className="text-center">
          <div className="inline-flex items-center gap-2 bg-cyan-500/10 border border-cyan-500/20 rounded-full px-3 py-1 text-[11px] sm:text-xs text-cyan-400 mb-3 font-bold tracking-wider uppercase">
            <Crown className="w-3 h-3" /> 3 planes · Elige el tuyo
          </div>
          <h2 className="text-2xl sm:text-3xl lg:text-4xl font-black text-white">
            Acceso completo desde{" "}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-blue-500">
              €{Math.min(...product.prices.map((p) => p.monthlyEquivalent ?? p.price)).toFixed(2)}/mes
            </span>
          </h2>
          <p className="text-white/55 text-sm mt-2 max-w-2xl mx-auto">
            Las 3 herramientas incluidas en todos los planes. Cuanto más largo el plazo, más ahorras.
          </p>
        </div>

        {/* Grid 3 cols × 1 row */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 lg:gap-5 max-w-5xl mx-auto">
          {product.prices.map((tier) => {
            const discount = tier.originalPrice
              ? Math.round(((tier.originalPrice - tier.price) / tier.originalPrice) * 100)
              : 0;
            const isPopular = tier.popular;

            return (
              <div
                key={tier.id}
                onClick={() => setSelectedPriceId(tier.id)}
                className={`glass-card hover-lift relative overflow-hidden rounded-3xl border-2 p-5 sm:p-6 cursor-pointer transition-all ${
                  isPopular
                    ? `${product.borderColor} shadow-2xl shadow-violet-500/30 ring-2 ring-violet-500/40 scale-100 md:scale-105`
                    : "border-white/10"
                }`}
              >
                {tier.badge && (
                  <div className={`absolute top-0 left-1/2 -translate-x-1/2 ${
                    isPopular
                      ? `bg-gradient-to-r ${product.gradient}`
                      : "bg-green-500"
                  } text-white text-[9px] font-black px-3 py-1 rounded-b-lg uppercase tracking-widest`}>
                    {tier.badge}
                  </div>
                )}

                <div className={`absolute -top-8 -right-8 w-32 h-32 bg-gradient-to-br ${product.gradient} opacity-15 rounded-full blur-3xl pointer-events-none float-soft`} />

                <div className="relative pt-3">
                  {/* Nombre + periodo */}
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className={`font-black text-xl ${isPopular ? product.textAccent : "text-white"}`}>{tier.name}</h3>
                  </div>
                  <p className="text-white/45 text-xs mb-5 leading-snug">{tier.description}</p>

                  {/* Precio principal */}
                  <div className="mb-4">
                    <div className="flex items-baseline gap-2">
                      <span className="text-white font-black text-5xl">€{tier.price}</span>
                      <span className="text-white/40 text-sm">{tier.periodLabel}</span>
                    </div>

                    {/* Precio original tachado + descuento */}
                    {tier.originalPrice && (
                      <div className="flex items-center gap-2 mt-1">
                        <span className="text-white/30 text-sm line-through">€{tier.originalPrice}</span>
                        {discount > 0 && (
                          <span className="bg-green-500/15 border border-green-500/30 text-green-400 text-[10px] font-black px-2 py-0.5 rounded-full">
                            -{discount}%
                          </span>
                        )}
                      </div>
                    )}

                    {/* Equivalente mensual (siempre visible) */}
                    {tier.monthlyEquivalent && tier.billingPeriod !== "monthly" && (
                      <div className="mt-3 bg-white/5 border border-white/10 rounded-lg p-2.5">
                        <p className="text-white/55 text-[10px] font-bold uppercase tracking-wider">Equivale a</p>
                        <p className="text-white font-black text-lg">
                          €{tier.monthlyEquivalent.toFixed(2)} <span className="text-white/40 text-xs font-normal">/mes</span>
                        </p>
                      </div>
                    )}
                  </div>

                  {/* CTA Comprar */}
                  <button
                    onClick={(e) => { e.stopPropagation(); handleBuy(tier.id); }}
                    className={`shine-btn w-full inline-flex items-center justify-center gap-2 ${
                      isPopular
                        ? `bg-gradient-to-r ${product.gradient} text-white shadow-xl ring-1 ring-white/20`
                        : "bg-white/10 hover:bg-white/15 text-white border border-white/15"
                    } font-bold text-sm px-4 py-3 rounded-xl transition-all hover:-translate-y-0.5`}
                  >
                    <ShoppingCart className="w-4 h-4" />
                    {tier.cta}
                  </button>

                  {/* Lista features */}
                  <ul className="mt-5 space-y-2 pt-4 border-t border-white/8">
                    {tier.features.map((f) => (
                      <li key={f} className="flex items-start gap-2 text-xs">
                        <Check className={`w-3.5 h-3.5 flex-shrink-0 mt-0.5 ${
                          isPopular ? "text-green-400" : "text-white/55"
                        }`} />
                        <span className="text-white/75">{f}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            );
          })}
        </div>

        {/* Trust strip */}
        <div className="glass-card rounded-2xl border border-white/10 p-4 sm:p-5">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-center">
            <div>
              <Award className="w-6 h-6 text-yellow-400 mx-auto mb-1" />
              <p className="text-white text-xs font-bold">Garantía 30 días</p>
              <p className="text-white/40 text-[10px]">o te devolvemos tu dinero</p>
            </div>
            <div>
              <Zap className="w-6 h-6 text-cyan-400 mx-auto mb-1" />
              <p className="text-white text-xs font-bold">Activación inmediata</p>
              <p className="text-white/40 text-[10px]">Email + descarga en 1 min</p>
            </div>
            <div>
              <Star className="w-6 h-6 text-violet-400 mx-auto mb-1" />
              <p className="text-white text-xs font-bold">4.9/5 valoración</p>
              <p className="text-white/40 text-[10px]">2,400+ creadores satisfechos</p>
            </div>
            <div>
              <Crown className="w-6 h-6 text-orange-400 mx-auto mb-1" />
              <p className="text-white text-xs font-bold">Soporte 24/7</p>
              <p className="text-white/40 text-[10px]">Respuesta en menos de 24h</p>
            </div>
          </div>
        </div>
      </div>

      {/* ── Modal: Login Prompt (cuando usuario anónimo pulsa Comprar) ── */}
      {showLoginPrompt && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-in fade-in duration-200" onClick={() => setShowLoginPrompt(null)}>
          <div
            onClick={(e) => e.stopPropagation()}
            className="glass-card relative max-w-md w-full rounded-3xl border-2 border-violet-500/40 p-6 sm:p-8 shadow-2xl shadow-violet-500/30 animate-in zoom-in-95 duration-200"
          >
            <div className={`absolute -top-20 -right-20 w-72 h-72 bg-gradient-to-br ${product.gradient} opacity-20 rounded-full blur-3xl pointer-events-none`} />

            <div className="relative text-center">
              <div className={`inline-flex w-16 h-16 rounded-2xl bg-gradient-to-br ${product.gradient} items-center justify-center shadow-2xl mb-4 ring-2 ring-white/20 glow-pulse`}>
                <Lock className="w-8 h-8 text-white" />
              </div>

              <h3 className="text-2xl font-black text-white mb-2">¡Casi lo tienes!</h3>
              <p className="text-white/55 text-sm mb-5">
                Para comprar <strong className={product.textAccent}>{product.name}</strong> necesitas tener una cuenta. Es gratis y tarda menos de 1 minuto.
              </p>

              <div className="bg-white/5 border border-white/10 rounded-2xl p-3 mb-5 text-left">
                <p className="text-white/40 text-[10px] uppercase tracking-wider font-bold mb-1">Has elegido</p>
                <p className="text-white font-bold">
                  {product.prices.find((p) => p.id === showLoginPrompt)?.name} · €{product.prices.find((p) => p.id === showLoginPrompt)?.price}
                  <span className="text-white/40 font-normal text-xs ml-1">{product.prices.find((p) => p.id === showLoginPrompt)?.periodLabel}</span>
                </p>
              </div>

              <div className="space-y-2">
                <button
                  onClick={() => goToLogin(showLoginPrompt)}
                  className={`shine-btn w-full inline-flex items-center justify-center gap-2 bg-gradient-to-r ${product.gradient} text-white font-bold text-sm px-5 py-3 rounded-xl shadow-lg ring-1 ring-white/20 transition-all hover:-translate-y-0.5`}
                >
                  <LogIn className="w-4 h-4" /> Iniciar sesión y comprar
                </button>
                <button
                  onClick={() => {
                    const returnTo = `${pathname}?buy=${showLoginPrompt}`;
                    router.push(`/register?redirect=${encodeURIComponent(returnTo)}`);
                  }}
                  className="w-full inline-flex items-center justify-center gap-2 bg-white/5 hover:bg-white/10 border border-white/10 text-white font-semibold text-sm px-5 py-3 rounded-xl transition-all"
                >
                  Crear cuenta gratis <ArrowRight className="w-4 h-4" />
                </button>
                <button
                  onClick={() => setShowLoginPrompt(null)}
                  className="w-full text-white/40 hover:text-white text-xs py-2 transition-colors"
                >
                  Seguir explorando
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
