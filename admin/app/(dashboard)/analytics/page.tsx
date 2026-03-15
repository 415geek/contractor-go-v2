"use client";

import { useState } from "react";
import { useAnalytics } from "@/hooks/useAnalytics";
import { StatsCard } from "@/components/analytics/StatsCard";
import { FunnelChart } from "@/components/analytics/FunnelChart";
import { PageDurationChart } from "@/components/analytics/PageDurationChart";
import { RetentionChart } from "@/components/analytics/RetentionChart";

type Range = "7" | "30" | "90";

export default function AnalyticsPage() {
  const [range, setRange] = useState<Range>("30");
  const { data, isLoading, error } = useAnalytics(range);

  if (error) {
    return (
      <div className="rounded-lg border border-destructive/50 bg-destructive/10 p-4 text-destructive">
        加载失败: {(error as Error).message}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">行为分析</h1>
        <div className="flex gap-2">
          {(["7", "30", "90"] as Range[]).map((r) => (
            <button
              key={r}
              type="button"
              onClick={() => setRange(r)}
              className={`rounded-md border px-3 py-1.5 text-sm ${
                range === r ? "bg-primary text-primary-foreground" : "hover:bg-muted"
              }`}
            >
              {r} 天
            </button>
          ))}
        </div>
      </div>

      {isLoading ? (
        <div className="text-muted-foreground">加载中…</div>
      ) : data ? (
        <>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <StatsCard title="页面浏览" value={data.pageViews ?? 0} />
            <StatsCard title="独立会话" value={data.sessions ?? 0} />
            <StatsCard title="平均停留(ms)" value={data.avgDuration ?? 0} />
            <StatsCard title="点击事件" value={data.clickEvents ?? 0} />
          </div>

          <div className="rounded-lg border bg-card p-4 shadow-sm">
            <h2 className="mb-4 font-medium">页面停留时间排行</h2>
            <PageDurationChart
              data={(data.pageDurationRank ?? []).map((p: { path: string; avgDuration: number }) => ({
                path: p.path,
                avgDuration: p.avgDuration,
              }))}
            />
          </div>

          <div className="grid gap-6 lg:grid-cols-2">
            <div className="rounded-lg border bg-card p-4 shadow-sm">
              <h2 className="mb-4 font-medium">转化漏斗</h2>
              <FunnelChart data={data.funnel ?? {}} />
            </div>
            <div className="rounded-lg border bg-card p-4 shadow-sm">
              <h2 className="mb-4 font-medium">留存率</h2>
              <RetentionChart data={data.retention ?? []} />
            </div>
          </div>
        </>
      ) : null}
    </div>
  );
}
