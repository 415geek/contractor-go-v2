import { createAdminClient } from "@/lib/supabase-admin";
import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  const supabase = createAdminClient();
  const { searchParams } = new URL(request.url);
  const range = searchParams.get("range") || "30";
  const days = Math.min(90, Math.max(7, parseInt(range, 10)));

  const start = new Date();
  start.setDate(start.getDate() - days);
  const startStr = start.toISOString();

  const { data: events } = await supabase
    .from("user_analytics")
    .select("event_name, subject_type, subject_value, payload, created_at, user_id")
    .gte("created_at", startStr);

  const list = (events ?? []) as Array<{
    event_name: string;
    subject_type: string;
    subject_value: string;
    payload?: { duration_ms?: number; page_path?: string };
    created_at: string;
    session_id?: string;
    duration_ms?: number;
    page_path?: string;
    action_type?: string;
    device_type?: string;
  } & { user_id?: string }>;
  const pageViews = list.filter((e) => (e as { action_type?: string }).action_type === "page_view" || e.event_name === "page_view").length;
  const sessions = new Set(list.map((e) => (e as { session_id?: string }).session_id || e.subject_value || e.created_at)).size;
  const durationSum = list.reduce((s, e) => s + ((e as { duration_ms?: number }).duration_ms ?? (e.payload as { duration_ms?: number })?.duration_ms ?? 0), 0);
  const durationCount = list.filter((e) => ((e as { duration_ms?: number }).duration_ms ?? (e.payload as { duration_ms?: number })?.duration_ms ?? 0) > 0).length;
  const avgDuration = durationCount > 0 ? Math.round(durationSum / durationCount) : 0;
  const clickEvents = list.filter((e) => (e as { action_type?: string }).action_type === "click" || e.event_name === "click").length;

  const byPath: Record<string, number[]> = {};
  list.forEach((e) => {
    const path = (e as { page_path?: string }).page_path || (e.payload as { page_path?: string })?.page_path || e.subject_value || "";
    if (!path) return;
    if (!byPath[path]) byPath[path] = [];
    const dur = (e as { duration_ms?: number }).duration_ms ?? (e.payload as { duration_ms?: number })?.duration_ms;
    if (dur) byPath[path].push(dur);
  });
  const pageDurationRank = Object.entries(byPath)
    .map(([path, arr]) => ({
      path,
      avgDuration: arr.length ? Math.round(arr.reduce((a, b) => a + b, 0) / arr.length) : 0,
    }))
    .filter((p) => p.avgDuration > 0)
    .sort((a, b) => b.avgDuration - a.avgDuration)
    .slice(0, 10);

  const funnel = {
    visit: list.length,
    browse: list.filter((e) => e.action_type !== "page_view" || e.event_name !== "page_view").length,
    register: new Set(list.map((e) => e.user_id).filter(Boolean)).size,
    subscribe: 0,
  };

  const byDay: Record<string, Set<string>> = {};
  for (let i = 0; i < days; i++) {
    const d = new Date(start);
    d.setDate(d.getDate() + i);
    byDay[d.toISOString().slice(0, 10)] = new Set();
  }
  list.forEach((e) => {
    const day = (e.created_at as string).slice(0, 10);
    const uid = (e as { user_id?: string }).user_id;
    if (byDay[day] && uid) byDay[day].add(uid);
  });
  const retention = Object.entries(byDay)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([date, set]) => ({ date, retained: set.size }));

  return NextResponse.json({
    pageViews,
    sessions,
    avgDuration,
    clickEvents,
    pageDurationRank,
    funnel,
    retention,
  });
}
