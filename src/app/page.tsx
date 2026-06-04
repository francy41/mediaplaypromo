"use client";
import Link from "next/link";
import { useState } from "react";
import { ArrowRight, Menu, X, Sparkles, Sun, Moon } from "lucide-react";
import { CATEGORIES } from "@/lib/categories";
import HeroBannerSlider from "@/components/HeroBannerSlider";
import { ThemeToggle } from "@/components/ThemeToggle";
import { useTheme } from "@/lib/theme-context";
import { MobileBottomNav } from "@/components/MobileBottomNav";
import { PricingPlans } from "@/components/PricingPlans";
import { VideoPricingTable } from "@/components/VideoPricingTable";
import { useStats, formatCount } from "@/lib/stats";
import { SocialLinks } from "@/components/SocialLinks";

function CategorySidebar({ onItemClick }: { onItemClick?: () => void }) {
  const cats = CATEGORIES.filter((c) => c.enabled);
  return (
    <nav className="category-sidebar-nav h-full flex flex-col bg-gradient-to-b from-[#0b0d12] via-[#0a0c10] to-[#080a0e] relative">
      {/* Decorative glow */}
      <div className="pointer-events-none absolute -top-24 -left-10 w-56 h-56 bg-cyan-500/10 rounded-full blur-3xl" />
      <div className="pointer-events-none absolute bottom-24 -right-10 w-48 h-48 bg-fuchsia-500/10 rounded-full blur-3xl" />

      {/* Header — compact */}
      <div className="relative px-3.5 py-3 border-b border-white/10 bg-gradient-to-br from-cyan-500/5 via-transparent to-fuchsia-500/5 flex-shrink-0">
        <div className="flex items-center gap-1.5 mb-1">
          <div className="w-5 h-5 rounded-md bg-gradient-to-br from-cyan-400 to-blue-600 flex items-center justify-center shadow shadow-cyan-500/30">
            <Sparkles className="w-2.5 h-2.5 text-white" />
          </div>
          <p className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-300 to-blue-400 text-[10px] font-black uppercase tracking-[0.18em]">
            Categorías
          </p>
        </div>
        <p className="text-white/85 text-[12px] font-bold leading-tight">
          18 herramientas <span className="text-cyan-400">IA</span>
        </p>
      </div>

      {/* Items — compact rows */}
      <div className="relative flex-1 overflow-y-auto py-2 px-1.5 space-y-0.5 scrollbar-hide">
        {cats.map((cat) => {
          const Icon = cat.icon;
          return (
            <Link
              key={cat.slug}
              href={`/categories/${cat.slug}`}
              onClick={onItemClick}
              className="relative flex items-center gap-2 px-2 py-1.5 rounded-lg text-white/65 hover:text-white hover:bg-white/[0.06] transition-all duration-200 group overflow-hidden"
            >
              {/* Hover gradient accent */}
              <div className={`absolute inset-0 bg-gradient-to-r ${cat.bgCard} opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none rounded-lg`} />
              {/* Left active bar */}
              <div className={`absolute left-0 top-1/2 -translate-y-1/2 h-0 group-hover:h-5 w-[2px] rounded-r-full bg-gradient-to-b ${cat.gradient} transition-all duration-300`} />

              <div className={`relative w-7 h-7 rounded-lg bg-gradient-to-br ${cat.gradient} flex items-center justify-center flex-shrink-0 shadow-md ${cat.glowColor} group-hover:scale-105 transition-transform duration-300 ring-1 ring-white/15`}>
                <Icon className="w-3.5 h-3.5 text-white drop-shadow" />
              </div>

              <span className="relative text-[12px] font-semibold leading-tight truncate flex-1 text-white/85 group-hover:text-white">
                {cat.title}
              </span>

              {cat.premium && (
                <span className="relative text-[8px] font-black bg-gradient-to-r from-yellow-400 to-orange-500 text-black rounded-full px-1.5 py-px flex-shrink-0 shadow shadow-orange-500/30">
                  PRO
                </span>
              )}
            </Link>
          );
        })}
      </div>

      {/* Footer CTA + Theme — compact */}
      <div className="relative px-2.5 pt-2 pb-3 border-t border-white/10 bg-gradient-to-t from-cyan-500/5 to-transparent space-y-2 flex-shrink-0">
        <Link
          href="/register"
          onClick={onItemClick}
          className="group flex items-center justify-center gap-1.5 bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white font-bold text-[11px] px-3 py-2 rounded-lg transition-all shadow-md shadow-cyan-500/30 hover:shadow-cyan-500/50 hover:-translate-y-0.5"
        >
          <Sparkles className="w-3 h-3" />
          Crear cuenta
          <ArrowRight className="w-3 h-3 group-hover:translate-x-0.5 transition-transform" />
        </Link>
        <SidebarThemeSwitcher />
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
  const { byCategory, total } = useStats();

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
        <div className="ml-auto flex items-center gap-1.5 sm:gap-3">
          <Link href="/pricing" className="hidden sm:inline-flex items-center text-white/60 hover:text-white text-sm transition-colors px-2 font-medium">
            Precios
          </Link>
          <ThemeToggle compact />
          <Link href="/login" className="hidden sm:inline-flex items-center text-white/60 hover:text-white text-sm transition-colors px-2">
            Iniciar sesión
          </Link>
          <Link
            href="/register"
            className="bg-cyan-500 hover:bg-cyan-400 text-black font-semibold text-[11px] sm:text-sm px-3 sm:px-4 py-2 rounded-lg transition-colors whitespace-nowrap"
          >
            Registrarse
          </Link>
        </div>
      </nav>

      {/* Desktop sidebar — narrower so it doesn't overlap hero content */}
      <aside className="hidden lg:flex fixed top-16 left-0 w-56 xl:w-60 h-[calc(100vh-4rem)] border-r border-white/10 shadow-2xl shadow-black/60 z-40">
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
      <div className="lg:pl-56 xl:pl-60">
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
            {CATEGORIES.filter((c) => c.enabled).map((cat, i) => {
              const Icon = cat.icon;
              return (
                <Link
                  key={cat.slug}
                  href={`/categories/${cat.slug}`}
                  className="glass-card hover-lift group flex flex-col items-center gap-3 rounded-2xl p-4 sm:p-5 relative overflow-hidden"
                  style={{ animationDelay: `${(i % 5) * 100}ms` }}
                >
                  {/* Hover gradient overlay */}
                  <div className={`absolute inset-0 bg-gradient-to-br ${cat.bgCard} opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none`} />
                  {/* Orb on hover */}
                  <div className={`absolute -top-6 -right-6 w-24 h-24 bg-gradient-to-br ${cat.gradient} opacity-0 group-hover:opacity-30 blur-2xl transition-opacity duration-500 pointer-events-none`} />

                  {cat.premium && (
                    <span className="absolute top-2 right-2 z-10 text-[8px] font-black bg-gradient-to-r from-yellow-400 to-orange-500 text-black rounded-full px-1.5 py-0.5 shadow-lg shadow-orange-500/40">
                      PRO
                    </span>
                  )}

                  <div className={`icon-ring relative w-11 h-11 sm:w-12 sm:h-12 rounded-2xl bg-gradient-to-br ${cat.gradient} flex items-center justify-center shadow-lg ${cat.glowColor} group-hover:scale-110 group-hover:rotate-3 transition-all duration-300 ring-1 ring-white/20`}>
                    <Icon className="w-5 h-5 sm:w-6 sm:h-6 text-white drop-shadow" />
                  </div>

                  <div className="text-center relative z-10">
                    <h3 className="text-white font-bold text-xs leading-tight mb-1">{cat.title}</h3>
                    <p className="text-white/45 text-[10px] leading-tight mb-2">{cat.subtitle}</p>
                    <span className="inline-flex items-center gap-1 bg-white/[0.06] border border-white/10 rounded-full px-1.5 py-0.5 text-[9px] font-bold text-cyan-300">
                      <span className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" />
                      {formatCount(byCategory[cat.slug] ?? 0)} generaciones
                    </span>
                  </div>
                </Link>
              );
            })}
          </div>

          {/* Total counter strip */}
          <div className="mt-6 text-center">
            <p className="text-white/45 text-xs">
              <span className="text-white font-bold text-base">{formatCount(total)}</span> generaciones realizadas en la plataforma
              <span className="inline-block w-1.5 h-1.5 rounded-full bg-green-400 ml-2 animate-pulse" />
            </p>
          </div>
        </section>

        {/* Trending Tools Strip */}
        <section className="px-4 sm:px-6 lg:px-8 pb-12 sm:pb-16 lg:pb-20 max-w-6xl mx-auto">
          <div className="flex items-end justify-between mb-6 sm:mb-8">
            <div>
              <p className="text-pink-400 text-xs sm:text-sm font-semibold tracking-wider mb-1">🔥 TRENDING ESTA SEMANA</p>
              <h2 className="text-xl sm:text-2xl lg:text-3xl font-bold">Las herramientas que <span className="text-transparent bg-clip-text bg-gradient-to-r from-pink-400 to-fuchsia-500">todos están usando</span></h2>
            </div>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
            {CATEGORIES.filter((c) => c.enabled).slice(0, 4).map((cat) => {
              const Icon = cat.icon;
              return (
                <Link key={cat.slug} href={`/categories/${cat.slug}`} className={`glass-card hover-lift group relative overflow-hidden rounded-2xl p-5`}>
                  <div className={`absolute -top-6 -right-6 w-32 h-32 bg-gradient-to-br ${cat.gradient} opacity-20 rounded-full blur-3xl group-hover:opacity-50 transition-opacity duration-500 float-soft`} />
                  <div className={`icon-ring relative w-14 h-14 rounded-2xl bg-gradient-to-br ${cat.gradient} flex items-center justify-center shadow-xl ${cat.glowColor} mb-4 ring-1 ring-white/20 group-hover:scale-105 transition-transform`}>
                    <Icon className="w-7 h-7 text-white drop-shadow" />
                  </div>
                  <h3 className="relative text-white font-bold text-base mb-1">{cat.title}</h3>
                  <p className="relative text-white/55 text-xs leading-relaxed mb-3">{cat.subtitle}</p>
                  <div className="relative flex items-center justify-between">
                    <span className="inline-flex items-center gap-1 bg-white/[0.06] border border-white/10 rounded-full px-2 py-0.5 text-[10px] font-bold text-cyan-300">
                      <span className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" />
                      {formatCount(byCategory[cat.slug] ?? 0)}
                    </span>
                    <p className={`text-[11px] font-bold ${cat.textAccent} flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity`}>Explorar <ArrowRight className="w-3 h-3" /></p>
                  </div>
                </Link>
              );
            })}
          </div>
        </section>

        {/* White Label Promo */}
        <section className="px-4 sm:px-6 lg:px-8 pb-12 sm:pb-16 lg:pb-20 max-w-6xl mx-auto">
          <div
            className="cinematic-dark relative overflow-hidden rounded-3xl border border-fuchsia-500/30 bg-gradient-to-br from-[#1a0c2e] via-[#1c0a30] to-[#0d0620] p-8 sm:p-12"
            style={{ backgroundColor: "#140828", color: "white" }}
          >
            <div className="absolute -top-20 -right-20 w-80 h-80 bg-fuchsia-500/20 rounded-full blur-3xl" />
            <div className="absolute -bottom-20 -left-20 w-80 h-80 bg-purple-500/20 rounded-full blur-3xl" />
            <div className="relative grid grid-cols-1 lg:grid-cols-2 gap-8 items-center">
              <div>
                <p className="text-fuchsia-400 text-xs font-bold tracking-[0.2em] mb-3">🏷️ MARCA BLANCA SAAS</p>
                <h2 className="text-3xl sm:text-4xl lg:text-5xl font-black leading-tight mb-4">
                  Vende nuestra plataforma{" "}
                  <span className="text-transparent bg-clip-text bg-gradient-to-r from-fuchsia-400 to-purple-500">bajo TU marca</span>
                </h2>
                <p className="text-white/60 text-base mb-6">Dominio propio, logo, colores, panel branded. Tú vendes — nosotros operamos la infra.</p>
                <ul className="space-y-2 mb-6 text-sm">
                  {["Dominio + SSL automático", "Branding 100% personalizable", "Clientes y suscripciones propios", "Sin límite de usuarios"].map((f) => (
                    <li key={f} className="flex items-center gap-2 text-white/75">
                      <span className="w-1.5 h-1.5 rounded-full bg-fuchsia-400" /> {f}
                    </li>
                  ))}
                </ul>
                <Link href="/categories/marca-blanca" className="inline-flex items-center gap-2 bg-gradient-to-r from-fuchsia-500 to-purple-600 hover:opacity-90 text-white font-bold px-6 py-3 rounded-xl shadow-lg shadow-fuchsia-500/30 transition-all hover:-translate-y-0.5">
                  Empezar Marca Blanca <ArrowRight className="w-4 h-4" />
                </Link>
              </div>
              <div className="hidden lg:grid grid-cols-3 gap-3">
                {CATEGORIES.filter((c) => c.enabled).slice(10, 16).map((cat) => {
                  const Icon = cat.icon;
                  return (
                    <div key={cat.slug} className={`bg-black/40 backdrop-blur border ${cat.borderColor} rounded-2xl p-4 aspect-square flex flex-col items-center justify-center gap-2`}>
                      <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${cat.gradient} flex items-center justify-center shadow-md`}>
                        <Icon className="w-5 h-5 text-white" />
                      </div>
                      <p className="text-white text-[10px] font-semibold text-center leading-tight">{cat.title}</p>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </section>

        {/* Affiliate Promo */}
        <section className="px-4 sm:px-6 lg:px-8 pb-12 sm:pb-16 lg:pb-20 max-w-6xl mx-auto">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
            {[
              { kpi: "30%", label: "Comisión recurrente", color: "from-green-500/20 to-emerald-500/5", text: "text-green-400", border: "border-green-500/20" },
              { kpi: "De por vida", label: "Pagos garantizados", color: "from-blue-500/20 to-cyan-500/5", text: "text-cyan-400", border: "border-blue-500/20" },
              { kpi: "Sin límite", label: "Referidos que puedes traer", color: "from-fuchsia-500/20 to-pink-500/5", text: "text-pink-400", border: "border-fuchsia-500/20" },
            ].map((s) => (
              <div key={s.label} className={`bg-gradient-to-br ${s.color} border ${s.border} rounded-2xl p-6 text-center`}>
                <p className={`text-3xl sm:text-4xl font-black ${s.text}`}>{s.kpi}</p>
                <p className="text-white/60 text-sm mt-1">{s.label}</p>
              </div>
            ))}
          </div>
        </section>

        {/* ─── Pricing Plans (con margen 50% admin) ─── */}
        <section className="bg-gradient-to-b from-transparent via-white/[0.02] to-transparent border-y border-white/8">
          <div className="text-center pt-12 sm:pt-16 px-4">
            <div className="inline-flex items-center gap-2 bg-cyan-500/10 border border-cyan-500/20 rounded-full px-3 py-1 text-[11px] sm:text-xs text-cyan-400 mb-4 font-bold tracking-wider uppercase">
              <Sparkles className="w-3 h-3" /> Planes y precios
            </div>
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-black leading-tight mb-3 max-w-3xl mx-auto">
              Acceso completo desde{" "}
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-blue-500">€29/mes</span>
            </h2>
            <p className="text-white/55 text-sm sm:text-base max-w-2xl mx-auto">
              Generación de videos e imágenes con IA, marca blanca, afiliados — todo incluido.
              <br />
              <span className="text-white/45 text-xs">Cancela cuando quieras. Garantía de 30 días.</span>
            </p>
          </div>
          <PricingPlans embedded showMargin />

          {/* Precios por video individual con bundles */}
          <div className="border-t border-white/8 pb-12">
            <div className="text-center pt-12 px-4 mb-2">
              <div className="inline-flex items-center gap-2 bg-fuchsia-500/10 border border-fuchsia-500/20 rounded-full px-3 py-1 text-[11px] sm:text-xs text-fuchsia-400 mb-4 font-bold tracking-wider uppercase">
                <Sparkles className="w-3 h-3" /> Pago por video
              </div>
              <h2 className="text-3xl sm:text-4xl lg:text-5xl font-black leading-tight mb-3 max-w-3xl mx-auto">
                Compra paquetes{" "}
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-fuchsia-400 to-purple-500">según tu necesidad</span>
              </h2>
              <p className="text-white/55 text-sm sm:text-base max-w-2xl mx-auto">
                17 modelos. Desde €0.03 por video con Wan 2.2 hasta videos premium con Veo 3.1 y Sora 2 Pro.
              </p>
            </div>
            <VideoPricingTable embedded />
          </div>
        </section>

        {/* CTA */}
        <section className="px-4 sm:px-6 lg:px-8 pb-16 sm:pb-20 lg:pb-24 pt-12 max-w-3xl mx-auto text-center">
          <div className="bg-gradient-to-br from-cyan-500/10 to-blue-600/10 border border-cyan-500/20 rounded-2xl p-7 sm:p-10">
            <h2 className="text-2xl sm:text-3xl font-black mb-3">Empieza hoy mismo</h2>
            <p className="text-white/50 mb-6 text-sm sm:text-base">Activación inmediata. Cancela cuando quieras. Sin permanencia.</p>
            <Link
              href="/pricing"
              className="inline-flex items-center gap-2 bg-cyan-500 hover:bg-cyan-400 text-black font-bold px-6 sm:px-8 py-3 sm:py-3.5 rounded-xl transition-colors text-sm"
            >
              Ver todos los planes <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </section>

        {/* Footer */}
        <footer className="border-t border-white/8 px-4 sm:px-6 lg:px-8 py-8">
          <div className="max-w-6xl mx-auto flex flex-col items-center gap-5">
            {/* Redes sociales */}
            <div className="text-center">
              <p className="text-white/45 text-xs font-semibold mb-3">Síguenos en redes</p>
              <SocialLinks variant="footer" className="justify-center" />
            </div>

            {/* Links legales */}
            <div className="flex flex-wrap items-center justify-center gap-x-4 gap-y-1.5 text-[11px] text-white/40">
              <Link href="/pricing" className="hover:text-white transition-colors">Precios</Link>
              <Link href="/terms" className="hover:text-white transition-colors">Términos</Link>
              <Link href="/privacy" className="hover:text-white transition-colors">Privacidad</Link>
              <Link href="/refunds" className="hover:text-white transition-colors">Reembolsos</Link>
              <Link href="/cookies" className="hover:text-white transition-colors">Cookies</Link>
              <Link href="/legal" className="hover:text-white transition-colors">Aviso Legal</Link>
            </div>

            <p className="text-white/30 text-xs">© 2025 MediaPlayPromo.com — Todos los derechos reservados</p>
          </div>
        </footer>
      </div>

      {/* Mobile bottom navigation */}
      <MobileBottomNav onOpenCategories={() => setMenuOpen(true)} variant="public" />
    </div>
  );
}
