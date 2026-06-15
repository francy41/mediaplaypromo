import { NextRequest, NextResponse } from "next/server";
import { listLicenses, setLicenseStatus } from "@/lib/license";

/**
 * POST /api/license/admin   Header: x-admin-secret == LICENSE_ADMIN_SECRET
 * Acciones del panel admin de licencias.
 *   { action: "list" }                  → { licenses: [...] }
 *   { action: "revoke",   key: "..." }  → { ok }
 *   { action: "activate", key: "..." }  → { ok }
 * Seguro por defecto: sin secret configurado, rechaza.
 */
export async function POST(req: NextRequest) {
  const secret = process.env.LICENSE_ADMIN_SECRET;
  const provided = req.headers.get("x-admin-secret");
  if (!secret || provided !== secret) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  const body = await req.json().catch(() => ({}));
  const action = body?.action;

  if (action === "list") {
    const licenses = await listLicenses();
    return NextResponse.json({ licenses });
  }

  if (action === "revoke" || action === "activate") {
    if (!body?.key || typeof body.key !== "string") {
      return NextResponse.json({ error: "Falta key" }, { status: 400 });
    }
    const ok = await setLicenseStatus(body.key, action === "revoke" ? "revoked" : "active");
    return NextResponse.json({ ok });
  }

  return NextResponse.json({ error: "Acción inválida" }, { status: 400 });
}
