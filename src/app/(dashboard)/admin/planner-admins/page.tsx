"use client";
import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { KeyRound, Lock, Plus, Trash2, RefreshCw, UserPlus, CalendarClock, Power, Eye, EyeOff } from "lucide-react";
import { AdminShell, KPIGrid } from "@/components/admin/AdminShell";

const SECRET_STORE = "mpp_license_admin_secret";

interface Admin {
  id: string;
  name: string;
  username: string;
  email: string | null;
  active: boolean;
  createdAt: string;
}

export default function PlannerAdminsPage() {
  const [secret, setSecret] = useState("");
  const [input, setInput] = useState("");
  const [authed, setAuthed] = useState(false);
  const [admins, setAdmins] = useState<Admin[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [name, setName] = useState("");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPw, setShowPw] = useState(false);
  const [msg, setMsg] = useState("");
  const [justCreated, setJustCreated] = useState<string | null>(null);

  const call = useCallback((sec: string, method: string, body?: unknown) =>
    fetch("/api/admin/planner-admins", {
      method,
      headers: { "Content-Type": "application/json", "x-admin-secret": sec },
      ...(body ? { body: JSON.stringify(body) } : {}),
    }), []);

  const load = useCallback(async (sec: string) => {
    setLoading(true); setError(null);
    try {
      const r = await call(sec, "GET");
      if (r.status === 401) { setAuthed(false); try { localStorage.removeItem(SECRET_STORE); } catch {} setError("Secreto de SuperAdmin incorrecto."); return; }
      const d = await r.json();
      setAdmins(d.admins ?? []); setSecret(sec); setAuthed(true);
      try { localStorage.setItem(SECRET_STORE, sec); } catch {}
    } catch { setError("Error de conexión."); }
    finally { setLoading(false); }
  }, [call]);

  useEffect(() => {
    let s = ""; try { s = localStorage.getItem(SECRET_STORE) ?? ""; } catch {}
    if (!s) return;
    const t = setTimeout(() => load(s), 0);
    return () => clearTimeout(t);
  }, [load]);

  const create = async () => {
    if (!username.trim() || !password.trim()) { setMsg("Escribe usuario y contraseña."); return; }
    setMsg("Creando…");
    const r = await call(secret, "POST", { action: "create", name, username, password });
    const d = await r.json();
    if (d.ok && d.admin) {
      setMsg("✅ Administrador creado"); setName(""); setUsername(""); setPassword("");
      setJustCreated(d.admin.id);
      load(secret);
    } else setMsg(`⚠️ ${d.error || "No se pudo crear"}`);
  };

  const changePassword = async (a: Admin) => {
    const pw = prompt(`Nueva contraseña para "${a.username}":`);
    if (!pw) return;
    const r = await call(secret, "POST", { action: "password", id: a.id, password: pw });
    const d = await r.json();
    alert(d.ok ? "✅ Contraseña actualizada" : `⚠️ ${d.error || "Error"}`);
  };

  const toggle = async (a: Admin) => {
    await call(secret, "POST", { action: "toggle", id: a.id, active: !a.active });
    load(secret);
  };

  const remove = async (a: Admin) => {
    if (!confirm(`¿Eliminar al administrador "${a.username}"? No podrá volver a entrar.`)) return;
    await call(secret, "POST", { action: "remove", id: a.id });
    load(secret);
  };

  const activeCount = admins.filter((a) => a.active).length;

  return (
    <AdminShell
      title="Admins del Planificador"
      description="Crea administradores con usuario y contraseña: acceso gratis al Planificador y a sus propias cuentas GHL."
      icon={KeyRound}
      iconGradient="from-pink-500 to-violet-600"
      status="live"
      breadcrumb={[{ label: "Admins del Planificador" }]}
      actions={authed && (
        <button onClick={() => load(secret)} className="inline-flex items-center gap-1.5 bg-white/5 hover:bg-white/10 border border-white/10 text-white text-xs font-semibold px-3 py-2 rounded-xl transition-colors">
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} /> Actualizar
        </button>
      )}
    >
      {!authed ? (
        <div className="glass-card rounded-2xl border border-white/10 p-8 max-w-md mx-auto text-center">
          <div className="inline-flex w-14 h-14 rounded-2xl bg-pink-500/15 border border-pink-500/30 items-center justify-center mb-4"><Lock className="w-7 h-7 text-pink-400" /></div>
          <h2 className="text-white font-bold text-lg mb-1">Secreto de SuperAdmin</h2>
          <p className="text-white/50 text-sm mb-5">Introduce tu <code className="text-pink-300">LICENSE_ADMIN_SECRET</code> para gestionar los administradores.</p>
          <form onSubmit={(e) => { e.preventDefault(); if (input.trim()) load(input.trim()); }} className="space-y-3">
            <input type="password" value={input} onChange={(e) => setInput(e.target.value)} placeholder="Secreto de SuperAdmin" className="w-full bg-white/5 border border-white/10 rounded-xl px-3.5 py-2.5 text-sm text-white placeholder:text-white/30 focus:outline-none focus:border-pink-500/40" />
            {error && <p className="text-red-400 text-xs">{error}</p>}
            <button type="submit" className="shine-btn w-full bg-gradient-to-r from-pink-500 to-violet-600 text-white font-bold text-sm px-5 py-3 rounded-xl shadow-lg shadow-pink-500/30">Entrar</button>
          </form>
        </div>
      ) : (
        <div className="space-y-4">
          <KPIGrid kpis={[
            { label: "Administradores", value: admins.length, gradient: "from-pink-500 to-violet-600" },
            { label: "Activos", value: activeCount, gradient: "from-green-500 to-emerald-600" },
            { label: "Suspendidos", value: admins.length - activeCount, gradient: "from-orange-500 to-red-600" },
          ]} />

          {/* Crear admin */}
          <div className="glass-card rounded-2xl border border-violet-500/25 bg-violet-500/[0.03] p-5">
            <h3 className="flex items-center gap-2 text-white font-bold text-sm mb-3"><UserPlus className="w-4 h-4 text-violet-400" /> Crear administrador</h3>
            <div className="grid sm:grid-cols-3 gap-2 mb-2">
              <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Nombre (opcional)" className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-white placeholder:text-white/30 focus:outline-none focus:border-violet-500/40" />
              <input value={username} onChange={(e) => setUsername(e.target.value)} placeholder="Usuario *" autoComplete="off" className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-white placeholder:text-white/30 focus:outline-none focus:border-violet-500/40" />
              <div className="relative">
                <input value={password} onChange={(e) => setPassword(e.target.value)} type={showPw ? "text" : "password"} placeholder="Contraseña *" autoComplete="new-password" className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 pr-9 text-sm text-white placeholder:text-white/30 focus:outline-none focus:border-violet-500/40" />
                <button type="button" onClick={() => setShowPw((v) => !v)} className="absolute right-2 top-1/2 -translate-y-1/2 text-white/40 hover:text-white/70">{showPw ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}</button>
              </div>
            </div>
            <div className="flex items-center gap-2 flex-wrap">
              <button onClick={create} className="inline-flex items-center gap-1.5 bg-gradient-to-r from-pink-500 to-violet-600 text-white text-xs font-bold px-4 py-2 rounded-lg shadow shadow-violet-500/30"><Plus className="w-3.5 h-3.5" /> Crear administrador</button>
              {msg && <span className="text-xs text-white/70">{msg}</span>}
            </div>
            <p className="text-white/35 text-[10px] mt-2">Dale el <b>usuario y la contraseña</b> a tu cliente. Entra en el Planificador → <b>Acceso administrador</b>, los introduce y tendrá su propio espacio aislado para conectar sus cuentas GHL y programar videos, gratis.</p>
          </div>

          {/* Lista de admins */}
          <div className="glass-card rounded-2xl border border-white/10 overflow-hidden">
            <div className="overflow-x-auto scrollbar-hide">
              <table className="w-full text-sm min-w-[640px]">
                <thead>
                  <tr className="border-b border-white/8 text-white/45 text-[10px] uppercase tracking-wider">
                    <th className="text-left font-bold px-4 py-3">Administrador</th>
                    <th className="text-left font-bold px-4 py-3">Usuario</th>
                    <th className="text-left font-bold px-4 py-3">Estado</th>
                    <th className="text-left font-bold px-4 py-3">Creado</th>
                    <th className="text-right font-bold px-4 py-3"></th>
                  </tr>
                </thead>
                <tbody>
                  {admins.map((a) => (
                    <tr key={a.id} className={`border-b border-white/5 hover:bg-white/[0.02] ${justCreated === a.id ? "bg-violet-500/[0.06]" : ""}`}>
                      <td className="px-4 py-3">
                        <span className="text-white text-xs font-semibold block">{a.name}</span>
                        {a.email && <span className="text-white/40 text-[11px] block">{a.email}</span>}
                      </td>
                      <td className="px-4 py-3">
                        <code className="text-cyan-300 font-mono text-xs bg-white/5 border border-white/10 rounded px-2 py-1">{a.username}</code>
                      </td>
                      <td className="px-4 py-3">
                        <span className={`text-[10px] font-black px-2 py-0.5 rounded-full uppercase ${a.active ? "bg-green-500/15 text-green-400 border border-green-500/30" : "bg-white/8 text-white/40 border border-white/15"}`}>
                          {a.active ? "Activo" : "Suspendido"}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-white/55 text-xs">{a.createdAt ? new Date(a.createdAt).toLocaleDateString() : "—"}</td>
                      <td className="px-4 py-3 text-right whitespace-nowrap">
                        <button onClick={() => changePassword(a)} className="inline-flex items-center gap-1 bg-white/5 hover:bg-cyan-500/15 border border-white/10 hover:border-cyan-500/30 text-white/60 hover:text-cyan-300 text-[11px] px-2.5 py-1.5 rounded-lg transition-colors mr-1.5" title="Cambiar contraseña">
                          <KeyRound className="w-3.5 h-3.5" />
                        </button>
                        <button onClick={() => toggle(a)} className={`inline-flex items-center gap-1 border text-[11px] px-2.5 py-1.5 rounded-lg transition-colors mr-1.5 ${a.active ? "bg-white/5 hover:bg-amber-500/15 border-white/10 hover:border-amber-500/30 text-white/60 hover:text-amber-300" : "bg-emerald-500/10 hover:bg-emerald-500/20 border-emerald-500/30 text-emerald-300"}`} title={a.active ? "Suspender" : "Reactivar"}>
                          <Power className="w-3.5 h-3.5" />
                        </button>
                        <button onClick={() => remove(a)} className="inline-flex items-center gap-1 bg-white/5 hover:bg-red-500/15 border border-white/10 hover:border-red-500/30 text-white/60 hover:text-red-300 text-[11px] px-2.5 py-1.5 rounded-lg transition-colors" title="Eliminar"><Trash2 className="w-3.5 h-3.5" /></button>
                      </td>
                    </tr>
                  ))}
                  {admins.length === 0 && (
                    <tr><td colSpan={5} className="px-4 py-10 text-center text-white/40 text-sm">Aún no hay administradores. Crea el primero arriba.</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

          <Link href="/content" className="inline-flex items-center gap-1.5 text-violet-300 hover:text-violet-200 text-xs font-semibold">
            <CalendarClock className="w-3.5 h-3.5" /> Ir al Planificador
          </Link>
        </div>
      )}
    </AdminShell>
  );
}
