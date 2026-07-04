"use client";
import { useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { Mail, Lock, Eye, EyeOff, AlertCircle, Crown, Sparkles, Shield, Check, ArrowRight, Zap } from "lucide-react";
import { useAuth } from "@/lib/auth-context";
import { ThemeToggle } from "@/components/ThemeToggle";
import { BrandLogo } from "@/components/BrandLogo";

function LoginContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirect = searchParams.get("redirect") || "/dashboard";
  const { login } = useAuth();

  const [email, setEmail]       = useState("");
  const [password, setPassword] = useState("");
  const [showPwd, setShowPwd]   = useState(false);
  const [error, setError]       = useState("");
  const [loading, setLoading]   = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    const result = await login(email, password);
    setLoading(false);
    if (result.ok) {
      router.push(redirect);
    } else {
      setError(result.error ?? "Error al iniciar sesión.");
    }
  };

  const isComingFromBuy = redirect.includes("?buy=");

  return (
    <div className="min-h-screen bg-[#070809] grid grid-cols-1 lg:grid-cols-2 overflow-hidden">

      {/* ─────────────────────────────────────────────
         IZQUIERDA: Branding / Marketing (oculto en móvil)
         ───────────────────────────────────────────── */}
      <aside className="hidden lg:flex relative flex-col justify-between p-10 xl:p-14 bg-gradient-to-br from-[#0a0c12] via-[#0f0a1c] to-[#0a0c12] overflow-hidden">
        {/* Decorative orbs */}
        <div className="absolute -top-32 -right-32 w-96 h-96 bg-gradient-to-br from-cyan-500 to-blue-600 opacity-25 rounded-full blur-3xl float-slow" />
        <div className="absolute top-1/3 -left-20 w-80 h-80 bg-gradient-to-br from-fuchsia-500 to-purple-600 opacity-20 rounded-full blur-3xl float-soft" />
        <div className="absolute -bottom-32 right-1/4 w-72 h-72 bg-gradient-to-br from-orange-500 to-red-500 opacity-15 rounded-full blur-3xl float-slow" style={{ animationDelay: "3s" }} />
        <div className="particles-bg" />

        {/* Top: Logo */}
        <div className="relative">
          <Link href="/" className="inline-flex items-center gap-3 group">
            <BrandLogo className="w-12 h-12 drop-shadow-2xl group-hover:scale-105 transition-transform" />
            <div>
              <div className="text-white font-black text-base leading-none tracking-wide">MediaPlay<span className="font-medium text-white/80">Promo</span></div>
              <div className="text-white/40 text-[10px] font-bold tracking-[0.25em] leading-none mt-1">.COM</div>
            </div>
          </Link>
        </div>

        {/* Middle: Marketing copy */}
        <div className="relative space-y-6 max-w-md">
          <div className="inline-flex items-center gap-2 bg-cyan-500/10 border border-cyan-500/20 rounded-full px-3 py-1 text-[10px] font-black uppercase tracking-[0.18em] text-cyan-300">
            <Sparkles className="w-3 h-3" /> SUITE PROFESIONAL PARA CREADORES
          </div>

          <h1 className="text-4xl xl:text-5xl font-black text-white leading-[1.1] tracking-tight">
            La plataforma{" "}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-blue-500">todo en uno</span>{" "}
            para tu marca digital.
          </h1>

          <p className="text-white/55 text-base leading-relaxed">
            Genera videos con IA, vende productos digitales, gestiona afiliados y construye tu marca blanca — todo desde un panel.
          </p>

          {/* Features list */}
          <ul className="space-y-3 pt-2">
            {[
              { icon: Zap, text: "17 modelos de IA: Veo 3, Sora 2, Kling, Grok..." },
              { icon: Shield, text: "Tus datos seguros, encriptados end-to-end" },
              { icon: Check, text: "Cancela cuando quieras, sin permanencia" },
            ].map((f, i) => {
              const Icon = f.icon;
              return (
                <li key={i} className="flex items-center gap-3">
                  <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center shadow-lg shadow-cyan-500/30 flex-shrink-0">
                    <Icon className="w-3.5 h-3.5 text-white" />
                  </div>
                  <span className="text-white/75 text-sm">{f.text}</span>
                </li>
              );
            })}
          </ul>

          {/* Social proof */}
          <div className="flex items-center gap-3 pt-4">
            <div className="flex -space-x-2">
              {["from-pink-500 to-rose-600", "from-cyan-400 to-blue-600", "from-violet-500 to-purple-600", "from-amber-400 to-orange-600"].map((c, i) => (
                <div key={i} className={`w-9 h-9 rounded-full bg-gradient-to-br ${c} border-2 border-[#0a0c12] shadow-md`} />
              ))}
            </div>
            <div>
              <p className="text-white font-bold text-sm">+12,400 creadores</p>
              <p className="text-white/45 text-xs">ya confían en MediaPlayPromo</p>
            </div>
          </div>
        </div>

        {/* Bottom: Copyright */}
        <div className="relative text-white/30 text-xs">
          © 2025 MediaPlayPromo.com · Todos los derechos reservados
        </div>
      </aside>

      {/* ─────────────────────────────────────────────
         DERECHA: Formulario de login
         ───────────────────────────────────────────── */}
      <main className="relative flex flex-col bg-[#0a0c10]">
        {/* Top bar móvil + theme toggle */}
        <div className="flex items-center justify-between p-4 sm:p-6 lg:p-8">
          <Link href="/" className="lg:hidden inline-flex items-center gap-2.5">
            <BrandLogo className="w-9 h-9 drop-shadow-lg" />
            <div>
              <div className="text-white font-bold text-xs leading-none">MediaPlay<span className="font-medium text-white/80">Promo</span></div>
              <div className="text-white/40 text-[8px] font-bold tracking-widest leading-none mt-0.5">.COM</div>
            </div>
          </Link>
          <div className="ml-auto flex items-center gap-2">
            <ThemeToggle compact />
            <Link href="/" className="hidden sm:inline-flex text-white/50 hover:text-white text-xs font-medium px-3 py-1.5 rounded-lg hover:bg-white/5 transition-colors">
              ← Volver al inicio
            </Link>
          </div>
        </div>

        {/* Form container */}
        <div className="flex-1 flex items-center justify-center px-4 sm:px-6 lg:px-8 pb-10">
          <div className="w-full max-w-md">

            {/* Coming from buy banner */}
            {isComingFromBuy && (
              <div className="bg-gradient-to-r from-violet-500/15 to-fuchsia-500/15 border border-violet-500/30 rounded-2xl p-4 mb-6 flex items-start gap-3">
                <Sparkles className="w-5 h-5 text-violet-400 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="text-violet-200 font-bold text-sm">Casi listo para comprar</p>
                  <p className="text-violet-200/70 text-xs mt-0.5">Inicia sesión para completar tu compra de YF AUTO CLIP.</p>
                </div>
              </div>
            )}

            {/* Heading */}
            <div className="mb-7">
              <h2 className="text-3xl sm:text-4xl font-black text-white tracking-tight">
                {isComingFromBuy ? "Continúa con tu compra" : "Bienvenido de nuevo"}
              </h2>
              <p className="text-white/50 text-sm mt-2">
                ¿No tienes cuenta?{" "}
                <Link href={`/register${redirect ? `?redirect=${encodeURIComponent(redirect)}` : ""}`} className="text-cyan-400 hover:text-cyan-300 font-bold">
                  Regístrate gratis
                </Link>
              </p>
            </div>

            {/* SuperAdmin hint */}
            <div className="glass-card rounded-2xl border border-orange-500/25 bg-gradient-to-r from-orange-500/10 to-yellow-500/5 p-3.5 mb-5 flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-orange-400 to-orange-600 flex items-center justify-center shadow-lg shadow-orange-500/30 flex-shrink-0">
                <Crown className="w-4 h-4 text-white" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-orange-300 font-bold text-xs">Acceso SuperAdmin</p>
                <p className="text-orange-200/60 text-[11px] truncate">solfamendez41@gmail.com</p>
              </div>
            </div>

            {/* Form */}
            <form onSubmit={handleSubmit} className="space-y-4">

              {/* Email */}
              <div>
                <label htmlFor="email" className="block text-white/65 text-xs font-bold mb-1.5">
                  Email o usuario
                </label>
                <div className="relative">
                  <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-white/35" />
                  <input
                    id="email"
                    type="text"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="tu@email.com o tu usuario"
                    autoComplete="username"
                    required
                    className="w-full bg-white/[0.04] border border-white/10 rounded-xl pl-10 pr-3 py-3 text-sm text-white placeholder:text-white/30 focus:outline-none focus:border-cyan-500/50 focus:bg-white/[0.07] transition-all"
                  />
                </div>
              </div>

              {/* Password */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label htmlFor="password" className="block text-white/65 text-xs font-bold">
                    Contraseña
                  </label>
                  <Link href="/forgot-password" className="text-cyan-400 hover:text-cyan-300 text-xs font-semibold">
                    ¿Olvidaste tu contraseña?
                  </Link>
                </div>
                <div className="relative">
                  <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-white/35" />
                  <input
                    id="password"
                    type={showPwd ? "text" : "password"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    autoComplete="current-password"
                    required
                    className="w-full bg-white/[0.04] border border-white/10 rounded-xl pl-10 pr-10 py-3 text-sm text-white placeholder:text-white/30 focus:outline-none focus:border-cyan-500/50 focus:bg-white/[0.07] transition-all"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPwd(!showPwd)}
                    aria-label={showPwd ? "Ocultar" : "Mostrar"}
                    className="absolute right-3.5 top-1/2 -translate-y-1/2 text-white/40 hover:text-white/70 transition-colors"
                  >
                    {showPwd ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {/* Error message */}
              {error && (
                <div className="bg-red-500/10 border border-red-500/25 rounded-xl p-3 flex items-start gap-2.5">
                  <AlertCircle className="w-4 h-4 text-red-400 flex-shrink-0 mt-0.5" />
                  <p className="text-red-300 text-xs font-semibold">{error}</p>
                </div>
              )}

              {/* Submit */}
              <button
                type="submit"
                disabled={loading || !email || !password}
                className="shine-btn w-full inline-flex items-center justify-center gap-2 bg-gradient-to-r from-cyan-500 to-blue-600 hover:opacity-95 text-white font-bold text-sm px-5 py-3.5 rounded-xl shadow-xl shadow-cyan-500/25 ring-1 ring-white/15 transition-all hover:-translate-y-0.5 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
              >
                {loading ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    Verificando...
                  </>
                ) : (
                  <>
                    Acceder al Panel <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>

              {/* Divider */}
              <div className="flex items-center gap-3 py-1">
                <div className="flex-1 h-px bg-white/8" />
                <span className="text-white/30 text-[10px] font-bold uppercase tracking-wider">o continúa con</span>
                <div className="flex-1 h-px bg-white/8" />
              </div>

              {/* Social login (placeholder) */}
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  className="inline-flex items-center justify-center gap-2 bg-white/[0.04] hover:bg-white/[0.08] border border-white/10 text-white text-xs font-semibold px-3 py-2.5 rounded-xl transition-all"
                  onClick={() => alert("Próximamente: login con Google")}
                >
                  <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                    <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                    <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
                    <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
                  </svg>
                  Google
                </button>
                <button
                  type="button"
                  className="inline-flex items-center justify-center gap-2 bg-white/[0.04] hover:bg-white/[0.08] border border-white/10 text-white text-xs font-semibold px-3 py-2.5 rounded-xl transition-all"
                  onClick={() => alert("Próximamente: login con GitHub")}
                >
                  <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor"><path d="M12 0C5.37 0 0 5.37 0 12c0 5.3 3.44 9.8 8.21 11.39.6.11.82-.26.82-.58v-2.16c-3.34.73-4.04-1.6-4.04-1.6-.55-1.39-1.34-1.76-1.34-1.76-1.09-.74.08-.73.08-.73 1.21.09 1.85 1.24 1.85 1.24 1.07 1.83 2.81 1.3 3.49.99.11-.77.42-1.3.76-1.6-2.67-.3-5.47-1.33-5.47-5.93 0-1.31.47-2.38 1.24-3.22-.13-.31-.54-1.52.12-3.18 0 0 1.01-.32 3.3 1.23a11.5 11.5 0 016 0c2.29-1.55 3.3-1.23 3.3-1.23.66 1.66.25 2.87.12 3.18.77.84 1.24 1.91 1.24 3.22 0 4.61-2.81 5.62-5.48 5.92.43.37.82 1.1.82 2.22v3.29c0 .32.22.7.83.58A12.01 12.01 0 0024 12c0-6.63-5.37-12-12-12z"/></svg>
                  GitHub
                </button>
              </div>
            </form>

            <p className="text-center text-white/35 text-[10px] mt-6">
              Al iniciar sesión aceptas nuestros{" "}
              <Link href="/terms" className="text-white/55 hover:text-white">Términos</Link> y{" "}
              <Link href="/privacy" className="text-white/55 hover:text-white">Privacidad</Link>.
            </p>
          </div>
        </div>
      </main>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-[#070809]" />}>
      <LoginContent />
    </Suspense>
  );
}
