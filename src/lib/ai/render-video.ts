import { FFmpeg } from "@ffmpeg/ffmpeg";
import { toBlobURL } from "@ffmpeg/util";

/**
 * Render client-side (ffmpeg.wasm) del montaje a MP4.
 * Single-thread core → no requiere cross-origin isolation.
 * Soporta: efectos/looks, recorte, narración (TTS o voz propia), música de fondo
 * y subtítulos quemados (overlay de PNG generado con canvas).
 */
export interface RenderScene {
  seconds: number;
  media?: { type: "video" | "photo"; url: string };
  effect?: string;
  startSec?: number;
  narration?: string;
}
type Progress = (msg: string, pct: number) => void;
interface RenderOpts {
  ttsLang?: string;
  customAudio?: Uint8Array; customAudioExt?: string;
  music?: Uint8Array; musicExt?: string; musicVol?: number;
  subtitles?: boolean;
}

const DIMS: Record<string, [number, number]> = { "16:9": [1280, 720], "9:16": [720, 1280], "1:1": [720, 720] };

function effectFilter(effect?: string): string {
  switch (effect) {
    case "bw": return ",hue=s=0";
    case "blur": return ",boxblur=2:1";
    case "bright": return ",eq=brightness=0.12:saturation=1.25";
    case "warm": return ",colorbalance=rm=0.15:bm=-0.15";
    case "cold": return ",colorbalance=rm=-0.15:bm=0.15";
    case "vintage": return ",curves=preset=vintage";
    case "vivid": return ",eq=saturation=1.5:contrast=1.1";
    default: return "";
  }
}

/** Genera un PNG (W×H, transparente) con el subtítulo abajo. Usa canvas del navegador. */
function captionPng(text: string, W: number, H: number): Uint8Array {
  const c = document.createElement("canvas");
  c.width = W; c.height = H;
  const ctx = c.getContext("2d");
  if (!ctx) return new Uint8Array();
  const fontSize = Math.max(20, Math.round(H / 22));
  ctx.font = `bold ${fontSize}px Arial, sans-serif`;
  ctx.textAlign = "center";
  ctx.textBaseline = "alphabetic";
  // wrap
  const maxW = W * 0.86;
  const words = text.trim().split(/\s+/);
  const lines: string[] = [];
  let cur = "";
  for (const w of words) {
    const t = cur ? `${cur} ${w}` : w;
    if (ctx.measureText(t).width > maxW && cur) { lines.push(cur); cur = w; } else cur = t;
  }
  if (cur) lines.push(cur);
  const lh = Math.round(fontSize * 1.3);
  const bottomPad = Math.round(H * 0.06);
  const startY = H - bottomPad - (lines.length - 1) * lh;
  // caja semitransparente
  const boxTop = startY - fontSize - 10;
  ctx.fillStyle = "rgba(0,0,0,0.45)";
  ctx.fillRect(0, boxTop, W, H - boxTop);
  // texto con sombra
  ctx.fillStyle = "#ffffff";
  ctx.shadowColor = "rgba(0,0,0,0.85)";
  ctx.shadowBlur = 4;
  lines.forEach((ln, i) => ctx.fillText(ln, W / 2, startY + i * lh));
  const b64 = c.toDataURL("image/png").split(",")[1] || "";
  const bin = atob(b64);
  const arr = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) arr[i] = bin.charCodeAt(i);
  return arr;
}

let ffPromise: Promise<FFmpeg> | null = null;
async function getFF(): Promise<FFmpeg> {
  if (!ffPromise) {
    ffPromise = (async () => {
      const f = new FFmpeg();
      const base = "https://unpkg.com/@ffmpeg/core@0.12.6/dist/umd";
      await f.load({
        coreURL: await toBlobURL(`${base}/ffmpeg-core.js`, "text/javascript"),
        wasmURL: await toBlobURL(`${base}/ffmpeg-core.wasm`, "application/wasm"),
      });
      return f;
    })();
  }
  return ffPromise;
}

