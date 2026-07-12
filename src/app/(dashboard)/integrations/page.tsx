"use client";
import { useCallback, useEffect, useState } from "react";
import {
  Plug, Lock, Plus, Trash2, RefreshCw, KeyRound, Check, X, Power,
  Loader2, Zap, CheckCircle2, AlertCircle, ExternalLink, Pencil,
} from "lucide-react";
import { AdminShell, KPIGrid } from "@/components/admin/AdminShell";
import { ensureAdminSecret } from "@/lib/admin-secret";
import { PROVIDER_CATALOG, catalogByCategory, type ProviderSpec } from "@/lib/integration-providers";

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

interface TestState {
  loading?: boolean;
  ok?: boolean;
  message?: string;
}

type Status = "connected" | "inactive" | "unset";

function statusOf(row?: Row): Status {
  if (!row || !row.has_key) return "unset";
  return row.enabled ? "connected" : "inactive";
}

const STATUS_META: Record<Status, { label: string; cls: string; dot: string }> = {
  connected: { label: "Conectada", cls: "bg-emerald-500/15 border-emerald-500/30 text-emerald-300", dot: "bg-emerald-400" },
  inactive: { label: "Inactiva", cls: "bg-amber-500/15 border-amber-500/30 text-amber-300", dot: "bg-amber-400" },
  unset: { label: "Sin configurar", cls: "bg-white/5 border-white/10 text-white/40", dot: "bg-white/30" },
};

