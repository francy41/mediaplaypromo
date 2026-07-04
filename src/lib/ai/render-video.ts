import { FFmpeg } from "@ffmpeg/ffmpeg";
import { toBlobURL } from "@ffmpeg/util";

/**
 * Render client-side (ffmpeg.wasm) del montaje a MP4.
 * Single-thread core → no requiere cross-origin isolation.
 * Soporta: efectos/looks, Ken Burns, recorte, transiciones (fundido), narración
 * (TTS o voz propia) con SINCRONÍA real texto↔audio, música de fondo y subtítulos quemados.
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
  transitions?: boolean; // fundido entrada/salida entre clips (default: true)
  transitionStyle?: "fade" | "xfade"; // "xfade" = crossfade real (solo videos cortos)
}

const DIMS: Record<string, [number, number]> = { "16:9": [1280, 720], "9:16": [720, 1280], "1:1": [720, 720] };
const FD = 0.3; // duración del fundido (s)

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
function fadeSuffix(dur: number, on: boolean): string {
  if (!on || dur <= 1) return "";
  return `,fade=t=in:st=0:d=${FD},fade=t=out:st=${(dur - FD).toFixed(2)}:d=${FD}`;
}

/** Mide la duración real de un audio (mp3) con la Web Audio API. 0 si falla. */
async function audioDurationOf(bytes: Uint8Array): Promise<number> {
  try {
    const AC = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    if (!AC) return 0;
    const ctx = new AC();
    const ab = bytes.buffer.slice(bytes.byteOffset, bytes.byteOffset + bytes.byteLength) as ArrayBuffer;
    const buf = await ctx.decodeAudioData(ab);
    const d = buf.duration;
    try { await ctx.close(); } catch { /* noop */ }
    return d;
  } catch { return 0; }
}

