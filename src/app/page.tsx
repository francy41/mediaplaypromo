"use client";
import Link from "next/link";
import { useState } from "react";
import { ArrowRight, Menu, X, Sparkles, ChevronRight, Sun, Moon } from "lucide-react";
import { CATEGORIES } from "@/lib/categories";
import HeroBannerSlider from "@/components/HeroBannerSlider";
import { ThemeToggle } from "@/components/ThemeToggle";
import { useTheme } from "@/lib/theme-context";

function CategorySidebar({ onItemClick }: { onItemClick?: () => void }) {
  const cats = CATEGORIES.filter((c) => c.enabled);
  return (
    <nav className="h-full flex flex-col bg-gradient-to-b from-[#0b0d12] via-[#0a0c10] to-[#080a0e] relative">
      {/* Decorative glow */}
      <div className="pointer-events-none absolute -top-24 -left-10 w-56 h-56 bg-cyan-500/10 rounded-full blur-3xl" />
      <div className="pointer-events-none absolute bottom-24 -right-10 w-48 h-48 bg-fuchsia-500/10 rounded-full blur-3xl" />

      {/* Header */}
      <div className="relative px-5 py-5 border-b border-white/10 bg-gradient-to-br from-cyan-500/5 via-transparent to-fuchsia-500/5">
        <div className="flex items-center gap-2 mb-1.5">
          <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-cyan-400 to-blue-600 flex items-center justify-center shadow-lg shadow-cyan-500/30">
            <Sparkles className="w-3.5 h-3.5 text-white" />
          </div>
          <p className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-300 to-blue-400 text-[11px] font-black uppercase tracking-[0.22em]">
            Categorías IA
          </p>
        </div>
        <p className="text-white/85 text-sm font-bold leading-tight">
          10 herramientas <span className="text-cyan-400">PRO</span>
        </p>
        <p className="text-white/40 text-[11px] mt-0.5">Suite completa de IA</p>
      </div>

      {/* Items */}
      <div className="relative flex-1 overflow-y-auto py-3 px-2.5 space-y-1.5 scrollbar-hide">
        {cats.map((cat) => {
          const Icon = cat.icon;
          return (
            <Link
              key={cat.slug}
              href={`/categories/${cat.slug}`}
              onClick={onItemClick}
              className="relative flex items-center gap-3 px-3 py-2.5 rounded-xl text-white/70 hover:text-white bg-white/[0.02] border border-white/5 hover:border-white/15 hover:bg-white/[0.06] transition-all duration-200 group overflow-hidden"
            >
              {/* Hover gradient accent */}
              <div className={`absolute inset-0 bg-gradient-to-r ${cat.bgCard} opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none`} />
              {/* Left active bar */}
              <div className={`absolute left-0 top-1/2 -translate-y-1/2 h-0 group-hover:h-8 w-[3px] rounded-r-full bg-gradient-to-b ${cat.gradient} transition-all duration-300`} />

              <div
                className={`relative w-10 h-10 rounded-xl bg-gradient-to-br ${cat.gradient} flex items-center justify-center flex-shrink-0 shadow-lg ${cat.glowColor} group-hover:scale-110 group-hover:rotate-3 transition-all duration-300`}
              >
                <Icon className="w-4.5 h-4.5 text-white drop-shadow" />
                <div className="absolute inset-0 rounded-xl ring-1 ring-white/20" />
              </div>

              <div className="relative min-w-0 flex-1">
                <p className="text-[13px] font-bold leading-tight truncate text-white group-hover:text-white">
                  {cat.title}
                </p>
                <p className="text-[10.5px] text-white/45 group-hover:text-white/65 truncate mt-0.5 transition-colors">
                  {cat.subtitle}
                </p>
              </div>

              {cat.premium ? (
                <span className="relative text-[8px] font-black bg-gradient-to-r from-yellow-400 to-orange-500 text-black rounded-full px-2 py-0.5 flex-shrink-0 shadow-md shadow-orange-500/30">
                  PRO
                </span>
              ) : (
                <ChevronRight className="relative w-3.5 h-3.5 text-white/20 group-hover:text-white/60 group-hover:translate-x-0.5 transition-all flex-shrink-0" />
              )}
            </Link>
          );
        })}
      </div>

      {/* Footer CTA + Theme */}
      <div className="relative p-3 border-t border-white/10 bg-gradient-to-t from-cyan-500/5 to-transparent space-y-2.5">
        <Link
          href="/register"
          onClick={onItemClick}
          className="group flex items-center justify-center gap-2 bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white font-bold text-[12px] px-4 py-3 rounded-xl transition-all shadow-lg shadow-cyan-500/30 hover:shadow-cyan-500/50 hover:-translate-y-0.5"
        >
          <Sparkles className="w-3.5 h-3.5" />
          Crear cuenta gratis
          <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
        </Link>
        <SidebarThemeSwitcher />
        <p className="text-center text-white/30 text-[10px]">Sin tarjeta · Cancela cuando quieras</p>
      </div>
    </nav>
  );
}

