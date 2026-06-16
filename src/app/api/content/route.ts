import { NextRequest, NextResponse } from "next/server";
import { createSupabaseAdminClient } from "@/lib/supabase/server";
import { createGHLSocialPost, GHL_SOCIAL_ENABLED } from "@/lib/ghl-social";

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

    if (action === "schedule") {
      const { data: post } = await admin.from("content_posts").select("caption,video_url").eq("id", body.id).maybeSingle();
      if (!post) return NextResponse.json({ error: "Post no encontrado" }, { status: 404 });
      const upd = await pushAndStatus(post, body.scheduled_at, body.platforms ?? []);
      const { error } = await admin.from("content_posts").update(upd).eq("id", body.id);
      return NextResponse.json({ ok: !error, status: upd.status, error: upd.error });
    }

    if (action === "batch") {
      // Distribuye TODOS los "queued": 1 por día desde startDate a la hora dada
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

    return NextResponse.json({ error: "Acción inválida" }, { status: 400 });
  } catch (e) {
    return NextResponse.json({ error: e instanceof Error ? e.message : "error" }, { status: 500 });
  }
}