async function loadBytes(mediaUrl: string, secret: string): Promise<Uint8Array> {
  if (mediaUrl.startsWith("data:")) {
    const r = await fetch(mediaUrl);
    return new Uint8Array(await r.arrayBuffer());
  }
  const r = await fetch(`/api/admin/stock/proxy?url=${encodeURIComponent(mediaUrl)}`, { headers: { "x-admin-secret": secret } });
  if (!r.ok) throw new Error(`No se pudo descargar el clip (${r.status})`);
  return new Uint8Array(await r.arrayBuffer());
}

async function ttsBytes(text: string, lang: string, secret: string): Promise<Uint8Array | null> {
  try {
    const r = await fetch("/api/admin/editor/tts", { method: "POST", headers: { "Content-Type": "application/json", "x-admin-secret": secret }, body: JSON.stringify({ text, lang }) });
    if (!r.ok) return null;
    return new Uint8Array(await r.arrayBuffer());
  } catch { return null; }
}

const VOL = (v?: number) => (typeof v === "number" && v >= 0 && v <= 1 ? v : 0.22);

export async function renderVideo(scenes: RenderScene[], aspect: string, secret: string, onProgress: Progress, opts: RenderOpts = {}): Promise<Blob> {
  const [W, H] = DIMS[aspect] ?? DIMS["16:9"];
  onProgress("Cargando motor de render…", 3);
  const f = await getFF();

  const baseVf = `scale=${W}:${H}:force_original_aspect_ratio=increase,crop=${W}:${H},setsar=1,format=yuv420p`;
  const usable = scenes.filter((s) => s.media?.url);
  if (usable.length === 0) throw new Error("No hay escenas con clip para renderizar.");

  const segs: string[] = [];
  for (let i = 0; i < usable.length; i++) {
    const s = usable[i];
    const sec = Math.min(Math.max(Math.round(s.seconds) || 4, 2), 60);
    onProgress(`Procesando escena ${i + 1}/${usable.length}…`, 5 + Math.round((i / usable.length) * 75));
    const bytes = await loadBytes(s.media!.url, secret);
    const seg = `seg${i}.mp4`;
    const fullVf = baseVf + effectFilter(s.effect);
    if (s.media!.type === "photo") {
      const fn = `img${i}.jpg`;
      await f.writeFile(fn, bytes);
      await f.exec(["-loop", "1", "-t", String(sec), "-i", fn, "-vf", fullVf, "-r", "25", "-c:v", "libx264", "-preset", "ultrafast", "-pix_fmt", "yuv420p", seg]);
      try { await f.deleteFile(fn); } catch { /* noop */ }
    } else {
      const fn = `in${i}.mp4`;
      await f.writeFile(fn, bytes);
      const start = Math.max(0, Math.round(s.startSec || 0));
      const pre = start > 0 ? ["-ss", String(start)] : [];
      await f.exec(["-stream_loop", "-1", ...pre, "-i", fn, "-t", String(sec), "-an", "-vf", fullVf, "-r", "25", "-c:v", "libx264", "-preset", "ultrafast", "-pix_fmt", "yuv420p", seg]);
      try { await f.deleteFile(fn); } catch { /* noop */ }
    }

    // Subtítulos quemados (overlay de PNG, best-effort)
    let finalSeg = seg;
    if (opts.subtitles && (s.narration || "").trim()) {
      try {
        const png = captionPng(s.narration!.trim(), W, H);
        if (png.length > 0) {
          const cap = `cap${i}.png`;
          const segc = `segc${i}.mp4`;
          await f.writeFile(cap, png);
          await f.exec(["-i", seg, "-i", cap, "-filter_complex", "[0:v][1:v]overlay=0:0", "-r", "25", "-c:v", "libx264", "-preset", "ultrafast", "-pix_fmt", "yuv420p", segc]);
          try { await f.deleteFile(cap); } catch { /* noop */ }
          try { await f.deleteFile(seg); } catch { /* noop */ }
          finalSeg = segc;
        }
      } catch { finalSeg = seg; }
    }
    segs.push(finalSeg);
  }

  onProgress("Uniendo escenas…", 84);
  await f.writeFile("list.txt", new TextEncoder().encode(segs.map((s) => `file ${s}`).join("\n")));
  await f.exec(["-f", "concat", "-safe", "0", "-i", "list.txt", "-c", "copy", "out.mp4"]);

  // ── Audio: voz (propia o TTS) + música de fondo ──
  let finalFile = "out.mp4";
  const aSegs: string[] = [];
  let voiceFile: string | null = null;

  try {
    if (opts.customAudio && opts.customAudio.length > 100) {
      voiceFile = `voice.${opts.customAudioExt || "mp3"}`;
      await f.writeFile(voiceFile, opts.customAudio);
    } else if (opts.ttsLang && usable.some((s) => (s.narration || "").trim())) {
      onProgress("Generando narración…", 88);
      for (let i = 0; i < usable.length; i++) {
        const s = usable[i];
        const sec = Math.min(Math.max(Math.round(s.seconds) || 4, 2), 60);
        const aseg = `a${i}.m4a`;
        const narration = (s.narration || "").trim();
        let made = false;
        if (narration) {
          const mp3 = await ttsBytes(narration, opts.ttsLang, secret);
          if (mp3 && mp3.length > 200) {
            await f.writeFile(`n${i}.mp3`, mp3);
            await f.exec(["-i", `n${i}.mp3`, "-af", "apad", "-t", String(sec), "-ar", "44100", "-ac", "2", "-c:a", "aac", aseg]);
            try { await f.deleteFile(`n${i}.mp3`); } catch { /* noop */ }
            made = true;
          }
        }
        if (!made) await f.exec(["-f", "lavfi", "-i", "anullsrc=channel_layout=stereo:sample_rate=44100", "-t", String(sec), "-c:a", "aac", aseg]);
        aSegs.push(aseg);
      }
      await f.writeFile("alist.txt", new TextEncoder().encode(aSegs.map((a) => `file ${a}`).join("\n")));
      await f.exec(["-f", "concat", "-safe", "0", "-i", "alist.txt", "-c", "copy", "voiceaudio.m4a"]);
      voiceFile = "voiceaudio.m4a";
    }

    let musicFile: string | null = null;
    if (opts.music && opts.music.length > 100) {
      musicFile = `music.${opts.musicExt || "mp3"}`;
      await f.writeFile(musicFile, opts.music);
    }

    if (voiceFile || musicFile) {
      onProgress("Montando audio…", 95);
      if (voiceFile && musicFile) {
        await f.exec(["-i", "out.mp4", "-i", voiceFile, "-stream_loop", "-1", "-i", musicFile,
          "-filter_complex", `[2:a]volume=${VOL(opts.musicVol)}[m];[1:a][m]amix=inputs=2:duration=first:dropout_transition=2[a]`,
          "-map", "0:v:0", "-map", "[a]", "-c:v", "copy", "-c:a", "aac", "-shortest", "final.mp4"]);
      } else if (voiceFile) {
        await f.exec(["-i", "out.mp4", "-i", voiceFile, "-map", "0:v:0", "-map", "1:a:0", "-c:v", "copy", "-c:a", "aac", "-shortest", "final.mp4"]);
      } else if (musicFile) {
        await f.exec(["-i", "out.mp4", "-stream_loop", "-1", "-i", musicFile, "-map", "0:v:0", "-map", "1:a:0", "-c:v", "copy", "-c:a", "aac", "-shortest", "final.mp4"]);
      }
      finalFile = "final.mp4";
    }
  } catch { finalFile = "out.mp4"; }

  const data = (await f.readFile(finalFile)) as Uint8Array;
  onProgress("¡Listo!", 100);

  for (const s of segs) { try { await f.deleteFile(s); } catch { /* noop */ } }
  for (const a of aSegs) { try { await f.deleteFile(a); } catch { /* noop */ } }
  for (const fn of ["list.txt", "alist.txt", "voiceaudio.m4a", "out.mp4", "final.mp4", voiceFile || ""]) { if (fn) try { await f.deleteFile(fn); } catch { /* noop */ } }

  return new Blob([data as unknown as BlobPart], { type: "video/mp4" });
}
