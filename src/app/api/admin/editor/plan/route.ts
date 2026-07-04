import { NextRequest, NextResponse } from "next/server";
import { getIntegration } from "@/lib/integrations";
import { resolveOwner } from "@/lib/planner-admins";

export const runtime = "nodejs";
export const maxDuration = 60;

async function authed(req: NextRequest): Promise<boolean> {
  return !!(await resolveOwner(req.headers.get("x-admin-secret")));
}

interface Scene { narration: string; query: string; visual: string; seconds: number }

/** Extrae el array de escenas de la salida del modelo, tolerando fences/objeto/prosa. */
function parseScenes(content: string): Scene[] | null {
  if (!content) return null;
  const t = content.trim().replace(/^```(?:json)?/i, "").replace(/```\s*$/i, "").trim();
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

async function callModel(baseUrl: string, key: string, sys: string, user: string, model = "meta/llama-3.1-8b-instruct"): Promise<string> {
  const r = await fetch(`${baseUrl.replace(/\/+$/, "")}/chat/completions`, {
    method: "POST",
    headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      model,
      messages: [{ role: "system", content: sys }, { role: "user", content: user }],
      temperature: 0.3,
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
  if (!(await authed(req))) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

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

  const sys = `You are an expert scriptwriter for short PROMOTIONAL / MARKETING videos (social ads for a product, store or service). The user gives a TOPIC or PRODUCT. Write a script whose EVERY scene is directly about that exact topic/product — its features, benefits, offer and call to action. NEVER invent an unrelated story, news event or fictional narrative.
Return ONLY a JSON array — no markdown, no code fences, no text before or after.
Each item has EXACTLY these keys: {"narration": string, "query": string, "visual": string, "seconds": number}.
- "narration": ONE short punchy sentence in ${lang}, clearly about the topic/product (a benefit, feature, offer or CTA). It MUST refer to the product/topic — no generic filler.
- "query": 2-4 English keywords for real stock b-roll that LITERALLY shows this product/topic. Example — topic "sneaker store": "running shoes closeup", "person lacing sneakers", "sneaker shop shelves", "runner city street". Must match the actual product, not an abstract mood. Never copyrighted names.
- "visual": a vivid English image prompt of the product/topic in context (subject + setting + action + lighting), ending with ", commercial product shot, cinematic lighting, consistent style".
- "seconds": integer between ${Math.max(3, per - 2)} and ${per + 2}.
Structure across the ${target} scenes: scene 1 = attention hook about the product, middle scenes = key benefits/features, final scene = strong call to action. Stay 100% on the topic. Produce EXACTLY ${target} scenes. Never repeat a query.`;
  const user = `Topic / product to promote: ${prompt}\nTotal duration: ${durationSec} seconds. Exactly ${target} scenes, ALL about this exact topic.`;

  const BIG = "meta/llama-3.3-70b-instruct"; // mejor seguimiento del tema
  const SMALL = "meta/llama-3.1-8b-instruct"; // fallback si el 70B no está

  try {
    let scenes: Scene[] | null = null;
    // 1º intento: modelo grande (más consistente con el tema)
    try { scenes = parseScenes(await callModel(baseUrl, integ.apiKey, sys, user, BIG)); } catch { scenes = null; }
    // 2º: mismo prompt con el modelo pequeño (por si el 70B no está disponible)
    if (!scenes) { try { scenes = parseScenes(await callModel(baseUrl, integ.apiKey, sys, user, SMALL)); } catch { scenes = null; } }
    if (!scenes) {
      // 3º: reintento más estricto de formato
      const sys2 = `Output ONLY a valid JSON array of exactly ${target} objects, each {"narration","query","visual","seconds"}. ${lang} narration, all strictly about: ${prompt}. No markdown, no extra text.`;
      try { scenes = parseScenes(await callModel(baseUrl, integ.apiKey, sys2, user, SMALL)); } catch { scenes = null; }
    }
    if (!scenes) return NextResponse.json({ error: "El modelo no devolvió un guión válido. Reintenta." }, { status: 502 });

    const totalSec = scenes.reduce((a, s) => a + s.seconds, 0);
    return NextResponse.json({ title: prompt.slice(0, 80), totalSec, scenes });
  } catch (e) {
    return NextResponse.json({ error: e instanceof Error ? e.message : "Error de red" }, { status: 500 });
  }
}
