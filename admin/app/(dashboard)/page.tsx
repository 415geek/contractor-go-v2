"use client";

import { useDashboardStats } from "@/hooks/useUsers";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { format, subDays } from "date-fns";
import { zhCN } from "date-fns/locale";
import { Users, MessageSquare, Activity, DollarSign } from "lucide-react";

export default function DashboardPage() {
  const { data, isLoading, error } = useDashboardStats();

  if (error) {
    return (
      <div className="rounded-lg border border-destructive/50 bg-destructive/10 p-4 text-destructive">
        加载失败: {(error as Error).message}
      </div>
    );
  }

  if (isLoading || !data) {
    return <div className="text-muted-foreground">加载中…</div>;
  }

  const stats = [
    { label: "总用户", value: data.totalUsers, icon: Users },
    { label: "今日活跃", value: data.activeToday, icon: Activity },
    { label: "月收入", value: `¥${data.monthlyRevenue ?? 0}`, icon: DollarSign },
    { label: "消息总量", value: data.totalMessages, icon: MessageSquare },
  ];

  const growthData = (data.userGrowth ?? []).map((d: { date: string; count: number }) => ({
    ...d,
    dateLabel: format(new Date(d.date), "M/d", { locale: zhCN }),
  }));
  const revenueData = (data.revenueTrend ?? []).map((d: { date: string; revenue: number }) => ({
    ...d,
    dateLabel: format(new Date(d.date), "M/d", { locale: zhCN }),
  }));

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold">概览</h1>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {stats.map((s) => (
          <div
            key={s.label}
            className="rounded-lg border bg-card p-4 shadow-sm"
          >
            <div className="flex items-center justify-between">
              <p className="text-muted-foreground text-sm">{s.label}</p>
              <s.icon className="h-4 w-4 text-muted-foreground" />
            </div>
            <p className="mt-2 text-2xl font-semibold">{s.value}</p>
          </div>
        ))}
      </div>
      <div className="grid gap-6 lg:grid-cols-2">
        <div className="rounded-lg border bg-card p-4 shadow-sm">
          <h2 className="mb-4 font-medium">用户增长趋势（近30天）</h2>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={growthData}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                <XAxis dataKey="dateLabel" tick={{ fontSize: 12 }} />
                <YAxis tick={{ fontSize: 12 }} />
                <Tooltip
                  formatter={(value: number) => [value, "新增"]}
                  labelFormatter={(label) => label}
                />
                <Area
                  type="monotone"
                  dataKey="count"
                  stroke="hsl(var(--primary))"
                  fill="hsl(var(--primary) / 0.2)"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>
        <div className="rounded-lg border bg-card p-4 shadow-sm">
          <h2 className="mb-4 font-medium">收入趋势（近30天）</h2>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={revenueData}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                <XAxis dataKey="dateLabel" tick={{ fontSize: 12 }} />
                <YAxis tick={{ fontSize: 12 }} />
                <Tooltip
                  formatter={(value: number) => [`¥${value}`, "收入"]}
                  labelFormatter={(label) => label}
                />
                <Area
                  type="monotone"
                  dataKey="revenue"
                  stroke="hsl(var(--primary))"
                  fill="hsl(var(--primary) / 0.2)"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
}
