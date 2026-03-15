import { createAdminClient } from "@/lib/supabase-admin";
import { NextResponse } from "next/server";

export async function GET() {
  const supabase = createAdminClient();
  const now = new Date();
  const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate()).toISOString();
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();

  const [usersRes, activeTodayRes, messagesRes] = await Promise.all([
    supabase.from("users").select("id", { count: "exact", head: true }),
    supabase.from("user_analytics").select("user_id").gte("created_at", todayStart),
    supabase.from("messages").select("id", { count: "exact", head: true }),
  ]);

  const totalUsers = usersRes.count ?? 0;
  const activeToday = new Set((activeTodayRes.data ?? []).map((r) => r.user_id)).size;
  const totalMessages = messagesRes.count ?? 0;

  const thirtyDaysAgo = new Date(now);
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
  const { data: signups } = await supabase
    .from("users")
    .select("created_at")
    .gte("created_at", thirtyDaysAgo.toISOString());
  const byDay: Record<string, number> = {};
  for (let d = 0; d < 30; d++) {
    const day = new Date(thirtyDaysAgo);
    day.setDate(day.getDate() + d);
    const key = day.toISOString().slice(0, 10);
    byDay[key] = 0;
  }
  signups?.forEach((r) => {
    const key = (r as { created_at: string }).created_at.slice(0, 10);
    if (byDay[key] !== undefined) byDay[key]++;
  });

  const revenue = 0;

  return NextResponse.json({
    totalUsers,
    activeToday,
    monthlyRevenue: revenue,
    totalMessages,
    userGrowth: Object.entries(byDay)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([date, count]) => ({ date, count })),
    revenueTrend: Object.entries(byDay)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([date]) => ({ date, revenue: 0 })),
  });
}
