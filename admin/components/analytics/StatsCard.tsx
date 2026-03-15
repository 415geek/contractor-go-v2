"use client";

import { TrendingUp, TrendingDown } from "lucide-react";

type Props = {
  title: string;
  value: string | number;
  trend?: "up" | "down";
  changePercent?: number;
};

export function StatsCard({ title, value, trend, changePercent }: Props) {
  return (
    <div className="rounded-lg border bg-card p-4 shadow-sm">
      <p className="text-muted-foreground text-sm">{title}</p>
      <div className="mt-2 flex items-center gap-2">
        <span className="text-2xl font-semibold">{value}</span>
        {trend !== undefined && changePercent !== undefined && (
          <span
            className={`flex items-center gap-0.5 text-sm ${
              trend === "up" ? "text-green-600" : "text-red-600"
            }`}
          >
            {trend === "up" ? <TrendingUp className="h-4 w-4" /> : <TrendingDown className="h-4 w-4" />}
            {changePercent}%
          </span>
        )}
      </div>
    </div>
  );
}
