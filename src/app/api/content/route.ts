import { NextRequest, NextResponse } from "next/server";
import { createSupabaseAdminClient } from "@/lib/supabase/server";
import { postToGHL, resolveAccountIds, resolveGHLUserId, getGHLAccounts } from "@/lib/ghl-social";
import { getGhlConn, listGhlProjectsSafe, type GhlConn } from "@/lib/ghl-projects";
import { resolveOwner } from "@/lib/planner-admins";
import { listTemplates, addTemplate, removeTemplate } from "@/lib/caption-templates";

export const maxDuration = 60;

const MAX_BATCH = 40;
const THROTTLE_MS = 250;
const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

type GhlResult = { ok: boolean; postId?: string; error?: string };

// Publica usando grupos de cuentas ya resueltos (TikTok va en su propio grupo).
async function pushWithGroups(post: { caption: string | null; video_url: string }, scheduledAt: string, platforms: string[], groups: string[][], conn: GhlConn | null) {
  if (!conn) {
    return { scheduled_at: scheduledAt, platforms, status: "scheduled", ghl_post_id: null, error: null };
  }
  const results: GhlResult[] = [];
  for (let i = 0; i < groups.length; i++) {
    results.push(await postToGHL(groups[i], { caption: post.caption ?? "", mediaUrl: post.video_url, scheduleDate: scheduledAt, platforms }, conn));
    if (i < groups.length - 1) await sleep(THROTTLE_MS);
  }
  const okAny = results.some((r) => r.ok);
  const errors = results.filter((r) => !r.ok).map((r) => r.error).filter(Boolean) as string[];
  return {
    scheduled_at: scheduledAt,
    platforms,
    status: okAny || groups.length === 0 ? "scheduled" : "failed",
    ghl_post_id: results.find((r) => r.ok)?.postId ?? null,
    error: errors.length ? errors.join(" | ") : null,
  };
}

export async function GET(req: NextRequest) {
  const owner = await resolveOwner(req.headers.get("x-admin-secret"));
  if (!owner) return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  try {
    const admin = createSupabaseAdminClient();
    const { data, error } = await admin
      .from("content_posts")
      .select("*")
      .eq("owner_id", owner.ownerId)
      .order("scheduled_at", { ascending: true, nullsFirst: false })
      .order("created_at", { ascending: false })
      .limit(500);
    const projects = await listGhlProjectsSafe(owner.ownerId);
    const templates = await listTemplates(owner.ownerId);
    return NextResponse.json({ posts: error ? [] : data ?? [], projects, templates, ghlEnabled: projects.length > 0, role: owner.role, name: owner.name, error: error?.message });
  } catch {
    return NextResponse.json({ posts: [], projects: [], ghlEnabled: false });
  }
}

