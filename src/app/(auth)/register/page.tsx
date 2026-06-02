"use client";
import { useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { User, Mail, Lock, Eye, EyeOff, Globe, Check, AlertCircle, Loader2, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/lib/auth-context";

function RegisterContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirect = searchParams.get("redirect") || "/dashboard";
  const { register, supabaseEnabled } = useAuth();

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSuccess("");
    if (password.length < 6) {
      setError("La contraseña debe tener al menos 6 caracteres.");
      return;
    }
    setLoading(true);
    const result = await register(email, password, name || undefined);
    setLoading(false);

    if (result.ok) {
      if (result.error) {
        // Caso: requiere confirmar email
        setSuccess(result.error);
      } else {
        router.push(redirect);
      }
    } else {
      setError(result.error ?? "No se pudo crear la cuenta.");
    }
  };

  return (
    <div className="w-full max-w-sm">
      {/* Logo */}
      <div className="text-center mb-8">
        <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-cyan-400 to-blue-600 flex items-center justify-center font-black text-white text-xl mx-auto mb-3">
          M
        </div>
        <h1 className="text-white font-bold text-xl">Crear cuenta gratis</h1>
        <p className="text-white/40 text-sm mt-1">Empieza a dominar tu contenido hoy</p>
      </div>

      <form onSubmit={handleSubmit} className="bg-[#0f1117] border border-white/10 rounded-2xl p-6 space-y-4">
        {!supabaseEnabled && (
          <div className="bg-yellow-500/10 border border-yellow-500/25 rounded-lg p-3 flex items-start gap-2">
            <AlertCircle className="w-4 h-4 text-yellow-400 flex-shrink-0 mt-0.5" />
            <p className="text-yellow-200/80 text-[11px]">El registro estará activo cuando se conecte la base de datos. Usa el acceso admin por ahora.</p>
          </div>
        )}

        <button
          type="button"
          onClick={() => alert("Próximamente: registro con Google")}
          className="w-full flex items-center justify-center gap-2.5 bg-white/5 border border-white/10 hover:bg-white/10 rounded-lg py-2.5 text-sm text-white transition-all"
        >
          <Globe className="w-4 h-4" />
          Continuar con Google
        </button>

        <div className="flex items-center gap-3">
          <div className="flex-1 h-px bg-white/10" />
          <span className="text-white/30 text-xs">o con email</span>
          <div className="flex-1 h-px bg-white/10" />
        </div>

        <div>
          <label className="text-white/60 text-xs block mb-1.5">Nombre completo</label>
          <div className="relative">
            <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30" />
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Tu nombre"
              autoComplete="name"
              className="w-full bg-white/5 border border-white/10 rounded-lg pl-9 pr-4 py-2.5 text-sm text-white placeholder:text-white/30 focus:outline-none focus:border-cyan-500/50 transition-all"
            />
          </div>
        </div>

        <div>
          <label className="text-white/60 text-xs block mb-1.5">Email</label>
          <div className="relative">
            <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30" />
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="tu@email.com"
              autoComplete="email"
              required
              className="w-full bg-white/5 border border-white/10 rounded-lg pl-9 pr-4 py-2.5 text-sm text-white placeholder:text-white/30 focus:outline-none focus:border-cyan-500/50 transition-all"
            />
          </div>
        </div>

        <div>
          <label className="text-white/60 text-xs block mb-1.5">Contraseña</label>
          <div className="relative">
            <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30" />
            <input
              type={showPassword ? "text" : "password"}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Mínimo 6 caracteres"
              autoComplete="new-password"
              required
              className="w-full bg-white/5 border border-white/10 rounded-lg pl-9 pr-10 py-2.5 text-sm text-white placeholder:text-white/30 focus:outline-none focus:border-cyan-500/50 transition-all"
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-white/30 hover:text-white/60"
            >
              {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          </div>
        </div>

        {error && (
          <div className="bg-red-500/10 border border-red-500/25 rounded-lg p-3 flex items-start gap-2">
            <AlertCircle className="w-4 h-4 text-red-400 flex-shrink-0 mt-0.5" />
            <p className="text-red-300 text-xs font-semibold">{error}</p>
          </div>
        )}
        {success && (
          <div className="bg-green-500/10 border border-green-500/25 rounded-lg p-3 flex items-start gap-2">
            <CheckCircle2 className="w-4 h-4 text-green-400 flex-shrink-0 mt-0.5" />
            <p className="text-green-300 text-xs font-semibold">{success}</p>
          </div>
        )}

        {/* Benefits */}
        <div className="bg-white/3 rounded-lg p-3 space-y-1.5">
          {["Acceso a herramientas gratuitas", "Sin tarjeta de crédito", "Soporte incluido"].map((b) => (
            <div key={b} className="flex items-center gap-2 text-xs text-white/60">
              <Check className="w-3 h-3 text-cyan-400 flex-shrink-0" />
              {b}
            </div>
          ))}
        </div>

        <Button type="submit" className="w-full" size="md" disabled={loading || !email || !password}>
          {loading ? (
            <span className="inline-flex items-center gap-2"><Loader2 className="w-4 h-4 animate-spin" /> Creando cuenta...</span>
          ) : (
            "Crear cuenta gratis"
          )}
        </Button>

        <p className="text-center text-white/30 text-[10px]">
          Al registrarte aceptas los{" "}
          <Link href="/terms" className="text-cyan-400 hover:underline">Términos</Link>
          {" "}y la{" "}
          <Link href="/privacy" className="text-cyan-400 hover:underline">Política de privacidad</Link>
        </p>
      </form>

      <p className="text-center text-white/40 text-sm mt-4">
        ¿Ya tienes cuenta?{" "}
        <Link href={`/login${redirect ? `?redirect=${encodeURIComponent(redirect)}` : ""}`} className="text-cyan-400 hover:underline">
          Iniciar sesión
        </Link>
      </p>
    </div>
  );
}

export default function RegisterPage() {
  return (
    <Suspense fallback={<div className="w-full max-w-sm h-96" />}>
      <RegisterContent />
    </Suspense>
  );
}
