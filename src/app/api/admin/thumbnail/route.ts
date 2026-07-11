import { NextRequest, NextResponse } from "next/server";
import { resolveOwner } from "@/lib/planner-admins";
import { getIntegration } from "@/lib/integrations";

export const runtime = "nodejs";
export const maxDuration = 30;

async function authed(req: NextRequest): Promise<boolean> {
  return !!(await resolveOwner(req.headers.get("x-admin-secret")));
}

async function callModel(baseUrl: string, key: string, sys: string, user: string, maxTokens = 300, timeoutMs = 22000): Promise<string> {
  const ctrl = new AbortController();
  const t = setTimeout(() => ctrl.abort(), timeoutMs);
  try {
    const r = await fetch(`${baseUrl.replace(/\/+$/, "")}/chat/completions`, {
      method: "POST",
      headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        model: "meta/llama-3.1-8b-instruct",
        messages: [{ role: "system", content: sys }, { role: "user", content: user }],
        temperature: 0.5,
        max_tokens: maxTokens,
      }),
      cache: "no-store",
      signal: ctrl.signal,
    });
    const d = await r.json().catch(() => ({} as Record<string, unknown>)) as Record<string, unknown>;
    if (!r.ok) throw new Error((d.error as { message?: string })?.message || `NVIDIA error ${r.status}`);
    return (d.choices as Array<{ message?: { content?: string } }> | undefined)?.[0]?.message?.content ?? "";
  } finally { clearTimeout(t); }
}

function parseOut(raw: string): { headline?: string; subtitle?: string; keywords?: string[] } {
  const m = raw.match(/\{[\s\S]*\}/);
  if (!m) return {};
  try { return JSON.parse(m[0]); } catch { return {}; }
}

/**
 * POST /api/admin/thumbnail  Body: { topic, lang }
 * Genera texto de miniatura de YouTube (titular corto + subtítulo) y palabras clave
 * EN INGLÉS para buscar el fondo de stock. Usa NVIDIA (gratis). Solo admins.
 */
export async function POST(req: NextRequest) {
  if (!(await authed(req))) return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  const body = await req.json().catch(() => ({}));
  const topic = String(body.topic ?? "").trim();
  const language = body.lang === "en" ? "English" : "Spanish";
  if (!topic) return NextResponse.json({ error: "Falta el tema del video" }, { status: 400 });

  const integ = await getIntegration("nvidia");
  if (!integ?.apiKey) {
    // Sin LLM: heurística simple para no bloquear la creación de la miniatura.
    const words = topic.split(/\s+/).filter(Boolean);
    return NextResponse.json({
      headline: words.slice(0, 4).join(" ").toUpperCase(),
      subtitle: "",
      keywords: [words.slice(0, 3).join(" ") || topic],
      note: "Conecta NVIDIA en Integraciones para textos más llamativos (es gratis).",
    });
  }

  const sys = `Creas TEXTO para miniaturas de YouTube que consiguen muchos clics. Responde SOLO un JSON válido, sin explicaciones:
{"headline":"...","subtitle":"...","keywords":["...","..."]}
Reglas:
- "headline": máximo 4 palabras, en ${language}, con MUCHO gancho/curiosidad, puede ir en MAYÚSCULAS. Sin comillas ni emojis.
- "subtitle": máximo 5 palabras en ${language}, o "" si no aporta.
- "keywords": 2 o 3 términos de búsqueda EN INGLÉS (sustantivos concretos y visuales) para encontrar una FOTO de fondo del tema.`;
  const user = `Tema del video: ${topic}`;

  let out = parseOut(await callModel(integ.baseUrl || "https://integrate.api.nvidia.com/v1", integ.apiKey, sys, user).catch(() => ""));
  if (!out.headline) {
    const words = topic.split(/\s+/).filter(Boolean);
    out = { headline: words.slice(0, 4).join(" ").toUpperCase(), subtitle: "", keywords: [words.slice(0, 3).join(" ") || topic] };
  }
  const keywords = Array.isArray(out.keywords) && out.keywords.length ? out.keywords.map((k) => String(k)).filter(Boolean).slice(0, 3) : [topic];
  return NextResponse.json({
    headline: String(out.headline || topic).slice(0, 60),
    subtitle: String(out.subtitle || "").slice(0, 80),
    keywords,
  });
}
