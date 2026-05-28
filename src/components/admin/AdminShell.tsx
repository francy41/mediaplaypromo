"use client";
import Link from "next/link";
import { ChevronRight, Shield, ExternalLink } from "lucide-react";
import { useAuth } from "@/lib/auth-context";
import type { LucideIcon } from "lucide-react";

interface Props {
  title: string;
  description?: string;
  icon: LucideIcon;
  iconGradient?: string;
  status?: "live" | "beta" | "soon";
  breadcrumb?: { label: string; href?: string }[];
  actions?: React.ReactNode;
  children: React.ReactNode;
}

export function AdminShell({
  title, description, icon: Icon, iconGradient = "from-cyan-500 to-blue-600",
  status, breadcrumb, actions, children,
}: Props) {
  const { user } = useAuth();

  if (user && user.role !== "superadmin") {
    return (
      <div className="bg-red-500/10 border border-red-500/20 rounded-2xl p-8 text-center max-w-md mx-auto">
        <Shield className="w-10 h-10 text-red-400 mx-auto mb-3" />
        <h2 className="text-white font-bold text-lg">Acceso restringido</h2>
        <p className="text-white/55 text-sm mt-1">Solo SuperAdmin puede ver esta página.</p>
      </div>
    );
  }

  const statusChip = status && (
    <span className={`text-[10px] font-black px-2 py-0.5 rounded-full uppercase tracking-wider ${
      status === "live" ? "bg-green-500/20 text-green-400 border border-green-500/30"
      : status === "beta" ? "bg-yellow-500/20 text-yellow-400 border border-yellow-500/30"
      : "bg-white/10 text-white/45 border border-white/15"
    }`}>
      {status}
    </span>
  );

  return (
    <div className="space-y-6 pb-10">
      {/* Header */}
      <div className="glass-card relative overflow-hidden rounded-2xl border border-white/10 p-6">
        <div className={`absolute -top-20 -right-20 w-72 h-72 bg-gradient-to-br ${iconGradient} opacity-15 rounded-full blur-3xl pointer-events-none float-slow`} />
        <div className="relative flex flex-wrap items-start justify-between gap-4">
          <div className="flex items-start gap-4 min-w-0 flex-1">
            <div className={`w-14 h-14 rounded-2xl bg-gradient-to-br ${iconGradient} flex items-center justify-center shadow-lg ring-1 ring-white/20 flex-shrink-0`}>
              <Icon className="w-7 h-7 text-white" />
            </div>
            <div className="min-w-0">
              {breadcrumb && (
                <div className="flex items-center gap-1 text-[11px] text-white/35 mb-1.5 flex-wrap">
                  <Link href="/admin" className="hover:text-white/65 transition-colors">SuperAdmin</Link>
                  {breadcrumb.map((c, i) => (
                    <span key={i} className="flex items-center gap-1">
                      <ChevronRight className="w-3 h-3 text-white/20" />
                      {c.href ? <Link href={c.href} className="hover:text-white/65 transition-colors">{c.label}</Link> : <span className="text-white/55">{c.label}</span>}
                    </span>
                  ))}
                </div>
              )}
              <div className="flex items-center gap-2 flex-wrap">
                <h1 className="text-white font-black text-2xl truncate">{title}</h1>
                {statusChip}
              </div>
              {description && <p className="text-white/55 text-sm mt-1">{description}</p>}
            </div>
          </div>
          {actions && <div className="flex flex-wrap items-center gap-2">{actions}</div>}
        </div>
      </div>

      {/* Content */}
      {children}
    </div>
  );
}

/* ─────────────────────────────────────────────
   ComingSoonPanel — placeholder consistente
   ───────────────────────────────────────────── */
export function ComingSoonPanel({
  feature, requirements,
}: {
  feature: string;
  requirements?: string[];
}) {
  return (
    <div className="glass-card rounded-2xl border border-white/10 p-10 text-center">
      <div className="inline-flex items-center gap-2 bg-yellow-500/10 border border-yellow-500/20 rounded-full px-3 py-1 text-yellow-400 text-[10px] font-black uppercase tracking-wider mb-4">
        🚧 EN DESARROLLO
      </div>
      <h2 className="text-white font-bold text-xl mb-2">{feature}</h2>
      <p className="text-white/50 text-sm max-w-md mx-auto mb-6">
        Este módulo está siendo construido. La UI está lista — falta wireado al backend real.
      </p>
      {requirements && requirements.length > 0 && (
        <div className="bg-white/3 border border-white/8 rounded-2xl p-5 max-w-md mx-auto text-left">
          <p className="text-white/60 text-xs font-bold uppercase tracking-wider mb-3">Para activarlo necesitamos:</p>
          <ul className="space-y-2">
            {requirements.map((r, i) => (
              <li key={i} className="flex items-start gap-2 text-white/70 text-sm">
                <span className="text-cyan-400 mt-0.5">→</span>
                <span>{r}</span>
              </li>
            ))}
          </ul>
        </div>
      )}
      <Link href="/admin" className="inline-flex items-center gap-1.5 mt-6 text-cyan-400 hover:text-cyan-300 text-xs font-semibold transition-colors">
        <ExternalLink className="w-3.5 h-3.5" /> Volver al Hub
      </Link>
    </div>
  );
}

/* ─────────────────────────────────────────────
   KPIGrid — reusable stat cards
   ───────────────────────────────────────────── */
export function KPIGrid({ kpis }: { kpis: { label: string; value: string | number; sublabel?: string; gradient?: string }[] }) {
  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
      {kpis.map((k) => (
        <div key={k.label} className="glass-card hover-lift rounded-2xl border border-white/10 p-5 relative overflow-hidden">
          {k.gradient && (
            <div className={`absolute -top-8 -right-8 w-24 h-24 bg-gradient-to-br ${k.gradient} opacity-15 rounded-full blur-2xl pointer-events-none`} />
          )}
          <p className="relative text-white/45 text-[10px] font-bold uppercase tracking-wider">{k.label}</p>
          <p className="relative text-3xl font-black text-white mt-1.5">{k.value}</p>
          {k.sublabel && <p className="relative text-white/40 text-xs mt-1">{k.sublabel}</p>}
        </div>
      ))}
    </div>
  );
}