export async function POST(req: NextRequest) {
  const owner = await resolveOwner(req.headers.get("x-admin-secret"));
  if (!owner) return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  const body = await req.json().catch(() => ({}));
  const action = body?.action;
  const admin = createSupabaseAdminClient();
  // Conexión GHL del proyecto seleccionado (aislada por owner; env solo para super)
  const conn = await getGhlConn(body?.projectId, owner.ownerId);

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
          owner_id: owner.ownerId,
        }));
      if (rows.length === 0) return NextResponse.json({ error: "Falta la URL del video" }, { status: 400 });
      const { error } = await admin.from("content_posts").insert(rows);
      return NextResponse.json({ ok: !error, added: rows.length, error: error?.message });
    }

    if (action === "delete") {
      const { error } = await admin.from("content_posts").delete().eq("id", body.id).eq("owner_id", owner.ownerId);
      return NextResponse.json({ ok: !error });
    }

    if (action === "template-add") {
      const r = await addTemplate(owner.ownerId, { label: body.label, text: body.text });
      return NextResponse.json(r, { status: r.ok ? 200 : 400 });
    }

    if (action === "template-delete") {
      const r = await removeTemplate(owner.ownerId, String(body.id ?? ""));
      return NextResponse.json(r, { status: r.ok ? 200 : 400 });
    }

    // Diagnóstico: ver qué cuentas sociales están conectadas en el proyecto GHL
    if (action === "ghl-accounts") {
      if (!conn) return NextResponse.json({ ok: false, error: "Sin proyecto GHL conectado." });
      const r = await getGHLAccounts(conn);
      return NextResponse.json(r);
    }

    if (action === "clear") {
      const scope = body.scope === "all" ? null : "failed";
      const q = admin.from("content_posts").delete().eq("owner_id", owner.ownerId);
      const { error } = scope ? await q.eq("status", scope) : await q;
      return NextResponse.json({ ok: !error, error: error?.message });
    }

    if (action === "schedule") {
      const { data: post } = await admin.from("content_posts").select("caption,video_url").eq("id", body.id).eq("owner_id", owner.ownerId).maybeSingle();
      if (!post) return NextResponse.json({ error: "Post no encontrado" }, { status: 404 });
      const platforms: string[] = body.platforms ?? [];
      let groups: string[][] = [];
      if (conn) {
        const r = await resolveAccountIds(platforms, conn);
        if (!r.ok) return NextResponse.json({ error: r.error }, { status: 400 });
        groups = r.groups;
        const u = await resolveGHLUserId(conn);
        if (!u.ok) return NextResponse.json({ error: u.error }, { status: 400 });
      }
      const upd = await pushWithGroups(post, body.scheduled_at, platforms, groups, conn);
      const { error } = await admin.from("content_posts").update(upd).eq("id", body.id).eq("owner_id", owner.ownerId);
      return NextResponse.json({ ok: !error, status: upd.status, error: upd.error });
    }

    if (action === "batch") {
      const { data: queued } = await admin
        .from("content_posts")
        .select("id,caption,video_url")
        .eq("owner_id", owner.ownerId)
        .eq("status", "queued")
        .order("created_at", { ascending: true });
      const list = queued ?? [];
      const platforms: string[] = body.platforms ?? [];
      const time: string = body.time || "10:00";
      const [hh, mm] = time.split(":").map((n: string) => Number(n));
      const start = body.startDate ? new Date(body.startDate) : new Date(Date.now() + 86400000);

      let groups: string[][] = [];
      if (conn) {
        const r = await resolveAccountIds(platforms, conn);
        if (!r.ok) return NextResponse.json({ error: r.error }, { status: 400 });
        groups = r.groups;
        const u = await resolveGHLUserId(conn);
        if (!u.ok) return NextResponse.json({ error: u.error }, { status: 400 });
      }

      let scheduled = 0;
      for (let i = 0; i < list.length; i++) {
        const d = new Date(start);
        d.setDate(d.getDate() + i);
        d.setHours(hh || 10, mm || 0, 0, 0);
        const upd = await pushWithGroups(list[i], d.toISOString(), platforms, groups, conn);
        await admin.from("content_posts").update(upd).eq("id", list[i].id).eq("owner_id", owner.ownerId);
        scheduled++;
        if (conn && i < list.length - 1) await sleep(THROTTLE_MS);
      }
      return NextResponse.json({ ok: true, scheduled });
    }

    if (action === "batch-loop") {
      const { data: queued } = await admin
        .from("content_posts")
        .select("id,caption,video_url,title")
        .eq("owner_id", owner.ownerId)
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
      const rawDays = Math.max(1, Math.floor((end.getTime() - start.getTime()) / msPerDay) + 1);
      const totalDays = Math.min(rawDays, MAX_BATCH);
      const capped = rawDays > MAX_BATCH;

      let groups: string[][] = [];
      if (conn) {
        const r = await resolveAccountIds(platforms, conn);
        if (!r.ok) return NextResponse.json({ error: r.error }, { status: 400 });
        groups = r.groups;
        const u = await resolveGHLUserId(conn);
        if (!u.ok) return NextResponse.json({ error: u.error }, { status: 400 });
      }

      let scheduled = 0;
      const toInsert: Record<string, unknown>[] = [];

      for (let i = 0; i < totalDays; i++) {
        const template = list[i % list.length];
        const d = new Date(start);
        d.setDate(d.getDate() + i);
        d.setHours(hh || 10, mm || 0, 0, 0);
        const isoDate = d.toISOString();
        const upd = await pushWithGroups(template, isoDate, platforms, groups, conn);
        if (i < list.length) {
          await admin.from("content_posts").update(upd).eq("id", template.id).eq("owner_id", owner.ownerId);
        } else {
          toInsert.push({ video_url: template.video_url, caption: template.caption, title: template.title, owner_id: owner.ownerId, ...upd });
        }
        scheduled++;
        if (conn && i < totalDays - 1) await sleep(THROTTLE_MS);
      }

      if (toInsert.length > 0) await admin.from("content_posts").insert(toInsert);

      return NextResponse.json({
        ok: true,
        scheduled,
        cycles: Math.ceil(totalDays / list.length),
        capped,
        note: capped ? `Se programaron ${totalDays} publicaciones (tope de seguridad). Cuando se publiquen, usa "Reciclar" para continuar el ciclo.` : undefined,
      });
    }

    if (action === "recycle") {
      const { error } = await admin.from("content_posts").update({
        status: "queued", scheduled_at: null, platforms: [], ghl_post_id: null, error: null,
      }).eq("status", "published").eq("owner_id", owner.ownerId);
      return NextResponse.json({ ok: !error, error: error?.message });
    }

    return NextResponse.json({ error: "Acción inválida" }, { status: 400 });
  } catch (e) {
    return NextResponse.json({ error: e instanceof Error ? e.message : "error" }, { status: 500 });
  }
}
