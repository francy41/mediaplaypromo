import { NextRequest, NextResponse } from "next/server";
import { resolveOwner } from "@/lib/planner-admins";

export const runtime = "nodejs";

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
