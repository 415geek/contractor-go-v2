import { createAdminClient } from "@/lib/supabase-admin";
import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  const supabase = createAdminClient();
  const { searchParams } = new URL(request.url);
  const page = Math.max(1, parseInt(searchParams.get("page") ?? "1", 10));
  const pageSize = Math.min(50, Math.max(10, parseInt(searchParams.get("pageSize") ?? "20", 10)));
  const search = searchParams.get("search") ?? "";
  const tier = searchParams.get("tier") ?? "";

  const selectCols = "id, email, phone, display_name, subscription_tier, subscription_expires_at, created_at";
  let q = supabase
    .from("users")
    .select(selectCols, { count: "exact" })
    .order("created_at", { ascending: false })
    .range((page - 1) * pageSize, page * pageSize - 1);

  if (search) {
    q = q.or(`phone.ilike.%${search}%,display_name.ilike.%${search}%,email.ilike.%${search}%`);
  }
  if (tier && ["free", "basic", "pro"].includes(tier)) {
    q = q.eq("subscription_tier", tier);
  }

  const { data: users, error, count } = await q;

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  const userIds = (users ?? []).map((u) => u.id);
  if (userIds.length === 0) {
    return NextResponse.json({ data: [], total: count ?? 0 });
  }

  const [permsRes, vnRes, convRes, projRes] = await Promise.all([
    supabase.from("user_permissions").select("user_id, permissions").in("user_id", userIds),
    supabase.from("virtual_numbers").select("user_id").in("user_id", userIds),
    supabase.from("conversations").select("id, user_id").in("user_id", userIds),
    supabase.from("projects").select("user_id").in("user_id", userIds),
  ]);

  const permMap = new Map((permsRes.data ?? []).map((p) => [p.user_id, p.permissions]));
  const vnByUser = (vnRes.data ?? []).reduce((acc: Record<string, number>, r) => {
    acc[r.user_id] = (acc[r.user_id] ?? 0) + 1;
    return acc;
  }, {});
  const projByUser = (projRes.data ?? []).reduce((acc: Record<string, number>, r) => {
    acc[r.user_id] = (acc[r.user_id] ?? 0) + 1;
    return acc;
  }, {});

  const convIds = (convRes.data ?? []).map((c) => c.id);
  const convByUser = (convRes.data ?? []).reduce((acc: Record<string, string>, c) => {
    acc[c.id] = c.user_id;
    return acc;
  }, {});
  let messageCountByUser: Record<string, number> = {};
  if (convIds.length > 0) {
    const { data: msgs } = await supabase.from("messages").select("conversation_id").in("conversation_id", convIds);
    (msgs ?? []).forEach((m) => {
      const uid = convByUser[m.conversation_id];
      if (uid) messageCountByUser[uid] = (messageCountByUser[uid] ?? 0) + 1;
    });
  }

  const list = (users ?? []).map((u) => ({
    ...u,
    virtual_number_count: vnByUser[u.id] ?? 0,
    message_count: messageCountByUser[u.id] ?? 0,
    project_count: projByUser[u.id] ?? 0,
    permissions: permMap.get(u.id) ?? {},
  }));

  return NextResponse.json({ data: list, total: count ?? 0 });
}