export default function IntegrationsPage() {
  const [secret, setSecret] = useState("");
  const [input, setInput] = useState("");
  const [authed, setAuthed] = useState(false);
  const [rows, setRows] = useState<Row[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // editor inline: provider que se está editando
  const [editing, setEditing] = useState<string | null>(null);
  const [draftLabel, setDraftLabel] = useState("");
  const [draftKey, setDraftKey] = useState("");
  const [draftBase, setDraftBase] = useState("");
  const [saving, setSaving] = useState(false);

  // alta de proveedor personalizado
  const [customId, setCustomId] = useState("");

  const [tests, setTests] = useState<Record<string, TestState>>({});

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
    const t = setTimeout(async () => { const s = await ensureAdminSecret(); if (s) load(s); }, 0);
    return () => clearTimeout(t);
  }, [load]);

  const byProvider = Object.fromEntries(rows.map((r) => [r.provider, r])) as Record<string, Row>;
  const customRows = rows.filter((r) => !PROVIDER_CATALOG.some((p) => p.id === r.provider));

  const openEditor = (id: string, row?: Row, spec?: ProviderSpec) => {
    setEditing(id);
    setDraftLabel(row?.label ?? spec?.label ?? "");
    setDraftKey("");
    setDraftBase(row?.base_url ?? spec?.defaultBaseUrl ?? "");
    setTests((t) => ({ ...t, [id]: {} }));
  };

  const closeEditor = () => { setEditing(null); setDraftKey(""); };

  const save = async (id: string) => {
    setSaving(true);
    try {
      const r = await fetch("/api/integrations", {
        method: "POST",
        headers: { "Content-Type": "application/json", "x-admin-secret": secret },
        body: JSON.stringify({ provider: id, label: draftLabel, api_key: draftKey, base_url: draftBase, enabled: true }),
      });
      const d = await r.json();
      if (!d.ok) { alert(d.error ?? "No se pudo guardar (¿creaste la tabla api_integrations?)"); return; }
      closeEditor();
      await load(secret);
    } finally { setSaving(false); }
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

  const test = async (id: string, useDraft = false) => {
    setTests((t) => ({ ...t, [id]: { loading: true } }));
    try {
      const payload: Record<string, string> = { provider: id };
      if (useDraft && draftKey.trim()) payload.api_key = draftKey.trim();
      if (useDraft && draftBase.trim()) payload.base_url = draftBase.trim();
      const r = await fetch("/api/integrations/test", {
        method: "POST",
        headers: { "Content-Type": "application/json", "x-admin-secret": secret },
        body: JSON.stringify(payload),
      });
      const d = await r.json();
      setTests((t) => ({ ...t, [id]: { ok: d.ok, message: d.message } }));
    } catch {
      setTests((t) => ({ ...t, [id]: { ok: false, message: "Error de red" } }));
    }
  };

  const connectedCount = rows.filter((r) => r.enabled && r.has_key).length;

  return (
    <AdminShell
      title="Integraciones / APIs"
      description="Conecta tus proveedores de IA (MUAPI, OpenAI, NVIDIA, ElevenLabs…). Las claves se guardan con RLS server-only y se usan automáticamente en la generación."
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
        <div className="space-y-5">
          <KPIGrid kpis={[
            { label: "Conectadas", value: connectedCount, gradient: "from-emerald-500 to-teal-600" },
            { label: "Catálogo", value: PROVIDER_CATALOG.length, gradient: "from-indigo-500 to-violet-600" },
            { label: "Personalizadas", value: customRows.length, gradient: "from-fuchsia-500 to-purple-600" },
          ]} />

          {/* ── Proveedores del catálogo, agrupados por categoría ── */}
          {catalogByCategory().map(({ category, items }) => (
            <section key={category}>
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-white/85 font-bold text-sm">{category}</h3>
                <span className="text-white/35 text-xs">{items.length} proveedores</span>
              </div>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
                {items.map((spec) => (
                  <ProviderCard
                    key={spec.id}
                    id={spec.id} spec={spec} row={byProvider[spec.id]}
                    editing={editing === spec.id}
                    draftLabel={draftLabel} draftKey={draftKey} draftBase={draftBase} saving={saving}
                    test={tests[spec.id]}
                    onOpen={() => openEditor(spec.id, byProvider[spec.id], spec)}
                    onClose={closeEditor}
                    onChangeLabel={setDraftLabel} onChangeKey={setDraftKey} onChangeBase={setDraftBase}
                    onSave={() => save(spec.id)} onToggle={() => byProvider[spec.id] && toggle(byProvider[spec.id])}
                    onDelete={() => del(spec.id)} onTest={(useDraft) => test(spec.id, useDraft)}
                  />
                ))}
              </div>
            </section>
          ))}

          {/* ── Personalizadas ── */}
          {customRows.length > 0 && (
            <section>
              <h3 className="text-white/85 font-bold text-sm mb-3">Personalizadas</h3>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
                {customRows.map((row) => (
                  <ProviderCard
                    key={row.provider}
                    id={row.provider} row={row}
                    editing={editing === row.provider}
                    draftLabel={draftLabel} draftKey={draftKey} draftBase={draftBase} saving={saving}
                    test={tests[row.provider]}
                    onOpen={() => openEditor(row.provider, row)}
                    onClose={closeEditor}
                    onChangeLabel={setDraftLabel} onChangeKey={setDraftKey} onChangeBase={setDraftBase}
                    onSave={() => save(row.provider)} onToggle={() => toggle(row)}
                    onDelete={() => del(row.provider)} onTest={(useDraft) => test(row.provider, useDraft)}
                  />
                ))}
              </div>
            </section>
          )}

          {/* ── Añadir personalizada ── */}
          <div className="glass-card rounded-2xl border border-white/10 p-5">
            <h3 className="flex items-center gap-2 text-white font-bold text-sm mb-1"><KeyRound className="w-4 h-4 text-indigo-400" /> Añadir API personalizada</h3>
            <p className="text-white/40 text-[11px] mb-3">Para un proveedor que no esté en el catálogo. El id es corto (solo letras, números, <code>-</code> y <code>_</code>).</p>
            <form
              onSubmit={(e) => {
                e.preventDefault();
                const id = customId.trim().toLowerCase().replace(/[^a-z0-9_-]/g, "");
                if (!id) return;
                setCustomId("");
                openEditor(id, byProvider[id]);
              }}
              className="flex flex-wrap items-end gap-3"
            >
              <div className="flex-1 min-w-[200px]">
                <label className="block text-white/55 text-[10px] font-bold uppercase tracking-wider mb-1.5">Proveedor (id)</label>
                <input value={customId} onChange={(e) => setCustomId(e.target.value)} placeholder="replicate" className="w-full bg-white/5 border border-white/10 rounded-xl px-3.5 py-2.5 text-sm text-white placeholder:text-white/30 focus:outline-none focus:border-indigo-500/40" />
              </div>
              <button type="submit" className="inline-flex items-center gap-1.5 bg-gradient-to-r from-indigo-500 to-violet-600 text-white text-xs font-bold px-4 py-2.5 rounded-lg shadow shadow-indigo-500/30"><Plus className="w-3.5 h-3.5" /> Configurar</button>
            </form>
          </div>

          <p className="text-white/35 text-[11px]">
            🔒 Las claves se guardan con RLS (solo el servidor las lee) y nunca se muestran completas. La generación usa <code>getIntegration(&quot;proveedor&quot;)</code> del lado servidor (BD → fallback al entorno).
          </p>
        </div>
      )}
    </AdminShell>
  );
}

