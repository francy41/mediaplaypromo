"use client";
import Link from "next/link";
import { Lock, Crown, Sparkles, ArrowRight, Check } from "lucide-react";
import { useAuth } from "@/lib/auth-context";
import { PLANS } from "@/lib/pricing";

interface Props {
  /** Contenido protegido (playground). Solo se renderiza si el usuario tiene plan de pago */
  children: React.ReactNode;
  /** Texto del feature bloqueado (ej: "AI Video Generator") */
  feature?: string;
}

/** Planes que dan acceso a la feature */
const PAID_PLANS = new Set(["Pro", "Business", "Enterprise"]);

export function PaywallGate({ children, feature = "AI Generator" }: Props) {
  const { user } = useAuth();

  // SuperAdmin SIEMPRE pasa
  if (user?.role === "superadmin") {
    return <>{children}</>;
  }

  // Usuarios con plan de pago pasan
  if (user?.plan && PAID_PLANS.has(user.plan)) {
    return <>{children}</>;
  }

  // Usuarios free / no logueados → paywall
  const popularPlan = PLANS.find((p) => p.popular);

  return (
    <div className="glass-card rounded-3xl border border-cyan-500/30 p-6 sm:p-10 relative overflow-hidden">
      {/* Decorative orbs */}
      <div className="absolute -top-24 -right-24 w-72 h-72 bg-gradient-to-br from-cyan-500 to-blue-600 opacity-20 rounded-full blur-3xl pointer-events-none float-slow" />
      <div className="absolute -bottom-24 -left-24 w-72 h-72 bg-gradient-to-br from-fuchsia-500 to-purple-600 opacity-15 rounded-full blur-3xl pointer-events-none float-soft" />
      <div className="particles-bg" />

      <div className="relative max-w-2xl mx-auto text-center">
        {/* Lock icon with glow */}
        <div className="relative inline-block mb-5">
          <div className="absolute inset-0 bg-gradient-to-br from-cyan-500 to-blue-600 opacity-40 rounded-3xl blur-2xl glow-pulse" />
          <div className="relative w-20 h-20 mx-auto rounded-3xl bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center shadow-2xl ring-2 ring-white/20">
            <Lock className="w-10 h-10 text-white" />
          </div>
        </div>

        <div className="inline-flex items-center gap-2 bg-yellow-500/10 border border-yellow-500/25 rounded-full px-3 py-1 text-[11px] font-black uppercase tracking-wider text-yellow-300 mb-4">
          <Crown className="w-3 h-3" /> CONTENIDO PREMIUM
        </div>

        <h2 className="text-2xl sm:text-3xl lg:text-4xl font-black text-white leading-tight mb-3">
          Desbloquea {feature}{" "}
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-blue-500">con un plan Pro</span>
        </h2>

        <p className="text-white/55 text-sm sm:text-base max-w-xl mx-auto mb-6">
          La generación de videos con IA es exclusiva para suscriptores. Activa tu plan en 1 click y empieza a crear ahora mismo.
        </p>

        {/* Plan highlight */}
        {popularPlan && (
          <div className="glass-card rounded-2xl border border-cyan-500/30 p-5 mb-6 max-w-md mx-auto">
            <div className="flex items-baseline justify-center gap-1 mb-3">
              <span className="text-white font-black text-4xl">€{popularPlan.priceMonthly}</span>
              <span className="text-white/45 text-xs">/mes</span>
            </div>
            <p className="text-white/55 text-xs mb-4">Plan <strong className="text-cyan-400">{popularPlan.name}</strong> · {popularPlan.credits} créditos · todos los modelos</p>
            <ul className="space-y-1.5 text-left text-xs">
              {popularPlan.features.slice(0, 4).map((f) => (
                <li key={f} className="flex items-start gap-2">
                  <Check className="w-3.5 h-3.5 text-green-400 flex-shrink-0 mt-0.5" />
                  <span className="text-white/75">{f}</span>
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* CTAs */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
          <Link
            href="/pricing"
            className="shine-btn w-full sm:w-auto inline-flex items-center justify-center gap-2 bg-gradient-to-r from-cyan-500 to-blue-600 hover:opacity-95 text-white font-bold text-sm px-6 py-3 rounded-2xl shadow-lg shadow-cyan-500/30 transition-all hover:-translate-y-0.5"
          >
            <Sparkles className="w-4 h-4" /> Ver planes y precios
          </Link>
          {!user && (
            <Link
              href="/login"
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 bg-white/5 hover:bg-white/10 border border-white/15 text-white font-semibold text-sm px-6 py-3 rounded-2xl transition-all"
            >
              Ya tengo cuenta <ArrowRight className="w-4 h-4" />
            </Link>
          )}
        </div>

        <p className="text-white/35 text-[10px] mt-4">
          ⚡ Activación inmediata · Cancela cuando quieras · Sin permanencia
        </p>
      </div>
    </div>
  );
}
