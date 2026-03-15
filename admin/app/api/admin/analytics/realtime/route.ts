import { createAdminClient } from "@/lib/supabase-admin";
import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function GET() {
  const supabase = createAdminClient();
  const now = new Date();
  const fiveMinAgo = new Date(now.getTime() - 5 * 60 * 1000).toISOString();
  const oneMinAgo = new Date(now.getTime() - 60 * 1000).toISOString();

  const { data: recent } = await supabase
    .from("user_analytics")
    .select("*")
    .gte("created_at", fiveMinAgo)
    .order("created_at", { ascending: false })
    .limit(50);

  const onlineSessions = new Set((recent ?? []).map((r) => r.session_id));
  const mobile = (recent ?? []).filter((r) => r.device_type === "ios" || r.device_type === "android").length;
  const desktop = (recent ?? []).filter((r) => r.device_type === "web").length;

  const { count: msgCount } = await supabase
    .from("messages")
    .select("id", { count: "exact", head: true })
    .gte("created_at", oneMinAgo);

  const activities = (recent ?? []).slice(0, 50).map((r) => ({
    user_id: r.user_id,
    session_id: r.session_id,
    page_path: r.page_path,
    action_type: r.action_type,
    device_type: r.device_type,
    created_at: r.created_at,
    payload: r.payload,
  }));

  return NextResponse.json({
    online: onlineSessions.size,
    mobile,
    desktop,
    messagesPerMinute: msgCount ?? 0,
    activities,
  });
}
