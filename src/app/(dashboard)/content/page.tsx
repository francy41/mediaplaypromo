"use client";
import { useCallback, useEffect, useState, Fragment } from "react";
import Link from "next/link";
import { CalendarClock, Lock, Plus, Trash2, RefreshCw, Send, Film, Wand2, UploadCloud, Loader2, Repeat2, RotateCcw, Sparkles, Building2, Plug, Crown, Check, KeyRound, Save, LogOut } from "lucide-react";
import { AdminShell, KPIGrid } from "@/components/admin/AdminShell";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";
import { generateCaptionTemplate, composeCaption } from "@/lib/caption-generator";

const SALES_LINK = "https://yfsportshop.com/";
// Contacto para activar la Marca Blanca del Planificador (cliente). Cambiable.
const WHITELABEL_CONTACT = "mailto:ventas@mediaplaypromo.com?subject=Quiero%20la%20Marca%20Blanca%20de%20MediaPlayPromo%20(100%E2%82%AC%2Fmes)";

const CAPTION_TEMPLATES = [
  {
    label: "🎬 Reels / TikTok",
    text: `👟🔥 Zapatillas y ropa de marca 100% originales en YF Sport Shop\n\nLo último de Nike, Adidas y Jordan al mejor precio 💸\n\n✅ Originales garantizados\n✅ Envíos a todo el país 📦\n✅ Nuevos modelos cada semana\n✅ Pago seguro y fácil\n\n💰 ¿Quieres ganar dinero? Hazte afiliado y cobra comisión por cada venta que traigas 🤝\n\n🛒 Compra o únete como afiliado 👇\n${SALES_LINK}\n\n#zapatillas #sneakers #Nike #Adidas #Jordan #ropadedemarca #streetwear #moda #ofertas #afiliados #ganardinero #emprende`,
  },
  {
    label: "📸 Instagram",
    text: `El drip correcto lo cambia todo. 👟🔥\n\nEn YF Sport Shop tienes Nike, Adidas y Jordan originales, nuevos modelos cada semana y envíos a todo el país 📦\n\n✅ 100% originales\n✅ Mejor precio\n✅ Pago seguro\n\nY si te encanta la moda… conviértela en ingresos 💰 Únete a nuestro programa de afiliados y gana comisión revendiendo lo que ya amas.\n\n🛒 Compra o hazte afiliado 👇\n${SALES_LINK}\n\n#sneakers #ropadedemarca #Nike #Adidas #Jordan #outfit #streetwear #moda #afiliados #negocio #emprendimiento #reseller`,
  },
  {
    label: "▶️ YouTube",
    text: `👟 YF Sport Shop — Zapatillas y ropa de marca originales al mejor precio\n\nEncuentra Nike, Adidas, Jordan y las últimas tendencias con envíos a todo el país y pago 100% seguro.\n\n✅ Productos originales garantizados\n✅ Nuevos modelos cada semana\n✅ Envíos rápidos\n\n💼 PROGRAMA DE AFILIADOS: gana comisión por cada venta que refieras. Ideal si tienes redes, comunidad o simplemente quieres emprender. Únete gratis.\n\n🛒 Comprar / Hacerme afiliado:\n${SALES_LINK}\n\n#zapatillas #sneakers #Nike #Adidas #Jordan #moda #afiliados #emprender #negociodigital`,
  },
  {
    label: "⏰ Urgencia / CTA",
    text: `⏰ Se agotan rápido… ¿te vas a quedar sin tu talla? 👟\n\nYF Sport Shop — Nike, Adidas y Jordan originales al mejor precio. Nuevos modelos cada semana.\n\n🔥 Oferta por tiempo limitado\n✅ Originales garantizados\n✅ Envíos a todo el país\n\n💰 Gana dinero con nosotros: hazte afiliado y cobra comisión por cada venta.\n\n👉 Compra ya o únete como afiliado:\n${SALES_LINK}\n\n#ofertas #zapatillas #sneakers #Nike #Adidas #Jordan #afiliados #ganardinero #emprende`,
  },
];

interface Post {
  id: string;
  title: string | null;
  video_url: string;
  caption: string | null;
  platforms: string[] | null;
  scheduled_at: string | null;
  status: string;
  error: string | null;
  created_at: string | null;
}

const SECRET_STORE = "mpp_license_admin_secret";
const PLATFORMS = ["instagram", "facebook", "youtube", "tiktok", "linkedin"];

