"use client";
import { useState } from "react";
import { UserCheck, Plus, Trophy, DollarSign } from "lucide-react";
import { AdminShell, KPIGrid } from "@/components/admin/AdminShell";

export default function AffiliatesAdminPage() {
  const [commission, setCommission] = useState(30);
  const [recurring, setRecurring] = useState(true);

  return (
    <AdminShell
      title="Sistema de Afiliados"
      description="Comisiones, red de referidos, payouts y leaderboard global"
      icon={UserCheck}
      iconGradient="from-green-500 to-emerald-600"
      status="beta"
      breadcrumb={[{ label: "Afiliados" }]}
      actions={
        <button className="inline-flex items-center gap-1.5 bg-green-500 hover:bg-green-400 text-white font-bold text-xs px-4 py-2 rounded-xl transition-all">
          <Plus className="w-4 h-4" /> Nueva Campaña
        </button>
      }
    >
      <KPIGrid
        kpis={[
          { label: "Comisión Base", value: `${commission}%`, sublabel: "Por venta", gradient: "from-green-500 to-emerald-600" },
          { label: "Afiliados Activos", value: 0, sublabel: "Sin pagos pendientes", gradient: "from-cyan-500 to-blue-600" },
          { label: "Comisiones Mes", value: "$0", sublabel: "Pagadas + pendientes", gradient: "from-yellow-500 to-orange-500" },
          { label: "Click-through", value: "—", sublabel: "Conversión global", gradient: "from-fuchsia-500 to-purple-600" },
        ]}
      />

      {/* Config */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="glass-card rounded-2xl border border-white/10 p-6">
          <h3 className="text-white font-bold text-base mb-1">Configuración Global</h3>
          <p className="text-white/45 text-xs mb-5">Reglas que aplican a toda la red</p>

          <div className="space-y-4">
            <div>
              <label className="block text-white/55 text-[10px] font-bold uppercase tracking-wider mb-2">Comisión por venta (%)</label>
              <input
                type="range" min="5" max="50" step="5"
                value={commission}
                onChange={(e) => setCommission(parseInt(e.target.value))}
                className="w-full accent-green-500"
              />
              <div className="flex items-center justify-between mt-2">
                <span className="text-white/30 text-xs">5%</span>
                <span className="text-green-400 font-black text-2xl">{commission}%</span>
                <span className="text-white/30 text-xs">50%</span>
              </div>
            </div>

            <label className="flex items-center gap-3 cursor-pointer p-3 bg-white/3 border border-white/8 rounded-xl hover:bg-white/5 transition-colors">
              <input
                type="checkbox"
                checked={recurring}
                onChange={(e) => setRecurring(e.target.checked)}
                className="w-4 h-4 accent-green-500"
              />
              <div className="flex-1">
                <p className="text-white font-semibold text-sm">Comisiones Recurrentes</p>
                <p className="text-white/45 text-xs">Paga al afiliado cada renovación del cliente</p>
              </div>
            </label>

            <button className="w-full bg-gradient-to-r from-green-500 to-emerald-600 hover:opacity-90 text-white font-bold text-sm py-3 rounded-xl shadow-lg shadow-green-500/30 transition-all">
              Guardar Configuración
            </button>
          </div>
        </div>

        <div className="glass-card rounded-2xl border border-white/10 p-6">
          <h3 className="text-white font-bold text-base mb-1 flex items-center gap-2">
            <Trophy className="w-4 h-4 text-yellow-400" /> Leaderboard
          </h3>
          <p className="text-white/45 text-xs mb-5">Top afiliados por ingresos generados</p>

          <div className="space-y-2">
            {[1, 2, 3].map((rank) => (
              <div key={rank} className="flex items-center gap-3 p-3 bg-white/3 border border-white/8 rounded-xl opacity-50">
                <span className={`w-8 h-8 rounded-full flex items-center justify-center font-black text-xs ${
                  rank === 1 ? "bg-gradient-to-br from-yellow-400 to-orange-500 text-black" :
                  rank === 2 ? "bg-gradient-to-br from-slate-300 to-slate-400 text-black" :
                  "bg-gradient-to-br from-orange-400 to-red-500 text-white"
                }`}>
                  {rank}
                </span>
                <div className="flex-1">
                  <p className="text-white/60 font-semibold text-sm">Sin datos aún</p>
                  <p className="text-white/30 text-xs">— referidos</p>
                </div>
                <span className="text-white/30 font-bold text-sm">$0</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="bg-yellow-500/8 border border-yellow-500/20 rounded-2xl p-4 text-sm flex items-start gap-3">
        <DollarSign className="w-5 h-5 text-yellow-400 flex-shrink-0 mt-0.5" />
        <div>
          <p className="text-yellow-300 font-bold">Para activar pagos automáticos:</p>
          <p className="text-yellow-100/60 text-xs mt-1">Stripe Connect + PayPal Payouts API + base de datos para referral tracking.</p>
        </div>
      </div>
    </AdminShell>
  );
}
