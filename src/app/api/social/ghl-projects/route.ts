import { NextRequest, NextResponse } from "next/server";
import { addGhlProject, removeGhlProject, listGhlProjectsSafe, getGhlConn } from "@/lib/ghl-projects";
import { getGHLAccounts } from "@/lib/ghl-social";
import { resolveOwner } from "@/lib/planner-admins";

export const runtime = "nodejs";

export async function GET(req: NextRequest) {
  const owner = await resolveOwner(req.headers.get("x-admin-secret"));
  if (!owner) return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  return NextResponse.json({ projects: await listGhlProjectsSafe(owner.ownerId) });
}

export async function POST(req: NextRequest) {
  const owner = await resolveOwner(req.headers.get("x-admin-secret"));
  if (!owner) return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  const body = await req.json().catch(() => ({}));
  const action = body?.action;

  if (action === "add") {
    const r = await addGhlProject({ name: body.name, locationId: body.locationId, token: body.token, userId: body.userId, ownerId: owner.ownerId });
    return NextResponse.json(r, { status: r.ok ? 200 : 400 });
  }
  if (action === "remove") {
    const r = await removeGhlProject(String(body.id ?? ""), owner.ownerId);
    return NextResponse.json(r, { status: r.ok ? 200 : 400 });
  }
  if (action === "verify") {
    const conn = await getGhlConn(String(body.id ?? ""), owner.ownerId);
    if (!conn) return NextResponse.json({ ok: false, error: "Proyecto no encontrado o sin token." }, { status: 400 });
    const acc = await getGHLAccounts(conn);
    return NextResponse.json(acc);
  }
  return NextResponse.json({ error: "Acción inválida" }, { status: 400 });
}
