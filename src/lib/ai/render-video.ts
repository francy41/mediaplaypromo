import { FFmpeg } from "@ffmpeg/ffmpeg";
import { toBlobURL } from "@ffmpeg/util";

/**
 * Render client-side (ffmpeg.wasm) del montaje visual a MP4.
 * Single-thread core → no requiere cross-origin isolation (COOP/COEP).
 * v1: montaje visual (clips + imágenes), sin audio embebido.
 */
export interface RenderScene {
  seconds: number;
  media?: { type: "video" | "photo"; url: string };
  effect?: string;     // none | bw | blur | bright | zoom
  startSec?: number;   // recorte: segundo de inicio (solo video)
  narration?: string;  // texto para la voz (TTS)
}
type Progress = (msg: string, pct: number) => void;
interface RenderOpts { ttsLang?: string } // "es" | "en" → genera narración con voz

function effectFilter(effect?: string): string {
  switch (effect) {
    case "bw": return ",hue=s=0";
    case "blur": return ",boxblur=2:1";
    case "bright": return ",eq=brightness=0.12:saturation=1.25";
    default: return ""; // none / zoom → sin filtro extra en render
  }
}

const DIMS: Record<string, [number, number]> = {
  "16:9": [1280, 720],
  "9:16": [720, 1280],
  "1:1": [720, 720],
};

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
  // Imágenes IA vienen como data URL → fetch directo (sin proxy).
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

export async function renderVideo(scenes: RenderScene[], aspect: string, secret: string, onProgress: Progress, opts: RenderOpts = {}): Promise<Blob> {
  const [W, H] = DIMS[aspect] ?? DIMS["16:9"];
  onProgress("Cargando motor de render…", 3);
  const f = await getFF();

  const vf = `scale=${W}:${H}:force_original_aspect_ratio=increase,crop=${W}:${H},setsar=1,format=yuv420p`;
  const usable = scenes.filter((s) => s.media?.url);
  if (usable.length === 0) throw new Error("No hay escenas con clip para renderizar.");

  const segs: string[] = [];
  for (let i = 0; i < usable.length; i++) {
    const s = usable[i];
    const sec = Math.min(Math.max(Math.round(s.seconds) || 4, 2), 12);
    onProgress(`Procesando escena ${i + 1}/${usable.length}…`, 5 + Math.round((i / usable.length) * 80));
    const bytes = await loadBytes(s.media!.url, secret);
    const seg = `seg${i}.mp4`;
    const fullVf = vf + effectFilter(s.effect);
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
      // -stream_loop -1 + -t sec (salida): el clip se repite para llenar la duración exacta → sin freezes ni huecos.
      await f.exec(["-stream_loop", "-1", ...pre, "-i", fn, "-t", String(sec), "-an", "-vf", fullVf, "-r", "25", "-c:v", "libx264", "-preset", "ultrafast", "-pix_fmt", "yuv420p", seg]);
      try { await f.deleteFile(fn); } catch { /* noop */ }
    }
    segs.push(seg);
  }

  onProgress("Uniendo escenas…", 90);
  await f.writeFile("list.txt", new TextEncoder().encode(segs.map((s) => `file ${s}`).join("\n")));
  await f.exec(["-f", "concat", "-safe", "0", "-i", "list.txt", "-c", "copy", "out.mp4"]);

  // ── Audio: narración con voz (Google TTS gratis), best-effort ──
  let finalFile = "out.mp4";
  const aSegs: string[] = [];
  if (opts.ttsLang && usable.some((s) => (s.narration || "").trim())) {
    try {
      onProgress("Generando narración…", 92);
      for (let i = 0; i < usable.length; i++) {
        const s = usable[i];
        const sec = Math.min(Math.max(Math.round(s.seconds) || 4, 2), 12);
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
        if (!made) {
          await f.exec(["-f", "lavfi", "-i", "anullsrc=channel_layout=stereo:sample_rate=44100", "-t", String(sec), "-c:a", "aac", aseg]);
        }
        aSegs.push(aseg);
      }
      onProgress("Montando audio…", 97);
      await f.writeFile("alist.txt", new TextEncoder().encode(aSegs.map((a) => `file ${a}`).join("\n")));
      await f.exec(["-f", "concat", "-safe", "0", "-i", "alist.txt", "-c", "copy", "audio.m4a"]);
      await f.exec(["-i", "out.mp4", "-i", "audio.m4a", "-c:v", "copy", "-c:a", "aac", "-shortest", "final.mp4"]);
      finalFile = "final.mp4";
    } catch { finalFile = "out.mp4"; }
  }

  const data = (await f.readFile(finalFile)) as Uint8Array;
  onProgress("¡Listo!", 100);

  // limpieza
  for (const s of segs) { try { await f.deleteFile(s); } catch { /* noop */ } }
  for (const a of aSegs) { try { await f.deleteFile(a); } catch { /* noop */ } }
  for (const fn of ["list.txt", "alist.txt", "audio.m4a", "out.mp4", "final.mp4"]) { try { await f.deleteFile(fn); } catch { /* noop */ } }

  return new Blob([data as unknown as BlobPart], { type: "video/mp4" });
}
