import { NextRequest, NextResponse } from "next/server";
import { getJob, MuapiError } from "@/lib/ai/muapi";

/**
 * GET /api/ai/status/[id]
 * Polling endpoint para conocer el estado de un job de Muapi.
 */
export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const job = await getJob(id);
    return NextResponse.json(job);
  } catch (e) {
    if (e instanceof MuapiError) {
      return NextResponse.json({ error: e.message }, { status: e.status });
    }
    const msg = e instanceof Error ? e.message : "Error desconocido";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
