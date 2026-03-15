"use client";

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

type Item = { path: string; avgDuration: number };

export function PageDurationChart({ data }: { data: Item[] }) {
  const chartData = data.map((d) => ({
    name: d.path.length > 20 ? d.path.slice(0, 20) + "…" : d.path,
    fullPath: d.path,
    duration: d.avgDuration,
  }));

  return (
    <div className="h-64">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={chartData} layout="vertical" margin={{ left: 24 }}>
          <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
          <XAxis type="number" tick={{ fontSize: 12 }} unit="ms" />
          <YAxis type="category" dataKey="name" width={120} tick={{ fontSize: 11 }} />
          <Tooltip
            formatter={(value: number) => [`${value} ms`, "平均停留"]}
            labelFormatter={(_, payload) => payload[0]?.payload?.fullPath ?? ""}
          />
          <Bar dataKey="duration" fill="hsl(var(--primary) / 0.8)" radius={4} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
