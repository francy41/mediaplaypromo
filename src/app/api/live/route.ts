import { NextRequest, NextResponse } from "next/server";
import {
  isAdmin, getConfig, updateConfig, listItems, addItem,
  deleteItem, setEnabled, reorder,
} from "@/lib/live-channel";

export const dynamic = "force-dynamic";

/**
 * GET /api/live  → PÚBLICO
 * Devuelve la config del canal + los items habilitados (para el reproductor).
 */
export async function GET() {
  try {
    const [config, items] = await Promise.all([getConfig(), listItems(true)]);
    return NextResponse.json(
      {
        config,
        items: items.map((i) => ({
          id: i.id,
          title: i.title,
          video_url: i.video_url,
          duration_seconds: Number(i.duration_seconds),
        })),
      },
      { headers: { "Cache-Control": "no-store" } }
    );
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Error";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

/**
 * POST /api/live  → ADMIN (header x-admin-secret)
 * Body: { action: "add"|"delete"|"toggle"|"reorder"|"config"|"list", ... }
 */
export async function POST(req: NextRequest) {
  if (!isAdmin(req)) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }
  const body = await req.json().catch(() => ({}));
  const action: string = body.action;

  try {
    switch (action) {
      case "list": {
        const [config, items] = await Promise.all([getConfig(), listItems(false)]);
        return NextResponse.json({ config, items });
      }
      case "add": {
        if (!body.video_url || !(Number(body.duration_seconds) > 0)) {
          return NextResponse.json({ error: "Falta video_url o duration_seconds" }, { status: 400 });
        }
        const item = await addItem({
          title: String(body.title ?? "Sin título"),
          video_url: String(body.video_url),
          storage_path: body.storage_path ?? null,
          duration_seconds: Number(body.duration_seconds),
        });
        return NextResponse.json({ ok: true, item });
      }
      case "delete": {
        if (!body.id) return NextResponse.json({ error: "Falta id" }, { status: 400 });
        await deleteItem(String(body.id));
        return NextResponse.json({ ok: true });
      }
      case "toggle": {
        if (!body.id) return NextResponse.json({ error: "Falta id" }, { status: 400 });
        await setEnabled(String(body.id), Boolean(body.enabled));
        return NextResponse.json({ ok: true });
      }
      case "reorder": {
        if (!Array.isArray(body.ids)) return NextResponse.json({ error: "Falta ids[]" }, { status: 400 });
        await reorder(body.ids.map(String));
        return NextResponse.json({ ok: true });
      }
      case "config": {
        const patch: Record<string, unknown> = {};
        if (typeof body.title === "string") patch.title = body.title;
        if (Number(body.block_minutes) > 0) patch.block_minutes = Math.round(Number(body.block_minutes));
        if (typeof body.enabled === "boolean") patch.enabled = body.enabled;
        const config = await updateConfig(patch);
        return NextResponse.json({ ok: true, config });
      }
      default:
        return NextResponse.json({ error: "Acción no válida" }, { status: 400 });
    }
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Error";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
