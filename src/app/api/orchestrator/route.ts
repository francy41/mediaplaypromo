import { NextRequest, NextResponse } from "next/server";
import { generateVideoPlan } from "@/lib/ai/orchestrator";

export const runtime = "nodejs";
export const maxDuration = 60;

function authed(req: NextRequest): boolean {
  const secret = process.env.LICENSE_ADMIN_SECRET;
  return !!secret && req.headers.get("x-admin-secret") === secret;
}

/**
 * POST /api/orchestrator
 * Body: { topic, model?, language?, platform?, duration? }
 * Devuelve el plan de producción de video en JSON.
 */
export async function POST(req: NextRequest) {
  if (!authed(req)) return NextResponse.json({ ok: false, error: "No autorizado" }, { status: 401 });

  const body = await req.json().catch(() => ({}));
  const topic = String(body.topic ?? "").trim();
  if (!topic) return NextResponse.json({ ok: false, error: "Falta el tema (topic)." }, { status: 400 });

  const result = await generateVideoPlan(topic, {
    model: body.model,
    language: body.language,
    platform: body.platform,
    duration: typeof body.duration === "number" ? body.duration : undefined,
  });
  return NextResponse.json(result, { status: result.ok ? 200 : 502 });
}
