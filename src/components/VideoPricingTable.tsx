"use client";
import { useState } from "react";
import { Video as VideoIcon, Crown, Sparkles, Zap, TrendingUp, Info } from "lucide-react";
import { PUBLIC_VIDEO_PRICING, VIDEO_BUNDLE_SIZES, getBundlePrice, getBundleProfit, getCustomerPriceUSD, getAdminProfitUSD, getRealCostUSD, usdToEur } from "@/lib/pricing";
import { useAuth } from "@/lib/auth-context";

type Tier = "all" | "budget" | "mid" | "premium" | "ultra";

const TIER_LABELS: Record<Tier, string> = {
  all: "Todos",
  budget: "💎 Budget",
  mid: "⚡ Equilibrado",
  premium: "🏆 Premium",
  ultra: "👑 Ultra",
};

const TIER_COLORS: Record<Tier, string> = {
  all: "from-cyan-500 to-blue-600",
  budget: "from-green-500 to-emerald-600",
  mid: "from-cyan-500 to-blue-600",
  premium: "from-violet-500 to-purple-600",
  ultra: "from-yellow-400 to-orange-500",
};

interface Props {
  /** Mostrar columna de tu ganancia (solo SuperAdmin) */
  showAdminProfit?: boolean;
  /** Moneda */
  currency?: "USD" | "EUR";
  /** Si embebido en otra sección */
  embedded?: boolean;
}

