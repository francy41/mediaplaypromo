"use client";
import { useCallback, useEffect, useRef, useState } from "react";
import { AdminShell } from "@/components/admin/AdminShell";
import { Image as ImageIcon, Sparkles, Download, Upload, Loader2, Lock, Wand2, RefreshCw } from "lucide-react";

const SECRET_STORE = "mpp_license_admin_secret";
const W = 1280, H = 720;

interface StockItem { id: string | number; thumb: string; url: string }

// Estilos de miniatura (look tipo YouTube: texto enorme, contorno grueso, barra de acento).
interface Preset { name: string; text: string; stroke: string; accent: string; scrim: string }
const PRESETS: Preset[] = [
  { name: "Rojo YouTube", text: "#FFFFFF", stroke: "#0A0A0A", accent: "#FF2323", scrim: "rgba(0,0,0,0.55)" },
  { name: "Amarillo Impacto", text: "#FFE500", stroke: "#0A0A0A", accent: "#FF2323", scrim: "rgba(0,0,0,0.5)" },
  { name: "Cian Neón", text: "#22E5FF", stroke: "#06121A", accent: "#22E5FF", scrim: "rgba(0,0,0,0.55)" },
  { name: "Verde Money", text: "#00E676", stroke: "#062015", accent: "#00E676", scrim: "rgba(0,0,0,0.55)" },
  { name: "Blanco Limpio", text: "#FFFFFF", stroke: "#111827", accent: "#7C3AED", scrim: "rgba(0,0,0,0.45)" },
];

type Pos = "bottom" | "center" | "top";
type Align = "left" | "center";

