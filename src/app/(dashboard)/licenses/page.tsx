"use client";
import { useCallback, useEffect, useState } from "react";
import { KeyRound, ShieldOff, ShieldCheck, RefreshCw, Lock, Copy, Check } from "lucide-react";
import { AdminShell, KPIGrid } from "@/components/admin/AdminShell";

interface License {
  id: string;
  license_key: string;
  product_name: string | null;
  product_slug: string | null;
  tier_id: string | null;
  email: string | null;
  status: string;
  activation_count: number | null;
  max_activations: number | null;
  created_at: string | null;
  last_validated_at: string | null;
  stripe_session_id: string | null;
}

const SECRET_STORE = "mpp_license_admin_secret";

export default function LicensesAdminPage() {
  const [secret, setSecret] = useState("");
  const [input, setInput] = useState("");
  const [authed, setAuthed] = useState(false);
  const [licenses, setLicenses] = useState<License[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState<string | null>(null);

  const call = useCallback(async (sec: string, body: Record<string, unknown>) => {
    const r = await fetch("/api/license/admin", {
      method: "POST",
      headers: { "Content-Type": "application/json", "x-admin-secret": sec },
      body: JSON.stringify(body),
    });
    return r;
  }, []);

  const load = useCallback(async (sec: string) => {
    setLoading(true); setError(null);
    try {
      const r = await call(sec, { action: "list" });
      if (r.status === 401) {
        setError("Secreto incorrecto.");
        setAuthed(false);
        try { localStorage.removeItem(SECRET_STORE); } catch {}
        return;
      }
      const d = await r.json();
      setLicenses(d.licenses ?? []);
      setSecret(sec);
      setAuthed(true);
      try { localStorage.setItem(SECRET_STORE, sec); } catch {}
    } catch {
      setError("Error de conexión.");
    } finally {
      setLoading(false);
    }
  }, [call]);

  useEffect(() => {
    let s = "";
    try { s = localStorage.getItem(SECRET_STORE) ?? ""; } catch {}
    if (s) load(s);
  }, [load]);

  const setStatus = async (key: string, action: "revoke" | "activate") => {
    if (action === "revoke" && !confirm("¿Revocar esta licencia? El software dejará de validarla.")) return;
    await call(secret, { action, key });
    load(secret);
  };

  const copy = (text: string) => {
    navigator.clipboard?.writeText(text).then(() => {
      setCopied(text);
      setTimeout(() => setCopied(null), 1500);
    }).catch(() => {});
  };

  const total = licenses.length;
  const active = licenses.filter((l) => l.status === "active").length;
  const revoked = licenses.filter((l) => l.status === "revoked").length;

  return (
    <AdminShell
      title="Licencias"
      description="Claves de licencia generadas en cada compra. Revoca aquí en caso de reembolso o contracargo."
      icon={KeyRound}
      iconGradient="from-indigo-500 to-violet-600"
      status="live"
      breadcrumb={[{ label: "Licencias" }]}
      actions={authed && (
        <button onClick={() => load(secret)} className="inline-flex items-center gap-1.5 bg-white/5 hover:bg-white/10 border border-white/10 text-white text-xs font-semibold px-3 py-2 rounded-xl transition-colors">
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} /> Actualizar
        </button>
      )}
    >
      {!authed ? (
        <div className="glass-card rounded-2xl border border-white/10 p-8 max-w-md mx-auto text-center">
          <div className="inline-flex w-14 h-14 rounded-2xl bg-indigo-500/15 border border-indigo-500/30 items-center justify-center mb-4">
            <Lock className="w-7 h-7 text-indigo-400" />
          </div>
          <h2 className="text-white font-bold text-lg mb-1">Acceso a licencias</h2>
          <p className="text-white/50 text-sm mb-5">Introduce el secreto de administrador para gestionar las licencias.</p>
          <form onSubmit={(e) => { e.preventDefault(); if (input.trim()) load(input.trim()); }} className="space-y-3">
            <input
              type="password"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Secreto de admin"
              className="w-full bg-white/5 border border-white/10 rounded-xl px-3.5 py-2.5 text-sm text-white placeholder:text-white/30 focus:outline-none focus:border-indigo-500/40"
            />
            {error && <p className="text-red-400 text-xs">{error}</p>}
            <button type="submit" disabled={loading} className="shine-btn w-full inline-flex items-center justify-center gap-2 bg-gradient-to-r from-indigo-500 to-violet-600 text-white font-bold text-sm px-5 py-3 rounded-xl shadow-lg shadow-indigo-500/30 disabled:opacity-60">
              {loading ? "Comprobando..." : "Entrar"}
            </button>
          </form>
        </div>
      ) : (
        <div className="space-y-4">
          <KPIGrid kpis={[
            { label: "Total licencias", value: total, gradient: "from-indigo-500 to-violet-600" },
            { label: "Activas", value: active, gradient: "from-green-500 to-emerald-600" },
            { label: "Revocadas", value: revoked, gradient: "from-red-500 to-rose-600" },
          ]} />

          <div className="glass-card rounded-2xl border border-white/10 overflow-hidden">
            <div className="overflow-x-auto scrollbar-hide">
              <table className="w-full text-sm min-w-[760px]">
                <thead>
                  <tr className="border-b border-white/8 text-white/45 text-[10px] uppercase tracking-wider">
                    <th className="text-left font-bold px-4 py-3">Clave</th>
                    <th className="text-left font-bold px-4 py-3">Producto</th>
                    <th className="text-left font-bold px-4 py-3">Email</th>
                    <th className="text-left font-bold px-4 py-3">Estado</th>
                    <th className="text-left font-bold px-4 py-3">Activ.</th>
                    <th className="text-left font-bold px-4 py-3">Fecha</th>
                    <th className="text-right font-bold px-4 py-3">Acción</th>
                  </tr>
                </thead>
                <tbody>
                  {licenses.map((l) => (
                    <tr key={l.id} className="border-b border-white/5 hover:bg-white/[0.02]">
                      <td className="px-4 py-3">
                        <button onClick={() => copy(l.license_key)} className="inline-flex items-center gap-1.5 font-mono text-cyan-300 text-xs hover:text-cyan-200" title="Copiar">
                          {l.license_key}
                          {copied === l.license_key ? <Check className="w-3 h-3 text-green-400" /> : <Copy className="w-3 h-3 opacity-50" />}
                        </button>
                      </td>
                      <td className="px-4 py-3 text-white/70">{l.product_name ?? l.product_slug ?? "—"}<span className="text-white/35">{l.tier_id ? ` · ${l.tier_id}` : ""}</span></td>
                      <td className="px-4 py-3 text-white/60">{l.email ?? "—"}</td>
                      <td className="px-4 py-3">
                        <span className={`text-[10px] font-black px-2 py-0.5 rounded-full uppercase ${l.status === "active" ? "bg-green-500/15 text-green-400 border border-green-500/30" : "bg-red-500/15 text-red-400 border border-red-500/30"}`}>
                          {l.status === "active" ? "Activa" : "Revocada"}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-white/60">{l.activation_count ?? 0}{l.max_activations ? `/${l.max_activations}` : ""}</td>
                      <td className="px-4 py-3 text-white/45 text-xs">{l.created_at ? new Date(l.created_at).toLocaleDateString() : "—"}</td>
                      <td className="px-4 py-3 text-right">
                        {l.status === "active" ? (
                          <button onClick={() => setStatus(l.license_key, "revoke")} className="inline-flex items-center gap-1 bg-red-500/10 hover:bg-red-500/20 border border-red-500/30 text-red-300 text-[11px] font-semibold px-2.5 py-1.5 rounded-lg transition-colors">
                            <ShieldOff className="w-3.5 h-3.5" /> Revocar
                          </button>
                        ) : (
                          <button onClick={() => setStatus(l.license_key, "activate")} className="inline-flex items-center gap-1 bg-green-500/10 hover:bg-green-500/20 border border-green-500/30 text-green-300 text-[11px] font-semibold px-2.5 py-1.5 rounded-lg transition-colors">
                            <ShieldCheck className="w-3.5 h-3.5" /> Reactivar
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                  {licenses.length === 0 && (
                    <tr><td colSpan={7} className="px-4 py-10 text-center text-white/40 text-sm">Aún no hay licencias. Aparecerán automáticamente con cada compra.</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </AdminShell>
  );
}
