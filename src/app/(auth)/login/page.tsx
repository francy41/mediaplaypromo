"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Mail, Lock, Eye, EyeOff, AlertCircle, Crown } from "lucide-react";
import { useAuth } from "@/lib/auth-context";

export default function LoginPage() {
  const router = useRouter();
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

    // small delay to feel natural
    await new Promise((r) => setTimeout(r, 600));

    const result = login(email, password);
    setLoading(false);

    if (result.ok) {
      router.push("/dashboard");
    } else {
      setError(result.error ?? "Error al iniciar sesión.");
    }
  };

  return (
    <div className="min-h-screen bg-[#080a0f] flex items-center justify-center p-4">
      <div className="w-full max-w-sm">

        {/* Logo */}
        <div className="text-center mb-8">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-orange-400 to-orange-600 flex items-center justify-center font-black text-white text-xl mx-auto mb-4 shadow-lg shadow-orange-500/20">
            M
          </div>
          <h1 className="text-white font-bold text-xl">MediaPlayPromo</h1>
          <p className="text-white/40 text-sm mt-1">Panel de Administración</p>
        </div>

        {/* Admin hint */}
        <div className="flex items-center gap-2 bg-orange-500/10 border border-orange-500/20 rounded-xl px-4 py-3 mb-5">
          <Crown className="w-4 h-4 text-orange-400 flex-shrink-0" />
          <p className="text-orange-300 text-xs">
            Acceso SuperAdmin — <span className="font-semibold">solfamendez41@gmail.com</span>
          </p>
        </div>

        {/* Form */}
        <div className="bg-[#0f1219] border border-white/10 rounded-2xl p-6">
          <form onSubmit={handleSubmit} className="space-y-4">

            {/* Error */}
            {error && (
              <div className="flex items-center gap-2 bg-red-500/10 border border-red-500/20 rounded-xl px-3 py-2.5">
                <AlertCircle className="w-4 h-4 text-red-400 flex-shrink-0" />
                <p className="text-red-400 text-xs">{error}</p>
              </div>
            )}

            {/* Email */}
            <div>
              <label className="text-white/50 text-xs block mb-1.5">Email</label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/25" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="solfamendez41@gmail.com"
                  required
                  className="w-full bg-white/5 border border-white/10 rounded-xl pl-9 pr-4 py-2.5 text-sm text-white placeholder:text-white/20 focus:outline-none focus:border-orange-500/50 transition-all"
                />
              </div>
            </div>

            {/* Password */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-white/50 text-xs">Contraseña</label>
                <button type="button" className="text-orange-400 text-xs hover:underline">
                  ¿Olvidaste tu contraseña?
                </button>
              </div>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/25" />
                <input
                  type={showPwd ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  required
                  className="w-full bg-white/5 border border-white/10 rounded-xl pl-9 pr-10 py-2.5 text-sm text-white placeholder:text-white/20 focus:outline-none focus:border-orange-500/50 transition-all"
                />
                <button
                  type="button"
                  onClick={() => setShowPwd(!showPwd)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-white/25 hover:text-white/60 transition-colors"
                >
                  {showPwd ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* Submit */}
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-orange-500 hover:bg-orange-400 disabled:opacity-60 disabled:cursor-not-allowed text-white font-bold py-3 rounded-xl transition-all text-sm flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Iniciando sesión...
                </>
              ) : (
                "Acceder al Panel"
              )}
            </button>
          </form>
        </div>

        <p className="text-center text-white/25 text-xs mt-5">
          MediaPlayPromo © 2025 — Acceso restringido
        </p>
      </div>
    </div>
  );
}
