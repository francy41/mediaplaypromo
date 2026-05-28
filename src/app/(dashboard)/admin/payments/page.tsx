"use client";
import { CreditCard, Plus, DollarSign, TrendingUp, Wallet } from "lucide-react";
import { AdminShell, KPIGrid, ComingSoonPanel } from "@/components/admin/AdminShell";

export default function PaymentsAdminPage() {
  return (
    <AdminShell
      title="Pagos & Suscripciones"
      description="Stripe Connect, PayPal, suscripciones recurrentes, payouts y refunds"
      icon={CreditCard}
      iconGradient="from-green-500 to-emerald-600"
      status="beta"
      breadcrumb={[{ label: "Pagos" }]}
      actions={
        <button className="inline-flex items-center gap-1.5 bg-white/5 hover:bg-white/10 border border-white/10 text-white text-xs font-semibold px-3 py-2 rounded-xl transition-colors">
          Conectar Stripe
        </button>
      }
    >
      <KPIGrid
        kpis={[
          { label: "MRR", value: "$0", sublabel: "Conecta Stripe", gradient: "from-green-500 to-emerald-600" },
          { label: "Pagos 30d", value: 0, sublabel: "Transacciones", gradient: "from-cyan-500 to-blue-600" },
          { label: "Payouts Pendientes", value: "$0", sublabel: "Por aprobar", gradient: "from-yellow-500 to-orange-500" },
          { label: "Refunds 30d", value: "$0", sublabel: "Devuelto", gradient: "from-red-500 to-rose-600" },
        ]}
      />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {[
          { name: "Stripe", desc: "Pagos con tarjeta + Connect", status: "Desconectado", color: "from-violet-500 to-indigo-600" },
          { name: "PayPal", desc: "Pagos + Payouts API", status: "Desconectado", color: "from-blue-500 to-cyan-600" },
          { name: "Crypto", desc: "BTC, ETH, USDC", status: "Próximamente", color: "from-amber-500 to-orange-600" },
        ].map((g) => (
          <div key={g.name} className="glass-card rounded-2xl border border-white/10 p-5">
            <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${g.color} flex items-center justify-center mb-3 shadow-lg`}>
              <Wallet className="w-6 h-6 text-white" />
            </div>
            <h3 className="text-white font-bold text-base">{g.name}</h3>
            <p className="text-white/45 text-xs mb-3">{g.desc}</p>
            <span className="inline-flex items-center gap-1.5 bg-yellow-500/15 text-yellow-400 border border-yellow-500/25 text-[10px] font-bold px-2 py-0.5 rounded-full">
              <span className="w-1.5 h-1.5 rounded-full bg-yellow-400" /> {g.status}
            </span>
          </div>
        ))}
      </div>

      <ComingSoonPanel
        feature="Engine de Pagos"
        requirements={[
          "Cuenta Stripe + claves API (test y producción)",
          "Webhook endpoint con verificación de signature",
          "Stripe Connect para marketplace y payouts a sellers",
          "PayPal Business + REST API credentials",
          "Base de datos para guardar subscriptions, invoices, payouts",
        ]}
      />
    </AdminShell>
  );
}
