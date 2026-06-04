"use client";
import Link from "next/link";
import { useAuth } from "@/lib/auth-context";
import { ThemeToggle } from "@/components/ThemeToggle";
import { LayoutDashboard, ArrowRight, Crown } from "lucide-react";
import { SocialLinks } from "@/components/SocialLinks";
import { BrandLogo } from "@/components/BrandLogo";

/**
 * Layout PÚBLICO para /categories/*
 * Cualquiera puede navegar las categorías y ver productos sin loguearse.
 * El login solo se pide al pulsar "Comprar" en un producto.
 */
export default function PublicCategoriesLayout({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();

  return (
    <div className="min-h-screen bg-[#080a0f] text-white flex flex-col">
      {/* ── Top Nav ── */}
      <header className="sticky top-0 z-40 w-full bg-[#080a0f]/85 backdrop-blur-md border-b border-white/8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-3">
          <Link href="/" className="flex items-center gap-2.5">
            <BrandLogo className="w-9 h-9 drop-shadow-lg" />
            <div>
              <div className="text-white font-bold text-sm leading-none">MediaPlay<span className="font-medium text-white/80">Promo</span></div>
              <div className="text-white/35 text-[9px] font-semibold tracking-widest leading-none mt-0.5">.COM</div>
            </div>
          </Link>

          <nav className="hidden md:flex items-center gap-1">
            <Link href="/" className="text-white/55 hover:text-white text-sm font-medium px-3 py-2 rounded-lg hover:bg-white/5 transition-colors">
              Inicio
            </Link>
            <Link href="/pricing" className="text-white/55 hover:text-white text-sm font-medium px-3 py-2 rounded-lg hover:bg-white/5 transition-colors">
              Precios
            </Link>
            <Link href="/#categories" className="text-white/55 hover:text-white text-sm font-medium px-3 py-2 rounded-lg hover:bg-white/5 transition-colors">
              Categorías
            </Link>
          </nav>

          <div className="flex items-center gap-2">
            <ThemeToggle compact />
            {user ? (
              <Link href="/dashboard" className="inline-flex items-center gap-1.5 bg-white/5 hover:bg-white/10 border border-white/10 text-white text-xs font-semibold px-3 py-2 rounded-xl transition-colors">
                <LayoutDashboard className="w-3.5 h-3.5" /> Dashboard
              </Link>
            ) : (
              <>
                <Link href="/login" className="hidden sm:inline-flex items-center text-white/70 hover:text-white text-sm font-medium px-3 py-2 transition-colors">
                  Iniciar sesión
                </Link>
                <Link href="/register" className="inline-flex items-center gap-1.5 bg-gradient-to-r from-cyan-500 to-blue-600 hover:opacity-95 text-white font-bold text-xs sm:text-sm px-3 sm:px-4 py-2 rounded-xl shadow-lg shadow-cyan-500/25 transition-all">
                  Registrarse <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              </>
            )}
          </div>
        </div>

        {/* SuperAdmin badge */}
        {user?.role === "superadmin" && (
          <div className="bg-gradient-to-r from-fuchsia-500/15 to-purple-500/15 border-t border-fuchsia-500/30 py-1.5">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center justify-center gap-2 text-[10px] text-fuchsia-300 font-bold tracking-wider uppercase">
              <Crown className="w-3 h-3" />
              <span>Vista SuperAdmin · {user.email}</span>
            </div>
          </div>
        )}
      </header>

      {/* ── Content ── */}
      <main className="flex-1">
        <div className="max-w-7xl mx-auto px-3 sm:px-4 lg:px-6 py-6 sm:py-8">
          {children}
        </div>
      </main>

      {/* ── Footer ── */}
      <footer className="border-t border-white/8 bg-[#070809]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-7 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-white/40">
          <p>© 2025 MediaPlayPromo.com — Todos los derechos reservados</p>
          <div className="flex flex-col sm:items-end items-center gap-3">
            <SocialLinks variant="footer" />
            <div className="flex items-center gap-4 flex-wrap justify-center">
              <Link href="/pricing" className="hover:text-white transition-colors">Precios</Link>
              <Link href="/terms" className="hover:text-white transition-colors">Términos</Link>
              <Link href="/privacy" className="hover:text-white transition-colors">Privacidad</Link>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
