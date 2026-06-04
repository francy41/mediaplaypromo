"use client";
import Link from "next/link";
import { ArrowLeft, FileText, Shield, RefreshCw, Cookie, Scale, Mail } from "lucide-react";
import { ThemeToggle } from "@/components/ThemeToggle";

const LEGAL_PAGES = [
  { href: "/terms",    label: "Términos y Condiciones", icon: FileText },
  { href: "/privacy",  label: "Política de Privacidad", icon: Shield },
  { href: "/refunds",  label: "Política de Reembolsos", icon: RefreshCw },
  { href: "/cookies",  label: "Política de Cookies",    icon: Cookie },
  { href: "/legal",    label: "Aviso Legal",            icon: Scale },
];

export function LegalLayout({
  title,
  updated,
  children,
  currentPath,
}: {
  title: string;
  updated: string;
  children: React.ReactNode;
  currentPath: string;
}) {
  return (
    <div className="min-h-screen bg-[#070809] text-white flex flex-col">
      {/* Nav */}
      <header className="sticky top-0 z-40 bg-[#070809]/85 backdrop-blur-md border-b border-white/8">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between gap-3">
          <Link href="/" className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-orange-400 to-orange-600 flex items-center justify-center font-black text-white text-sm shadow-lg shadow-orange-500/30">M</div>
            <div>
              <div className="text-white font-bold text-sm leading-none">MEDIAPLAY</div>
              <div className="text-orange-400 text-[9px] font-semibold tracking-widest leading-none mt-0.5">PROMO.COM</div>
            </div>
          </Link>
          <div className="flex items-center gap-2">
            <ThemeToggle compact />
            <Link href="/" className="inline-flex items-center gap-1.5 text-white/60 hover:text-white text-xs font-medium px-3 py-2 rounded-lg hover:bg-white/5 transition-colors">
              <ArrowLeft className="w-3.5 h-3.5" /> Inicio
            </Link>
          </div>
        </div>
      </header>

      <main className="flex-1 max-w-5xl mx-auto px-4 sm:px-6 py-8 sm:py-12 w-full">
        <div className="grid grid-cols-1 lg:grid-cols-[220px_1fr] gap-8">
          {/* Sidebar nav legal */}
          <aside className="lg:sticky lg:top-24 h-fit">
            <p className="text-white/35 text-[10px] font-bold uppercase tracking-wider mb-3">Documentos legales</p>
            <nav className="space-y-1">
              {LEGAL_PAGES.map((p) => {
                const Icon = p.icon;
                const active = currentPath === p.href;
                return (
                  <Link
                    key={p.href}
                    href={p.href}
                    className={`flex items-center gap-2.5 px-3 py-2 rounded-xl text-sm transition-colors ${
                      active ? "bg-white/8 text-white font-semibold" : "text-white/55 hover:text-white hover:bg-white/5"
                    }`}
                  >
                    <Icon className="w-4 h-4 flex-shrink-0" />
                    <span className="text-[13px]">{p.label}</span>
                  </Link>
                );
              })}
            </nav>
            <div className="mt-6 bg-white/3 border border-white/8 rounded-xl p-3">
              <p className="text-white/50 text-[11px] mb-2">¿Dudas legales?</p>
              <a href="mailto:legal@mediaplaypromo.com" className="inline-flex items-center gap-1.5 text-cyan-400 hover:text-cyan-300 text-xs font-semibold">
                <Mail className="w-3.5 h-3.5" /> legal@mediaplaypromo.com
              </a>
            </div>
          </aside>

          {/* Content */}
          <article className="min-w-0">
            <div className="mb-6 pb-6 border-b border-white/8">
              <h1 className="text-2xl sm:text-3xl lg:text-4xl font-black text-white">{title}</h1>
              <p className="text-white/40 text-xs mt-2">Última actualización: {updated}</p>
            </div>
            <div className="legal-content space-y-5 text-white/70 text-sm leading-relaxed">
              {children}
            </div>
          </article>
        </div>
      </main>

      <footer className="border-t border-white/8 bg-[#060708]">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 py-6 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-white/40">
          <p>© 2025 MediaPlayPromo.com — Todos los derechos reservados</p>
          <div className="flex items-center gap-3 flex-wrap">
            {LEGAL_PAGES.map((p) => (
              <Link key={p.href} href={p.href} className="hover:text-white transition-colors">{p.label.split(" ")[0]}</Link>
            ))}
          </div>
        </div>
      </footer>
    </div>
  );
}

/* Helpers de tipografía para el contenido legal */
export function LegalSection({ n, title, children }: { n?: string; title: string; children: React.ReactNode }) {
  return (
    <section className="scroll-mt-24">
      <h2 className="text-white font-bold text-lg sm:text-xl mt-8 mb-3 flex items-baseline gap-2">
        {n && <span className="text-cyan-400 font-mono text-sm">{n}</span>}
        {title}
      </h2>
      <div className="space-y-3">{children}</div>
    </section>
  );
}
