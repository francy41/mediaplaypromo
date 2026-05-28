"use client";
import Link from "next/link";
import { useEffect, useState } from "react";
import { ArrowRight, ChevronLeft, ChevronRight, Sparkles, Settings, Pause, Play } from "lucide-react";
import { useBanners, gradientFor } from "@/lib/banners";
import { useAuth } from "@/lib/auth-context";

export default function HeroBannerSlider() {
  const [banners] = useBanners();
  const { user } = useAuth();
  const [idx, setIdx] = useState(0);
  const [paused, setPaused] = useState(false);

  const active = banners.filter((b) => b.enabled).sort((a, b) => a.order - b.order);
  const total = active.length;

  // Reset when list changes
  useEffect(() => {
    if (idx >= total && total > 0) setIdx(0);
  }, [total, idx]);

  // Autoplay
  useEffect(() => {
    if (paused || total <= 1) return;
    const t = setInterval(() => setIdx((i) => (i + 1) % total), 6000);
    return () => clearInterval(t);
  }, [paused, total]);

  if (total === 0) {
    return (
      <section className="px-4 sm:px-6 lg:px-8 py-12 text-center">
        <p className="text-white/40 text-sm">No hay banners activos.</p>
        {user?.role === "superadmin" && (
          <Link href="/admin/banners" className="inline-flex items-center gap-2 mt-3 text-cyan-400 text-sm hover:underline">
            <Settings className="w-4 h-4" /> Configurar banners
          </Link>
        )}
      </section>
    );
  }

  const b = active[idx];
  const g = gradientFor(b);
  const prev = () => setIdx((i) => (i - 1 + total) % total);
  const next = () => setIdx((i) => (i + 1) % total);

  return (
    <section className="relative pt-24 sm:pt-28 lg:pt-32 pb-12 sm:pb-16 lg:pb-20 px-4 sm:px-6 lg:px-8">
      {/* SuperAdmin shortcut */}
      {user?.role === "superadmin" && (
        <Link
          href="/admin/banners"
          className="absolute top-20 sm:top-24 lg:top-28 right-4 sm:right-6 lg:right-8 z-30 inline-flex items-center gap-1.5 bg-white/5 hover:bg-white/10 border border-white/15 text-white/70 hover:text-white text-[10px] sm:text-[11px] font-semibold px-2.5 py-1.5 rounded-full backdrop-blur transition-all"
        >
          <Settings className="w-3 h-3" /> Editar banners ({banners.length})
        </Link>
      )}

      <div className={`relative overflow-hidden rounded-3xl border ${g.border} bg-gradient-to-br ${g.bg} bg-[#0a0c10] min-h-[420px] sm:min-h-[460px] shadow-2xl shadow-black/40`}>
        {/* Animated decorative orbs */}
        <div className={`absolute -top-24 -right-24 w-80 h-80 ${g.orb} rounded-full blur-3xl pointer-events-none float-slow glow-pulse`} />
        <div className={`absolute -bottom-24 -left-24 w-72 h-72 ${g.orb} rounded-full blur-3xl pointer-events-none opacity-60 float-soft`} />
        <div className={`absolute top-1/3 left-1/2 w-40 h-40 ${g.orb} rounded-full blur-2xl opacity-30 pointer-events-none float-slow`} />

        {/* Subtle particle starfield */}
        <div className="particles-bg" />

        {/* Grid pattern overlay */}
        <div className="absolute inset-0 opacity-[0.04] pointer-events-none" style={{
          backgroundImage: "linear-gradient(rgba(255,255,255,0.5) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.5) 1px, transparent 1px)",
          backgroundSize: "40px 40px"
        }} />

        {/* Prev / Next */}
        {total > 1 && (
          <>
            <button
              onClick={prev}
              aria-label="Anterior"
              className="absolute left-2 sm:left-4 top-1/2 -translate-y-1/2 z-20 w-10 h-10 sm:w-11 sm:h-11 rounded-full bg-black/40 hover:bg-black/60 backdrop-blur border border-white/15 flex items-center justify-center transition-all hover:scale-105"
            >
              <ChevronLeft className="w-5 h-5 text-white" />
            </button>
            <button
              onClick={next}
              aria-label="Siguiente"
              className="absolute right-2 sm:right-4 top-1/2 -translate-y-1/2 z-20 w-10 h-10 sm:w-11 sm:h-11 rounded-full bg-black/40 hover:bg-black/60 backdrop-blur border border-white/15 flex items-center justify-center transition-all hover:scale-105"
            >
              <ChevronRight className="w-5 h-5 text-white" />
            </button>
          </>
        )}

        {/* Slide content — split layout: text left, floating constellation right */}
        <div className="relative z-10 px-6 sm:px-10 lg:px-14 py-10 sm:py-14 lg:py-16 grid lg:grid-cols-[1fr_auto] gap-8 lg:gap-10 items-center min-h-[420px] sm:min-h-[460px]">
          <div className="text-center lg:text-left">
            <div className="inline-flex items-center gap-2 glass-card border-white/15 rounded-full px-3 py-1 text-[10px] sm:text-xs text-white/90 mb-5 sm:mb-6 font-semibold tracking-wider uppercase">
              <Sparkles className="w-3 h-3 text-yellow-300" />
              {b.badge}
            </div>

            <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-black leading-[1.05] mb-4 text-white tracking-tight">
              {b.title}{" "}
              <span className={`text-transparent bg-clip-text bg-gradient-to-r ${g.text} gradient-anim`}>{b.accent}</span>
            </h1>

            <p className="text-white/60 text-sm sm:text-base lg:text-lg max-w-xl mb-7 sm:mb-8 mx-auto lg:mx-0">
              {b.subtitle}
            </p>

            <div className="flex flex-col sm:flex-row items-center lg:items-start justify-center lg:justify-start gap-3 sm:gap-4">
              <Link
                href={b.ctaHref}
                className={`shine-btn w-full sm:w-auto bg-gradient-to-r ${g.btn} gradient-anim hover:opacity-95 text-white font-bold px-7 py-3.5 rounded-2xl transition-all shadow-xl flex items-center justify-center gap-2 text-sm sm:text-base hover:-translate-y-0.5 hover:scale-[1.02] ring-1 ring-white/20`}
              >
                <span className="relative z-10 flex items-center gap-2">
                  {b.ctaLabel} <ArrowRight className="w-4 h-4" />
                </span>
              </Link>
              {b.secondaryLabel && b.secondaryHref && (
                <Link
                  href={b.secondaryHref}
                  className="glass-card w-full sm:w-auto hover:border-white/30 text-white px-6 py-3.5 rounded-2xl transition-all text-center text-sm sm:text-base hover:-translate-y-0.5 flex items-center justify-center gap-2"
                >
                  <Play className="w-3.5 h-3.5" /> {b.secondaryLabel}
                </Link>
              )}
            </div>

            {/* Social proof */}
            <div className="mt-7 sm:mt-8 flex items-center gap-3 justify-center lg:justify-start">
              <div className="flex -space-x-2">
                {["from-pink-500 to-rose-600", "from-cyan-400 to-blue-600", "from-violet-500 to-purple-600", "from-amber-400 to-orange-600", "from-green-400 to-emerald-600"].map((c, i) => (
                  <div key={i} className={`w-8 h-8 rounded-full bg-gradient-to-br ${c} border-2 border-[#0a0c10] shadow-md`} />
                ))}
              </div>
              <div className="text-left">
                <p className="text-white font-bold text-sm">+12K creadores</p>
                <p className="text-white/45 text-[11px]">ya usan MediaPlayPromo</p>
              </div>
            </div>
          </div>

          {/* Floating constellation (desktop only) */}
          <div className="hidden lg:block relative w-[340px] h-[340px] xl:w-[400px] xl:h-[400px] mx-auto">
            {/* Orbit ring */}
            <div className={`absolute inset-0 rounded-full border-2 border-dashed ${g.border} opacity-40`} />
            <div className={`absolute inset-8 rounded-full border ${g.border} opacity-25`} />

            {/* Center node (big icon) */}
            <div className={`absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-24 h-24 rounded-3xl bg-gradient-to-br ${g.btn} flex items-center justify-center shadow-2xl ${g.orb} ring-1 ring-white/30 glow-pulse`}>
              <Sparkles className="w-12 h-12 text-white drop-shadow" />
            </div>

            {/* Floating satellites */}
            {[
              { top: "8%", left: "50%", grad: "from-pink-500 to-rose-600", size: "w-14 h-14", delay: "0s" },
              { top: "30%", left: "85%", grad: "from-violet-500 to-purple-600", size: "w-12 h-12", delay: "1s" },
              { top: "70%", left: "85%", grad: "from-amber-400 to-orange-500", size: "w-12 h-12", delay: "2s" },
              { top: "92%", left: "50%", grad: "from-cyan-400 to-blue-600", size: "w-14 h-14", delay: "3s" },
              { top: "70%", left: "15%", grad: "from-emerald-400 to-teal-600", size: "w-12 h-12", delay: "4s" },
              { top: "30%", left: "15%", grad: "from-fuchsia-500 to-pink-600", size: "w-12 h-12", delay: "5s" },
            ].map((s, i) => (
              <div
                key={i}
                className={`absolute ${s.size} -translate-x-1/2 -translate-y-1/2 rounded-2xl bg-gradient-to-br ${s.grad} flex items-center justify-center shadow-xl ring-1 ring-white/20 float-soft`}
                style={{ top: s.top, left: s.left, animationDelay: s.delay }}
              >
                <Sparkles className="w-5 h-5 text-white/90 drop-shadow" />
              </div>
            ))}

            {/* Decorative dots */}
            <div className="absolute top-[20%] left-[40%] w-1.5 h-1.5 rounded-full bg-white/60 glow-pulse" />
            <div className="absolute top-[55%] left-[60%] w-1 h-1 rounded-full bg-white/40 glow-pulse" style={{ animationDelay: "1.5s" }} />
            <div className="absolute top-[80%] left-[35%] w-1 h-1 rounded-full bg-white/40 glow-pulse" style={{ animationDelay: "2.5s" }} />
          </div>
        </div>

        {/* Dots + Pause */}
        {total > 1 && (
          <div className="absolute bottom-4 sm:bottom-5 left-1/2 -translate-x-1/2 z-20 flex items-center gap-2">
            {active.map((_, i) => (
              <button
                key={i}
                onClick={() => setIdx(i)}
                aria-label={`Banner ${i + 1}`}
                className={`rounded-full transition-all duration-300 ${
                  i === idx ? `w-7 h-2 bg-gradient-to-r ${g.btn}` : "w-2 h-2 bg-white/30 hover:bg-white/60"
                }`}
              />
            ))}
            <button
              onClick={() => setPaused((p) => !p)}
              aria-label={paused ? "Reproducir" : "Pausar"}
              className="ml-2 w-6 h-6 rounded-full bg-white/10 hover:bg-white/20 border border-white/15 flex items-center justify-center transition-colors"
            >
              {paused ? <Play className="w-2.5 h-2.5 text-white/80" /> : <Pause className="w-2.5 h-2.5 text-white/80" />}
            </button>
          </div>
        )}
      </div>
    </section>
  );
}
