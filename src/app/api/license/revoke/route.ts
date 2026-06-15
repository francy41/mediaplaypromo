import { NextRequest, NextResponse } from "next/server";
import { revokeLicense } from "@/lib/license";

/**
 * POST /api/license/revoke   Body: { key }
 * Header requerido: x-admin-secret == LICENSE_ADMIN_SECRET
 * Revoca una licencia (uso interno admin en reembolsos/contracargos).
 * Seguro por defecto: si no hay secret configurado, rechaza.
 */
export async function POST(req: NextRequest) {
  const secret = process.env.LICENSE_ADMIN_SECRET;
  const provided = req.headers.get("x-admin-secret");
  if (!secret || provided !== secret) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }
  try {
    const { key } = await req.json();
    if (!key || typeof key !== "string") {
      return NextResponse.json({ error: "Falta key" }, { status: 400 });
    }
    const ok = await revokeLicense(key);
    return NextResponse.json({ ok });
  } catch {
    return NextResponse.json({ error: "bad_request" }, { status: 400 });
  }
}
