"use client";
import { useCallback, useEffect, useState } from "react";
import { Users, Lock, Plus, Trash2, RefreshCw, Copy, Check } from "lucide-react";
import { AdminShell, KPIGrid } from "@/components/admin/AdminShell";

const SECRET_STORE = "mpp_license_admin_secret";
const SITE = "https://mediaplaypromo.com";

interface AffiliateRow {
  code: string;
  name: string | null;
  email: string | null;
  commission_rate: number;
  clicks: number;
  stats: { sales: number; revenue: number; commission: number };
}

export default function AffiliatesPage() {
  const [secret, setSecret] = useState("");
  const [input, setInput] = useState("");
  const [authed, setAuthed] = useState(false);
  const [rows, setRows] = useState<AffiliateRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState<string | null>(null);

  // formulario
  const [code, setCode] = useState("");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [rate, setRate] = useState("40");

  const load = useCallback(async (sec: string) => {
    setLoading(true); setError(null);
    try {
      const r = await fetch("/api/affiliates", { headers: { "x-admin-secret": sec } });
      if (r.status === 401) { setAuthed(false); try { localStorage.removeItem(SECRET_STORE); } catch {} setError("Secreto incorrecto."); return; }
      const d = await r.json();
      setRows(d.affiliates ?? []); setSecret(sec); setAuthed(true);
      try { localStorage.setItem(SECRET_STORE, sec); } catch {}
    } catch { setError("Error de conexión."); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => {
    let s = ""; try { s = localStorage.getItem(SECRET_STORE) ?? ""; } catch {}
    if (s) load(s);
  }, [load]);

  const create = async () => {
    if (!code.trim()) return;
    const r = await fetch("/api/affiliates", {
      method: "POST",
      headers: { "Content-Type": "application/json", "x-admin-secret": secret },
      body: JSON.stringify({ code, name, email, commission_rate: Number(rate) }),
    });
    const d = await r.json();
    if (!d.ok) { alert(d.error ?? "No se pudo crear"); return; }
    setCode(""); setName(""); setEmail(""); setRate("40");
    load(secret);
  };

  const del = async (c: string) => {
    if (!confirm(`¿Eliminar al afiliado "${c}"? (sus ventas registradas se conservan)`)) return;
    await fetch("/api/affiliates", {
      method: "POST",
      headers: { "Content-Type": "application/json", "x-admin-secret": secret },
      body: JSON.stringify({ action: "delete", code: c }),
    });
    load(secret);
  };

  const copyLink = (c: string) => {
    const link = `${SITE}/?ref=${c}`;
    navigator.clipboard.writeText(link).then(() => { setCopied(c); setTimeout(() => setCopied(null), 1500); });
  };

  const totalSales = rows.reduce((s, r) => s + r.stats.sales, 0);
  const totalRevenue = rows.reduce((s, r) => s + r.stats.revenue, 0);
  const totalCommission = rows.reduce((s, r) => s + r.stats.commission, 0);

  return (
    <AdminShell
      title="Afiliados"
      description="Crea enlaces de afiliado, sigue ventas y comisiones. Pago por venta — riesgo cero."
      icon={Users}
      iconGradient="from-emerald-500 to-teal-600"
      status="live"
      breadcrumb={[{ label: "Afiliados" }]}
      actions={authed && (
        <button onClick={() => load(secret)} className="inline-flex items-center gap-1.5 bg-white/5 hover:bg-white/10 border border-white/10 text-white text-xs font-semibold px-3 py-2 rounded-xl transition-colors">
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} /> Actualizar
        </button>
      )}
    >
      {!authed ? (
        <div className="glass-card rounded-2xl border border-white/10 p-8 max-w-md mx-auto text-center">
          <div className="inline-flex w-14 h-14 rounded-2xl bg-emerald-500/15 border border-emerald-500/30 items-center justify-center mb-4"><Lock className="w-7 h-7 text-emerald-400" /></div>
          <h2 className="text-white font-bold text-lg mb-1">Panel de Afiliados</h2>
          <p className="text-white/50 text-sm mb-5">Introduce el secreto de administrador.</p>
          <form onSubmit={(e) => { e.preventDefault(); if (input.trim()) load(input.trim()); }} className="space-y-3">
            <input type="password" value={input} onChange={(e) => setInput(e.target.value)} placeholder="Secreto de admin" className="w-full bg-white/5 border border-white/10 rounded-xl px-3.5 py-2.5 text-sm text-white placeholder:text-white/30 focus:outline-none focus:border-emerald-500/40" />
            {error && <p className="text-red-400 text-xs">{error}</p>}
            <button type="submit" className="shine-btn w-full bg-gradient-to-r from-emerald-500 to-teal-600 text-white font-bold text-sm px-5 py-3 rounded-xl shadow-lg shadow-emerald-500/30">Entrar</button>
          </form>
        </div>
      ) : (
        <div className="space-y-4">
          <KPIGrid kpis={[
            { label: "Afiliados", value: rows.length, gradient: "from-emerald-500 to-teal-600" },
            { label: "Ventas atribuidas", value: totalSales, gradient: "from-cyan-500 to-blue-600" },
            { label: "Ingresos €", value: Math.round(totalRevenue), gradient: "from-violet-500 to-fuchsia-600" },
            { label: "Comisiones €", value: Math.round(totalCommission), gradient: "from-amber-500 to-orange-600" },
          ]} />

          {/* Crear afiliado */}
          <div className="glass-card rounded-2xl border border-white/10 p-5">
            <h3 className="flex items-center gap-2 text-white font-bold text-sm mb-3"><Plus className="w-4 h-4 text-emerald-400" /> Nuevo afiliado</h3>
            <div className="grid sm:grid-cols-4 gap-3">
              <div>
                <label className="block text-white/55 text-[10px] font-bold uppercase tracking-wider mb-1.5">Código (su link)</label>
                <input value={code} onChange={(e) => setCode(e.target.value)} placeholder="maria" className="w-full bg-white/5 border border-white/10 rounded-xl px-3.5 py-2.5 text-sm text-white placeholder:text-white/30 focus:outline-none focus:border-emerald-500/40" />
              </div>
              <div>
                <label className="block text-white/55 text-[10px] font-bold uppercase tracking-wider mb-1.5">Nombre</label>
                <input value={name} onChange={(e) => setName(e.target.value)} placeholder="María García" className="w-full bg-white/5 border border-white/10 rounded-xl px-3.5 py-2.5 text-sm text-white placeholder:text-white/30 focus:outline-none focus:border-emerald-500/40" />
              </div>
              <div>
                <label className="block text-white/55 text-[10px] font-bold uppercase tracking-wider mb-1.5">Email</label>
                <input value={email} onChange={(e) => setEmail(e.target.value)} placeholder="maria@email.com" className="w-full bg-white/5 border border-white/10 rounded-xl px-3.5 py-2.5 text-sm text-white placeholder:text-white/30 focus:outline-none focus:border-emerald-500/40" />
              </div>
              <div>
                <label className="block text-white/55 text-[10px] font-bold uppercase tracking-wider mb-1.5">Comisión %</label>
                <input value={rate} onChange={(e) => setRate(e.target.value)} placeholder="40" className="w-full bg-white/5 border border-white/10 rounded-xl px-3.5 py-2.5 text-sm text-white placeholder:text-white/30 focus:outline-none focus:border-emerald-500/40" />
              </div>
            </div>
            <button onClick={create} className="mt-3 inline-flex items-center gap-1.5 bg-gradient-to-r from-emerald-500 to-teal-600 text-white text-xs font-bold px-4 py-2 rounded-lg shadow shadow-emerald-500/30"><Plus className="w-3.5 h-3.5" /> Crear afiliado</button>
          </div>

          {/* Tabla */}
          <div className="glass-card rounded-2xl border border-white/10 overflow-hidden">
            <div className="overflow-x-auto scrollbar-hide">
              <table className="w-full text-sm min-w-[760px]">
                <thead>
                  <tr className="border-b border-white/8 text-white/45 text-[10px] uppercase tracking-wider">
                    <th className="text-left font-bold px-4 py-3">Afiliado</th>
                    <th className="text-left font-bold px-4 py-3">Enlace</th>
                    <th className="text-right font-bold px-4 py-3">Clics</th>
                    <th className="text-right font-bold px-4 py-3">Ventas</th>
                    <th className="text-right font-bold px-4 py-3">Comisión</th>
                    <th className="text-right font-bold px-4 py-3"></th>
                  </tr>
                </thead>
                <tbody>
                  {rows.map((r) => (
                    <tr key={r.code} className="border-b border-white/5 hover:bg-white/[0.02]">
                      <td className="px-4 py-3">
                        <div className="text-white font-semibold text-xs">{r.name || r.code}</div>
                        <div className="text-white/40 text-[11px]">{r.email || `código: ${r.code}`} · {Math.round(r.commission_rate * 100)}%</div>
                      </td>
                      <td className="px-4 py-3">
                        <button onClick={() => copyLink(r.code)} className="inline-flex items-center gap-1.5 bg-white/5 hover:bg-white/10 border border-white/10 text-emerald-300 text-[11px] font-mono px-2.5 py-1.5 rounded-lg transition-colors">
                          {copied === r.code ? <><Check className="w-3 h-3" /> ¡Copiado!</> : <><Copy className="w-3 h-3" /> /?ref={r.code}</>}
                        </button>
                      </td>
                      <td className="px-4 py-3 text-right text-white/55 text-xs">{r.clicks ?? 0}</td>
                      <td className="px-4 py-3 text-right text-white font-bold text-xs">{r.stats.sales}</td>
                      <td className="px-4 py-3 text-right text-emerald-300 font-bold text-xs">€{r.stats.commission.toFixed(2)}</td>
                      <td className="px-4 py-3 text-right">
                        <button onClick={() => del(r.code)} className="inline-flex items-center gap-1 bg-white/5 hover:bg-red-500/15 border border-white/10 hover:border-red-500/30 text-white/60 hover:text-red-300 text-[11px] px-2.5 py-1.5 rounded-lg transition-colors"><Trash2 className="w-3.5 h-3.5" /></button>
                      </td>
                    </tr>
                  ))}
                  {rows.length === 0 && (
                    <tr><td colSpan={6} className="px-4 py-10 text-center text-white/40 text-sm">Aún no hay afiliados. Crea el primero arriba — su enlace será mediaplaypromo.com/?ref=CÓDIGO</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

          <p className="text-white/35 text-[11px]">
            💡 Cada afiliado comparte su enlace <b>mediaplaypromo.com/?ref=su-código</b>. Cuando alguien compra desde ese enlace (hasta 30 días después), la venta se le atribuye y se calcula su comisión automáticamente.
          </p>
        </div>
      )}
    </AdminShell>
  );
}
