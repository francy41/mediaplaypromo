"use client";
import { useCallback, useEffect, useState } from "react";
import { Plug, Lock, Plus, Trash2, RefreshCw, KeyRound, Check, X } from "lucide-react";
import { AdminShell, KPIGrid } from "@/components/admin/AdminShell";

const SECRET_STORE = "mpp_license_admin_secret";

interface Row {
  provider: string;
  label: string | null;
  base_url: string | null;
  enabled: boolean;
  updated_at: string | null;
  api_key_masked: string | null;
  has_key: boolean;
}

export default function IntegrationsPage() {
  const [secret, setSecret] = useState("");
  const [input, setInput] = useState("");
  const [authed, setAuthed] = useState(false);
  const [rows, setRows] = useState<Row[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // formulario
  const [provider, setProvider] = useState("");
  const [label, setLabel] = useState("");
  const [apiKey, setApiKey] = useState("");
  const [baseUrl, setBaseUrl] = useState("");

  const load = useCallback(async (sec: string) => {
    setLoading(true); setError(null);
    try {
      const r = await fetch("/api/integrations", { headers: { "x-admin-secret": sec } });
      if (r.status === 401) { setAuthed(false); try { localStorage.removeItem(SECRET_STORE); } catch {} setError("Secreto incorrecto."); return; }
      const d = await r.json();
      setRows(d.integrations ?? []); setSecret(sec); setAuthed(true);
      try { localStorage.setItem(SECRET_STORE, sec); } catch {}
    } catch { setError("Error de conexión."); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => {
    let s = ""; try { s = localStorage.getItem(SECRET_STORE) ?? ""; } catch {}
    if (s) load(s);
  }, [load]);

  const save = async () => {
    if (!provider.trim()) return;
    const r = await fetch("/api/integrations", {
      method: "POST",
      headers: { "Content-Type": "application/json", "x-admin-secret": secret },
      body: JSON.stringify({ provider, label, api_key: apiKey, base_url: baseUrl, enabled: true }),
    });
    const d = await r.json();
    if (!d.ok) { alert(d.error ?? "No se pudo guardar (¿creaste la tabla api_integrations?)"); return; }
    setProvider(""); setLabel(""); setApiKey(""); setBaseUrl("");
    load(secret);
  };

  const toggle = async (row: Row) => {
    await fetch("/api/integrations", {
      method: "POST",
      headers: { "Content-Type": "application/json", "x-admin-secret": secret },
      body: JSON.stringify({ provider: row.provider, label: row.label, base_url: row.base_url, enabled: !row.enabled }),
    });
    load(secret);
  };

  const del = async (p: string) => {
    if (!confirm(`¿Eliminar la integración "${p}"?`)) return;
    await fetch("/api/integrations", {
      method: "POST",
      headers: { "Content-Type": "application/json", "x-admin-secret": secret },
      body: JSON.stringify({ action: "delete", provider: p }),
    });
    load(secret);
  };

  const active = rows.filter((r) => r.enabled && r.has_key).length;

  return (
    <AdminShell
      title="Integraciones / APIs"
      description="Gestiona las claves de API de tus proveedores (MUAPI, NVIDIA…) en un solo sitio, de forma segura."
      icon={Plug}
      iconGradient="from-indigo-500 to-violet-600"
      status="live"
      breadcrumb={[{ label: "Integraciones" }]}
      actions={authed && (
        <button onClick={() => load(secret)} className="inline-flex items-center gap-1.5 bg-white/5 hover:bg-white/10 border border-white/10 text-white text-xs font-semibold px-3 py-2 rounded-xl transition-colors">
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} /> Actualizar
        </button>
      )}
    >
      {!authed ? (
        <div className="glass-card rounded-2xl border border-white/10 p-8 max-w-md mx-auto text-center">
          <div className="inline-flex w-14 h-14 rounded-2xl bg-indigo-500/15 border border-indigo-500/30 items-center justify-center mb-4"><Lock className="w-7 h-7 text-indigo-400" /></div>
          <h2 className="text-white font-bold text-lg mb-1">Integraciones</h2>
          <p className="text-white/50 text-sm mb-5">Introduce el secreto de administrador.</p>
          <form onSubmit={(e) => { e.preventDefault(); if (input.trim()) load(input.trim()); }} className="space-y-3">
            <input type="password" value={input} onChange={(e) => setInput(e.target.value)} placeholder="Secreto de admin" className="w-full bg-white/5 border border-white/10 rounded-xl px-3.5 py-2.5 text-sm text-white placeholder:text-white/30 focus:outline-none focus:border-indigo-500/40" />
            {error && <p className="text-red-400 text-xs">{error}</p>}
            <button type="submit" className="shine-btn w-full bg-gradient-to-r from-indigo-500 to-violet-600 text-white font-bold text-sm px-5 py-3 rounded-xl shadow-lg shadow-indigo-500/30">Entrar</button>
          </form>
        </div>
      ) : (
        <div className="space-y-4">
          <KPIGrid kpis={[
            { label: "Integraciones", value: rows.length, gradient: "from-indigo-500 to-violet-600" },
            { label: "Activas", value: active, gradient: "from-emerald-500 to-teal-600" },
          ]} />

          {/* Añadir / actualizar */}
          <div className="glass-card rounded-2xl border border-white/10 p-5">
            <h3 className="flex items-center gap-2 text-white font-bold text-sm mb-1"><KeyRound className="w-4 h-4 text-indigo-400" /> Añadir / actualizar API</h3>
            <p className="text-white/40 text-[11px] mb-3">El proveedor es un identificador corto (ej. <b>nvidia</b>, <b>muapi</b>). La clave se guarda cifrada y nunca se muestra completa.</p>
            <div className="grid sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-white/55 text-[10px] font-bold uppercase tracking-wider mb-1.5">Proveedor (id)</label>
                <input value={provider} onChange={(e) => setProvider(e.target.value)} placeholder="nvidia" className="w-full bg-white/5 border border-white/10 rounded-xl px-3.5 py-2.5 text-sm text-white placeholder:text-white/30 focus:outline-none focus:border-indigo-500/40" />
              </div>
              <div>
                <label className="block text-white/55 text-[10px] font-bold uppercase tracking-wider mb-1.5">Nombre visible</label>
                <input value={label} onChange={(e) => setLabel(e.target.value)} placeholder="NVIDIA API" className="w-full bg-white/5 border border-white/10 rounded-xl px-3.5 py-2.5 text-sm text-white placeholder:text-white/30 focus:outline-none focus:border-indigo-500/40" />
              </div>
              <div>
                <label className="block text-white/55 text-[10px] font-bold uppercase tracking-wider mb-1.5">API Key</label>
                <input type="password" value={apiKey} onChange={(e) => setApiKey(e.target.value)} placeholder="nvapi-..." className="w-full bg-white/5 border border-white/10 rounded-xl px-3.5 py-2.5 text-sm text-white placeholder:text-white/30 focus:outline-none focus:border-indigo-500/40" />
              </div>
              <div>
                <label className="block text-white/55 text-[10px] font-bold uppercase tracking-wider mb-1.5">Base URL (opcional)</label>
                <input value={baseUrl} onChange={(e) => setBaseUrl(e.target.value)} placeholder="https://integrate.api.nvidia.com/v1" className="w-full bg-white/5 border border-white/10 rounded-xl px-3.5 py-2.5 text-sm text-white placeholder:text-white/30 focus:outline-none focus:border-indigo-500/40" />
              </div>
            </div>
            <button onClick={save} className="mt-3 inline-flex items-center gap-1.5 bg-gradient-to-r from-indigo-500 to-violet-600 text-white text-xs font-bold px-4 py-2 rounded-lg shadow shadow-indigo-500/30"><Plus className="w-3.5 h-3.5" /> Guardar</button>
          </div>

          {/* Lista */}
          <div className="glass-card rounded-2xl border border-white/10 overflow-hidden">
            <div className="overflow-x-auto scrollbar-hide">
              <table className="w-full text-sm min-w-[640px]">
                <thead>
                  <tr className="border-b border-white/8 text-white/45 text-[10px] uppercase tracking-wider">
                    <th className="text-left font-bold px-4 py-3">Proveedor</th>
                    <th className="text-left font-bold px-4 py-3">Clave</th>
                    <th className="text-left font-bold px-4 py-3">Base URL</th>
                    <th className="text-center font-bold px-4 py-3">Estado</th>
                    <th className="text-right font-bold px-4 py-3"></th>
                  </tr>
                </thead>
                <tbody>
                  {rows.map((r) => (
                    <tr key={r.provider} className="border-b border-white/5 hover:bg-white/[0.02]">
                      <td className="px-4 py-3">
                        <div className="text-white font-semibold text-xs">{r.label || r.provider}</div>
                        <div className="text-white/40 text-[11px]">id: {r.provider}</div>
                      </td>
                      <td className="px-4 py-3"><span className="font-mono text-indigo-300 text-[11px]">{r.api_key_masked ?? "— sin clave —"}</span></td>
                      <td className="px-4 py-3 text-white/50 text-[11px] truncate max-w-[200px]">{r.base_url || "—"}</td>
                      <td className="px-4 py-3 text-center">
                        <button onClick={() => toggle(r)} className={`inline-flex items-center gap-1 text-[11px] font-bold px-2.5 py-1 rounded-full border ${r.enabled ? "bg-emerald-500/15 border-emerald-500/30 text-emerald-300" : "bg-white/5 border-white/10 text-white/40"}`}>
                          {r.enabled ? <><Check className="w-3 h-3" /> Activa</> : <><X className="w-3 h-3" /> Inactiva</>}
                        </button>
                      </td>
                      <td className="px-4 py-3 text-right">
                        <button onClick={() => del(r.provider)} className="inline-flex items-center gap-1 bg-white/5 hover:bg-red-500/15 border border-white/10 hover:border-red-500/30 text-white/60 hover:text-red-300 text-[11px] px-2.5 py-1.5 rounded-lg transition-colors"><Trash2 className="w-3.5 h-3.5" /></button>
                      </td>
                    </tr>
                  ))}
                  {rows.length === 0 && (
                    <tr><td colSpan={5} className="px-4 py-10 text-center text-white/40 text-sm">Aún no hay integraciones. Añade tu primera API arriba (ej. NVIDIA).</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

          <p className="text-white/35 text-[11px]">
            🔒 Las claves se guardan con RLS (solo el servidor las lee) y en la web nunca se muestran completas. El sistema usa <code>getIntegration(&quot;proveedor&quot;)</code> para leerlas del lado servidor.
          </p>
        </div>
      )}
    </AdminShell>
  );
}
