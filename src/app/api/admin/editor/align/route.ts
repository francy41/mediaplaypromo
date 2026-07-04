import { NextRequest, NextResponse } from "next/server";
import { getIntegration } from "@/lib/integrations";
import { resolveOwner } from "@/lib/planner-admins";

export const runtime = "nodejs";
export const maxDuration = 60;

async function authed(req: NextRequest): Promise<boolean> {
  return !!(await resolveOwner(req.headers.get("x-admin-secret")));
}

interface Char { text: string; start: number; end: number }

/**
 * POST /api/admin/editor/align   (multipart/form-data)
 *   file:        audio subido (la locución de ElevenLabs)
 *   narrations:  JSON string[] — la narración de cada escena, en orden
 *
 * Usa ElevenLabs Forced Alignment para obtener los tiempos REALES de cada palabra
 * y devuelve la duración exacta que debe tener cada clip para coincidir con la voz.
 */
export async function POST(req: NextRequest) {
  if (!(await authed(req))) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

  let form: FormData;
  try { form = await req.formData(); } catch { return NextResponse.json({ error: "Cuerpo inválido" }, { status: 400 }); }

  const file = form.get("file");
  const narrationsRaw = String(form.get("narrations") ?? "[]");
  if (!(file instanceof Blob)) return NextResponse.json({ error: "Falta el audio" }, { status: 400 });

  let narrations: string[];
  try { narrations = (JSON.parse(narrationsRaw) as unknown[]).map((s) => String(s ?? "").trim()); }
  catch { return NextResponse.json({ error: "narrations inválido" }, { status: 400 }); }
  if (!narrations.length) return NextResponse.json({ error: "No hay narraciones" }, { status: 400 });

  const integ = await getIntegration("elevenlabs");
  if (!integ?.apiKey) return NextResponse.json({ error: "Conecta ElevenLabs en Integraciones (categoría Voz/Audio)." }, { status: 400 });
  const base = (integ.baseUrl || "https://api.elevenlabs.io").replace(/\/+$/, "");

  // Construye el transcript y guarda el índice de carácter donde empieza cada escena.
  let transcript = "";
  const offsets: number[] = [];
  for (let i = 0; i < narrations.length; i++) {
    if (i > 0) transcript += " ";
    offsets[i] = transcript.length;
    transcript += narrations[i];
  }
  if (!transcript.trim()) return NextResponse.json({ error: "Las narraciones están vacías" }, { status: 400 });

  try {
    const fd = new FormData();
    fd.append("file", file, (file as File).name || "audio.mp3");
    fd.append("text", transcript);

    const r = await fetch(`${base}/v1/forced-alignment`, { method: "POST", headers: { "xi-api-key": integ.apiKey }, body: fd, cache: "no-store" });
    const data = await r.json().catch(() => ({} as Record<string, unknown>)) as Record<string, unknown>;
    if (!r.ok) {
      const detail = (data?.detail as { message?: string })?.message || (typeof data?.detail === "string" ? data.detail : "") || `ElevenLabs error ${r.status}`;
      return NextResponse.json({ error: detail }, { status: 502 });
    }

    const chars = (data.characters as Char[] | undefined) ?? [];
    if (!chars.length) return NextResponse.json({ error: "ElevenLabs no devolvió tiempos." }, { status: 502 });
    const audioDur = Number(chars[chars.length - 1]?.end) || 0;
    if (audioDur < 1) return NextResponse.json({ error: "Duración de audio inválida." }, { status: 502 });

    // Frontera de cada escena = instante en que empieza su primer carácter.
    const n = narrations.length;
    const bound: number[] = new Array(n + 1);
    bound[0] = 0;
    for (let i = 1; i < n; i++) {
      const idx = Math.min(offsets[i], chars.length - 1);
      bound[i] = Number(chars[idx]?.start);
      if (!Number.isFinite(bound[i])) bound[i] = (audioDur * i) / n; // fallback proporcional
    }
    bound[n] = audioDur;

    // Garantiza orden creciente y calcula duraciones.
    const durations: number[] = [];
    for (let i = 0; i < n; i++) {
      const start = bound[i];
      const end = Math.max(bound[i + 1], start);
      durations[i] = Math.max(1, Math.round(end - start));
    }

    return NextResponse.json({ durations, totalSec: Math.round(audioDur) });
  } catch (e) {
    return NextResponse.json({ error: e instanceof Error ? e.message : "Error de red" }, { status: 500 });
  }
}
