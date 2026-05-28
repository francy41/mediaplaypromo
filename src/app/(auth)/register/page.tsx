"use client";
import { useState } from "react";
import Link from "next/link";
import { User, Mail, Lock, Eye, EyeOff, Globe, Check } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function RegisterPage() {
  const [showPassword, setShowPassword] = useState(false);

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

      <div className="bg-[#0f1117] border border-white/10 rounded-2xl p-6 space-y-4">
        <button className="w-full flex items-center justify-center gap-2.5 bg-white/5 border border-white/10 hover:bg-white/10 rounded-lg py-2.5 text-sm text-white transition-all">
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
              placeholder="Tu nombre"
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
              placeholder="tu@email.com"
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
              placeholder="Mínimo 8 caracteres"
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

        {/* Benefits */}
        <div className="bg-white/3 rounded-lg p-3 space-y-1.5">
          {["Acceso a 3+ herramientas gratuitas", "Sin tarjeta de crédito", "Soporte incluido"].map((b) => (
            <div key={b} className="flex items-center gap-2 text-xs text-white/60">
              <Check className="w-3 h-3 text-cyan-400 flex-shrink-0" />
              {b}
            </div>
          ))}
        </div>

        <Button className="w-full" size="md">
          Crear cuenta gratis
        </Button>

        <p className="text-center text-white/30 text-[10px]">
          Al registrarte aceptas los{" "}
          <Link href="/terms" className="text-cyan-400 hover:underline">Términos</Link>
          {" "}y la{" "}
          <Link href="/privacy" className="text-cyan-400 hover:underline">Política de privacidad</Link>
        </p>
      </div>

      <p className="text-center text-white/40 text-sm mt-4">
        ¿Ya tienes cuenta?{" "}
        <Link href="/login" className="text-cyan-400 hover:underline">
          Iniciar sesión
        </Link>
      </p>
    </div>
  );
}
