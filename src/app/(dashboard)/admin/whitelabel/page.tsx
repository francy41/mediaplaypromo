"use client";
import { Globe, Plus, Server, CheckCircle2, AlertCircle } from "lucide-react";
import { AdminShell, KPIGrid, ComingSoonPanel } from "@/components/admin/AdminShell";

export default function WhiteLabelAdminPage() {
  return (
    <AdminShell
      title="Marca Blanca (White Label)"
      description="Tenants multi-empresa, dominios custom, SSL automático y branding aislado"
      icon={Globe}
      iconGradient="from-fuchsia-500 to-purple-600"
      status="beta"
      breadcrumb={[{ label: "White Label" }]}
      actions={
        <button className="inline-flex items-center gap-1.5 bg-gradient-to-r from-fuchsia-500 to-purple-600 text-white font-bold text-xs px-4 py-2 rounded-xl shadow-lg shadow-fuchsia-500/30 hover:-translate-y-0.5 transition-all">
          <Plus className="w-4 h-4" /> Nuevo Tenant
        </button>
      }
    >
      <KPIGrid
        kpis={[
          { label: "Tenants Activos", value: 0, sublabel: "Clientes SaaS", gradient: "from-fuchsia-500 to-purple-600" },
          { label: "Dominios Conectados", value: 0, sublabel: "Con SSL activo", gradient: "from-cyan-500 to-blue-600" },
          { label: "MRR White-Label", value: "$0", sublabel: "Revenue mensual", gradient: "from-green-500 to-emerald-600" },
          { label: "Plan Promedio", value: "—", sublabel: "Por tenant", gradient: "from-amber-500 to-orange-500" },
        ]}
      />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="glass-card rounded-2xl border border-white/10 p-6">
          <h3 className="text-white font-bold text-base mb-3 flex items-center gap-2">
            <Server className="w-4 h-4 text-cyan-400" /> Arquitectura Multi-Tenant
          </h3>
          <ul className="space-y-2 text-sm">
            {[
              { ok: false, t: "Aislamiento de datos por tenant (DB)" },
              { ok: false, t: "DNS verification automático" },
              { ok: false, t: "SSL provisioning (Let's Encrypt)" },
              { ok: false, t: "Branding por tenant (logo, colores, dominio)" },
              { ok: false, t: "Subdominio reservado *.mediaplaypromo.com" },
              { ok: false, t: "API de tenant management" },
            ].map((r, i) => (
              <li key={i} className="flex items-center gap-2">
                {r.ok ? <CheckCircle2 className="w-4 h-4 text-green-400 flex-shrink-0" /> : <AlertCircle className="w-4 h-4 text-yellow-400 flex-shrink-0" />}
                <span className={r.ok ? "text-white/70" : "text-white/50"}>{r.t}</span>
              </li>
            ))}
          </ul>
        </div>

        <div className="glass-card rounded-2xl border border-white/10 p-6">
          <h3 className="text-white font-bold text-base mb-3">Planes propuestos</h3>
          <div className="space-y-2">
            {[
              { name: "Starter", price: "$49/mes", features: "1 dominio, 100 usuarios, branding básico" },
              { name: "Agency", price: "$199/mes", features: "5 dominios, 5k usuarios, branding completo" },
              { name: "Enterprise", price: "$999/mes", features: "Ilimitado, SLA 99.9%, soporte dedicado" },
            ].map((p) => (
              <div key={p.name} className="p-3 bg-white/3 border border-white/8 rounded-xl">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-white font-bold">{p.name}</span>
                  <span className="text-fuchsia-400 font-black">{p.price}</span>
                </div>
                <p className="text-white/45 text-xs">{p.features}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      <ComingSoonPanel
        feature="Multi-Tenant Engine"
        requirements={[
          "Base de datos con esquema multi-tenant (Postgres + Row Level Security)",
          "Cloudflare for SaaS o servicio similar para SSL automático",
          "Backend Node/Edge para tenant resolver (subdomain & custom domain)",
          "Stripe Connect para revenue sharing entre platform y tenants",
          "Sistema de templates de branding (color, logo, favicon, copy)",
        ]}
      />
    </AdminShell>
  );
}
