"use client";
import { useState } from "react";
import { User, Mail, Lock, Bell, Shield, Globe, Save } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { mockUser } from "@/lib/mock-data";

export default function SettingsPage() {
  const [name, setName] = useState(mockUser.name);
  const [email, setEmail] = useState(mockUser.email);

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div>
        <h1 className="text-xl font-bold text-white">Ajustes de Cuenta</h1>
        <p className="text-white/40 text-sm mt-1">Gestiona tu perfil y preferencias.</p>
      </div>

      {/* Profile */}
      <Card className="p-5">
        <div className="flex items-center gap-2 mb-4">
          <User className="w-4 h-4 text-cyan-400" />
          <h2 className="text-white font-semibold text-sm">Información Personal</h2>
        </div>

        {/* Avatar */}
        <div className="flex items-center gap-4 mb-5">
          <div className="w-16 h-16 rounded-full bg-gradient-to-br from-cyan-400 to-blue-600 flex items-center justify-center text-2xl font-bold text-white">
            {name.charAt(0)}
          </div>
          <div>
            <Button variant="outline" size="sm">Cambiar foto</Button>
            <p className="text-white/30 text-xs mt-1">JPG, PNG máx 2MB</p>
          </div>
        </div>

        <div className="space-y-4">
          <div>
            <label className="text-white/60 text-xs block mb-1.5">Nombre completo</label>
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2.5 text-sm text-white focus:outline-none focus:border-cyan-500/50 transition-all"
            />
          </div>
          <div>
            <label className="text-white/60 text-xs block mb-1.5">Email</label>
            <input
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              type="email"
              className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2.5 text-sm text-white focus:outline-none focus:border-cyan-500/50 transition-all"
            />
          </div>
          <Button size="md">
            <Save className="w-4 h-4 mr-2" />
            Guardar cambios
          </Button>
        </div>
      </Card>

      {/* Password */}
      <Card className="p-5">
        <div className="flex items-center gap-2 mb-4">
          <Lock className="w-4 h-4 text-cyan-400" />
          <h2 className="text-white font-semibold text-sm">Seguridad</h2>
        </div>
        <div className="space-y-4">
          {["Contraseña actual", "Nueva contraseña", "Confirmar contraseña"].map((label) => (
            <div key={label}>
              <label className="text-white/60 text-xs block mb-1.5">{label}</label>
              <input
                type="password"
                placeholder="••••••••"
                className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2.5 text-sm text-white focus:outline-none focus:border-cyan-500/50 transition-all"
              />
            </div>
          ))}
          <Button size="md">Actualizar contraseña</Button>
        </div>
      </Card>

      {/* Notifications */}
      <Card className="p-5">
        <div className="flex items-center gap-2 mb-4">
          <Bell className="w-4 h-4 text-cyan-400" />
          <h2 className="text-white font-semibold text-sm">Notificaciones</h2>
        </div>
        <div className="space-y-3">
          {[
            "Nuevas descargas disponibles",
            "Actualizaciones de productos",
            "Facturas y pagos",
            "Respuestas de soporte",
            "Novedades de la plataforma",
          ].map((item) => (
            <label key={item} className="flex items-center justify-between cursor-pointer group">
              <span className="text-white/70 text-sm group-hover:text-white transition-colors">{item}</span>
              <div className="relative">
                <input type="checkbox" defaultChecked className="sr-only peer" />
                <div className="w-10 h-5 bg-white/10 rounded-full peer peer-checked:bg-cyan-500 transition-colors" />
                <div className="absolute top-0.5 left-0.5 w-4 h-4 bg-white rounded-full transition-transform peer-checked:translate-x-5" />
              </div>
            </label>
          ))}
        </div>
      </Card>
    </div>
  );
}
