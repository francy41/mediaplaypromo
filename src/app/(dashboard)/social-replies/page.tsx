"use client";
import { useCallback, useEffect, useState } from "react";
import {
  MessageCircle, Lock, RefreshCw, Save, ToggleLeft, ToggleRight,
  Link2, Copy, CheckCheck, AlertCircle, Zap, Info,
} from "lucide-react";
import { AdminShell, KPIGrid } from "@/components/admin/AdminShell";

interface Config {
  enabled: boolean;
  trigger_mode: "any" | "keyword";
  keywords: string[];
  message_template: string;
  link_type: "product" | "community" | "custom";
  custom_link: string;
  product_slug: string;
}

interface ReplyLog {
  id: string;
  contact_name: string | null;
  platform: string | null;
  incoming_message: string | null;
  reply_sent: string | null;
  status: string;
  created_at: string;
}

const SECRET_STORE = "mpp_license_admin_secret";
const WEBHOOK_BASE = "https://mediaplaypromo.com/api/social/webhook";

const PLATFORM_ICONS: Record<string, string> = {
  IG: "📷", INSTAGRAM: "📷",
  FB: "💙", FACEBOOK: "💙",
  SMS: "💬", WHATSAPP: "🟢",
};

export default function SocialRepliesPage() {
  const [secret, setSecret] = useState("");
  const [inputSecret, setInputSecret] = useState("");
  const [authed, setAuthed] = useState(false);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [config, setConfig] = useState<Config>({
    enabled: false,
    trigger_mode: "any",
    keywords: [],
    message_template: "",
    link_type: "product",
    custom_link: "",
    product_slug: "yfautoclip-v2",
  });
  const [keywordsText, setKeywordsText] = useState("");
  const [logs, setLogs] = useState<ReplyLog[]>([]);
  const [webhookSecret, setWebhookSecret] = useState("");
  const [copied, setCopied] = useState(false);

  const headers = useCallback((sec: string) => ({
    "Content-Type": "application/json",
    "x-admin-secret": sec,
  }), []);

  const loadAll = useCallback(async (sec: string) => {
    setLoading(true); setError(null);
    try {
      const [cfgRes, logsRes] = await Promise.all([
        fetch("/api/social/config", { headers: { "x-admin-secret": sec } }),
        fetch("/api/social/logs", { headers: { "x-admin-secret": sec } }),
      ]);
      if (cfgRes.status === 401) { setAuthed(false); localStorage.removeItem(SECRET_STORE); setError("Secreto incorrecto."); return; }
      const cfgData = await cfgRes.json();
      const logsData = await logsRes.json();
      const c = cfgData.config ?? {};
      setConfig({
        enabled: !!c.enabled,
        trigger_mode: c.trigger_mode ?? "any",
        keywords: c.keywords ?? [],
        message_template: c.message_template || cfgData.defaultTemplate || "",
        link_type: c.link_type ?? "product",
        custom_link: c.custom_link ?? "",
        product_slug: c.product_slug ?? "yfautoclip-v2",
      });
      setKeywordsText((c.keywords ?? []).join(", "));
      setLogs(logsData.logs ?? []);
      setSecret(sec); setAuthed(true);
      localStorage.setItem(SECRET_STORE, sec);
    } catch { setError("Error de conexión."); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => {
    let s = ""; try { s = localStorage.getItem(SECRET_STORE) ?? ""; } catch {}
    if (s) loadAll(s);
    // Genera un webhook secret aleatorio si no hay uno en memoria
    setWebhookSecret(Math.random().toString(36).slice(2) + Math.random().toString(36).slice(2));
  }, [loadAll]);

  const save = async () => {
    setSaving(true); setSaved(false);
    const keywords = keywordsText.split(",").map((k) => k.trim()).filter(Boolean);
    const body = { ...config, keywords };
    const res = await fetch("/api/social/config", { method: "POST", headers: headers(secret), body: JSON.stringify(body) });
    const d = await res.json();
    setSaving(false);
    if (d.ok) { setSaved(true); setTimeout(() => setSaved(false), 3000); }
    else setError(d.error ?? "Error al guardar");
  };

  const copyWebhook = () => {
    const url = `${WEBHOOK_BASE}?secret=${webhookSecret}`;
    navigator.clipboard.writeText(url).then(() => { setCopied(true); setTimeout(() => setCopied(false), 2500); });
  };

  const sentCount = logs.filter((l) => l.status === "sent").length;
  const failedCount = logs.filter((l) => l.status === "failed").length;

  const webhookUrl = `${WEBHOOK_BASE}?secret=${webhookSecret}`;

  return (
    <AdminShell
      title="Auto DM / Social Responder"
      description="Responde automáticamente a DMs y comentarios con tu mensaje de ventas."
      icon={MessageCircle}
      iconGradient="from-green-500 to-teal-600"
      status="live"
      breadcrumb={[{ label: "Auto DM" }]}
      actions={authed && (
        <button onClick={() => loadAll(secret)} className="inline-flex items-center gap-1.5 bg-white/5 hover:bg-white/10 border border-white/10 text-white text-xs font-semibold px-3 py-2 rounded-xl transition-colors">
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} /> Actualizar
        </button>
      )}
    >
      {!authed ? (
        <div className="glass-card rounded-2xl border border-white/10 p-8 max-w-md mx-auto text-center">
          <div className="inline-flex w-14 h-14 rounded-2xl bg-green-500/15 border border-green-500/30 items-center justify-center mb-4">
            <Lock className="w-7 h-7 text-green-400" />
          </div>
          <h2 className="text-white font-bold text-lg mb-1">Auto DM Responder</h2>
          <p className="text-white/50 text-sm mb-5">Introduce el secreto de administrador.</p>
          <form onSubmit={(e) => { e.preventDefault(); if (inputSecret.trim()) loadAll(inputSecret.trim()); }} className="space-y-3">
            <input type="password" value={inputSecret} onChange={(e) => setInputSecret(e.target.value)} placeholder="Secreto de admin" className="w-full bg-white/5 border border-white/10 rounded-xl px-3.5 py-2.5 text-sm text-white placeholder:text-white/30 focus:outline-none focus:border-green-500/40" />
            {error && <p className="text-red-400 text-xs">{error}</p>}
            <button type="submit" className="shine-btn w-full bg-gradient-to-r from-green-500 to-teal-600 text-white font-bold text-sm px-5 py-3 rounded-xl shadow-lg">Entrar</button>
          </form>
        </div>
      ) : (
        <div className="space-y-4">
          <KPIGrid kpis={[
            { label: "Respuestas enviadas", value: sentCount, gradient: "from-green-500 to-teal-600" },
            { label: "Fallidas", value: failedCount, gradient: "from-red-500 to-rose-600" },
            { label: "Total interacciones", value: logs.length, gradient: "from-violet-500 to-purple-600" },
          ]} />

          {/* ON/OFF + Config */}
          <div className="glass-card rounded-2xl border border-white/10 p-5 space-y-4">
            {/* Toggle principal */}
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-white font-bold text-sm">Auto-responder</h3>
                <p className="text-white/45 text-xs mt-0.5">Cuando alguien te escriba por DM, recibirá tu mensaje automáticamente.</p>
              </div>
              <button
                onClick={() => setConfig((c) => ({ ...c, enabled: !c.enabled }))}
                className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold transition-all border ${
                  config.enabled
                    ? "bg-green-500/20 border-green-400/40 text-green-300"
                    : "bg-white/5 border-white/10 text-white/50"
                }`}
              >
                {config.enabled ? <ToggleRight className="w-5 h-5" /> : <ToggleLeft className="w-5 h-5" />}
                {config.enabled ? "ACTIVO" : "INACTIVO"}
              </button>
            </div>

            {/* Trigger mode */}
            <div>
              <label className="block text-white/55 text-[10px] font-bold uppercase tracking-wider mb-2">¿Cuándo responder?</label>
              <div className="flex gap-2">
                {(["any", "keyword"] as const).map((m) => (
                  <button
                    key={m}
                    onClick={() => setConfig((c) => ({ ...c, trigger_mode: m }))}
                    className={`px-3 py-2 rounded-lg text-xs font-semibold transition-colors border ${
                      config.trigger_mode === m
                        ? "bg-teal-500/20 text-teal-200 border-teal-500/40"
                        : "bg-white/5 text-white/50 border-white/10"
                    }`}
                  >
                    {m === "any" ? "✉️ Cualquier mensaje" : "🔑 Solo con palabras clave"}
                  </button>
                ))}
              </div>
            </div>

            {config.trigger_mode === "keyword" && (
              <div>
                <label className="block text-white/55 text-[10px] font-bold uppercase tracking-wider mb-1.5">Palabras clave (separadas por coma)</label>
                <input
                  value={keywordsText}
                  onChange={(e) => setKeywordsText(e.target.value)}
                  placeholder="precio, info, comprar, link, cuanto"
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-3.5 py-2.5 text-sm text-white placeholder:text-white/30 focus:outline-none focus:border-teal-500/40"
                />
                <p className="text-white/30 text-[10px] mt-1">El bot solo responde si el mensaje contiene alguna de estas palabras.</p>
              </div>
            )}

            {/* Link a incluir */}
            <div>
              <label className="block text-white/55 text-[10px] font-bold uppercase tracking-wider mb-2">Link a incluir en el mensaje</label>
              <div className="flex flex-wrap gap-2">
                {(["product", "community", "custom"] as const).map((t) => (
                  <button
                    key={t}
                    onClick={() => setConfig((c) => ({ ...c, link_type: t }))}
                    className={`px-3 py-1.5 rounded-lg text-xs font-semibold capitalize transition-colors border ${
                      config.link_type === t
                        ? "bg-violet-500/20 text-violet-200 border-violet-500/40"
                        : "bg-white/5 text-white/50 border-white/10"
                    }`}
                  >
                    {t === "product" ? "🛒 Página de producto" : t === "community" ? "👥 Comunidad" : "🔗 URL personalizada"}
                  </button>
                ))}
              </div>
              {config.link_type === "custom" && (
                <input
                  value={config.custom_link}
                  onChange={(e) => setConfig((c) => ({ ...c, custom_link: e.target.value }))}
                  placeholder="https://tu-link.com"
                  className="mt-2 w-full bg-white/5 border border-white/10 rounded-xl px-3.5 py-2.5 text-sm text-white placeholder:text-white/30 focus:outline-none focus:border-violet-500/40"
                />
              )}
            </div>

            {/* Template del mensaje */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-white/55 text-[10px] font-bold uppercase tracking-wider">Mensaje automático</label>
                <span className="text-white/30 text-[10px]">Variables: <code className="bg-white/5 px-1 rounded">{"{nombre}"}</code> <code className="bg-white/5 px-1 rounded">{"{link_compra}"}</code> <code className="bg-white/5 px-1 rounded">{"{codigo}"}</code></span>
              </div>
              <textarea
                value={config.message_template}
                onChange={(e) => setConfig((c) => ({ ...c, message_template: e.target.value }))}
                rows={12}
                className="w-full bg-white/5 border border-white/10 rounded-xl px-3.5 py-2.5 text-xs text-white placeholder:text-white/30 focus:outline-none focus:border-teal-500/40 resize-none font-mono leading-relaxed"
              />
              <p className="text-white/30 text-[10px] mt-1">
                {"{nombre}"} = primer nombre del contacto &nbsp;·&nbsp; {"{link_compra}"} = URL del producto seleccionado arriba &nbsp;·&nbsp; {"{codigo}"} = YFAUTOCLIP
              </p>
            </div>

            {error && <p className="text-red-400 text-xs flex items-center gap-1"><AlertCircle className="w-3.5 h-3.5" />{error}</p>}

            <button
              onClick={save}
              disabled={saving}
              className="shine-btn inline-flex items-center gap-2 bg-gradient-to-r from-green-500 to-teal-600 text-white text-sm font-bold px-5 py-2.5 rounded-xl shadow-lg disabled:opacity-50"
            >
              {saved ? <CheckCheck className="w-4 h-4" /> : saving ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
              {saved ? "¡Guardado!" : saving ? "Guardando..." : "Guardar configuración"}
            </button>
          </div>

          {/* Configuración del webhook en GHL */}
          <div className="glass-card rounded-2xl border border-amber-500/20 bg-amber-500/[0.04] p-5 space-y-3">
            <h3 className="flex items-center gap-2 text-white font-bold text-sm">
              <Zap className="w-4 h-4 text-amber-400" /> Conectar con GoHighLevel
            </h3>
            <p className="text-white/55 text-xs">Copia esta URL y pégala en GHL para activar el auto-responder:</p>

            <div className="flex items-center gap-2">
              <div className="flex-1 bg-white/5 border border-white/10 rounded-xl px-3.5 py-2.5 text-xs font-mono text-cyan-300 truncate">{webhookUrl}</div>
              <button onClick={copyWebhook} className="flex-shrink-0 inline-flex items-center gap-1.5 bg-amber-500/15 hover:bg-amber-500/25 border border-amber-500/30 text-amber-300 text-xs font-bold px-3 py-2.5 rounded-xl transition-colors">
                {copied ? <CheckCheck className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                {copied ? "¡Copiado!" : "Copiar"}
              </button>
            </div>

            <div className="rounded-xl bg-white/[0.03] border border-white/8 p-4 space-y-2">
              <p className="text-white/70 text-[11px] font-bold uppercase tracking-wide flex items-center gap-1.5"><Info className="w-3.5 h-3.5 text-cyan-400" /> Pasos en GHL:</p>
              <ol className="space-y-1.5 text-white/50 text-xs list-decimal list-inside">
                <li>Ve a <b className="text-white/70">GHL → Settings → Integrations → Webhooks</b></li>
                <li>Clic en <b className="text-white/70">"+ Add Webhook"</b></li>
                <li>Pega la URL de arriba en el campo <b className="text-white/70">Webhook URL</b></li>
                <li>En eventos selecciona <b className="text-white/70">InboundMessage</b></li>
                <li>Guarda y activa el webhook</li>
              </ol>
              <p className="text-white/35 text-[10px] mt-2">
                Para comentarios → DM: en GHL crea un <b>Workflow</b> con trigger &ldquo;Instagram / Facebook Comment&rdquo; y acción &ldquo;Send DM&rdquo; usando este webhook como paso final, o usa el nodo &ldquo;Send Message&rdquo; directamente en el workflow.
              </p>
            </div>

            <div className="rounded-xl bg-white/[0.03] border border-white/8 p-4">
              <p className="text-white/70 text-[11px] font-bold uppercase tracking-wide flex items-center gap-1.5 mb-2">
                <Link2 className="w-3.5 h-3.5 text-violet-400" /> Automatización de comentarios en GHL
              </p>
              <ol className="space-y-1.5 text-white/50 text-xs list-decimal list-inside">
                <li>Ve a <b className="text-white/70">GHL → Automation → Workflows → + New Workflow</b></li>
                <li>Trigger: <b className="text-white/70">Instagram Comment</b> (o Facebook Comment)</li>
                <li>Filtro opcional: comentario contiene &ldquo;precio&rdquo;, &ldquo;info&rdquo;, &ldquo;link&rdquo;, etc.</li>
                <li>Acción: <b className="text-white/70">Send DM / Send Instagram Message</b></li>
                <li>En el mensaje pon el texto de ventas con el link de compra</li>
                <li>Activa el workflow</li>
              </ol>
            </div>
          </div>

          {/* Log de respuestas */}
          <div className="glass-card rounded-2xl border border-white/10 overflow-hidden">
            <div className="px-5 py-3 border-b border-white/8 flex items-center justify-between">
              <h3 className="text-white font-bold text-sm flex items-center gap-2"><MessageCircle className="w-4 h-4 text-green-400" /> Respuestas automáticas enviadas</h3>
              <span className="text-white/35 text-xs">{logs.length} total</span>
            </div>
            <div className="overflow-x-auto scrollbar-hide">
              <table className="w-full text-sm min-w-[640px]">
                <thead>
                  <tr className="border-b border-white/8 text-white/40 text-[10px] uppercase tracking-wider">
                    <th className="text-left font-bold px-4 py-3">Contacto</th>
                    <th className="text-left font-bold px-4 py-3">Red</th>
                    <th className="text-left font-bold px-4 py-3">Recibido</th>
                    <th className="text-left font-bold px-4 py-3">Estado</th>
                    <th className="text-left font-bold px-4 py-3">Fecha</th>
                  </tr>
                </thead>
                <tbody>
                  {logs.map((l) => (
                    <tr key={l.id} className="border-b border-white/5 hover:bg-white/[0.02]">
                      <td className="px-4 py-3 text-white/80 text-xs font-medium">{l.contact_name || "—"}</td>
                      <td className="px-4 py-3 text-xs">
                        <span className="inline-flex items-center gap-1 bg-white/5 border border-white/10 rounded-lg px-2 py-0.5">
                          {PLATFORM_ICONS[(l.platform ?? "").toUpperCase()] ?? "💬"}
                          <span className="text-white/60 text-[10px] uppercase font-bold">{l.platform ?? "—"}</span>
                        </span>
                      </td>
                      <td className="px-4 py-3 text-white/45 text-xs max-w-[180px] truncate">{l.incoming_message || "—"}</td>
                      <td className="px-4 py-3">
                        <span className={`text-[10px] font-black px-2 py-0.5 rounded-full uppercase ${
                          l.status === "sent" ? "bg-green-500/15 text-green-400 border border-green-500/30"
                          : "bg-red-500/15 text-red-400 border border-red-500/30"
                        }`}>{l.status === "sent" ? "Enviado" : "Error"}</span>
                      </td>
                      <td className="px-4 py-3 text-white/40 text-xs">{new Date(l.created_at).toLocaleString()}</td>
                    </tr>
                  ))}
                  {logs.length === 0 && (
                    <tr><td colSpan={5} className="px-4 py-10 text-center text-white/35 text-sm">Aún no se han enviado respuestas automáticas.<br /><span className="text-xs">Activa el responder y configura el webhook en GHL.</span></td></tr>
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
