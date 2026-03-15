import { createAdminClient } from "@/lib/supabase-admin";
import { NextRequest, NextResponse } from "next/server";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const supabase = createAdminClient();

  const { data: user, error: userError } = await supabase
    .from("users")
    .select("*")
    .eq("id", id)
    .single();

  if (userError || !user) {
    return NextResponse.json({ error: "User not found" }, { status: 404 });
  }

  const [{ data: perms }, { data: numbers }, { data: projects }] = await Promise.all([
    supabase.from("user_permissions").select("permissions").eq("user_id", id).single(),
    supabase.from("virtual_numbers").select("id, phone_number, status, purchased_at").eq("user_id", id),
    supabase.from("projects").select("id, name, status, created_at").eq("user_id", id).order("created_at", { ascending: false }).limit(20),
  ]);

  const { data: convs } = await supabase.from("conversations").select("id").eq("user_id", id);
  const convIds = (convs ?? []).map((c) => c.id);
  let messageCount = 0;
  if (convIds.length > 0) {
    const { count } = await supabase.from("messages").select("id", { count: "exact", head: true }).in("conversation_id", convIds);
    messageCount = count ?? 0;
  }

  return NextResponse.json({
    ...user,
    permissions: perms?.permissions ?? {},
    virtual_numbers: numbers ?? [],
    projects: projects ?? [],
    message_count: messageCount,
  });
}
