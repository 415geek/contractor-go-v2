"use client";

import { useRealtimeStats } from "@/hooks/useRealtimeStats";
import { RealtimeActivityFeed } from "@/components/analytics/RealtimeActivityFeed";
import { Users, Smartphone, Monitor, MessageSquare } from "lucide-react";

export default function RealtimePage() {
  const { data, isLoading, error } = useRealtimeStats();

  if (error) {
    return (
      <div className="rounded-lg border border-destructive/50 bg-destructive/10 p-4 text-destructive">
        加载失败: {(error as Error).message}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2">
        <span className="relative flex h-3 w-3">
          <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-green-400 opacity-75" />
          <span className="relative inline-flex h-3 w-3 rounded-full bg-green-500" />
        </span>
        <h1 className="text-2xl font-semibold">实时监控</h1>
      </div>

      {isLoading && !data ? (
        <div className="text-muted-foreground">加载中…</div>
      ) : (
        <>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <div className="rounded-lg border bg-card p-4 shadow-sm">
              <div className="flex items-center gap-2">
                <Users className="h-4 w-4 text-muted-foreground" />
                <span className="text-muted-foreground text-sm">当前在线</span>
              </div>
              <p className="mt-2 text-2xl font-semibold">{data?.online ?? 0}</p>
            </div>
            <div className="rounded-lg border bg-card p-4 shadow-sm">
              <div className="flex items-center gap-2">
                <Smartphone className="h-4 w-4 text-muted-foreground" />
                <span className="text-muted-foreground text-sm">移动端</span>
              </div>
              <p className="mt-2 text-2xl font-semibold">{data?.mobile ?? 0}</p>
            </div>
            <div className="rounded-lg border bg-card p-4 shadow-sm">
              <div className="flex items-center gap-2">
                <Monitor className="h-4 w-4 text-muted-foreground" />
                <span className="text-muted-foreground text-sm">桌面端</span>
              </div>
              <p className="mt-2 text-2xl font-semibold">{data?.desktop ?? 0}</p>
            </div>
            <div className="rounded-lg border bg-card p-4 shadow-sm">
              <div className="flex items-center gap-2">
                <MessageSquare className="h-4 w-4 text-muted-foreground" />
                <span className="text-muted-foreground text-sm">消息/分钟</span>
              </div>
              <p className="mt-2 text-2xl font-semibold">{data?.messagesPerMinute ?? 0}</p>
            </div>
          </div>

          <div className="rounded-lg border bg-card p-4 shadow-sm">
            <h2 className="mb-4 font-medium">实时活动流（最新 50 条）</h2>
            <RealtimeActivityFeed activities={data?.activities ?? []} />
          </div>
        </>
      )}
    </div>
  );
}
