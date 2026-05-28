import { NextRequest, NextResponse } from "next/server";
import { createGeneration, MuapiError, type MuapiGenerateRequest } from "@/lib/ai/muapi";

/**
 * POST /api/ai/generate
 * Inicia un job de generación en Muapi. Devuelve el job_id para polling.
 *
 * Body: MuapiGenerateRequest
 */
export async function POST(req: NextRequest) {
  try {
    const body = (await req.json()) as MuapiGenerateRequest;

    if (!body.model || !body.prompt) {
      return NextResponse.json(
        { error: "Faltan campos requeridos: model y prompt" },
        { status: 400 }
      );
    }

    // Rate limit / cuota — TODO: añadir cuando esté Supabase
    // const userId = await getUserFromCookie(req);
    // await assertCanGenerate(userId);

    const job = await createGeneration(body);
    return NextResponse.json(job, { status: 202 });
  } catch (e) {
    if (e instanceof MuapiError) {
      return NextResponse.json({ error: e.message, details: e.body }, { status: e.status });
    }
    const msg = e instanceof Error ? e.message : "Error desconocido";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
