"use client";
import { useCallback, useEffect, useRef, useState } from "react";
import { AdminShell } from "@/components/admin/AdminShell";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";
import { ensureAdminSecret } from "@/lib/admin-secret";
import {
  Radio, Upload, Trash2, ChevronUp, ChevronDown, Eye, EyeOff,
  Loader2, ExternalLink, Save, Clock, AlertCircle, KeyRound,
} from "lucide-react";

const SECRET_STORE = "mpp_license_admin_secret";
const LIVE_BUCKET = "live-videos";

interface Item {
  id: string;
  title: string;
  video_url: string;
  duration_seconds: number;
  position: number;
  enabled: boolean;
}
interface Config { title: string; block_minutes: number; enabled: boolean }

const fmtDur = (s: number) => {
  const m = Math.floor(s / 60);
  const sec = Math.round(s % 60);
  return `${m}:${String(sec).padStart(2, "0")}`;
};

export default function AdminLivePage() {
  const [secret, setSecret] = useState("");
  const [config, setConfig] = useState<Config>({ title: "Canal en Directo", block_minutes: 30, enabled: true });
  const [items, setItems] = useState<Item[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState<string | null>(null);
  const [error, setError] = useState("");
  const [savedCfg, setSavedCfg] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const t = setTimeout(async () => { const s = await ensureAdminSecret(); if (s) setSecret(s); }, 0);
    return () => clearTimeout(t);
  }, []);

  const api = useCallback(
    async (payload: Record<string, unknown>) => {
      const r = await fetch("/api/live", {
        method: "POST",
        headers: { "Content-Type": "application/json", "x-admin-secret": secret },
        body: JSON.stringify(payload),
      });
      const data = await r.json();
      if (!r.ok) throw new Error(data.error || "Error");
      return data;
    },
    [secret]
  );

  const load = useCallback(async () => {
    if (!secret) { setLoading(false); return; }
    setLoading(true); setError("");
    try {
      const data = await api({ action: "list" });
      setConfig(data.config);
      setItems(data.items);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Error al cargar");
    } finally {
      setLoading(false);
    }
  }, [api, secret]);

  useEffect(() => { load(); }, [load]);

  const saveSecret = () => {
    try { localStorage.setItem(SECRET_STORE, secret); } catch {}
    load();
  };

  // Lee la duración real del vídeo cargándolo en memoria.
  const readDuration = (file: File): Promise<number> =>
    new Promise((resolve, reject) => {
      const v = document.createElement("video");
      v.preload = "metadata";
      v.onloadedmetadata = () => { URL.revokeObjectURL(v.src); resolve(v.duration); };
      v.onerror = () => reject(new Error("No se pudo leer el vídeo"));
      v.src = URL.createObjectURL(file);
    });

  const onFiles = async (files: FileList | null) => {
    if (!files || !secret) return;
    setError("");
    const supabase = createSupabaseBrowserClient();
    for (const file of Array.from(files)) {
      try {
        setUploading(file.name);
        const duration = await readDuration(file);
        if (!(duration > 0)) throw new Error("Duración inválida");

        // 1) URL firmada
        const signRes = await fetch("/api/live/upload", {
          method: "POST",
          headers: { "Content-Type": "application/json", "x-admin-secret": secret },
          body: JSON.stringify({ filename: file.name }),
        });
        const sign = await signRes.json();
        if (!signRes.ok) throw new Error(sign.error || "Error al firmar subida");

        // 2) Subida directa a Storage
        const up = await supabase.storage
          .from(LIVE_BUCKET)
          .uploadToSignedUrl(sign.path, sign.token, file);
        if (up.error) throw new Error(up.error.message);

        // 3) Registrar item
        await api({
          action: "add",
          title: file.name.replace(/\.[^.]+$/, ""),
          video_url: sign.publicUrl,
          storage_path: sign.path,
          duration_seconds: duration,
        });
      } catch (e) {
        setError(`${file.name}: ${e instanceof Error ? e.message : "Error"}`);
      }
    }
    setUploading(null);
    if (fileRef.current) fileRef.current.value = "";
    load();
  };

  const move = async (index: number, dir: -1 | 1) => {
    const j = index + dir;
    if (j < 0 || j >= items.length) return;
    const next = [...items];
    [next[index], next[j]] = [next[j], next[index]];
    setItems(next);
    try { await api({ action: "reorder", ids: next.map((i) => i.id) }); }
    catch (e) { setError(e instanceof Error ? e.message : "Error"); load(); }
  };

  const toggle = async (it: Item) => {
    setItems((prev) => prev.map((i) => (i.id === it.id ? { ...i, enabled: !i.enabled } : i)));
    try { await api({ action: "toggle", id: it.id, enabled: !it.enabled }); }
    catch (e) { setError(e instanceof Error ? e.message : "Error"); load(); }
  };

  const remove = async (it: Item) => {
    if (!confirm(`¿Borrar "${it.title}"? Se elimina también el archivo.`)) return;
    setItems((prev) => prev.filter((i) => i.id !== it.id));
    try { await api({ action: "delete", id: it.id }); }
    catch (e) { setError(e instanceof Error ? e.message : "Error"); load(); }
  };

  const saveConfig = async () => {
    try {
      const data = await api({ action: "config", ...config });
      setConfig(data.config);
      setSavedCfg(true); setTimeout(() => setSavedCfg(false), 2000);
    } catch (e) { setError(e instanceof Error ? e.message : "Error"); }
  };

  const totalSec = items.filter((i) => i.enabled).reduce((s, i) => s + Number(i.duration_seconds), 0);

  return (
    <AdminShell
      title="Canal en Directo"
      description="Sube vídeos, ordénalos y emítelos como un canal 24/7 sincronizado. La lista se reinicia cada intervalo."
      icon={Radio}
      iconGradient="from-red-500 to-rose-600"
      status="beta"
      breadcrumb={[{ label: "Admin", href: "/dashboard" }, { label: "Canal en Directo" }]}
      actions={
        <a href="/en-vivo" target="_blank" rel="noreferrer"
          className="inline-flex items-center gap-2 text-sm font-semibold px-4 py-2 rounded-xl bg-red-500/15 text-red-300 border border-red-500/30 hover:bg-red-500/25">
          <ExternalLink className="w-4 h-4" /> Ver el directo
        </a>
      }
    >
      {/* Secreto de admin */}
      {!secret && (
        <div className="bg-yellow-500/10 border border-yellow-500/25 rounded-2xl p-5 mb-5">
          <div className="flex items-center gap-2 text-yellow-300 font-bold mb-2">
            <KeyRound className="w-4 h-4" /> Introduce el secreto de administrador
          </div>
          <div className="flex gap-2">
            <input type="password" value={secret} onChange={(e) => setSecret(e.target.value)}
              placeholder="LICENSE_ADMIN_SECRET"
              className="flex-1 bg-black/40 border border-white/10 rounded-xl px-3 py-2 text-white text-sm" />
            <button onClick={saveSecret} className="px-4 py-2 rounded-xl bg-white/10 text-white text-sm font-semibold hover:bg-white/20">Guardar</button>
          </div>
        </div>
      )}

      {error && (
        <div className="bg-red-500/10 border border-red-500/25 rounded-xl p-3 mb-4 text-red-300 text-sm flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0" /> {error}
        </div>
      )}

      {/* Config */}
      <div className="bg-white/[0.03] border border-white/10 rounded-2xl p-5 mb-6">
        <h3 className="text-white font-bold mb-4 flex items-center gap-2"><Clock className="w-4 h-4 text-red-400" /> Configuración del canal</h3>
        <div className="grid sm:grid-cols-3 gap-4">
          <label className="block">
            <span className="text-white/60 text-xs">Nombre</span>
            <input value={config.title} onChange={(e) => setConfig({ ...config, title: e.target.value })}
              className="mt-1 w-full bg-black/40 border border-white/10 rounded-xl px-3 py-2 text-white text-sm" />
          </label>
          <label className="block">
            <span className="text-white/60 text-xs">Reiniciar cada (minutos)</span>
            <input type="number" min={1} max={720} value={config.block_minutes}
              onChange={(e) => setConfig({ ...config, block_minutes: Number(e.target.value) })}
              className="mt-1 w-full bg-black/40 border border-white/10 rounded-xl px-3 py-2 text-white text-sm" />
          </label>
          <label className="flex items-end gap-2 pb-1">
            <input type="checkbox" checked={config.enabled}
              onChange={(e) => setConfig({ ...config, enabled: e.target.checked })} className="w-4 h-4 accent-red-500" />
            <span className="text-white/80 text-sm">Canal activo</span>
          </label>
        </div>
        <button onClick={saveConfig} disabled={!secret}
          className="mt-4 inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-red-500/20 text-red-200 border border-red-500/30 text-sm font-semibold hover:bg-red-500/30 disabled:opacity-40">
          <Save className="w-4 h-4" /> {savedCfg ? "Guardado ✓" : "Guardar config"}
        </button>
      </div>

      {/* Subida */}
      <div
        onDragOver={(e) => e.preventDefault()}
        onDrop={(e) => { e.preventDefault(); onFiles(e.dataTransfer.files); }}
        className="border-2 border-dashed border-white/15 rounded-2xl p-8 text-center mb-6 bg-white/[0.02]">
        <Upload className="w-8 h-8 text-white/40 mx-auto mb-3" />
        <p className="text-white/70 text-sm mb-3">Arrastra vídeos aquí o selecciónalos (mp4, webm…)</p>
        <input ref={fileRef} type="file" accept="video/*" multiple hidden
          onChange={(e) => onFiles(e.target.files)} />
        <button onClick={() => fileRef.current?.click()} disabled={!secret || !!uploading}
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-white/10 text-white text-sm font-semibold hover:bg-white/20 disabled:opacity-40">
          {uploading ? <><Loader2 className="w-4 h-4 animate-spin" /> Subiendo {uploading}…</> : <>Seleccionar vídeos</>}
        </button>
      </div>

      {/* Lista */}
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-white font-bold">Lista de reproducción ({items.length})</h3>
        <span className="text-white/50 text-xs">Duración total activa: {fmtDur(totalSec)}</span>
      </div>

      {loading ? (
        <div className="text-white/50 text-sm flex items-center gap-2"><Loader2 className="w-4 h-4 animate-spin" /> Cargando…</div>
      ) : items.length === 0 ? (
        <div className="text-white/40 text-sm bg-white/[0.02] border border-white/10 rounded-xl p-6 text-center">Aún no hay vídeos. Sube el primero arriba.</div>
      ) : (
        <ul className="space-y-2">
          {items.map((it, i) => (
            <li key={it.id}
              className={`flex items-center gap-3 p-3 rounded-xl border ${it.enabled ? "bg-white/[0.03] border-white/10" : "bg-white/[0.01] border-white/5 opacity-50"}`}>
              <div className="flex flex-col">
                <button onClick={() => move(i, -1)} disabled={i === 0} className="text-white/40 hover:text-white disabled:opacity-20"><ChevronUp className="w-4 h-4" /></button>
                <button onClick={() => move(i, 1)} disabled={i === items.length - 1} className="text-white/40 hover:text-white disabled:opacity-20"><ChevronDown className="w-4 h-4" /></button>
              </div>
              <video src={it.video_url} className="w-24 h-14 object-cover rounded-lg bg-black" muted preload="metadata" />
              <div className="flex-1 min-w-0">
                <p className="text-white text-sm font-medium truncate">{it.title}</p>
                <p className="text-white/40 text-xs">{fmtDur(Number(it.duration_seconds))}</p>
              </div>
              <button onClick={() => toggle(it)} title={it.enabled ? "Ocultar" : "Mostrar"}
                className="text-white/50 hover:text-white p-2">
                {it.enabled ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
              </button>
              <button onClick={() => remove(it)} title="Borrar" className="text-red-400/70 hover:text-red-400 p-2">
                <Trash2 className="w-4 h-4" />
              </button>
            </li>
          ))}
        </ul>
      )}
    </AdminShell>
  );
}