/** PNG (W×H, transparente) con el subtítulo abajo. Canvas del navegador. */
function captionPng(text: string, W: number, H: number): Uint8Array {
  const c = document.createElement("canvas");
  c.width = W; c.height = H;
  const ctx = c.getContext("2d");
  if (!ctx) return new Uint8Array();
  const fontSize = Math.max(20, Math.round(H / 22));
  ctx.font = `bold ${fontSize}px Arial, sans-serif`;
  ctx.textAlign = "center";
  ctx.textBaseline = "alphabetic";
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
  const boxTop = startY - fontSize - 10;
  ctx.fillStyle = "rgba(0,0,0,0.45)";
  ctx.fillRect(0, boxTop, W, H - boxTop);
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

/** Trocea la narración en líneas cortas (para subtítulos sincronizados). */
function chunkCaption(text: string, maxWords = 9, maxChunks = 8): string[] {
  const words = text.replace(/\s+/g, " ").trim().split(" ").filter(Boolean);
  if (words.length === 0) return [];
  const per = Math.max(maxWords, Math.ceil(words.length / maxChunks));
  const chunks: string[] = [];
  for (let i = 0; i < words.length; i += per) chunks.push(words.slice(i, i + per).join(" "));
  return chunks;
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
    // "mx:<voiceId>" → voz natural MUAPI; si no, código de idioma de Google TTS.
    const payload = lang.startsWith("mx:") ? { text, voice: lang } : { text, lang };
    const r = await fetch("/api/admin/editor/tts", { method: "POST", headers: { "Content-Type": "application/json", "x-admin-secret": secret }, body: JSON.stringify(payload) });
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
  const fadeOn = opts.transitions !== false;
  const ttsMode = !!opts.ttsLang && !opts.customAudio;

  // ── Pre-pass: si hay TTS, genera la voz y MIDE su duración real → cada escena
  //    durará lo mismo que su locución (sincronía texto↔audio↔video perfecta).
  const ttsCache: (Uint8Array | null)[] = [];
  const effDur: number[] = [];
  for (let i = 0; i < usable.length; i++) {
    const s = usable[i];
    let dur = Math.min(Math.max(Math.round(s.seconds) || 4, 2), 60);
    if (ttsMode) {
      const nar = (s.narration || "").trim();
      if (nar) {
        onProgress(`Generando narración ${i + 1}/${usable.length}…`, 4 + Math.round((i / usable.length) * 12));
        const mp3 = await ttsBytes(nar, opts.ttsLang!, secret);
        ttsCache[i] = mp3 && mp3.length > 200 ? mp3 : null;
        if (ttsCache[i]) {
          const d = await audioDurationOf(ttsCache[i]!);
          if (d && isFinite(d) && d > 0.3) dur = Math.min(Math.max(d + 0.4, 1.5), 60);
        }
      } else ttsCache[i] = null;
    }
    effDur[i] = dur;
  }

  // Crossfade real (xfade) solo si: lo piden, no hay audio propio, pocas escenas y video corto
  // (decodifica varios clips a la vez → limitado por memoria del navegador).
  const totalEff = effDur.reduce((a, b) => a + b, 0);
  const minEff = effDur.length ? Math.min(...effDur) : 0;
  const xfadeMode = opts.transitionStyle === "xfade" && !opts.customAudio
    && usable.length >= 2 && usable.length <= 12 && totalEff <= 35 && minEff >= 1.2;
  const XT = 0.5; // duración del crossfade (s)
  const segFade = fadeOn && !xfadeMode; // si hay xfade, él gestiona la transición

  // ── Segmentos de video (duración = effDur, con efecto/Ken Burns/fundidos) ──
  const segs: string[] = [];
  for (let i = 0; i < usable.length; i++) {
    const s = usable[i];
    const dur = effDur[i];
    const t = dur.toFixed(2);
    onProgress(`Procesando escena ${i + 1}/${usable.length}…`, 18 + Math.round((i / usable.length) * 62));
    const bytes = await loadBytes(s.media!.url, secret);
    const seg = `seg${i}.mp4`;
    const fade = fadeSuffix(dur, segFade);

    if (s.media!.type === "photo") {
      const fn = `img${i}.jpg`;
      await f.writeFile(fn, bytes);
      const vf = s.effect === "zoom"
        ? `scale=${W * 2}:${H * 2}:force_original_aspect_ratio=increase,crop=${W * 2}:${H * 2},zoompan=z='min(zoom+0.0012,1.2)':d=${Math.round(dur * 25)}:s=${W}x${H}:fps=25,setsar=1,format=yuv420p${fade}`
        : baseVf + effectFilter(s.effect) + fade;
      await f.exec(["-loop", "1", "-t", t, "-i", fn, "-vf", vf, "-r", "25", "-c:v", "libx264", "-preset", "ultrafast", "-pix_fmt", "yuv420p", seg]);
      try { await f.deleteFile(fn); } catch { /* noop */ }
    } else {
      const fn = `in${i}.mp4`;
      await f.writeFile(fn, bytes);
      const start = Math.max(0, Math.round(s.startSec || 0));
      const pre = start > 0 ? ["-ss", String(start)] : [];
      await f.exec(["-stream_loop", "-1", ...pre, "-i", fn, "-t", t, "-an", "-vf", baseVf + effectFilter(s.effect) + fade, "-r", "25", "-c:v", "libx264", "-preset", "ultrafast", "-pix_fmt", "yuv420p", seg]);
      try { await f.deleteFile(fn); } catch { /* noop */ }
    }

    // Subtítulos quemados: la narración se trocea en líneas cortas y se muestran
    // SINCRONIZADAS a lo largo de la escena (no un muro de texto estático).
    let finalSeg = seg;
    if (opts.subtitles && (s.narration || "").trim()) {
      try {
        const chunks = chunkCaption(s.narration!.trim());
        const inputs: string[] = [];
        let fc = ""; let last = "[0:v]"; let n = 0;
        for (let k = 0; k < chunks.length; k++) {
          const png = captionPng(chunks[k], W, H);
          if (png.length === 0) continue;
          const capf = `cap${i}_${k}.png`;
          await f.writeFile(capf, png);
          inputs.push("-loop", "1", "-i", capf);
          n++;
          const a = ((k * dur) / chunks.length).toFixed(2);
          const b = (((k + 1) * dur) / chunks.length).toFixed(2);
          const out = `[o${k}]`;
          fc += `${last}[${n}:v]overlay=0:0:enable='between(t,${a},${b})'${out};`;
          last = out;
        }
        if (fc) {
          fc = fc.slice(0, -1);
          const segc = `segc${i}.mp4`;
          await f.exec(["-i", seg, ...inputs, "-filter_complex", fc, "-map", last, "-t", t, "-r", "25", "-c:v", "libx264", "-preset", "ultrafast", "-pix_fmt", "yuv420p", segc]);
          for (let k = 0; k < chunks.length; k++) { try { await f.deleteFile(`cap${i}_${k}.png`); } catch { /* noop */ } }
          try { await f.deleteFile(seg); } catch { /* noop */ }
          finalSeg = segc;
        }
      } catch { finalSeg = seg; }
    }
    segs.push(finalSeg);
  }

  onProgress(xfadeMode ? "Aplicando crossfade…" : "Uniendo escenas…", 84);
  if (xfadeMode) {
    const inputs = segs.flatMap((s) => ["-i", s]);
    let fc = ""; let prev = "[0:v]"; let runLen = effDur[0];
    for (let i = 1; i < segs.length; i++) {
      const out = i === segs.length - 1 ? "vout" : `vx${i}`;
      fc += `${prev}[${i}:v]xfade=transition=fade:duration=${XT}:offset=${(runLen - XT).toFixed(3)}[${out}];`;
      prev = `[${out}]`; runLen += effDur[i] - XT;
    }
    await f.exec([...inputs, "-filter_complex", fc.replace(/;$/, ""), "-map", "[vout]", "-r", "25", "-c:v", "libx264", "-preset", "ultrafast", "-pix_fmt", "yuv420p", "out.mp4"]);
  } else {
    await f.writeFile("list.txt", new TextEncoder().encode(segs.map((s) => `file ${s}`).join("\n")));
    await f.exec(["-f", "concat", "-safe", "0", "-i", "list.txt", "-c", "copy", "out.mp4"]);
  }

  // ── Audio: voz (TTS sincronizado o tu MP3) + música de fondo ──
  let finalFile = "out.mp4";
  const aSegs: string[] = [];
  let voiceFile: string | null = null;

  try {
    if (opts.customAudio && opts.customAudio.length > 100) {
      voiceFile = `voice.${opts.customAudioExt || "mp3"}`;
      await f.writeFile(voiceFile, opts.customAudio);
    } else if (ttsMode && ttsCache.some((b) => b)) {
      onProgress("Montando narración…", 90);
      for (let i = 0; i < usable.length; i++) {
        const t = effDur[i].toFixed(2);
        const aseg = `a${i}.m4a`;
        if (ttsCache[i]) {
          await f.writeFile(`n${i}.mp3`, ttsCache[i]!);
          await f.exec(["-i", `n${i}.mp3`, "-af", "apad", "-t", t, "-ar", "44100", "-ac", "2", "-c:a", "aac", aseg]);
          try { await f.deleteFile(`n${i}.mp3`); } catch { /* noop */ }
        } else {
          await f.exec(["-f", "lavfi", "-i", "anullsrc=channel_layout=stereo:sample_rate=44100", "-t", t, "-c:a", "aac", aseg]);
        }
        aSegs.push(aseg);
      }
      if (xfadeMode && aSegs.length >= 2) {
        // El audio se solapa igual que el video (acrossfade) → la sincronía se mantiene.
        const inputs = aSegs.flatMap((a) => ["-i", a]);
        let fc = ""; let prev = "[0:a]";
        for (let i = 1; i < aSegs.length; i++) {
          const out = i === aSegs.length - 1 ? "aout" : `ax${i}`;
          fc += `${prev}[${i}:a]acrossfade=d=${XT}[${out}];`;
          prev = `[${out}]`;
        }
        await f.exec([...inputs, "-filter_complex", fc.replace(/;$/, ""), "-map", "[aout]", "-c:a", "aac", "voiceaudio.m4a"]);
      } else {
        await f.writeFile("alist.txt", new TextEncoder().encode(aSegs.map((a) => `file ${a}`).join("\n")));
        await f.exec(["-f", "concat", "-safe", "0", "-i", "alist.txt", "-c", "copy", "voiceaudio.m4a"]);
      }
      voiceFile = "voiceaudio.m4a";
    }

    let musicFile: string | null = null;
    if (opts.music && opts.music.length > 100) {
      musicFile = `music.${opts.musicExt || "mp3"}`;
      await f.writeFile(musicFile, opts.music);
    }

    if (voiceFile || musicFile) {
      onProgress("Mezclando audio…", 95);
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
