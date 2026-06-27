import { NextRequest, NextResponse } from "next/server";
import { addGhlProject, removeGhlProject, listGhlProjectsSafe, getGhlConn } from "@/lib/ghl-projects";
import { getGHLAccounts } from "@/lib/ghl-social";

export const runtime = "nodejs";

function authed(req: NextRequest): boolean {
  const secret = process.env.LICENSE_ADMIN_SECRET;
  return !!secret && req.headers.get("x-admin-secret") === secret;
}

export async function GET(req: NextRequest) {
  if (!authed(req)) return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  return NextResponse.json({ projects: await listGhlProjectsSafe() });
}

export async function POST(req: NextRequest) {
  if (!authed(req)) return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  const body = await req.json().catch(() => ({}));
  const action = body?.action;

  if (action === "add") {
    const r = await addGhlProject({ name: body.name, locationId: body.locationId, token: body.token, userId: body.userId });
    return NextResponse.json(r, { status: r.ok ? 200 : 400 });
  }
  if (action === "remove") {
    const r = await removeGhlProject(String(body.id ?? ""));
    return NextResponse.json(r, { status: r.ok ? 200 : 400 });
  }
  if (action === "verify") {
    const conn = await getGhlConn(String(body.id ?? ""));
    if (!conn) return NextResponse.json({ ok: false, error: "Proyecto no encontrado o sin token." }, { status: 400 });
    const acc = await getGHLAccounts(conn);
    return NextResponse.json(acc);
  }
  return NextResponse.json({ error: "Acción inválida" }, { status: 400 });
}
