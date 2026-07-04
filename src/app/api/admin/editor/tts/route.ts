import { NextRequest, NextResponse } from "next/server";
import { resolveOwner } from "@/lib/planner-admins";
import { createRawJob, waitForJob } from "@/lib/ai/muapi";

export const runtime = "nodejs";
export const maxDuration = 60;

async function authed(req: NextRequest): Promise<boolean> {
  return !!(await resolveOwner(req.headers.get("x-admin-secret")));
}

/** Parte el texto en trozos ≤200 chars (límite de Google TTS), respetando palabras. */
function chunk(text: string, max = 190): string[] {
  const words = text.replace(/\s+/g, " ").trim().split(" ");
  const out: string[] = [];
  let cur = "";
  for (const w of words) {
    if ((cur + " " + w).trim().length > max) { if (cur) out.push(cur.trim()); cur = w; }
    else cur += " " + w;
  }
  if (cur.trim()) out.push(cur.trim());
  return out.length ? out : [text.slice(0, max)];
}

/**
 * POST /api/admin/editor/tts  Body: { text, lang }
 * Genera narración MP3 gratis vía Google Translate TTS (sin clave). Solo SuperAdmin.
 */
export async function POST(req: NextRequest) {
  if (!(await authed(req))) return new NextResponse("No autorizado", { status: 401 });

  const body = await req.json().catch(() => ({}));
  const text = String(body.text ?? "").trim();
  const ALLOWED_TL = ["es", "es-us", "en", "en-gb", "en-au", "fr", "de", "it", "pt-br"];
  const tl = ALLOWED_TL.includes(String(body.lang)) ? String(body.lang) : "es";
  if (!text) return new NextResponse("text requerido", { status: 400 });

  // ── Voz natural con MUAPI (opt-in): la UI manda voice = "mx:<voice_id>" ──
  const voiceParam = String(body.voice || "").trim();
  if (voiceParam.startsWith("mx:")) {
    const voiceId = voiceParam.slice(3) || "Spanish_SereneWoman";
    const model = String(body.model || "minimax-speech-2.6-turbo");
    try {
      const job = await createRawJob(model, {
        prompt: text, voice_id: voiceId,
        speed: 1, volume: 1, pitch: 0, sample_rate: 24000, bitrate: 128000, format: "mp3", language_boost: "auto",
      });
      if (!job.id) return new NextResponse("MUAPI: sin request_id", { status: 502 });
      const done = await waitForJob(job.id, { timeoutMs: 50000, intervalMs: 2500 });
      if (done.status === "failed") return new NextResponse(`MUAPI TTS: ${done.error || "falló"}`, { status: 502 });
      const url = Array.isArray(done.output) ? done.output[0] : done.output;
      if (!url) return new NextResponse("MUAPI TTS: sin audio", { status: 502 });
      const ar = await fetch(url, { cache: "no-store" });
      if (!ar.ok) return new NextResponse(`MUAPI audio ${ar.status}`, { status: 502 });
      const mp3 = Buffer.from(await ar.arrayBuffer());
      return new NextResponse(new Uint8Array(mp3), { headers: { "Content-Type": "audio/mpeg", "Cache-Control": "no-store", "X-TTS-Engine": "muapi" } });
    } catch (e) {
      return new NextResponse(e instanceof Error ? e.message : "error", { status: 502 });
    }
  }

  // ── Voz gratis: Google Translate TTS (por defecto) ──
  try {
    const parts = chunk(text);
    const buffers: Buffer[] = [];
    for (const part of parts) {
      const url = `https://translate.google.com/translate_tts?ie=UTF-8&client=tw-ob&tl=${tl}&q=${encodeURIComponent(part)}`;
      const r = await fetch(url, { headers: { "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64)" }, cache: "no-store" });
      if (!r.ok) return new NextResponse(`tts upstream ${r.status}`, { status: 502 });
      buffers.push(Buffer.from(await r.arrayBuffer()));
    }
    const mp3 = Buffer.concat(buffers);
    return new NextResponse(mp3, { headers: { "Content-Type": "audio/mpeg", "Cache-Control": "no-store" } });
  } catch (e) {
    return new NextResponse(e instanceof Error ? e.message : "error", { status: 502 });
  }
}
