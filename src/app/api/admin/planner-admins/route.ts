import { NextRequest, NextResponse } from "next/server";
import { listAdmins, createAdmin, setAdminActive, removeAdmin } from "@/lib/planner-admins";

export const runtime = "nodejs";

/**
 * Gestión de administradores del Planificador. SOLO SuperAdmin.
 * Header: x-admin-secret == LICENSE_ADMIN_SECRET (el código de un admin NO sirve aquí).
 *   GET                                  → { admins: [...] }
 *   POST { action: "create", name, email? } → { ok, admin }
 *   POST { action: "toggle", id, active }   → { ok }
 *   POST { action: "remove", id }           → { ok }
 */
function isSuper(req: NextRequest): boolean {
  const secret = process.env.LICENSE_ADMIN_SECRET;
  return !!secret && req.headers.get("x-admin-secret") === secret;
}

export async function GET(req: NextRequest) {
  if (!isSuper(req)) return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  return NextResponse.json({ admins: await listAdmins() });
}

export async function POST(req: NextRequest) {
  if (!isSuper(req)) return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  const body = await req.json().catch(() => ({}));
  const action = body?.action;

  if (action === "create") {
    const r = await createAdmin({ name: body.name, email: body.email });
    return NextResponse.json(r, { status: r.ok ? 200 : 400 });
  }
  if (action === "toggle") {
    const r = await setAdminActive(String(body.id ?? ""), !!body.active);
    return NextResponse.json(r, { status: r.ok ? 200 : 400 });
  }
  if (action === "remove") {
    const r = await removeAdmin(String(body.id ?? ""));
    return NextResponse.json(r, { status: r.ok ? 200 : 400 });
  }
  return NextResponse.json({ error: "Acción inválida" }, { status: 400 });
}