export default function ThumbnailsPage() {
  const [secret, setSecret] = useState("");
  const [authed, setAuthed] = useState(false);
  const [input, setInput] = useState("");

  const [topic, setTopic] = useState("");
  const [headline, setHeadline] = useState("");
  const [subtitle, setSubtitle] = useState("");
  const [keywords, setKeywords] = useState<string[]>([]);
  const [backgrounds, setBackgrounds] = useState<StockItem[]>([]);
  const [bgImg, setBgImg] = useState<HTMLImageElement | null>(null);
  const [bgUrl, setBgUrl] = useState("");
  const [presetIdx, setPresetIdx] = useState(0);
  const [uppercase, setUppercase] = useState(true);
  const [pos, setPos] = useState<Pos>("bottom");
  const [align, setAlign] = useState<Align>("left");
  const [offset, setOffset] = useState({ x: 0, y: 0 });
  const [scale, setScale] = useState(1);
  const dragRef = useRef<{ sx: number; sy: number; ox: number; oy: number } | null>(null);

  const [loadingText, setLoadingText] = useState(false);
  const [loadingBg, setLoadingBg] = useState(false);
  const [msg, setMsg] = useState("");
  const [error, setError] = useState<string | null>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    let s = ""; try { s = localStorage.getItem(SECRET_STORE) ?? ""; } catch {}
    let t0 = ""; try { t0 = new URLSearchParams(window.location.search).get("topic") ?? ""; } catch {}
    if (!s && !t0) return;
    const t = setTimeout(() => { if (s) { setSecret(s); setAuthed(true); } if (t0) setTopic(t0); }, 0);
    return () => clearTimeout(t);
  }, []);

  // ── Dibuja la miniatura en el canvas ──
  const draw = useCallback(() => {
    const cv = canvasRef.current; if (!cv) return;
    const ctx = cv.getContext("2d"); if (!ctx) return;
    const p = PRESETS[presetIdx] ?? PRESETS[0];
    ctx.clearRect(0, 0, W, H);

    // Fondo (cover) o degradado si no hay imagen
    if (bgImg) {
      const s = Math.max(W / bgImg.width, H / bgImg.height);
      const dw = bgImg.width * s, dh = bgImg.height * s;
      ctx.drawImage(bgImg, (W - dw) / 2, (H - dh) / 2, dw, dh);
    } else {
      const g = ctx.createLinearGradient(0, 0, W, H);
      g.addColorStop(0, "#1e1b4b"); g.addColorStop(1, "#0f172a");
      ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);
    }

    // Scrim para contraste del texto según posición
    const grad = ctx.createLinearGradient(0, 0, 0, H);
    if (pos === "bottom") { grad.addColorStop(0.35, "rgba(0,0,0,0)"); grad.addColorStop(1, p.scrim); }
    else if (pos === "top") { grad.addColorStop(0, p.scrim); grad.addColorStop(0.6, "rgba(0,0,0,0)"); }
    else { grad.addColorStop(0, "rgba(0,0,0,0.15)"); grad.addColorStop(0.5, p.scrim); grad.addColorStop(1, "rgba(0,0,0,0.15)"); }
    ctx.fillStyle = grad; ctx.fillRect(0, 0, W, H);

    const M = 70; // margen
    const maxW = W - M * 2;
    const head = (uppercase ? headline.toUpperCase() : headline).trim();
    const sub = subtitle.trim();

    // Ajusta el tamaño para que quepa en 1-3 líneas y luego aplica la escala manual
    let baseSize = 132;
    let lines: string[] = [];
    const wrap = (size: number) => {
      ctx.font = `900 ${size}px 'Arial Black', Impact, system-ui, sans-serif`;
      const words = head.split(/\s+/).filter(Boolean);
      const ls: string[] = []; let cur = "";
      for (const w of words) {
        const test = cur ? `${cur} ${w}` : w;
        if (ctx.measureText(test).width > maxW && cur) { ls.push(cur); cur = w; } else cur = test;
      }
      if (cur) ls.push(cur);
      return ls;
    };
    for (; baseSize >= 60; baseSize -= 6) { lines = wrap(baseSize); if (lines.length <= 3) break; }
    const fontSize = Math.round(baseSize * scale);
    lines = wrap(fontSize);

    const lineH = fontSize * 1.06;
    const subSize = Math.round(fontSize * 0.42);
    const blockH = lines.length * lineH + (sub ? subSize * 1.5 + 16 : 0);
    let y = (pos === "bottom" ? H - M - blockH + lineH * 0.8
      : pos === "top" ? M + lineH * 0.8
      : (H - blockH) / 2 + lineH * 0.8) + offset.y;

    ctx.textAlign = align === "center" ? "center" : "left";
    ctx.lineJoin = "round";
    const x = (align === "center" ? W / 2 : M) + offset.x;

    for (const ln of lines) {
      ctx.lineWidth = Math.max(8, fontSize * 0.14);
      ctx.strokeStyle = p.stroke;
      ctx.shadowColor = "rgba(0,0,0,0.6)"; ctx.shadowBlur = 12; ctx.shadowOffsetY = 6;
      ctx.strokeText(ln, x, y);
      ctx.shadowColor = "transparent"; ctx.shadowBlur = 0; ctx.shadowOffsetY = 0;
      ctx.fillStyle = p.text;
      ctx.fillText(ln, x, y);
      y += lineH;
    }

    if (sub) {
      // Barra de acento + subtítulo
      ctx.font = `800 ${subSize}px system-ui, 'Arial Black', sans-serif`;
      const subW = ctx.measureText(sub.toUpperCase()).width;
      const padX = 22, padY = 12;
      const bx = (align === "center" ? W / 2 - subW / 2 - padX : M) + offset.x;
      const by = y - subSize * 0.15;
      ctx.fillStyle = p.accent;
      ctx.fillRect(bx, by, subW + padX * 2, subSize + padY * 2);
      ctx.fillStyle = "#0A0A0A";
      ctx.textAlign = "left";
      ctx.fillText(sub.toUpperCase(), bx + padX, by + subSize + padY - subSize * 0.18);
    }
  }, [bgImg, headline, subtitle, presetIdx, uppercase, pos, align, offset, scale]);

  useEffect(() => { draw(); }, [draw]);

  // ── Arrastrar el texto con el ratón para colocarlo donde quieras ──
  const onPointerDown = (e: React.PointerEvent<HTMLCanvasElement>) => {
    const cv = canvasRef.current; if (!cv) return;
    cv.setPointerCapture(e.pointerId);
    dragRef.current = { sx: e.clientX, sy: e.clientY, ox: offset.x, oy: offset.y };
  };
  const onPointerMove = (e: React.PointerEvent<HTMLCanvasElement>) => {
    const d = dragRef.current, cv = canvasRef.current; if (!d || !cv) return;
    const rect = cv.getBoundingClientRect(); const f = W / rect.width;
    setOffset({ x: d.ox + (e.clientX - d.sx) * f, y: d.oy + (e.clientY - d.sy) * f });
  };
  const onPointerUp = () => { dragRef.current = null; };
  const nudge = (dx: number, dy: number) => setOffset((o) => ({ x: o.x + dx, y: o.y + dy }));

  // ── Carga un fondo (vía proxy same-origin para poder exportar el PNG) ──
  const selectBg = useCallback(async (url: string) => {
    setBgUrl(url); setLoadingBg(true); setError(null);
    try {
      const r = await fetch(`/api/admin/stock/proxy?url=${encodeURIComponent(url)}`, { headers: { "x-admin-secret": secret } });
      if (!r.ok) throw new Error(`No se pudo cargar la imagen (${r.status})`);
      const blob = await r.blob();
      const obj = URL.createObjectURL(blob);
      const img = new Image();
      img.onload = () => { setBgImg(img); setLoadingBg(false); };
      img.onerror = () => { setLoadingBg(false); setError("La imagen no se pudo abrir."); };
      img.src = obj;
    } catch (e) { setLoadingBg(false); setError(e instanceof Error ? e.message : "Error"); }
  }, [secret]);

  const fetchBackgrounds = useCallback(async (q: string) => {
    setLoadingBg(true);
    try {
      const tryOne = async (source: string) => {
        const r = await fetch(`/api/admin/stock?q=${encodeURIComponent(q)}&source=${source}&type=photo`, { headers: { "x-admin-secret": secret } });
        const d = await r.json().catch(() => ({}));
        return (d.results ?? []).filter((m: StockItem) => m?.url && m?.thumb) as StockItem[];
      };
      let res = await tryOne("pexels");
      if (res.length === 0) res = await tryOne("pixabay");
      setBackgrounds(res);
      if (res.length) await selectBg(res[0].url);
      else setLoadingBg(false);
    } catch { setLoadingBg(false); }
  }, [secret, selectBg]);

  const generate = async () => {
    if (!topic.trim()) return;
    setLoadingText(true); setError(null); setMsg("Generando texto…");
    try {
      const r = await fetch("/api/admin/thumbnail", { method: "POST", headers: { "Content-Type": "application/json", "x-admin-secret": secret }, body: JSON.stringify({ topic, lang: "es" }) });
      if (r.status === 401) { setAuthed(false); try { localStorage.removeItem(SECRET_STORE); } catch {} return; }
      const d = await r.json();
      if (d.error) { setError(d.error); return; }
      setHeadline(d.headline || topic);
      setSubtitle(d.subtitle || "");
      const kws: string[] = d.keywords?.length ? d.keywords : [topic];
      setKeywords(kws);
      setMsg("Buscando fondos…");
      await fetchBackgrounds(kws[0]);
      setMsg("");
    } catch { setError("Error de conexión."); }
    finally { setLoadingText(false); }
  };

  const onUpload = (file: File | null) => {
    if (!file) return;
    const img = new Image();
    img.onload = () => setBgImg(img);
    img.src = URL.createObjectURL(file);
    setBgUrl("");
  };

  const download = () => {
    const cv = canvasRef.current; if (!cv) return;
    cv.toBlob((blob) => {
      if (!blob) return;
      const a = document.createElement("a");
      a.href = URL.createObjectURL(blob);
      a.download = `miniatura-${(topic || "youtube").replace(/[^a-z0-9]+/gi, "-").slice(0, 40).toLowerCase()}.png`;
      a.click();
      setTimeout(() => URL.revokeObjectURL(a.href), 4000);
    }, "image/png");
  };

  if (!authed) {
    return (
      <AdminShell title="Miniaturas de YouTube" description="Genera miniaturas automáticas según el tema del video." icon={ImageIcon} iconGradient="from-rose-500 to-orange-600" status="beta" breadcrumb={[{ label: "Miniaturas" }]}>
        <div className="glass-card rounded-2xl border border-white/10 p-8 max-w-md mx-auto text-center">
          <div className="inline-flex w-14 h-14 rounded-2xl bg-rose-500/15 border border-rose-500/30 items-center justify-center mb-4"><Lock className="w-7 h-7 text-rose-400" /></div>
          <h2 className="text-white font-bold text-lg mb-1">Acceso SuperAdmin</h2>
          <p className="text-white/50 text-sm mb-5">Introduce el secreto de administrador.</p>
          <form onSubmit={(e) => { e.preventDefault(); if (input.trim()) { setSecret(input.trim()); setAuthed(true); try { localStorage.setItem(SECRET_STORE, input.trim()); } catch {} } }} className="space-y-3">
            <input type="password" value={input} onChange={(e) => setInput(e.target.value)} placeholder="Secreto de admin" className="w-full bg-white/5 border border-white/10 rounded-xl px-3.5 py-2.5 text-sm text-white placeholder:text-white/30 focus:outline-none focus:border-rose-500/40" />
            <button type="submit" className="shine-btn w-full bg-gradient-to-r from-rose-500 to-orange-600 text-white font-bold text-sm px-5 py-3 rounded-xl shadow-lg shadow-rose-500/30">Entrar</button>
          </form>
        </div>
      </AdminShell>
    );
  }

  return (
    <AdminShell title="Miniaturas de YouTube" description="Escribe el tema → IA genera el titular, busca el fondo y monta la miniatura. Edita y descarga en 1280×720." icon={ImageIcon} iconGradient="from-rose-500 to-orange-600" status="beta" breadcrumb={[{ label: "Miniaturas" }]}>
      <div className="grid lg:grid-cols-[360px_1fr] gap-4">
        {/* Panel izquierdo: controles */}
        <div className="space-y-4 min-w-0">
          <div className="glass-card rounded-2xl border border-white/10 p-4">
            <label className="text-white/70 text-xs font-bold uppercase tracking-wider">Tema del video</label>
            <textarea value={topic} onChange={(e) => setTopic(e.target.value)} rows={2} placeholder="Ej. Cómo ganar dinero con IA en 2026" className="w-full mt-2 bg-white/5 border border-white/10 rounded-xl px-3 py-2.5 text-sm text-white placeholder:text-white/30 focus:outline-none focus:border-rose-500/40 resize-y" />
            <button onClick={generate} disabled={loadingText || !topic.trim()} className="w-full mt-2 inline-flex items-center justify-center gap-2 bg-gradient-to-r from-rose-500 to-orange-600 text-white text-sm font-bold px-4 py-2.5 rounded-xl shadow-lg shadow-rose-500/30 disabled:opacity-50">
              {loadingText ? <Loader2 className="w-4 h-4 animate-spin" /> : <Wand2 className="w-4 h-4" />} Generar miniatura
            </button>
            {msg && <p className="text-white/60 text-xs mt-2">{msg}</p>}
            {error && <p className="text-red-400 text-xs mt-2">{error}</p>}
          </div>

          <div className="glass-card rounded-2xl border border-white/10 p-4 space-y-3">
            <div>
              <label className="text-white/70 text-xs font-bold uppercase tracking-wider">Titular</label>
              <input value={headline} onChange={(e) => setHeadline(e.target.value)} placeholder="TITULAR IMPACTANTE" className="w-full mt-1.5 bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-sm text-white placeholder:text-white/30 focus:outline-none focus:border-rose-500/40" />
            </div>
            <div>
              <label className="text-white/70 text-xs font-bold uppercase tracking-wider">Subtítulo (opcional)</label>
              <input value={subtitle} onChange={(e) => setSubtitle(e.target.value)} placeholder="texto pequeño de acento" className="w-full mt-1.5 bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-sm text-white placeholder:text-white/30 focus:outline-none focus:border-rose-500/40" />
            </div>
            <label className="inline-flex items-center gap-1.5 text-white/60 text-xs"><input type="checkbox" checked={uppercase} onChange={(e) => setUppercase(e.target.checked)} /> MAYÚSCULAS</label>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="block text-white/45 text-[10px] font-bold uppercase tracking-wider mb-1">Posición</label>
                <select value={pos} onChange={(e) => setPos(e.target.value as Pos)} className="w-full bg-white/5 border border-white/10 rounded-lg px-2 py-1.5 text-xs text-white">
                  <option value="top" className="bg-[#0f1219]">Arriba</option>
                  <option value="center" className="bg-[#0f1219]">Centro</option>
                  <option value="bottom" className="bg-[#0f1219]">Abajo</option>
                </select>
              </div>
              <div>
                <label className="block text-white/45 text-[10px] font-bold uppercase tracking-wider mb-1">Alineación</label>
                <select value={align} onChange={(e) => setAlign(e.target.value as Align)} className="w-full bg-white/5 border border-white/10 rounded-lg px-2 py-1.5 text-xs text-white">
                  <option value="left" className="bg-[#0f1219]">Izquierda</option>
                  <option value="center" className="bg-[#0f1219]">Centrado</option>
                </select>
              </div>
            </div>
            <div>
              <label className="block text-white/45 text-[10px] font-bold uppercase tracking-wider mb-1">Tamaño del texto</label>
              <input type="range" min={0.6} max={1.8} step={0.05} value={scale} onChange={(e) => setScale(Number(e.target.value))} className="w-full accent-rose-500" />
            </div>
            <div>
              <label className="block text-white/45 text-[10px] font-bold uppercase tracking-wider mb-1">Mover texto</label>
              <div className="grid grid-cols-3 gap-1 w-32">
                <span />
                <button onClick={() => nudge(0, -30)} className="py-1.5 rounded-lg bg-white/5 border border-white/10 text-white/70 hover:bg-white/10 text-sm">↑</button>
                <span />
                <button onClick={() => nudge(-30, 0)} className="py-1.5 rounded-lg bg-white/5 border border-white/10 text-white/70 hover:bg-white/10 text-sm">←</button>
                <button onClick={() => { setOffset({ x: 0, y: 0 }); }} title="Centrar" className="py-1.5 rounded-lg bg-rose-500/20 border border-rose-500/30 text-rose-200 hover:bg-rose-500/30 text-xs font-bold">◎</button>
                <button onClick={() => nudge(30, 0)} className="py-1.5 rounded-lg bg-white/5 border border-white/10 text-white/70 hover:bg-white/10 text-sm">→</button>
                <span />
                <button onClick={() => nudge(0, 30)} className="py-1.5 rounded-lg bg-white/5 border border-white/10 text-white/70 hover:bg-white/10 text-sm">↓</button>
                <span />
              </div>
            </div>
            <button onClick={() => { setOffset({ x: 0, y: 0 }); setScale(1); }} className="w-full inline-flex items-center justify-center gap-1.5 bg-white/5 border border-white/10 text-white/60 hover:text-white text-[11px] font-bold px-3 py-1.5 rounded-lg">
              <RefreshCw className="w-3 h-3" /> Reiniciar posición y tamaño
            </button>
            <p className="text-white/30 text-[10px]">💡 O arrastra el texto directamente sobre la miniatura con el ratón.</p>
          </div>

          <div className="glass-card rounded-2xl border border-white/10 p-4">
            <label className="text-white/70 text-xs font-bold uppercase tracking-wider">Estilo</label>
            <div className="flex flex-wrap gap-1.5 mt-2">
              {PRESETS.map((p, i) => (
                <button key={p.name} onClick={() => setPresetIdx(i)} className={`px-2.5 py-1 rounded-lg text-[11px] font-bold border transition-colors ${presetIdx === i ? "bg-rose-500/25 text-rose-100 border-rose-500/40" : "bg-white/5 text-white/50 border-white/10 hover:text-white/80"}`}>
                  {p.name}
                </button>
              ))}
            </div>
          </div>

          <div className="glass-card rounded-2xl border border-white/10 p-4">
            <div className="flex items-center justify-between mb-2">
              <label className="text-white/70 text-xs font-bold uppercase tracking-wider">Fondo</label>
              <div className="flex gap-2">
                {keywords[0] && (
                  <button onClick={() => fetchBackgrounds(keywords[Math.floor(Math.random() * keywords.length)])} disabled={loadingBg} className="inline-flex items-center gap-1 text-[11px] text-white/60 hover:text-white disabled:opacity-50"><RefreshCw className={`w-3 h-3 ${loadingBg ? "animate-spin" : ""}`} /> Otros</button>
                )}
                <label className="inline-flex items-center gap-1 text-[11px] text-white/60 hover:text-white cursor-pointer">
                  <Upload className="w-3 h-3" /> Subir
                  <input type="file" accept="image/*" className="hidden" onChange={(e) => onUpload(e.target.files?.[0] ?? null)} />
                </label>
              </div>
            </div>
            <div className="grid grid-cols-3 gap-1.5 max-h-52 overflow-y-auto scrollbar-hide">
              {backgrounds.map((b) => (
                <button key={b.id} onClick={() => selectBg(b.url)} className={`relative rounded-lg overflow-hidden border-2 aspect-video ${bgUrl === b.url ? "border-rose-500" : "border-transparent hover:border-white/20"}`}>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={b.thumb} alt="" className="w-full h-full object-cover" />
                </button>
              ))}
              {backgrounds.length === 0 && <p className="col-span-3 text-white/30 text-xs py-6 text-center">Genera o sube un fondo.</p>}
            </div>
          </div>
        </div>

        {/* Panel derecho: preview + descarga */}
        <div className="space-y-3 min-w-0">
          <div className="glass-card rounded-2xl border border-white/10 p-3">
            <div className="relative rounded-xl overflow-hidden bg-black">
              <canvas ref={canvasRef} width={W} height={H} onPointerDown={onPointerDown} onPointerMove={onPointerMove} onPointerUp={onPointerUp} className="w-full h-auto block cursor-move touch-none" />
              {loadingBg && <div className="absolute inset-0 flex items-center justify-center bg-black/40"><Loader2 className="w-8 h-8 text-white animate-spin" /></div>}
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button onClick={download} className="inline-flex items-center gap-2 bg-gradient-to-r from-emerald-500 to-teal-600 text-white text-sm font-bold px-5 py-2.5 rounded-xl shadow-lg shadow-emerald-500/30">
              <Download className="w-4 h-4" /> Descargar PNG (1280×720)
            </button>
            <span className="inline-flex items-center gap-1.5 text-white/40 text-xs"><Sparkles className="w-3.5 h-3.5" /> Formato exacto de miniatura de YouTube</span>
          </div>
        </div>
      </div>
    </AdminShell>
  );
}
