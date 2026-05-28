"use client";
import { useState } from "react";
import { Users, Plus, Search, MoreVertical, Crown, Shield, Ban } from "lucide-react";
import { AdminShell, KPIGrid } from "@/components/admin/AdminShell";

const mockUsers = [
  { id: "u1", name: "Solfa Mendez", email: "solfamendez41@gmail.com", role: "SuperAdmin", plan: "Enterprise", status: "active", joined: "2026-05-01" },
];

export default function UsersAdminPage() {
  const [q, setQ] = useState("");
  const filtered = mockUsers.filter((u) => u.name.toLowerCase().includes(q.toLowerCase()) || u.email.includes(q.toLowerCase()));

  return (
    <AdminShell
      title="Gestión de Usuarios"
      description="Administra todas las cuentas, roles, permisos y suspensiones de la plataforma"
      icon={Users}
      iconGradient="from-cyan-500 to-blue-600"
      status="beta"
      breadcrumb={[{ label: "Usuarios" }]}
      actions={
        <button className="shine-btn inline-flex items-center gap-1.5 bg-gradient-to-r from-cyan-500 to-blue-600 text-white font-bold text-xs px-4 py-2 rounded-xl shadow-lg shadow-cyan-500/30 hover:-translate-y-0.5 transition-all">
          <Plus className="w-4 h-4" /> Nuevo Usuario
        </button>
      }
    >
      <KPIGrid
        kpis={[
          { label: "Total Usuarios", value: 1, gradient: "from-cyan-500 to-blue-600" },
          { label: "SuperAdmins", value: 1, gradient: "from-fuchsia-500 to-purple-600" },
          { label: "Activos 7d", value: 1, gradient: "from-green-500 to-emerald-600" },
          { label: "Suspendidos", value: 0, gradient: "from-red-500 to-rose-600" },
        ]}
      />

      {/* Search bar */}
      <div className="glass-card rounded-2xl border border-white/10 p-4">
        <div className="relative max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30" />
          <input
            placeholder="Buscar por nombre o email..."
            value={q}
            onChange={(e) => setQ(e.target.value)}
            className="w-full bg-white/5 border border-white/10 rounded-xl pl-9 pr-3 py-2 text-sm text-white placeholder:text-white/30 focus:outline-none focus:border-cyan-500/40 transition-colors"
          />
        </div>
      </div>

      {/* Table */}
      <div className="glass-card rounded-2xl border border-white/10 overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-white/8 text-white/40 text-[10px] uppercase tracking-wider">
              <th className="text-left px-5 py-3 font-bold">Usuario</th>
              <th className="text-left px-5 py-3 font-bold">Email</th>
              <th className="text-left px-5 py-3 font-bold">Rol</th>
              <th className="text-left px-5 py-3 font-bold">Plan</th>
              <th className="text-left px-5 py-3 font-bold">Estado</th>
              <th className="text-right px-5 py-3 font-bold">Acciones</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((u) => (
              <tr key={u.id} className="border-b border-white/5 hover:bg-white/3 transition-colors">
                <td className="px-5 py-3.5 flex items-center gap-3">
                  <div className="w-9 h-9 rounded-full bg-gradient-to-br from-orange-400 to-purple-600 flex items-center justify-center text-white font-bold text-xs ring-2 ring-orange-500/30">
                    SM
                  </div>
                  <span className="text-white font-semibold">{u.name}</span>
                </td>
                <td className="px-5 py-3.5 text-white/55">{u.email}</td>
                <td className="px-5 py-3.5">
                  <span className="inline-flex items-center gap-1 bg-fuchsia-500/15 text-fuchsia-400 border border-fuchsia-500/25 text-[10px] font-bold px-2 py-0.5 rounded-full">
                    <Crown className="w-2.5 h-2.5" /> {u.role}
                  </span>
                </td>
                <td className="px-5 py-3.5">
                  <span className="text-orange-400 font-semibold text-xs">{u.plan}</span>
                </td>
                <td className="px-5 py-3.5">
                  <span className="inline-flex items-center gap-1 bg-green-500/15 text-green-400 border border-green-500/25 text-[10px] font-bold px-2 py-0.5 rounded-full">
                    <span className="w-1.5 h-1.5 rounded-full bg-green-400" />
                    {u.status === "active" ? "Activo" : u.status}
                  </span>
                </td>
                <td className="px-5 py-3.5 text-right">
                  <button className="w-8 h-8 rounded-lg hover:bg-white/10 flex items-center justify-center text-white/45 hover:text-white transition-colors ml-auto">
                    <MoreVertical className="w-4 h-4" />
                  </button>
                </td>
              </tr>
            ))}
            {filtered.length === 0 && (
              <tr>
                <td colSpan={6} className="px-5 py-10 text-center text-white/35 text-sm">
                  No se encontraron usuarios con "{q}"
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <div className="bg-yellow-500/8 border border-yellow-500/20 rounded-2xl p-4 text-sm flex items-start gap-3">
        <Shield className="w-5 h-5 text-yellow-400 flex-shrink-0 mt-0.5" />
        <div>
          <p className="text-yellow-300 font-bold">UI lista — conexión a backend pendiente</p>
          <p className="text-yellow-100/60 text-xs mt-1">
            Suspender, asignar roles y verificación funcionarán cuando se conecte la base de datos (Postgres/Supabase recomendado).
          </p>
        </div>
      </div>
    </AdminShell>
  );
}
