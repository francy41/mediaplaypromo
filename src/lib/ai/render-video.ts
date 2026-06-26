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
}
type Progress = (msg: string, pct: number) => void;

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

async function fetchBytes(proxyUrl: string, secret: string): Promise<Uint8Array> {
  const r = await fetch(proxyUrl, { headers: { "x-admin-secret": secret } });
  if (!r.ok) throw new Error(`No se pudo descargar el clip (${r.status})`);
  return new Uint8Array(await r.arrayBuffer());
}

export async function renderVideo(scenes: RenderScene[], aspect: string, secret: string, onProgress: Progress): Promise<Blob> {
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
    const proxy = `/api/admin/stock/proxy?url=${encodeURIComponent(s.media!.url)}`;
    const bytes = await fetchBytes(proxy, secret);
    const seg = `seg${i}.mp4`;
    if (s.media!.type === "photo") {
      const fn = `img${i}.jpg`;
      await f.writeFile(fn, bytes);
      await f.exec(["-loop", "1", "-t", String(sec), "-i", fn, "-vf", vf, "-r", "25", "-c:v", "libx264", "-preset", "ultrafast", "-pix_fmt", "yuv420p", seg]);
      try { await f.deleteFile(fn); } catch { /* noop */ }
    } else {
      const fn = `in${i}.mp4`;
      await f.writeFile(fn, bytes);
      await f.exec(["-t", String(sec), "-i", fn, "-an", "-vf", vf, "-r", "25", "-c:v", "libx264", "-preset", "ultrafast", "-pix_fmt", "yuv420p", seg]);
      try { await f.deleteFile(fn); } catch { /* noop */ }
    }
    segs.push(seg);
  }

  onProgress("Uniendo escenas…", 90);
  await f.writeFile("list.txt", new TextEncoder().encode(segs.map((s) => `file ${s}`).join("\n")));
  await f.exec(["-f", "concat", "-safe", "0", "-i", "list.txt", "-c", "copy", "out.mp4"]);

  const data = (await f.readFile("out.mp4")) as Uint8Array;
  onProgress("¡Listo!", 100);

  // limpieza
  for (const s of segs) { try { await f.deleteFile(s); } catch { /* noop */ } }
  try { await f.deleteFile("list.txt"); } catch { /* noop */ }
  try { await f.deleteFile("out.mp4"); } catch { /* noop */ }

  return new Blob([data as unknown as BlobPart], { type: "video/mp4" });
}
