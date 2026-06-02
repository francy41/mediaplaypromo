"use client";
import { Suspense } from "react";
import Link from "next/link";
import { CheckCircle2, ArrowRight, LayoutDashboard, Download } from "lucide-react";

function SuccessContent() {
  return (
    <div className="min-h-screen bg-[#070809] text-white flex items-center justify-center p-4">
      <div className="glass-card relative overflow-hidden rounded-3xl border border-green-500/30 p-8 sm:p-12 max-w-md w-full text-center">
        <div className="absolute -top-24 -right-24 w-72 h-72 bg-gradient-to-br from-green-500 to-emerald-600 opacity-20 rounded-full blur-3xl float-slow" />
        <div className="particles-bg" />

        <div className="relative">
          <div className="inline-flex w-20 h-20 rounded-3xl bg-gradient-to-br from-green-500 to-emerald-600 items-center justify-center shadow-2xl ring-2 ring-white/20 mb-5 glow-pulse">
            <CheckCircle2 className="w-11 h-11 text-white" />
          </div>

          <h1 className="text-3xl sm:text-4xl font-black mb-3">¡Pago completado! 🎉</h1>
          <p className="text-white/60 text-sm sm:text-base mb-6">
            Tu compra fue procesada con éxito. Recibirás un email de confirmación con el acceso a tu producto.
          </p>

          <div className="space-y-2">
            <Link
              href="/dashboard"
              className="shine-btn w-full inline-flex items-center justify-center gap-2 bg-gradient-to-r from-green-500 to-emerald-600 hover:opacity-95 text-white font-bold text-sm px-6 py-3.5 rounded-2xl shadow-lg shadow-green-500/30 transition-all hover:-translate-y-0.5"
            >
              <LayoutDashboard className="w-4 h-4" /> Ir a mi Dashboard
            </Link>
            <Link
              href="/"
              className="w-full inline-flex items-center justify-center gap-2 bg-white/5 hover:bg-white/10 border border-white/10 text-white font-semibold text-sm px-6 py-3 rounded-2xl transition-all"
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
