import { NextRequest, NextResponse } from "next/server";
import { createSupabaseAdminClient } from "@/lib/supabase/server";
import { createGHLSocialPost, getGHLAccounts, GHL_SOCIAL_ENABLED } from "@/lib/ghl-social";

export const maxDuration = 60;

function authed(req: NextRequest): boolean {
  const secret = process.env.LICENSE_ADMIN_SECRET;
  return !!secret && req.headers.get("x-admin-secret") === secret;
}

type GhlResult = { ok: boolean; postId?: string; error?: string };

async function pushAndStatus(post: { caption: string | null; video_url: string }, scheduledAt: string, platforms: string[]) {
  let ghl: GhlResult = { ok: false };
  if (GHL_SOCIAL_ENABLED) {
    ghl = await createGHLSocialPost({ caption: post.caption ?? "", mediaUrl: post.video_url, scheduleDate: scheduledAt, platforms });
  }
  return {
    scheduled_at: scheduledAt,
    platforms,
    status: ghl.ok || !GHL_SOCIAL_ENABLED ? "scheduled" : "failed",
    ghl_post_id: ghl.postId ?? null,
    error: ghl.ok ? null : (GHL_SOCIAL_ENABLED ? ghl.error ?? null : null),
  };
}

export async function GET(req: NextRequest) {
  if (!authed(req)) return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  try {
    const admin = createSupabaseAdminClient();
    const { data, error } = await admin
      .from("content_posts")
      .select("*")
      .order("scheduled_at", { ascending: true, nullsFirst: false })
      .order("created_at", { ascending: false })
      .limit(500);
    return NextResponse.json({ posts: error ? [] : data ?? [], ghlEnabled: GHL_SOCIAL_ENABLED, error: error?.message });
  } catch {
    return NextResponse.json({ posts: [], ghlEnabled: GHL_SOCIAL_ENABLED });
  }
}

export async function POST(req: NextRequest) {
  if (!authed(req)) return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  const body = await req.json().catch(() => ({}));
  const action = body?.action;
  const admin = createSupabaseAdminClient();

  try {
    if (action === "add") {
      const items = Array.isArray(body.videos)
        ? body.videos
        : [{ video_url: body.video_url, title: body.title, caption: body.caption }];
      const rows = items
        .filter((v: { video_url?: string }) => v.video_url && v.video_url.trim())
        .map((v: { video_url: string; title?: string; caption?: string }) => ({
          video_url: v.video_url.trim(),
          title: v.title?.trim() || null,
          caption: v.caption?.trim() || null,
          status: "queued",
        }));
      if (rows.length === 0) return NextResponse.json({ error: "Falta la URL del video" }, { status: 400 });
      const { error } = await admin.from("content_posts").insert(rows);
      return NextResponse.json({ ok: !error, added: rows.length, error: error?.message });
    }

    if (action === "delete") {
      const { error } = await admin.from("content_posts").delete().eq("id", body.id);
      return NextResponse.json({ ok: !error });
    }

    // Diagnóstico: ver qué cuentas sociales están conectadas en GHL
    if (action === "ghl-accounts") {
      const r = await getGHLAccounts();
      return NextResponse.json(r);
    }

    // Limpiar filas con error (failed) o todas
    if (action === "clear") {
      const scope = body.scope === "all" ? null : "failed";
      const q = admin.from("content_posts").delete();
      const { error } = scope ? await q.eq("status", scope) : await q.neq("id", "00000000-0000-0000-0000-000000000000");
      return NextResponse.json({ ok: !error, error: error?.message });
    }

    if (action === "schedule") {
      const { data: post } = await admin.from("content_posts").select("caption,video_url").eq("id", body.id).maybeSingle();
      if (!post) return NextResponse.json({ error: "Post no encontrado" }, { status: 404 });
      const upd = await pushAndStatus(post, body.scheduled_at, body.platforms ?? []);
      const { error } = await admin.from("content_posts").update(upd).eq("id", body.id);
      return NextResponse.json({ ok: !error, status: upd.status, error: upd.error });
    }

    if (action === "batch") {
      const { data: queued } = await admin
        .from("content_posts")
        .select("id,caption,video_url")
        .eq("status", "queued")
        .order("created_at", { ascending: true });
      const list = queued ?? [];
      const platforms: string[] = body.platforms ?? [];
      const time: string = body.time || "10:00";
      const [hh, mm] = time.split(":").map((n: string) => Number(n));
      const start = body.startDate ? new Date(body.startDate) : new Date(Date.now() + 86400000);
      let scheduled = 0;
      for (let i = 0; i < list.length; i++) {
        const d = new Date(start);
        d.setDate(d.getDate() + i);
        d.setHours(hh || 10, mm || 0, 0, 0);
        const upd = await pushAndStatus(list[i], d.toISOString(), platforms);
        await admin.from("content_posts").update(upd).eq("id", list[i].id);
        scheduled++;
      }
      return NextResponse.json({ ok: true, scheduled });
    }

    // Modo bucle: distribuye todos los videos en cola en ciclo hasta endDate
    if (action === "batch-loop") {
      const { data: queued } = await admin
        .from("content_posts")
        .select("id,caption,video_url,title")
        .eq("status", "queued")
        .order("created_at", { ascending: true });
      const list = queued ?? [];
      if (list.length === 0) return NextResponse.json({ error: "No hay videos en cola" }, { status: 400 });

      const platforms: string[] = body.platforms ?? [];
      const time: string = body.time || "10:00";
      const [hh, mm] = time.split(":").map((n: string) => Number(n));
      const start = body.startDate ? new Date(body.startDate) : new Date(Date.now() + 86400000);
      const end = body.endDate ? new Date(body.endDate) : new Date(Date.now() + 30 * 86400000);

      const msPerDay = 86400000;
      const totalDays = Math.max(1, Math.floor((end.getTime() - start.getTime()) / msPerDay) + 1);

      let scheduled = 0;
      const toInsert: Record<string, unknown>[] = [];

      for (let i = 0; i < totalDays; i++) {
        const template = list[i % list.length];
        const d = new Date(start);
        d.setDate(d.getDate() + i);
        d.setHours(hh || 10, mm || 0, 0, 0);
        const isoDate = d.toISOString();

        const upd = await pushAndStatus(template, isoDate, platforms);

        if (i < list.length) {
          // Primera pasada: actualiza la fila original
          await admin.from("content_posts").update(upd).eq("id", template.id);
        } else {
          // Repeticiones: inserta nuevas filas
          toInsert.push({
            video_url: template.video_url,
            caption: template.caption,
            title: template.title,
            ...upd,
          });
        }
        scheduled++;
      }

      if (toInsert.length > 0) {
        await admin.from("content_posts").insert(toInsert);
      }

      return NextResponse.json({ ok: true, scheduled, cycles: Math.ceil(totalDays / list.length) });
    }

    // Reciclar publicadas: vuelve al estado "queued" para repetir ciclo
    if (action === "recycle") {
      const { error } = await admin.from("content_posts").update({
        status: "queued",
        scheduled_at: null,
        platforms: [],
        ghl_post_id: null,
        error: null,
      }).eq("status", "published");
      return NextResponse.json({ ok: !error, error: error?.message });
    }

    return NextResponse.json({ error: "Acción inválida" }, { status: 400 });
  } catch (e) {
    return NextResponse.json({ error: e instanceof Error ? e.message : "error" }, { status: 500 });
  }
}
