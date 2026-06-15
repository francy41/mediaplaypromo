"use client";
import { Suspense, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { CheckCircle2, ArrowRight, LayoutDashboard, Download, Loader2 } from "lucide-react";

interface SessionInfo {
  paid: boolean;
  productName?: string | null;
  tierName?: string | null;
  email?: string | null;
  downloadUrl?: string | null;
  licenseKey?: string | null;
}

function SuccessContent() {
  const sp = useSearchParams();
  const sessionId = sp.get("session_id");
  const [info, setInfo] = useState<SessionInfo | null>(null);
  const [loading, setLoading] = useState(!!sessionId);

  useEffect(() => {
    if (!sessionId) return;
    fetch(`/api/checkout/session?session_id=${encodeURIComponent(sessionId)}`)
      .then((r) => r.json())
      .then((d) => setInfo(d))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [sessionId]);

  return (
    <div className="always-dark min-h-screen bg-[#070809] text-white flex items-center justify-center p-4" style={{ colorScheme: "dark" }}>
      <div className="glass-card relative overflow-hidden rounded-3xl border border-green-500/30 p-8 sm:p-12 max-w-md w-full text-center">
        <div className="absolute -top-24 -right-24 w-72 h-72 bg-gradient-to-br from-green-500 to-emerald-600 opacity-20 rounded-full blur-3xl float-slow" />
        <div className="particles-bg" />

        <div className="relative">
          <div className="inline-flex w-20 h-20 rounded-3xl bg-gradient-to-br from-green-500 to-emerald-600 items-center justify-center shadow-2xl ring-2 ring-white/20 mb-5 glow-pulse">
            <CheckCircle2 className="w-11 h-11 text-white" />
          </div>

          <h1 className="text-3xl sm:text-4xl font-black mb-3">¡Pago completado! 🎉</h1>
          <p className="text-white/60 text-sm sm:text-base mb-6">
            {info?.productName ? <>Gracias por tu compra de <strong className="text-white">{info.productName}</strong>{info.tierName ? ` · ${info.tierName}` : ""}.</> : "Tu compra fue procesada con éxito."}
            {info?.email ? <> Enviamos la confirmación a <strong className="text-white">{info.email}</strong>.</> : null}
          </p>

          {/* Entrega del producto */}
          {loading && (
            <div className="flex items-center justify-center gap-2 text-white/60 text-sm mb-6">
              <Loader2 className="w-4 h-4 animate-spin" /> Preparando tu descarga...
            </div>
          )}

          {!loading && info?.licenseKey && (
            <div className="bg-white/5 border border-cyan-500/30 rounded-xl p-4 mb-3 text-left">
              <p className="text-white/50 text-[10px] font-bold uppercase tracking-wider mb-1">Tu clave de licencia</p>
              <p className="text-cyan-300 font-mono font-bold text-sm sm:text-base tracking-wider break-all select-all">{info.licenseKey}</p>
              <p className="text-white/35 text-[10px] mt-1.5">Guárdala en un lugar seguro: la necesitarás para activar el programa.</p>
            </div>
          )}

          {!loading && info?.downloadUrl && (
            <a
              href={info.downloadUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="shine-btn w-full inline-flex items-center justify-center gap-2 bg-gradient-to-r from-cyan-500 to-blue-600 hover:opacity-95 text-white font-black text-base px-6 py-4 rounded-2xl shadow-lg shadow-cyan-500/30 transition-all hover:-translate-y-0.5 mb-3"
            >
              <Download className="w-5 h-5" /> Descargar mi producto
            </a>
          )}

          {!loading && info && !info.downloadUrl && (
            <div className="bg-white/5 border border-white/10 rounded-xl p-3 mb-4 text-white/55 text-xs">
              Tu acceso llegará por email en breve. Si no lo recibes, escríbenos a soporte@mediaplaypromo.com
            </div>
          )}

          <div className="space-y-2">
            <Link
              href="/dashboard"
              className="w-full inline-flex items-center justify-center gap-2 bg-white/5 hover:bg-white/10 border border-white/10 text-white font-semibold text-sm px-6 py-3 rounded-2xl transition-all"
            >
              <LayoutDashboard className="w-4 h-4" /> Ir a mi Dashboard
            </Link>
            <Link
              href="/"
              className="w-full inline-flex items-center justify-center gap-2 text-white/50 hover:text-white font-medium text-sm px-6 py-2 transition-all"
            >
              Volver al inicio <ArrowRight className="w-4 h-4" />
            </Link>
          </div>

          <p className="text-white/30 text-[11px] mt-6">
            ¿Problemas con tu compra? Escríbenos a soporte@mediaplaypromo.com
          </p>
        </div>
      </div>
    </div>
  );
}

export default function CheckoutSuccessPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-[#070809]" />}>
      <SuccessContent />
    </Suspense>
  );
}