function ProviderCard(props: {
  id: string;
  spec?: ProviderSpec;
  row?: Row;
  editing: boolean;
  draftLabel: string; draftKey: string; draftBase: string; saving: boolean;
  test?: TestState;
  onOpen: () => void; onClose: () => void;
  onChangeLabel: (v: string) => void; onChangeKey: (v: string) => void; onChangeBase: (v: string) => void;
  onSave: () => void; onToggle: () => void; onDelete: () => void; onTest: (useDraft: boolean) => void;
}) {
  const { id, spec, row, editing, draftLabel, draftKey, draftBase, saving, test } = props;
  const status = statusOf(row);
  const sm = STATUS_META[status];
  const Icon = spec?.icon ?? Plug;
  const accent = spec?.accent ?? "from-slate-500 to-slate-700";
  const title = row?.label || spec?.label || id;

  return (
    <div className="glass-card rounded-2xl border border-white/10 p-4">
      <div className="flex items-start gap-3">
        <div className={`w-11 h-11 rounded-xl bg-gradient-to-br ${accent} flex items-center justify-center flex-shrink-0 ring-1 ring-white/15 shadow-lg`}>
          <Icon className="w-5 h-5 text-white drop-shadow" />
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2 flex-wrap">
            <h4 className="text-white font-bold text-sm leading-tight">{title}</h4>
            {spec && <span className="text-[9px] font-bold text-white/45 bg-white/5 border border-white/10 rounded-full px-1.5 py-px">{spec.category}</span>}
          </div>
          <p className="text-white/40 text-[11px] mt-0.5">id: {id}</p>
        </div>
        <span className={`inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full border flex-shrink-0 ${sm.cls}`}>
          <span className={`w-1.5 h-1.5 rounded-full ${sm.dot}`} /> {sm.label}
        </span>
      </div>

      {spec && <p className="text-white/45 text-[11px] mt-2.5 leading-snug">{spec.description}</p>}
      {spec?.note && <p className="text-amber-300/80 text-[10px] mt-1.5 flex items-start gap-1"><AlertCircle className="w-3 h-3 mt-px flex-shrink-0" /> {spec.note}</p>}

      {row?.has_key && (
        <p className="mt-2 text-[11px]"><span className="text-white/40">Clave: </span><span className="font-mono text-indigo-300">{row.api_key_masked}</span></p>
      )}

      {/* Resultado del test */}
      {test && !test.loading && test.message && (
        <p className={`mt-2 inline-flex items-center gap-1.5 text-[11px] font-semibold ${test.ok ? "text-emerald-300" : "text-red-300"}`}>
          {test.ok ? <CheckCircle2 className="w-3.5 h-3.5" /> : <AlertCircle className="w-3.5 h-3.5" />} {test.message}
        </p>
      )}

      {/* Editor inline */}
      {editing ? (
        <div className="mt-3 space-y-2.5 border-t border-white/8 pt-3">
          {!spec && (
            <div>
              <label className="block text-white/55 text-[10px] font-bold uppercase tracking-wider mb-1">Nombre visible</label>
              <input value={draftLabel} onChange={(e) => props.onChangeLabel(e.target.value)} placeholder="Mi proveedor" className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-white placeholder:text-white/30 focus:outline-none focus:border-indigo-500/40" />
            </div>
          )}
          <div>
            <label className="block text-white/55 text-[10px] font-bold uppercase tracking-wider mb-1">API Key {row?.has_key && <span className="text-white/30 normal-case font-normal">(deja vacío para mantener la actual)</span>}</label>
            <input type="password" value={draftKey} onChange={(e) => props.onChangeKey(e.target.value)} placeholder={spec?.keyPlaceholder ?? "tu api key…"} className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-white placeholder:text-white/30 focus:outline-none focus:border-indigo-500/40" />
          </div>
          <div>
            <label className="block text-white/55 text-[10px] font-bold uppercase tracking-wider mb-1">Base URL {spec && <span className="text-white/30 normal-case font-normal">(opcional)</span>}</label>
            <input value={draftBase} onChange={(e) => props.onChangeBase(e.target.value)} placeholder={spec?.defaultBaseUrl ?? "https://api.proveedor.com"} className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-white placeholder:text-white/30 focus:outline-none focus:border-indigo-500/40" />
          </div>
          <div className="flex items-center gap-2 flex-wrap pt-1">
            <button disabled={saving} onClick={props.onSave} className="inline-flex items-center gap-1.5 bg-gradient-to-r from-indigo-500 to-violet-600 text-white text-xs font-bold px-3.5 py-2 rounded-lg shadow shadow-indigo-500/30 disabled:opacity-60">
              {saving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Check className="w-3.5 h-3.5" />} Guardar
            </button>
            <button onClick={() => props.onTest(true)} className="inline-flex items-center gap-1.5 bg-white/5 hover:bg-white/10 border border-white/10 text-white text-xs font-semibold px-3 py-2 rounded-lg">
              {test?.loading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Zap className="w-3.5 h-3.5 text-amber-400" />} Probar
            </button>
            <button onClick={props.onClose} className="inline-flex items-center gap-1.5 text-white/50 hover:text-white text-xs font-semibold px-3 py-2 rounded-lg">
              <X className="w-3.5 h-3.5" /> Cancelar
            </button>
            {spec?.docsUrl && (
              <a href={spec.docsUrl} target="_blank" rel="noreferrer" className="ml-auto inline-flex items-center gap-1 text-indigo-300 hover:text-indigo-200 text-[11px] font-semibold">
                Obtener clave <ExternalLink className="w-3 h-3" />
              </a>
            )}
          </div>
        </div>
      ) : (
        <div className="flex items-center gap-2 flex-wrap mt-3 border-t border-white/8 pt-3">
          <button onClick={props.onOpen} className="inline-flex items-center gap-1.5 bg-white/5 hover:bg-white/10 border border-white/10 text-white text-xs font-semibold px-3 py-1.5 rounded-lg">
            {row?.has_key ? <><Pencil className="w-3.5 h-3.5" /> Editar</> : <><Plus className="w-3.5 h-3.5" /> Conectar</>}
          </button>
          {row?.has_key && (
            <>
              <button onClick={() => props.onTest(false)} className="inline-flex items-center gap-1.5 bg-white/5 hover:bg-white/10 border border-white/10 text-white text-xs font-semibold px-3 py-1.5 rounded-lg">
                {test?.loading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Zap className="w-3.5 h-3.5 text-amber-400" />} Probar
              </button>
              <button onClick={props.onToggle} className="inline-flex items-center gap-1.5 bg-white/5 hover:bg-white/10 border border-white/10 text-white/70 text-xs font-semibold px-3 py-1.5 rounded-lg" title={row.enabled ? "Desactivar" : "Activar"}>
                <Power className={`w-3.5 h-3.5 ${row.enabled ? "text-emerald-400" : "text-white/40"}`} />
              </button>
              <button onClick={props.onDelete} className="inline-flex items-center gap-1 bg-white/5 hover:bg-red-500/15 border border-white/10 hover:border-red-500/30 text-white/60 hover:text-red-300 text-xs px-2.5 py-1.5 rounded-lg transition-colors">
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </>
          )}
        </div>
      )}
    </div>
  );
}
