"use client";

import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { format } from "date-fns";
import { zhCN } from "date-fns/locale";

type Item = { date: string; retained: number };

export function RetentionChart({ data }: { data: Item[] }) {
  const chartData = data.map((d) => ({
    ...d,
    dateLabel: format(new Date(d.date), "M/d", { locale: zhCN }),
  }));

  return (
    <div className="h-64">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={chartData}>
          <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
          <XAxis dataKey="dateLabel" tick={{ fontSize: 12 }} />
          <YAxis tick={{ fontSize: 12 }} />
          <Tooltip
            formatter={(value: number) => [value, "留存"]}
            labelFormatter={(label) => label}
          />
          <Line
            type="monotone"
            dataKey="retained"
            stroke="hsl(var(--primary))"
            strokeWidth={2}
            dot={{ r: 2 }}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