export function VideoPricingTable({ showAdminProfit, currency = "EUR", embedded = false }: Props) {
  const { user } = useAuth();
  const [tier, setTier] = useState<Tier>("all");
  const isAdmin = user?.role === "superadmin";
  const showProfit = showAdminProfit ?? isAdmin;

  const symbol = currency === "EUR" ? "€" : "$";
  const fmt = (usd: number) => (currency === "EUR" ? usdToEur(usd) : usd).toFixed(2);

  const filtered = tier === "all"
    ? PUBLIC_VIDEO_PRICING
    : PUBLIC_VIDEO_PRICING.filter((m) => m.tier === tier);

  return (
    <section className={embedded ? "" : "px-4 sm:px-6 lg:px-8 py-12 sm:py-16 max-w-6xl mx-auto"}>
      {!embedded && (
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-2 bg-cyan-500/10 border border-cyan-500/20 rounded-full px-3 py-1 text-[11px] sm:text-xs text-cyan-400 mb-4 font-bold tracking-wider uppercase">
            <VideoIcon className="w-3 h-3" /> Precios por video
          </div>
          <h2 className="text-3xl sm:text-4xl font-black leading-tight mb-3">
            Paga solo por lo que{" "}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-blue-500">generas</span>
          </h2>
          <p className="text-white/55 text-sm sm:text-base max-w-xl mx-auto">
            17 modelos de video IA. Desde {symbol}{fmt(getCustomerPriceUSD("wan2.2-5b-fast-t2v"))} por video. Compra paquetes o usa créditos del plan.
          </p>
        </div>
      )}

      {/* Tier tabs */}
      <div className="flex flex-wrap justify-center gap-2 mb-6">
        {(Object.keys(TIER_LABELS) as Tier[]).map((t) => (
          <button
            key={t}
            onClick={() => setTier(t)}
            className={`px-3 sm:px-4 py-1.5 sm:py-2 rounded-full text-xs sm:text-sm font-bold transition-all ${
              tier === t
                ? `bg-gradient-to-r ${TIER_COLORS[t]} text-white shadow-lg ring-1 ring-white/20`
                : "bg-white/5 border border-white/10 text-white/65 hover:bg-white/10 hover:text-white"
            }`}
          >
            {TIER_LABELS[t]}
          </button>
        ))}
      </div>

      {/* Admin profit indicator */}
      {showProfit && (
        <div className="mb-4 inline-flex items-center gap-2 bg-green-500/10 border border-green-500/30 text-green-300 text-[10px] sm:text-xs font-bold px-3 py-1.5 rounded-full">
          <TrendingUp className="w-3 h-3" />
          Vista SuperAdmin · ves tu ganancia neta (margen 50%)
        </div>
      )}

      {/* Desktop table */}
      <div className="hidden md:block glass-card rounded-2xl border border-white/10 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-white/10 bg-white/[0.03]">
                <th className="text-left px-4 py-3 text-[10px] font-black uppercase tracking-wider text-white/45">Modelo</th>
                <th className="text-right px-3 py-3 text-[10px] font-black uppercase tracking-wider text-white/45">Por video</th>
                {VIDEO_BUNDLE_SIZES.slice(1).map((n) => (
                  <th key={n} className="text-right px-3 py-3 text-[10px] font-black uppercase tracking-wider text-white/45">
                    {n} videos
                  </th>
                ))}
                {showProfit && (
                  <th className="text-right px-3 py-3 text-[10px] font-black uppercase tracking-wider text-green-400 bg-green-500/5">
                    Tu ganancia (20)
                  </th>
                )}
              </tr>
            </thead>
            <tbody>
              {filtered.map((m) => {
                const tierColor =
                  m.tier === "budget"  ? "text-green-400" :
                  m.tier === "mid"     ? "text-cyan-400" :
                  m.tier === "premium" ? "text-violet-400" :
                  "text-yellow-400";
                const profit20 = getBundleProfit(m.slug, 20);
                return (
                  <tr key={m.slug} className="border-b border-white/5 hover:bg-white/3 transition-colors">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <span className={`text-[10px] font-bold uppercase tracking-wider ${tierColor}`}>
                          {m.tier === "budget" ? "💎" : m.tier === "mid" ? "⚡" : m.tier === "premium" ? "🏆" : "👑"}
                        </span>
                        <div>
                          <p className="text-white font-bold text-[13px]">{m.name}</p>
                          <p className="text-white/35 text-[10px]">{m.duration} · {m.resolution}</p>
                        </div>
                      </div>
                    </td>
                    {VIDEO_BUNDLE_SIZES.map((n, i) => {
                      const price = getBundlePrice(m.slug, n);
                      const isPopular = n === 20;
                      return (
                        <td key={n} className={`px-3 py-3 text-right ${isPopular ? "bg-cyan-500/5" : ""}`}>
                          <p className={`font-bold text-white ${i === 0 ? "text-sm" : "text-sm"}`}>
                            {symbol}{fmt(price)}
                          </p>
                          {i === 0 && (
                            <p className="text-white/30 text-[9px]">por unidad</p>
                          )}
                        </td>
                      );
                    })}
                    {showProfit && (
                      <td className="px-3 py-3 text-right bg-green-500/5 border-l border-green-500/20">
                        <p className="text-green-300 font-black text-sm">+{symbol}{fmt(profit20)}</p>
                        <p className="text-green-500/40 text-[9px]">neto</p>
                      </td>
                    )}
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Mobile cards */}
      <div className="md:hidden space-y-3">
        {filtered.map((m) => {
          const tierEmoji = m.tier === "budget" ? "💎" : m.tier === "mid" ? "⚡" : m.tier === "premium" ? "🏆" : "👑";
          return (
            <div key={m.slug} className="glass-card rounded-2xl border border-white/10 p-4">
              <div className="flex items-center justify-between mb-3">
                <div>
                  <p className="text-white font-bold text-sm">{tierEmoji} {m.name}</p>
                  <p className="text-white/40 text-[10px]">{m.duration} · {m.resolution}</p>
                </div>
                <div className="text-right">
                  <p className="text-white font-black text-lg">{symbol}{fmt(getCustomerPriceUSD(m.slug))}</p>
                  <p className="text-white/30 text-[9px]">por video</p>
                </div>
              </div>
              <div className="grid grid-cols-3 gap-1.5">
                {VIDEO_BUNDLE_SIZES.slice(1).map((n) => (
                  <div key={n} className={`bg-white/5 border border-white/10 rounded-lg p-2 text-center ${n === 20 ? "border-cyan-500/30 bg-cyan-500/10" : ""}`}>
                    <p className="text-white/45 text-[9px] font-bold">{n} videos</p>
                    <p className="text-white font-bold text-xs mt-0.5">{symbol}{fmt(getBundlePrice(m.slug, n))}</p>
                  </div>
                ))}
              </div>
              {showProfit && (
                <div className="mt-2 bg-green-500/10 border border-green-500/30 rounded-lg p-2 text-center">
                  <p className="text-green-300 text-[10px]">
                    Tu ganancia con bundle de 20: <strong>+{symbol}{fmt(getBundleProfit(m.slug, 20))}</strong>
                  </p>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Info footer */}
      <div className="mt-6 flex flex-wrap items-center justify-center gap-3 text-[11px] text-white/45">
        <span className="inline-flex items-center gap-1"><Info className="w-3 h-3" /> Precios IVA no incluido</span>
        <span>·</span>
        <span>Pago por consumo o suscripción</span>
        <span>·</span>
        <span>Sin permanencia</span>
      </div>
    </section>
  );
}