function SidebarThemeSwitcher() {
  const { theme, setTheme } = useTheme();
  return (
    <div className="flex items-center gap-1 bg-white/[0.04] border border-white/10 rounded-xl p-1 theme-toggle-btn">
      <button
        onClick={() => setTheme("light")}
        className={`flex-1 flex items-center justify-center gap-1.5 py-1.5 rounded-lg text-[11px] font-bold transition-all ${
          theme === "light"
            ? "bg-gradient-to-r from-yellow-300 to-orange-400 text-black shadow-md"
            : "text-white/55 hover:text-white"
        }`}
      >
        <Sun className="w-3.5 h-3.5" /> Claro
      </button>
      <button
        onClick={() => setTheme("dark")}
        className={`flex-1 flex items-center justify-center gap-1.5 py-1.5 rounded-lg text-[11px] font-bold transition-all ${
          theme === "dark"
            ? "bg-gradient-to-r from-indigo-500 to-blue-600 text-white shadow-md"
            : "text-white/55 hover:text-white"
        }`}
      >
        <Moon className="w-3.5 h-3.5" /> Oscuro
      </button>
    </div>
  );
}

export default function LandingPage() {
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <div className="min-h-screen bg-[#070809] text-white">
      {/* Top Nav */}
      <nav className="fixed top-0 left-0 right-0 h-16 bg-[#070809]/85 backdrop-blur border-b border-white/8 flex items-center px-4 sm:px-6 lg:px-8 z-50">
        <button
          aria-label="Menú"
          onClick={() => setMenuOpen(true)}
          className="lg:hidden mr-2 w-9 h-9 rounded-lg bg-white/5 border border-white/10 flex items-center justify-center hover:bg-white/10 transition-colors"
        >
          <Menu className="w-4 h-4 text-white" />
        </button>
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-cyan-400 to-blue-600 flex items-center justify-center font-black text-white">
            M
          </div>
          <div>
            <div className="text-white font-bold text-sm leading-none">MEDIA</div>
            <div className="text-cyan-400 text-[9px] font-semibold tracking-widest">PLAY PROMO</div>
          </div>
        </div>
        <div className="ml-auto flex items-center gap-2 sm:gap-3">
          <ThemeToggle compact />
          <Link href="/login" className="hidden sm:inline text-white/60 hover:text-white text-sm transition-colors">
            Iniciar sesión
          </Link>
          <Link
            href="/register"
            className="bg-cyan-500 hover:bg-cyan-400 text-black font-semibold text-xs sm:text-sm px-3 sm:px-4 py-2 rounded-lg transition-colors whitespace-nowrap"
          >
            Ver Productos
          </Link>
        </div>
      </nav>

      {/* Desktop sidebar */}
      <aside className="hidden lg:flex fixed top-16 left-0 w-72 h-[calc(100vh-4rem)] border-r border-white/10 shadow-2xl shadow-black/60 z-40">
        <CategorySidebar />
      </aside>

      {/* Mobile/Tablet drawer */}
      {menuOpen && (
        <>
          <div
            className="lg:hidden fixed inset-0 bg-black/60 backdrop-blur-sm z-50"
            onClick={() => setMenuOpen(false)}
          />
          <aside className="lg:hidden fixed top-0 left-0 w-72 max-w-[85vw] h-full bg-[#0a0c0f] border-r border-white/10 z-50 flex flex-col animate-in slide-in-from-left duration-200">
            <div className="flex items-center justify-between px-4 h-16 border-b border-white/8">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-cyan-400 to-blue-600 flex items-center justify-center font-black text-white text-xs">
                  M
                </div>
                <div className="text-white font-bold text-sm">MediaPlay</div>
              </div>
              <button
                aria-label="Cerrar"
                onClick={() => setMenuOpen(false)}
                className="w-8 h-8 rounded-lg hover:bg-white/10 flex items-center justify-center"
              >
                <X className="w-4 h-4 text-white" />
              </button>
            </div>
            <div className="flex-1 overflow-hidden">
              <CategorySidebar onItemClick={() => setMenuOpen(false)} />
            </div>
          </aside>
        </>
      )}

      {/* Main content (pushed right on desktop) */}
      <div className="lg:pl-72">
        {/* Hero Slider — editable desde SuperAdmin */}
        <HeroBannerSlider />

        {/* Categories — 10 AI Tools */}
        <section className="px-4 sm:px-6 lg:px-8 pb-12 sm:pb-16 lg:pb-20 max-w-6xl mx-auto">
          <div className="text-center mb-8 sm:mb-12">
            <p className="text-cyan-400 text-xs sm:text-sm font-semibold tracking-wider mb-2">10 CATEGORÍAS DE IA</p>
            <h2 className="text-xl sm:text-2xl lg:text-3xl font-bold">
              Todas las herramientas que necesitas<br className="hidden sm:block" />{" "}
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-blue-500">en una sola plataforma.</span>
            </h2>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3 sm:gap-4">
            {CATEGORIES.filter((c) => c.enabled).map((cat) => {
              const Icon = cat.icon;
              return (
                <Link
                  key={cat.slug}
                  href={`/categories/${cat.slug}`}
                  className="group flex flex-col items-center gap-3 bg-white/3 border border-white/8 hover:border-cyan-500/40 rounded-2xl p-4 sm:p-5 transition-all hover:-translate-y-0.5 hover:bg-white/5 relative"
                >
                  {cat.premium && (
                    <span className="absolute top-2 right-2 text-[8px] font-bold bg-gradient-to-r from-yellow-400 to-orange-500 text-black rounded-full px-1.5 py-0.5">
                      PRO
                    </span>
                  )}
                  <div className={`w-11 h-11 sm:w-12 sm:h-12 rounded-2xl bg-gradient-to-br ${cat.gradient} flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform`}>
                    <Icon className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
                  </div>
                  <div className="text-center">
                    <h3 className="text-white font-semibold text-xs leading-tight mb-1">{cat.title}</h3>
                    <p className="text-white/40 text-[10px] leading-tight">{cat.subtitle}</p>
                  </div>
                </Link>
              );
            })}
          </div>
        </section>

        {/* CTA */}
        <section className="px-4 sm:px-6 lg:px-8 pb-16 sm:pb-20 lg:pb-24 max-w-3xl mx-auto text-center">
          <div className="bg-gradient-to-br from-cyan-500/10 to-blue-600/10 border border-cyan-500/20 rounded-2xl p-7 sm:p-10">
            <h2 className="text-2xl sm:text-3xl font-black mb-3">Empieza gratis hoy</h2>
            <p className="text-white/50 mb-6 text-sm sm:text-base">Sin tarjeta de crédito. Sin compromisos. Solo resultados.</p>
            <Link
              href="/register"
              className="inline-flex items-center gap-2 bg-cyan-500 hover:bg-cyan-400 text-black font-bold px-6 sm:px-8 py-3 sm:py-3.5 rounded-xl transition-colors text-sm"
            >
              Crear cuenta gratis <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </section>

        {/* Footer */}
        <footer className="border-t border-white/8 px-4 sm:px-6 lg:px-8 py-6 text-center">
          <p className="text-white/30 text-xs">© 2025 MediaPlayPromo.com — Todos los derechos reservados</p>
        </footer>
      </div>
    </div>
  );
}
