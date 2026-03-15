"use client";

import { formatDistanceToNow } from "date-fns";
import { zhCN } from "date-fns/locale";
import { Smartphone, Monitor } from "lucide-react";

type Activity = {
  user_id?: string;
  session_id?: string;
  page_path?: string;
  action_type?: string;
  device_type?: string;
  created_at: string;
  payload?: { ip_address?: string };
};

export function RealtimeActivityFeed({ activities }: { activities: Activity[] }) {
  const maskIp = (ip?: string) => {
    if (!ip) return "—";
    const parts = String(ip).split(".");
    if (parts.length === 4) return `${parts[0]}.***.***.${parts[3]}`;
    return "***";
  };

  return (
    <ul className="space-y-2">
      {activities.length === 0 && (
        <li className="text-muted-foreground text-sm">暂无活动</li>
      )}
      {activities.map((a, i) => (
        <li
          key={`${a.session_id}-${a.created_at}-${i}`}
          className="flex items-start gap-2 rounded border bg-card px-3 py-2 text-sm"
        >
          <span className="shrink-0 pt-0.5">
            {a.device_type === "ios" || a.device_type === "android" ? (
              <Smartphone className="h-4 w-4 text-muted-foreground" />
            ) : (
              <Monitor className="h-4 w-4 text-muted-foreground" />
            )}
          </span>
          <div className="min-w-0 flex-1">
            <p className="font-medium">{a.page_path || a.action_type || "—"}</p>
            <p className="text-muted-foreground text-xs">
              IP: {maskIp(a.payload?.ip_address as string)} ·{" "}
              {formatDistanceToNow(new Date(a.created_at), { addSuffix: true, locale: zhCN })}
            </p>
          </div>
        </li>
      ))}
    </ul>
  );
}
