"use client";

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from "recharts";

const STEPS = [
  { key: "visit", label: "访问" },
  { key: "browse", label: "浏览功能" },
  { key: "register", label: "注册" },
  { key: "subscribe", label: "订阅" },
];

type FunnelData = { visit?: number; browse?: number; register?: number; subscribe?: number };

export function FunnelChart({ data }: { data: FunnelData }) {
  const chartData = STEPS.map((s) => ({
    name: s.label,
    value: Number((data as Record<string, number>)[s.key]) ?? 0,
  })).filter((d) => d.value >= 0);
  const colors = ["hsl(var(--primary))", "hsl(var(--primary) / 0.8)", "hsl(var(--primary) / 0.6)", "hsl(var(--primary) / 0.4)"];

  return (
    <div className="h-64">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={chartData} layout="vertical" margin={{ left: 60 }}>
          <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
          <XAxis type="number" tick={{ fontSize: 12 }} />
          <YAxis type="category" dataKey="name" width={56} tick={{ fontSize: 12 }} />
          <Tooltip />
          <Bar dataKey="value" radius={4}>
            {chartData.map((_, i) => (
              <Cell key={i} fill={colors[i % colors.length]} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
