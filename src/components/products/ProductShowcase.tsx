"use client";
import { useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import { Check, Star, ShoppingCart, Sparkles, Zap, Crown, Award, ArrowRight, Lock, LogIn } from "lucide-react";
import type { Product } from "@/lib/products";
import { useAuth } from "@/lib/auth-context";

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

      {/* ── HERO DEL PRODUCTO ── */}
      <div className={`glass-card relative overflow-hidden rounded-3xl border ${product.borderColor} bg-gradient-to-br from-violet-500/10 via-purple-500/5 to-transparent p-6 sm:p-8`}>
        {/* Decorative orbs */}
        <div className={`absolute -top-24 -right-24 w-80 h-80 bg-gradient-to-br ${product.gradient} opacity-20 rounded-full blur-3xl pointer-events-none float-slow`} />
        <div className={`absolute -bottom-24 -left-24 w-72 h-72 bg-gradient-to-br ${product.gradient} opacity-15 rounded-full blur-3xl pointer-events-none float-soft`} />
        <div className="particles-bg" />

        <div className="relative grid grid-cols-1 lg:grid-cols-[1fr_auto] gap-8 items-center">
          <div>
            {/* Tag superior */}
            <div className="inline-flex items-center gap-2 bg-white/10 border border-white/15 rounded-full px-2.5 py-1 text-[10px] sm:text-[11px] font-black uppercase tracking-[0.18em] text-white/80 mb-3">
              <Sparkles className="w-3 h-3 text-yellow-300" />
              PRODUCTO DIGITAL · LICENCIA PROFESIONAL
            </div>

            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-black leading-tight text-white tracking-tight">
              {product.name}
            </h1>

            <p className={`text-base sm:text-lg font-bold mt-2 ${product.textAccent}`}>{product.tagline}</p>

            <p className="text-white/55 text-sm sm:text-base max-w-xl mt-3">
              {product.longDescription ?? product.description}
            </p>

            {product.author && (
              <p className="text-white/35 text-xs mt-3 italic">{product.author}</p>
            )}

            {/* Stats */}
            {product.stats && (
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mt-5 max-w-md">
                {product.stats.map((s) => (
                  <div key={s.label} className="bg-white/5 border border-white/10 rounded-xl p-2.5 text-center">
                    <p className={`font-black text-base sm:text-lg ${product.textAccent}`}>{s.value}</p>
                    <p className="text-white/45 text-[9px] sm:text-[10px] uppercase tracking-wider font-bold">{s.label}</p>
                  </div>
                ))}
              </div>
            )}

            {/* CTAs */}
            <div className="flex flex-wrap items-center gap-3 mt-6">
              <a
                href="#prices"
                className={`shine-btn inline-flex items-center gap-2 bg-gradient-to-r ${product.gradient} hover:opacity-95 text-white font-bold px-5 py-3 rounded-xl shadow-xl transition-all hover:-translate-y-0.5 text-sm ring-1 ring-white/20`}
              >
                <ShoppingCart className="w-4 h-4" /> Ver precios
              </a>
              <button
                onClick={() => document.getElementById("subproducts")?.scrollIntoView({ behavior: "smooth" })}
                className="glass-card inline-flex items-center gap-2 hover:border-white/30 text-white px-5 py-3 rounded-xl transition-all text-sm hover:-translate-y-0.5"
              >
                Ver herramientas <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Box visual (placeholder estilo cinematic) */}
          <div className="hidden lg:flex items-center justify-center">
            <div className={`relative w-56 h-72 rounded-3xl bg-gradient-to-br ${product.gradient} flex flex-col items-center justify-between p-5 shadow-2xl ring-2 ring-white/20`}>
              <div className="text-center">
                <p className="text-white/70 text-[10px] font-bold tracking-[0.2em] uppercase">YF Auto Clip</p>
              </div>
              <div className="text-center">
                <p className="text-white font-black text-3xl tracking-wider">YF</p>
                <p className="text-white/85 text-[10px] font-bold tracking-widest uppercase mt-1">Auto Clip</p>
              </div>
              <div className="w-full space-y-1.5">
                {product.subProducts?.map((s) => (
                  <div key={s.name} className="bg-black/30 backdrop-blur border border-white/20 rounded-md py-1.5 text-center">
                    <p className="text-white text-[9px] font-black uppercase tracking-wider">{s.name}</p>
                  </div>
                ))}
              </div>
              <p className="text-white/40 text-[8px]">{product.packTagline}</p>
            </div>
          </div>
        </div>
      </div>

      {/* ── SUB-PRODUCTOS ── */}
      {product.subProducts && (
        <div id="subproducts" className="space-y-4">
          <div className="text-center">
            <h2 className="text-2xl sm:text-3xl font-black text-white">
              {product.subProducts.length} HERRAMIENTAS. <span className="text-transparent bg-clip-text bg-gradient-to-r from-violet-400 to-fuchsia-400">INFINITAS POSIBILIDADES.</span>
            </h2>
            <p className="text-white/45 text-sm mt-2">Cada herramienta es poderosa por sí sola. Juntas son imparables.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {product.subProducts.map((sub) => {
              const Icon = sub.icon;
              return (
                <div key={sub.name} className={`glass-card hover-lift relative overflow-hidden rounded-2xl border ${sub.borderColor} bg-gradient-to-br ${sub.bgColor} p-5`}>
                  <div className={`absolute -top-8 -right-8 w-32 h-32 bg-gradient-to-br ${sub.color} opacity-20 rounded-full blur-3xl`} />

                  <div className={`relative w-12 h-12 rounded-2xl bg-gradient-to-br ${sub.color} flex items-center justify-center shadow-lg mb-4 ring-1 ring-white/20`}>
                    <Icon className="w-6 h-6 text-white" />
                  </div>

                  <h3 className="relative text-white font-black text-base mb-1.5">{sub.name}</h3>
                  <p className="relative text-white/60 text-xs leading-relaxed mb-4">{sub.description}</p>

                  <ul className="relative space-y-1.5">
                    {sub.features.map((f) => (
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
        </div>
      )}

      {/* ── BENEFICIOS ── */}
      <div className="glass-card rounded-2xl border border-white/10 p-5 sm:p-6">
        <div className="text-center mb-5">
          <h2 className="text-xl sm:text-2xl font-black text-white">
            ¿Por qué usar <span className={product.textAccent}>{product.shortName ?? product.name}</span>?
          </h2>
          <p className="text-white/45 text-xs mt-1">Diseñado por creadores, para creadores serios.</p>
        </div>
        <div className="grid grid-cols-2 lg:grid-cols-3 gap-3">
          {product.benefits.map((b) => {
            const Icon = b.icon;
            return (
              <div key={b.title} className="bg-white/3 border border-white/8 rounded-xl p-4 hover:bg-white/5 transition-colors">
                <div className={`w-9 h-9 rounded-xl bg-gradient-to-br ${product.gradient} flex items-center justify-center mb-2 opacity-90`}>
                  <Icon className="w-4 h-4 text-white" />
                </div>
                <h3 className="text-white font-bold text-sm mb-0.5">{b.title}</h3>
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
