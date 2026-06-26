import { NextRequest, NextResponse } from "next/server";
import { getIntegration } from "@/lib/integrations";

export const runtime = "nodejs";

function authed(req: NextRequest): boolean {
  const secret = process.env.LICENSE_ADMIN_SECRET;
  return !!secret && req.headers.get("x-admin-secret") === secret;
}

interface Scene {
  narration: string;
  query: string;
  seconds: number;
}

/**
 * POST /api/admin/editor/plan
 * Body: { prompt, durationSec, lang }
 * Usa NVIDIA (LLM gratis) para crear un guión por escenas:
 *   [{ narration, query (keywords stock en inglés), seconds }]
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

  const target = Math.min(Math.max(Math.round(durationSec / 6), 3), 60); // ~6s por escena
  const sys = `You are a professional video director planning a COHESIVE short video. Output ONLY a valid JSON array, no prose, no markdown fences. Each element is a scene: {"narration": string, "query": string, "seconds": number}.
Rules:
- Produce about ${target} scenes; the sum of "seconds" must be close to ${durationSec}; each "seconds" is an integer 4-8.
- "narration" is ONE short, natural sentence in ${lang}; the scenes together must tell a coherent, logical story in order (intro → development → close).
- "query" is 2-3 CONCRETE, FILMABLE English keywords describing a REAL visual that exists in stock footage (an object, place, person or action). Examples GOOD: "city skyline night", "barista pouring coffee", "ocean waves drone". Examples BAD (do NOT use abstract words): "success", "idea", "future", "innovation".
- Keep the visuals coherent across scenes (consistent theme, setting and tone). Every "query" must be DISTINCT (never repeat the same query).`;
  const user = `Topic: ${prompt}\nTotal duration: ${durationSec} seconds.`;

  try {
    const r = await fetch(`${(integ.baseUrl || "https://integrate.api.nvidia.com/v1").replace(/\/+$/, "")}/chat/completions`, {
      method: "POST",
      headers: { Authorization: `Bearer ${integ.apiKey}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        model: "meta/llama-3.1-8b-instruct",
        messages: [{ role: "system", content: sys }, { role: "user", content: user }],
        temperature: 0.6,
        max_tokens: 2200,
      }),
      cache: "no-store",
    });
    const d = await r.json().catch(() => ({} as Record<string, unknown>)) as Record<string, unknown>;
    if (!r.ok) {
      const err = (d.error as { message?: string })?.message || (d.detail as string) || `NVIDIA error ${r.status}`;
      return NextResponse.json({ error: err }, { status: 502 });
    }
    const content = (d.choices as Array<{ message?: { content?: string } }> | undefined)?.[0]?.message?.content ?? "";
    // Extrae el array JSON aunque venga con texto alrededor
    const start = content.indexOf("[");
    const end = content.lastIndexOf("]");
    if (start === -1 || end === -1) return NextResponse.json({ error: "El modelo no devolvió un guión válido. Reintenta." }, { status: 502 });
    let scenes: Scene[];
    try {
      scenes = JSON.parse(content.slice(start, end + 1));
    } catch {
      return NextResponse.json({ error: "No se pudo leer el guión (JSON inválido). Reintenta." }, { status: 502 });
    }
    scenes = (scenes || [])
      .filter((s) => s && typeof s.narration === "string" && typeof s.query === "string")
      .map((s) => ({ narration: s.narration.trim(), query: s.query.trim(), seconds: Math.min(Math.max(Math.round(Number(s.seconds) || 6), 3), 12) }));

    const totalSec = scenes.reduce((a, s) => a + s.seconds, 0);
    return NextResponse.json({ title: prompt.slice(0, 80), totalSec, scenes });
  } catch (e) {
    return NextResponse.json({ error: e instanceof Error ? e.message : "Error de red" }, { status: 500 });
  }
}