export default function ContentPlannerPage() {
  const [secret, setSecret] = useState("");
  const [loginUser, setLoginUser] = useState("");
  const [loginPass, setLoginPass] = useState("");
  const [authed, setAuthed] = useState(false);
  const [showAdminLogin, setShowAdminLogin] = useState(false);
  const [role, setRole] = useState<"super" | "admin" | null>(null);
  const [ghlEnabled, setGhlEnabled] = useState(false);
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // formulario de alta
  const [bulk, setBulk] = useState("");
  const [caption, setCaption] = useState(CAPTION_TEMPLATES[0].text);
  const [activeTemplate, setActiveTemplate] = useState(0);

  // generador de caption (plantilla + IA)
  const [brief, setBrief] = useState("");
  const [genLink, setGenLink] = useState(SALES_LINK);
  const [genBusy, setGenBusy] = useState(false);
  const [genMsg, setGenMsg] = useState("");

  // plantillas guardadas por el usuario
  interface SavedTpl { id: string; label: string; text: string }
  const [savedTemplates, setSavedTemplates] = useState<SavedTpl[]>([]);

  // subida de archivos
  const [uploading, setUploading] = useState(false);
  const [upMsg, setUpMsg] = useState("");

  // distribución automática
  const [batchPlatforms, setBatchPlatforms] = useState<string[]>(["instagram", "tiktok", "youtube"]);
  const [batchTime, setBatchTime] = useState("10:00");
  const [batchStart, setBatchStart] = useState("");
  const [loopMode, setLoopMode] = useState(false);
  const [batchEnd, setBatchEnd] = useState("");
  const [freqDays, setFreqDays] = useState(1); // frecuencia: cada N días (1=diario, 7=semanal)

  // programación individual (un video)
  const [schedId, setSchedId] = useState<string | null>(null);
  const [schedDate, setSchedDate] = useState("");
  const [schedTime, setSchedTime] = useState("10:00");

  // proyectos / cuentas GHL (multi-cuenta)
  interface GhlProj { id: string; name: string; locationId: string; hasToken: boolean; isEnv?: boolean }
  const [projects, setProjects] = useState<GhlProj[]>([]);
  const [activeProject, setActiveProject] = useState<string>("");
  const [showAddProject, setShowAddProject] = useState(false);
  const [pName, setPName] = useState(""); const [pLoc, setPLoc] = useState("");
  const [pToken, setPToken] = useState(""); const [pUser, setPUser] = useState("");
  const [pMsg, setPMsg] = useState("");

  const call = useCallback((sec: string, method: string, body?: unknown) =>
    fetch("/api/content", {
      method,
      headers: { "Content-Type": "application/json", "x-admin-secret": sec },
      ...(body ? { body: JSON.stringify(body) } : {}),
    }), []);

  const load = useCallback(async (sec: string) => {
    setLoading(true); setError(null);
    try {
      const r = await call(sec, "GET");
      if (r.status === 401) { setAuthed(false); try { localStorage.removeItem(SECRET_STORE); } catch {} setError("Secreto incorrecto."); return; }
      const d = await r.json();
      setPosts(d.posts ?? []); setGhlEnabled(!!d.ghlEnabled); setRole(d.role ?? null); setSavedTemplates(d.templates ?? []); setSecret(sec); setAuthed(true);
      const projs: GhlProj[] = d.projects ?? [];
      setProjects(projs);
      setActiveProject((cur) => (cur && projs.some((p) => p.id === cur)) ? cur : (projs[0]?.id ?? ""));
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

  const doLogin = async () => {
    if (!loginUser.trim() || !loginPass.trim()) { setError("Escribe usuario y contraseña."); return; }
    setError(null);
    try {
      const r = await fetch("/api/planner-auth", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username: loginUser.trim(), password: loginPass }),
      });
      const d = await r.json();
      if (!d.ok || !d.token) { setError(d.error || "Usuario o contraseña incorrectos."); return; }
      setLoginPass("");
      load(d.token);
    } catch { setError("Error de conexión."); }
  };

  const addVideos = async () => {
    const urls = bulk.split("\n").map((l) => l.trim()).filter(Boolean);
    if (urls.length === 0) return;
    const videos = urls.map((u) => ({ video_url: u, caption: caption || null }));
    await call(secret, "POST", { action: "add", videos });
    setBulk(""); setCaption(CAPTION_TEMPLATES[0].text); setActiveTemplate(0);
    load(secret);
  };

  const onFiles = async (files: FileList | null) => {
    if (!files || files.length === 0) return;
    setUploading(true);
    const supabase = createSupabaseBrowserClient();
    const arr = Array.from(files);
    let done = 0;
    for (let i = 0; i < arr.length; i++) {
      const file = arr[i];
      setUpMsg(`Subiendo ${i + 1}/${arr.length}: ${file.name}`);
      try {
        const sr = await fetch("/api/content/upload-url", {
          method: "POST",
          headers: { "Content-Type": "application/json", "x-admin-secret": secret },
          body: JSON.stringify({ filename: file.name }),
        });
        const sd = await sr.json();
        if (!sr.ok) { setUpMsg(`Error: ${sd.error ?? "subida"}`); continue; }
        const up = await supabase.storage.from("content-videos").uploadToSignedUrl(sd.path, sd.token, file);
        if (up.error) { setUpMsg(`Error subiendo ${file.name}: ${up.error.message}`); continue; }
        await call(secret, "POST", { action: "add", videos: [{ video_url: sd.publicUrl, title: file.name, caption: caption || null }] });
        done++;
      } catch (e) {
        setUpMsg(`Error: ${e instanceof Error ? e.message : ""}`);
      }
    }
    setUpMsg(`✅ ${done} video(s) subidos a la carpeta`);
    setUploading(false);
    load(secret);
  };

  const del = async (id: string) => { await call(secret, "POST", { action: "delete", id }); load(secret); };

  const runBatch = async () => {
    if (loopMode) {
      if (!batchEnd) return alert("Selecciona una fecha de fin para el bucle.");
      if (!confirm(`¿Programar ${queued} video(s) en bucle (${freqLabel}) hasta el ${batchEnd}?`)) return;
      setLoading(true);
      const r = await call(secret, "POST", { action: "batch-loop", platforms: batchPlatforms, time: batchTime, startDate: batchStart || undefined, endDate: batchEnd, intervalDays: freqDays, projectId: activeProject });
      const d = await r.json();
      if (d.ok) alert(`✅ ${d.scheduled} publicaciones programadas en ${d.cycles} ciclo(s)`);
      else alert(`Error: ${d.error}`);
    } else {
      if (!confirm(`¿Programar todos los videos en cola, ${freqLabel}?`)) return;
      setLoading(true);
      await call(secret, "POST", { action: "batch", platforms: batchPlatforms, time: batchTime, startDate: batchStart || undefined, intervalDays: freqDays, projectId: activeProject });
    }
    load(secret);
  };

  const saveTemplate = async () => {
    if (!caption.trim()) { alert("Escribe un caption antes de guardar."); return; }
    const label = prompt("Nombre para esta plantilla (ej. Reels tienda):");
    if (!label || !label.trim()) return;
    const r = await call(secret, "POST", { action: "template-add", label: label.trim(), text: caption });
    const d = await r.json().catch(() => ({}));
    if (d && d.ok === false) { alert(`Error: ${d.error || "no se pudo guardar"}`); return; }
    load(secret);
  };

  const deleteTemplate = async (id: string) => {
    if (!confirm("¿Borrar esta plantilla guardada?")) return;
    await call(secret, "POST", { action: "template-delete", id });
    load(secret);
  };

  // ── Generador de caption ──
  const genPlatform = () => batchPlatforms[0] || undefined;
  const projName = () => projects.find((p) => p.id === activeProject)?.name;

  const genTemplate = () => {
    if (!brief.trim()) { setGenMsg("Escribe un brief (nicho/producto) primero."); return; }
    setGenMsg("");
    const r = generateCaptionTemplate({ brief, brand: projName(), link: genLink, platform: genPlatform() });
    setCaption(composeCaption(r));
    setActiveTemplate(-1);
  };

  const genAI = async () => {
    if (!brief.trim()) { setGenMsg("Escribe un brief (nicho/producto) primero."); return; }
    setGenBusy(true); setGenMsg("Generando con IA…");
    try {
      const r = await call(secret, "POST", { action: "caption-ai", brief, brand: projName(), link: genLink, platform: genPlatform() });
      const d = await r.json().catch(() => ({}));
      if (d.ok && d.caption) {
        setCaption(composeCaption({ caption: d.caption, hashtags: d.hashtags ?? [] }));
        setActiveTemplate(-1);
        setGenMsg("");
      } else {
        setGenMsg(`⚠️ ${d.error || "No se pudo generar"}`);
      }
    } catch { setGenMsg("Error de conexión."); }
    finally { setGenBusy(false); }
  };

  const openSchedule = (id: string) => setSchedId(id);

  const scheduleOne = async (id: string) => {
    if (!schedDate) { alert("Elige una fecha."); return; }
    if (batchPlatforms.length === 0) { alert("Selecciona al menos una red arriba (en 'Programar automático')."); return; }
    const [hh, mm] = (schedTime || "10:00").split(":").map((n) => Number(n));
    const d = new Date(schedDate);
    d.setHours(hh || 10, mm || 0, 0, 0);
    setLoading(true);
    const r = await call(secret, "POST", { action: "schedule", id, scheduled_at: d.toISOString(), platforms: batchPlatforms, projectId: activeProject });
    const dd = await r.json().catch(() => ({}));
    setSchedId(null);
    if (dd && dd.ok === false && dd.error) alert(`Error: ${dd.error}`);
    load(secret);
  };

  const recycle = async () => {
    if (!confirm(`¿Volver a encolar los ${published} videos publicados para repetir el ciclo?`)) return;
    setLoading(true);
    await call(secret, "POST", { action: "recycle" });
    load(secret);
  };

  const clearFailed = async () => {
    if (!confirm("¿Eliminar todas las publicaciones con ERROR?")) return;
    setLoading(true);
    await call(secret, "POST", { action: "clear", scope: "failed" });
    load(secret);
  };

  const [diag, setDiag] = useState<string>("");
  const checkGhl = async () => {
    if (!activeProject) { setDiag("⚠️ Añade y selecciona un proyecto GHL primero."); return; }
    setDiag("Consultando GHL...");
    const r = await call(secret, "POST", { action: "ghl-accounts", projectId: activeProject });
    const d = await r.json();
    if (d.ok && d.accounts?.length) {
      setDiag(`✅ Redes conectadas (${projects.find((p) => p.id === activeProject)?.name ?? "proyecto"}): ${d.accounts.map((a: { platform?: string }) => a.platform || "?").join(", ")}`);
    } else {
      setDiag(`⚠️ ${d.error || "No hay redes conectadas en este proyecto."}`);
    }
  };

  // ── Gestión de proyectos / cuentas GHL ──
  const callProjects = (method: string, body?: unknown) =>
    fetch("/api/social/ghl-projects", { method, headers: { "Content-Type": "application/json", "x-admin-secret": secret }, ...(body ? { body: JSON.stringify(body) } : {}) });
  const addProject = async () => {
    if (!pName.trim() || !pLoc.trim() || !pToken.trim()) { setPMsg("Completa nombre, Location ID y token."); return; }
    setPMsg("Guardando…");
    const r = await callProjects("POST", { action: "add", name: pName, locationId: pLoc, token: pToken, userId: pUser });
    const d = await r.json();
    if (d.ok) { setPMsg("✅ Proyecto conectado"); setPName(""); setPLoc(""); setPToken(""); setPUser(""); setShowAddProject(false); load(secret); }
    else setPMsg(`⚠️ ${d.error || "error"}`);
  };
  const removeProject = async (id: string) => {
    if (!confirm("¿Quitar este proyecto GHL?")) return;
    await callProjects("POST", { action: "remove", id });
    load(secret);
  };
  const verifyProject = async (id: string) => {
    setDiag("Consultando GHL…");
    const r = await callProjects("POST", { action: "verify", id });
    const d = await r.json();
    if (d.ok && d.accounts?.length) setDiag(`✅ ${projects.find((p) => p.id === id)?.name ?? "proyecto"}: ${d.accounts.map((a: { platform?: string }) => a.platform || "?").join(", ")}`);
    else setDiag(`⚠️ ${d.error || "Sin redes conectadas en este proyecto."}`);
  };

  const togglePlat = (p: string) =>
    setBatchPlatforms((cur) => (cur.includes(p) ? cur.filter((x) => x !== p) : [...cur, p]));

  const freqLabel = freqDays === 1 ? "1 por día" : freqDays === 7 ? "1 por semana" : freqDays === 14 ? "1 cada 2 semanas" : freqDays === 30 ? "1 por mes" : `1 cada ${freqDays} días`;
  const queued = posts.filter((p) => p.status === "queued").length;
  const scheduled = posts.filter((p) => p.status === "scheduled").length;
  const published = posts.filter((p) => p.status === "published").length;
  const failed = posts.filter((p) => p.status === "failed").length;

  return (
    <AdminShell
      title="Planificador de Contenido"
      description="Carga videos, ponles horarios y publícalos en tus redes automáticamente."
      icon={CalendarClock}
      iconGradient="from-pink-500 to-violet-600"
      status="live"
      breadcrumb={[{ label: "Planificador" }]}
      actions={authed && (
        <>
          {role === "super" && (
            <Link href="/admin/planner-admins" className="inline-flex items-center gap-1.5 bg-white/5 hover:bg-white/10 border border-white/10 text-white text-xs font-semibold px-3 py-2 rounded-xl transition-colors">
              <KeyRound className="w-3.5 h-3.5 text-pink-400" /> Administradores
            </Link>
          )}
          <button onClick={() => load(secret)} className="inline-flex items-center gap-1.5 bg-white/5 hover:bg-white/10 border border-white/10 text-white text-xs font-semibold px-3 py-2 rounded-xl transition-colors">
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} /> Actualizar
          </button>
          <button onClick={() => { try { localStorage.removeItem(SECRET_STORE); } catch {} setAuthed(false); setPosts([]); setProjects([]); setRole(null); setSecret(""); setShowAdminLogin(true); setError(null); }} className="inline-flex items-center gap-1.5 bg-white/5 hover:bg-red-500/15 border border-white/10 hover:border-red-500/30 text-white/70 hover:text-red-300 text-xs font-semibold px-3 py-2 rounded-xl transition-colors" title="Cerrar esta sesión y entrar con otra cuenta">
            <LogOut className="w-3.5 h-3.5" /> Cambiar cuenta
          </button>
        </>
      )}
    >
      {!authed ? (
        showAdminLogin ? (
          <div className="glass-card rounded-2xl border border-white/10 p-8 max-w-md mx-auto text-center">
            <div className="inline-flex w-14 h-14 rounded-2xl bg-pink-500/15 border border-pink-500/30 items-center justify-center mb-4"><Lock className="w-7 h-7 text-pink-400" /></div>
            <h2 className="text-white font-bold text-lg mb-1">Acceso administrador</h2>
            <p className="text-white/50 text-sm mb-5">Introduce el usuario y la contraseña que te dieron.</p>
            <form onSubmit={(e) => { e.preventDefault(); doLogin(); }} className="space-y-3">
              <input type="text" value={loginUser} onChange={(e) => setLoginUser(e.target.value)} placeholder="Usuario" autoComplete="username" className="w-full bg-white/5 border border-white/10 rounded-xl px-3.5 py-2.5 text-sm text-white placeholder:text-white/30 focus:outline-none focus:border-pink-500/40" />
              <input type="password" value={loginPass} onChange={(e) => setLoginPass(e.target.value)} placeholder="Contraseña" autoComplete="current-password" className="w-full bg-white/5 border border-white/10 rounded-xl px-3.5 py-2.5 text-sm text-white placeholder:text-white/30 focus:outline-none focus:border-pink-500/40" />
              {error && <p className="text-red-400 text-xs">{error}</p>}
              <button type="submit" className="shine-btn w-full bg-gradient-to-r from-pink-500 to-violet-600 text-white font-bold text-sm px-5 py-3 rounded-xl shadow-lg shadow-pink-500/30">Entrar</button>
            </form>
            <button onClick={() => { setShowAdminLogin(false); setError(null); }} className="mt-4 text-white/40 text-xs hover:text-white/70">← Volver</button>
          </div>
        ) : (
          <div className="glass-card rounded-3xl border border-violet-500/25 bg-gradient-to-br from-violet-600/10 via-transparent to-pink-600/10 p-8 sm:p-10 max-w-xl mx-auto text-center">
            <div className="inline-flex w-16 h-16 rounded-2xl bg-gradient-to-br from-pink-500 to-violet-600 items-center justify-center mb-4 shadow-lg shadow-violet-500/30 ring-1 ring-white/15"><Crown className="w-8 h-8 text-white" /></div>
            <span className="inline-block text-[11px] font-bold px-3 py-1 rounded-full bg-violet-500/20 text-violet-200 border border-violet-400/30 mb-3 tracking-wide">MARCA BLANCA · MEDIAPLAYPROMO</span>
            <h2 className="text-white font-black text-2xl sm:text-3xl mb-2 tracking-tight">Planificador de Contenido</h2>
            <p className="text-white/70 text-base sm:text-lg leading-relaxed mb-1">
              Para poder usar el Planificador tienes que tener la <b className="text-white">Marca Blanca de MediaPlayPromo</b>, que son <b className="text-white">100 € al mes</b>.
            </p>
            <p className="text-white/45 text-sm mb-5">Incluye tu sub-cuenta lista para publicar bajo tu propia marca.</p>
            <ul className="text-left max-w-sm mx-auto space-y-2 mb-6">
              {[
                "Publica en Instagram, TikTok, YouTube, Facebook y LinkedIn",
                "Programación automática: 1 por día o en bucle",
                "Sube tus videos y se publican solos",
                "Todo bajo tu propia marca, sin límites",
              ].map((b) => (
                <li key={b} className="flex items-start gap-2 text-white/75 text-sm">
                  <Check className="w-4 h-4 text-emerald-400 flex-shrink-0 mt-0.5" /> {b}
                </li>
              ))}
            </ul>
            <a href={WHITELABEL_CONTACT} className="shine-btn inline-flex items-center justify-center gap-2 w-full sm:w-auto bg-gradient-to-r from-pink-500 to-violet-600 text-white font-bold text-sm px-7 py-3.5 rounded-xl shadow-lg shadow-pink-500/30">
              <Crown className="w-4 h-4" /> Quiero la Marca Blanca · 100€/mes
            </a>
            <p className="text-white/40 text-xs mt-5">¿Ya eres administrador? <button onClick={() => setShowAdminLogin(true)} className="text-violet-300 hover:text-violet-200 font-semibold underline underline-offset-2">Acceso administrador</button></p>
          </div>
        )
      ) : (
        <div className="space-y-4">
          {!ghlEnabled && (
            <div className="rounded-2xl border border-amber-500/30 bg-amber-500/[0.06] p-4 text-sm text-amber-200/90">
              ⚠️ Aún no hay ninguna cuenta GHL conectada. Puedes cargar y programar videos (quedan listos), pero para que <b>publique solo</b> añade un <b>proyecto GHL</b> abajo (nombre + Location ID + Private Integration token). Cada proyecto = una cuenta GHL independiente.
            </div>
          )}

          {/* Cuentas / Proyectos GHL (multi-cuenta) */}
          <div className="glass-card rounded-2xl border border-white/10 p-5">
            <div className="flex items-center justify-between mb-3">
              <h3 className="flex items-center gap-2 text-white font-bold text-sm"><Building2 className="w-4 h-4 text-violet-400" /> Cuentas / Proyectos GHL</h3>
              <button onClick={() => setShowAddProject((v) => !v)} className="inline-flex items-center gap-1.5 bg-white/5 hover:bg-white/10 border border-white/10 text-white/80 text-xs font-semibold px-3 py-1.5 rounded-xl"><Plus className="w-3.5 h-3.5" /> Añadir proyecto</button>
            </div>
            {projects.length > 0 ? (
              <>
                <label className="block text-white/55 text-[10px] font-bold uppercase tracking-wider mb-1.5">Publicar en el proyecto</label>
                <select value={activeProject} onChange={(e) => setActiveProject(e.target.value)} className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-violet-500/40 mb-2">
                  {projects.map((p) => <option key={p.id} value={p.id} className="bg-[#0f1219]">{p.name} · {p.locationId}</option>)}
                </select>
                <div className="space-y-1.5">
                  {projects.map((p) => (
                    <div key={p.id} className="flex items-center gap-2 bg-white/5 border border-white/10 rounded-lg px-3 py-2">
                      <span className="text-white text-xs font-semibold flex-1 truncate">{p.name} {p.isEnv && <span className="text-white/40">(env)</span>}<span className="text-white/40 ml-2 font-mono text-[10px]">{p.locationId}</span></span>
                      <button onClick={() => verifyProject(p.id)} className="text-[10px] font-bold text-cyan-300 hover:text-cyan-200">Verificar</button>
                      {!p.isEnv && <button onClick={() => removeProject(p.id)} className="text-white/50 hover:text-red-300" title="Quitar"><Trash2 className="w-3.5 h-3.5" /></button>}
                    </div>
                  ))}
                </div>
              </>
            ) : (
              <p className="text-white/45 text-xs">No hay cuentas GHL. Añade una para publicar — cada proyecto es una cuenta GHL con su propio token privado.</p>
            )}
            {showAddProject && (
              <div className="mt-3 space-y-2 border-t border-white/10 pt-3">
                <input value={pName} onChange={(e) => setPName(e.target.value)} placeholder="Nombre del proyecto (ej. Cliente A)" className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-white placeholder:text-white/30 focus:outline-none focus:border-violet-500/40" />
                <input value={pLoc} onChange={(e) => setPLoc(e.target.value)} placeholder="Location ID de GHL" className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-white placeholder:text-white/30 focus:outline-none focus:border-violet-500/40 font-mono" />
                <input type="password" value={pToken} onChange={(e) => setPToken(e.target.value)} placeholder="Private Integration token" className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-white placeholder:text-white/30 focus:outline-none focus:border-violet-500/40 font-mono" />
                <input value={pUser} onChange={(e) => setPUser(e.target.value)} placeholder="User ID (opcional)" className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-white placeholder:text-white/30 focus:outline-none focus:border-violet-500/40 font-mono" />
                <div className="flex items-center gap-2 flex-wrap">
                  <button onClick={addProject} className="inline-flex items-center gap-1.5 bg-gradient-to-r from-pink-500 to-violet-600 text-white text-xs font-bold px-4 py-2 rounded-lg"><Plug className="w-3.5 h-3.5" /> Conectar proyecto</button>
                  {pMsg && <span className="text-xs text-white/70">{pMsg}</span>}
                </div>
                <p className="text-white/35 text-[10px]">En GHL: <b>Ajustes → Private Integrations</b> → crea un token con permiso de <b>Social Planner</b>. El <b>Location ID</b> está en Ajustes → Business Info (o en la URL de la sub-cuenta).</p>
              </div>
            )}
          </div>

          <KPIGrid kpis={[
            { label: "En cola", value: queued, gradient: "from-cyan-500 to-blue-600" },
            { label: "Programados", value: scheduled, gradient: "from-pink-500 to-violet-600" },
            { label: "Publicados", value: published, gradient: "from-green-500 to-emerald-600" },
          ]} />

          {/* Diagnóstico y limpieza */}
          <div className="flex flex-wrap items-center gap-2">
            <button onClick={checkGhl} className="inline-flex items-center gap-1.5 bg-white/5 hover:bg-white/10 border border-white/10 text-white/80 text-xs font-semibold px-3 py-2 rounded-xl transition-colors">
              <RefreshCw className="w-3.5 h-3.5 text-cyan-400" /> Verificar redes conectadas
            </button>
            {failed > 0 && (
              <button onClick={clearFailed} className="inline-flex items-center gap-1.5 bg-red-500/10 hover:bg-red-500/20 border border-red-500/30 text-red-300 text-xs font-semibold px-3 py-2 rounded-xl transition-colors">
                <Trash2 className="w-3.5 h-3.5" /> Limpiar {failed} con error
              </button>
            )}
            {diag && <span className="text-xs text-white/70">{diag}</span>}
          </div>

          {/* Cargar videos (la "carpeta") */}
          <div className="glass-card rounded-2xl border border-white/10 p-5">
            <h3 className="flex items-center gap-2 text-white font-bold text-sm mb-3"><Film className="w-4 h-4 text-cyan-400" /> Cargar videos a la carpeta</h3>

            <label
              onDragOver={(e) => e.preventDefault()}
              onDrop={(e) => { e.preventDefault(); onFiles(e.dataTransfer.files); }}
              className={`flex flex-col items-center justify-center gap-2 border-2 border-dashed rounded-xl p-6 cursor-pointer transition-colors ${uploading ? "border-cyan-500/40 bg-cyan-500/5" : "border-white/15 hover:border-cyan-500/40 hover:bg-white/[0.03]"}`}
            >
              <input type="file" accept="video/*" multiple className="hidden" disabled={uploading} onChange={(e) => onFiles(e.target.files)} />
              {uploading ? (
                <><Loader2 className="w-7 h-7 text-cyan-400 animate-spin" /><span className="text-cyan-300 text-sm font-semibold">{upMsg || "Subiendo..."}</span></>
              ) : (
                <><UploadCloud className="w-8 h-8 text-cyan-400" /><span className="text-white font-bold text-sm">Arrastra tus videos aquí o haz clic</span><span className="text-white/40 text-[11px]">MP4, MOV, WebM · hasta 50MB cada uno</span></>
              )}
            </label>
            {!uploading && upMsg && <p className="text-green-400 text-xs mt-2">{upMsg}</p>}

            <div className="my-4 flex items-center gap-3 text-white/30 text-[10px] uppercase tracking-wider">
              <div className="flex-1 h-px bg-white/10" /> o pega URLs <div className="flex-1 h-px bg-white/10" />
            </div>

            <label className="block text-white/55 text-[10px] font-bold uppercase tracking-wider mb-1.5">URLs de video (una por línea)</label>
            <textarea value={bulk} onChange={(e) => setBulk(e.target.value)} rows={3} placeholder={"https://.../video1.mp4\nhttps://.../video2.mp4"} className="w-full bg-white/5 border border-white/10 rounded-xl px-3.5 py-2.5 text-xs font-mono text-white placeholder:text-white/30 focus:outline-none focus:border-cyan-500/40 resize-none" />
            <div className="mt-3">
              <div className="flex items-center justify-between mb-1.5">
                <label className="block text-white/55 text-[10px] font-bold uppercase tracking-wider">Texto / caption (para todos los videos)</label>
                <span className="text-white/30 text-[10px]">{caption.length} chars</span>
              </div>

              {/* Generador de caption (plantilla instantánea + IA) */}
              <div className="mb-2 rounded-xl border border-violet-500/20 bg-violet-500/[0.04] p-3">
                <div className="flex items-center gap-1.5 mb-2">
                  <Wand2 className="w-3.5 h-3.5 text-violet-400" />
                  <span className="text-white/80 text-[11px] font-bold">Generar caption automáticamente</span>
                </div>
                <textarea
                  value={brief}
                  onChange={(e) => setBrief(e.target.value)}
                  rows={2}
                  placeholder="Describe el nicho/producto: ej. zapatillas Nike originales, envíos a todo el país, programa de afiliados"
                  className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-xs text-white placeholder:text-white/30 focus:outline-none focus:border-violet-500/40 resize-none mb-2"
                />
                <input
                  value={genLink}
                  onChange={(e) => setGenLink(e.target.value)}
                  placeholder="Enlace CTA (opcional)"
                  className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-xs text-white placeholder:text-white/30 focus:outline-none focus:border-violet-500/40 font-mono mb-2"
                />
                <div className="flex flex-wrap items-center gap-2">
                  <button type="button" onClick={genTemplate} disabled={genBusy}
                    className="inline-flex items-center gap-1.5 bg-white/10 hover:bg-white/15 border border-white/10 text-white/85 text-[11px] font-bold px-3 py-1.5 rounded-lg disabled:opacity-50">
                    <Sparkles className="w-3.5 h-3.5 text-cyan-300" /> Plantilla
                  </button>
                  <button type="button" onClick={genAI} disabled={genBusy}
                    className="inline-flex items-center gap-1.5 bg-gradient-to-r from-pink-500 to-violet-600 text-white text-[11px] font-bold px-3 py-1.5 rounded-lg disabled:opacity-50">
                    {genBusy ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Wand2 className="w-3.5 h-3.5" />} Con IA
                  </button>
                  {genMsg && <span className="text-[11px] text-white/70">{genMsg}</span>}
                </div>
                <p className="text-white/30 text-[10px] mt-2">💡 <b>Plantilla</b> = instantáneo y gratis. <b>Con IA</b> = caption único (usa NVIDIA de /integrations). El resultado rellena el texto de abajo; puedes editarlo y <b className="text-emerald-300/80">Guardar</b>.</p>
              </div>

              <div className="flex items-center gap-1.5 mb-2 flex-wrap">
                <Sparkles className="w-3 h-3 text-pink-400 flex-shrink-0" />
                {CAPTION_TEMPLATES.map((t, i) => (
                  <button key={i} type="button"
                    onClick={() => { setActiveTemplate(i); setCaption(t.text); }}
                    className={`px-2.5 py-1 rounded-lg text-[10px] font-bold transition-colors ${activeTemplate === i ? "bg-pink-500/25 text-pink-200 border border-pink-500/40" : "bg-white/5 text-white/45 border border-white/10 hover:text-white/80 hover:border-white/20"}`}>
                    {t.label}
                  </button>
                ))}
                {/* Plantillas guardadas por el usuario */}
                {savedTemplates.map((t) => (
                  <span key={t.id} className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-[10px] font-bold bg-violet-500/15 text-violet-200 border border-violet-500/30">
                    <button type="button" onClick={() => { setActiveTemplate(-1); setCaption(t.text); }} className="hover:text-white">{t.label}</button>
                    <button type="button" onClick={() => deleteTemplate(t.id)} title="Borrar plantilla" className="text-violet-300/60 hover:text-red-300 leading-none">×</button>
                  </span>
                ))}
                <button type="button"
                  onClick={() => { setActiveTemplate(-1); setCaption(""); }}
                  className="px-2.5 py-1 rounded-lg text-[10px] font-bold transition-colors bg-white/5 text-white/30 border border-white/10 hover:text-white/60">
                  Limpiar
                </button>
                <button type="button"
                  onClick={saveTemplate}
                  className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-[10px] font-bold transition-colors bg-emerald-500/15 text-emerald-300 border border-emerald-500/30 hover:bg-emerald-500/25">
                  <Save className="w-3 h-3" /> Guardar
                </button>
              </div>
              <textarea
                value={caption}
                onChange={(e) => { setCaption(e.target.value); setActiveTemplate(-1); }}
                rows={8}
                placeholder="Escribe o selecciona un template de marketing arriba..."
                className="w-full bg-white/5 border border-white/10 rounded-xl px-3.5 py-2.5 text-xs text-white placeholder:text-white/30 focus:outline-none focus:border-cyan-500/40 resize-y leading-relaxed"
              />
              <p className="text-white/30 text-[10px] mt-1">💡 Usa las plantillas o escribe tu propio texto y pulsa <b className="text-emerald-300/80">Guardar</b> para reutilizarlo. Tus plantillas guardadas aparecen en morado.</p>
            </div>
            <button onClick={addVideos} className="mt-3 inline-flex items-center gap-1.5 bg-gradient-to-r from-cyan-500 to-blue-600 text-white text-xs font-bold px-4 py-2 rounded-lg shadow shadow-cyan-500/30"><Plus className="w-3.5 h-3.5" /> Añadir a la cola</button>
          </div>

          {/* Distribución automática */}
          <div className="glass-card rounded-2xl border border-violet-500/25 bg-violet-500/[0.03] p-5">
            <div className="flex items-center justify-between mb-3">
              <h3 className="flex items-center gap-2 text-white font-bold text-sm">
                <Wand2 className="w-4 h-4 text-violet-400" /> Programar automático
              </h3>
              {/* Toggle modo bucle */}
              <button
                onClick={() => setLoopMode(!loopMode)}
                className={`flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs font-bold transition-all border ${
                  loopMode
                    ? "bg-violet-500/20 border-violet-400/40 text-violet-300"
                    : "bg-white/5 border-white/10 text-white/50 hover:text-white/80"
                }`}
              >
                <Repeat2 className="w-3.5 h-3.5" />
                Modo bucle {loopMode ? "ON" : "OFF"}
              </button>
            </div>

            {loopMode && (
              <div className="mb-3 rounded-xl border border-violet-500/30 bg-violet-500/[0.06] p-3 text-xs text-violet-200/80">
                <Repeat2 className="w-3.5 h-3.5 inline mr-1.5 text-violet-400" />
                Los <b>{queued} videos en cola</b> se publicarán <b>{freqLabel}</b> hasta la fecha de fin, repitiéndose cíclicamente. El ciclo se reinicia automáticamente cuando termina la lista.
              </div>
            )}

            <div className={`grid gap-3 mb-3 sm:grid-cols-2 ${loopMode ? "lg:grid-cols-4" : "lg:grid-cols-3"}`}>
              <div>
                <label className="block text-white/55 text-[10px] font-bold uppercase tracking-wider mb-1.5">Empezar el</label>
                <input type="date" value={batchStart} onChange={(e) => setBatchStart(e.target.value)} className="w-full bg-white/5 border border-white/10 rounded-xl px-3.5 py-2.5 text-sm text-white focus:outline-none focus:border-violet-500/40" />
              </div>
              {loopMode && (
                <div>
                  <label className="block text-white/55 text-[10px] font-bold uppercase tracking-wider mb-1.5">Repetir hasta</label>
                  <input type="date" value={batchEnd} onChange={(e) => setBatchEnd(e.target.value)} className="w-full bg-white/5 border border-violet-400/30 rounded-xl px-3.5 py-2.5 text-sm text-white focus:outline-none focus:border-violet-500/40" />
                </div>
              )}
              <div>
                <label className="block text-white/55 text-[10px] font-bold uppercase tracking-wider mb-1.5">Frecuencia</label>
                <select value={freqDays} onChange={(e) => setFreqDays(Number(e.target.value))} className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2.5 text-sm text-white focus:outline-none focus:border-violet-500/40">
                  <option value={1} className="bg-[#0f1219]">Cada día</option>
                  <option value={2} className="bg-[#0f1219]">Cada 2 días</option>
                  <option value={3} className="bg-[#0f1219]">Cada 3 días</option>
                  <option value={7} className="bg-[#0f1219]">Cada semana</option>
                  <option value={14} className="bg-[#0f1219]">Cada 2 semanas</option>
                  <option value={30} className="bg-[#0f1219]">Cada mes</option>
                </select>
              </div>
              <div>
                <label className="block text-white/55 text-[10px] font-bold uppercase tracking-wider mb-1.5">Hora</label>
                <input type="time" value={batchTime} onChange={(e) => setBatchTime(e.target.value)} className="w-full bg-white/5 border border-white/10 rounded-xl px-3.5 py-2.5 text-sm text-white focus:outline-none focus:border-violet-500/40" />
              </div>
            </div>

            <label className="block text-white/55 text-[10px] font-bold uppercase tracking-wider mb-1.5">Redes</label>
            <div className="flex flex-wrap gap-2 mb-4">
              {PLATFORMS.map((p) => (
                <button key={p} onClick={() => togglePlat(p)} className={`px-3 py-1.5 rounded-lg text-xs font-semibold capitalize transition-colors ${batchPlatforms.includes(p) ? "bg-violet-500/25 text-violet-200 border border-violet-500/40" : "bg-white/5 text-white/50 border border-white/10"}`}>{p}</button>
              ))}
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <button
                onClick={runBatch}
                disabled={queued === 0 || loading}
                className="shine-btn inline-flex items-center gap-1.5 bg-gradient-to-r from-pink-500 to-violet-600 text-white text-xs font-bold px-4 py-2.5 rounded-lg shadow-lg shadow-violet-500/30 disabled:opacity-50"
              >
                {loopMode ? <Repeat2 className="w-3.5 h-3.5" /> : <Send className="w-3.5 h-3.5" />}
                {loopMode ? `Programar bucle (${freqLabel})` : `Programar los ${queued} en cola (${freqLabel})`}
              </button>

              {published > 0 && (
                <button
                  onClick={recycle}
                  disabled={loading}
                  className="inline-flex items-center gap-1.5 bg-emerald-500/15 hover:bg-emerald-500/25 border border-emerald-500/30 text-emerald-300 text-xs font-bold px-4 py-2.5 rounded-lg transition-colors disabled:opacity-50"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  Reciclar {published} publicadas → cola
                </button>
              )}
            </div>

            {loopMode && (
              <p className="text-white/35 text-[10px] mt-2">
                Tip: cuando los videos se publiquen, usa <b>Reciclar publicadas</b> para volverlos a encolar y repetir el ciclo indefinidamente.
              </p>
            )}
          </div>

          {/* Tabla */}
          <div className="glass-card rounded-2xl border border-white/10 overflow-hidden">
            <div className="overflow-x-auto scrollbar-hide">
              <table className="w-full text-sm min-w-[720px]">
                <thead>
                  <tr className="border-b border-white/8 text-white/45 text-[10px] uppercase tracking-wider">
                    <th className="text-left font-bold px-4 py-3">Video</th>
                    <th className="text-left font-bold px-4 py-3">Estado</th>
                    <th className="text-left font-bold px-4 py-3">Programado</th>
                    <th className="text-left font-bold px-4 py-3">Redes</th>
                    <th className="text-right font-bold px-4 py-3"></th>
                  </tr>
                </thead>
                <tbody>
                  {posts.map((p) => (
                    <Fragment key={p.id}>
                    <tr className="border-b border-white/5 hover:bg-white/[0.02]">
                      <td className="px-4 py-3 max-w-[240px]">
                        <a href={p.video_url} target="_blank" rel="noopener noreferrer" className="text-cyan-300 hover:text-cyan-200 text-xs font-mono truncate block">{p.title || p.video_url}</a>
                        {p.caption && <span className="text-white/40 text-[11px] truncate block">{p.caption}</span>}
                        {p.error && <span className="text-red-400 text-[10px] block">⚠ {p.error}</span>}
                      </td>
                      <td className="px-4 py-3">
                        <span className={`text-[10px] font-black px-2 py-0.5 rounded-full uppercase ${
                          p.status === "published" ? "bg-green-500/15 text-green-400 border border-green-500/30"
                          : p.status === "scheduled" ? "bg-pink-500/15 text-pink-300 border border-pink-500/30"
                          : p.status === "failed" ? "bg-red-500/15 text-red-400 border border-red-500/30"
                          : "bg-cyan-500/15 text-cyan-300 border border-cyan-500/30"}`}>
                          {p.status === "queued" ? "En cola" : p.status === "scheduled" ? "Programado" : p.status === "published" ? "Publicado" : "Error"}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-white/55 text-xs">{p.scheduled_at ? new Date(p.scheduled_at).toLocaleString() : "—"}</td>
                      <td className="px-4 py-3 text-white/50 text-[11px] capitalize">{(p.platforms ?? []).join(", ") || "—"}</td>
                      <td className="px-4 py-3 text-right whitespace-nowrap">
                        {(p.status === "queued" || p.status === "failed") && (
                          <button onClick={() => openSchedule(p.id)} className="inline-flex items-center gap-1 bg-violet-500/15 hover:bg-violet-500/25 border border-violet-500/30 text-violet-300 text-[11px] px-2.5 py-1.5 rounded-lg transition-colors mr-1.5" title="Programar este video">
                            <CalendarClock className="w-3.5 h-3.5" /> Programar
                          </button>
                        )}
                        <button onClick={() => del(p.id)} className="inline-flex items-center gap-1 bg-white/5 hover:bg-red-500/15 border border-white/10 hover:border-red-500/30 text-white/60 hover:text-red-300 text-[11px] px-2.5 py-1.5 rounded-lg transition-colors"><Trash2 className="w-3.5 h-3.5" /></button>
                      </td>
                    </tr>
                    {schedId === p.id && (
                      <tr className="bg-violet-500/[0.05]">
                        <td colSpan={5} className="px-4 py-3">
                          <div className="flex flex-wrap items-end gap-3">
                            <div>
                              <label className="block text-white/55 text-[10px] font-bold uppercase tracking-wider mb-1">Fecha</label>
                              <input type="date" value={schedDate} onChange={(e) => setSchedDate(e.target.value)} className="bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-violet-500/40" />
                            </div>
                            <div>
                              <label className="block text-white/55 text-[10px] font-bold uppercase tracking-wider mb-1">Hora</label>
                              <input type="time" value={schedTime} onChange={(e) => setSchedTime(e.target.value)} className="bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-violet-500/40" />
                            </div>
                            <div className="text-white/45 text-[10px] max-w-[220px]">Se publicará en las redes marcadas arriba: <b className="text-white/70 capitalize">{batchPlatforms.join(", ") || "ninguna"}</b></div>
                            <button onClick={() => scheduleOne(p.id)} disabled={loading} className="shine-btn inline-flex items-center gap-1.5 bg-gradient-to-r from-pink-500 to-violet-600 text-white text-xs font-bold px-4 py-2 rounded-lg shadow shadow-violet-500/30 disabled:opacity-50">
                              <Send className="w-3.5 h-3.5" /> Programar este
                            </button>
                            <button onClick={() => setSchedId(null)} className="text-white/45 hover:text-white/70 text-xs font-semibold px-2 py-2">Cancelar</button>
                          </div>
                        </td>
                      </tr>
                    )}
                    </Fragment>
                  ))}
                  {posts.length === 0 && (
                    <tr><td colSpan={5} className="px-4 py-10 text-center text-white/40 text-sm">Tu carpeta está vacía. Añade URLs de video arriba para empezar.</td></tr>
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
