import { NextRequest, NextResponse } from "next/server";
import { getIntegration } from "@/lib/integrations";

export const runtime = "nodejs";
export const maxDuration = 60;

function authed(req: NextRequest): boolean {
  const secret = process.env.LICENSE_ADMIN_SECRET;
  return !!secret && req.headers.get("x-admin-secret") === secret;
}

interface Scene { narration: string; query: string; visual: string; seconds: number }

/** Extrae el array de escenas de la salida del modelo, tolerando fences/objeto/prosa. */
function parseScenes(content: string): Scene[] | null {
  if (!content) return null;
  let t = content.trim().replace(/^```(?:json)?/i, "").replace(/```\s*$/i, "").trim();
  const tryParse = (str: string): unknown => { try { return JSON.parse(str); } catch { return null; } };

  let data: unknown = tryParse(t);
  if (data === null) {
    const a = t.indexOf("["), b = t.lastIndexOf("]");
    if (a !== -1 && b > a) data = tryParse(t.slice(a, b + 1));
  }
  if (data && typeof data === "object" && !Array.isArray(data)) {
    const obj = data as Record<string, unknown>;
    if (Array.isArray(obj.scenes)) data = obj.scenes;
  }
  if (!Array.isArray(data)) return null;

  const scenes = (data as Record<string, unknown>[])
    .filter((s) => s && typeof s.narration === "string" && (s.narration as string).trim())
    .map((s) => {
      const narration = String(s.narration).trim();
      const query = (typeof s.query === "string" && (s.query as string).trim()) ? (s.query as string).trim() : narration.split(/\s+/).slice(0, 3).join(" ");
      const visual = (typeof s.visual === "string" && (s.visual as string).trim()) ? (s.visual as string).trim() : query;
      return { narration, query, visual, seconds: Math.min(Math.max(Math.round(Number(s.seconds) || 6), 3), 30) };
    });
  return scenes.length ? scenes : null;
}

async function callModel(baseUrl: string, key: string, sys: string, user: string): Promise<string> {
  const r = await fetch(`${baseUrl.replace(/\/+$/, "")}/chat/completions`, {
    method: "POST",
    headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      model: "meta/llama-3.1-8b-instruct",
      messages: [{ role: "system", content: sys }, { role: "user", content: user }],
      temperature: 0.4,
      max_tokens: 4096,
    }),
    cache: "no-store",
  });
  const d = await r.json().catch(() => ({} as Record<string, unknown>)) as Record<string, unknown>;
  if (!r.ok) throw new Error((d.error as { message?: string })?.message || (d.detail as string) || `NVIDIA error ${r.status}`);
  return (d.choices as Array<{ message?: { content?: string } }> | undefined)?.[0]?.message?.content ?? "";
}

/**
 * POST /api/admin/editor/plan  Body: { prompt, durationSec, lang }
 * Genera el guión por escenas con NVIDIA (gratis). Robusto: parseo tolerante + reintento.
 */
export async function POST(req: NextRequest) {
  if (!authed(req)) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

  const body = await req.json().catch(() => ({}));
  const prompt = String(body.prompt ?? "").trim();
  const durationSec = Math.min(Math.max(parseInt(body.durationSec, 10) || 60, 15), 1800);
  const lang = body.lang === "en" ? "English" : "Spanish";
  if (!prompt) return NextResponse.json({ error: "Falta el prompt" }, { status: 400 });

  const integ = await getIntegration("nvidia");
  if (!integ?.apiKey) {
    return NextResponse.json({ error: "Conecta NVIDIA en Integraciones / APIs (es gratis) para generar el guión." }, { status: 400 });
  }
  const baseUrl = integ.baseUrl || "https://integrate.api.nvidia.com/v1";

  // Menos escenas y más largas en videos largos → cabe en tokens y es fiable.
  const target = Math.min(Math.max(Math.round(durationSec / 8), 3), 20);
  const per = Math.min(Math.max(Math.round(durationSec / target), 3), 30);

  const sys = `You are a professional video director. Return ONLY a JSON array — no markdown, no code fences, no text before or after.
Each item is a scene with EXACTLY these keys: {"narration": string, "query": string, "visual": string, "seconds": number}.
- "narration": ONE short sentence in ${lang}.
- "query": 2-4 English keywords describing real ATMOSPHERIC stock b-roll that matches the scene's mood and setting (filmable things that truly exist in stock libraries, e.g. "foggy forest night", "river water dark", "candle flame closeup", "woman silhouette walking", "old town street rain"). No abstract words. Never use proper names of copyrighted characters.
- "visual": a vivid English image-generation prompt of the scene (subject + setting + action + lighting), ending with ", cinematic, dramatic lighting, consistent style".
- "seconds": integer between ${Math.max(3, per - 2)} and ${per + 2}.
Produce EXACTLY ${target} scenes that tell the topic as ONE coherent, visually consistent story. Never repeat a query.`;
  const user = `Topic: ${prompt}\nTotal duration: ${durationSec} seconds. Make exactly ${target} scenes.`;

  try {
    let scenes: Scene[] | null = null;
    try { scenes = parseScenes(await callModel(baseUrl, integ.apiKey, sys, user)); } catch { scenes = null; }
    if (!scenes) {
      // Reintento más estricto
      const sys2 = `Output ONLY a valid JSON array of exactly ${target} objects, each {"narration","query","visual","seconds"}. ${lang} narration. No markdown, no extra text.`;
      try { scenes = parseScenes(await callModel(baseUrl, integ.apiKey, sys2, user)); } catch { scenes = null; }
    }
    if (!scenes) return NextResponse.json({ error: "El modelo no devolvió un guión válido. Reintenta." }, { status: 502 });

    const totalSec = scenes.reduce((a, s) => a + s.seconds, 0);
    return NextResponse.json({ title: prompt.slice(0, 80), totalSec, scenes });
  } catch (e) {
    return NextResponse.json({ error: e instanceof Error ? e.message : "Error de red" }, { status: 500 });
  }
}
