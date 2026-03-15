"use client";

import { useState } from "react";
import Link from "next/link";
import type { UserRow } from "@/hooks/useUsers";
import { format } from "date-fns";
import { zhCN } from "date-fns/locale";
import { Eye } from "lucide-react";
import { cn } from "@/lib/utils";

const tierLabels: Record<string, string> = {
  free: "免费",
  basic: "基础",
  pro: "专业",
};

export function UserTable({
  data,
  total,
  page,
  pageSize,
  onPageChange,
  onSort,
  sortKey,
  sortOrder,
}: {
  data: UserRow[];
  total: number;
  page: number;
  pageSize: number;
  onPageChange: (p: number) => void;
  onSort?: (key: string) => void;
  sortKey?: string;
  sortOrder?: "asc" | "desc";
}) {
  const totalPages = Math.ceil(total / pageSize) || 1;

  return (
    <div className="rounded-md border">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b bg-muted/50">
            <th className="px-4 py-3 text-left font-medium">用户名</th>
            <th className="px-4 py-3 text-left font-medium">手机号</th>
            <th className="px-4 py-3 text-left font-medium">订阅等级</th>
            <th className="px-4 py-3 text-left font-medium">虚拟号码数</th>
            <th className="px-4 py-3 text-left font-medium">消息数</th>
            <th className="px-4 py-3 text-left font-medium">项目数</th>
            <th className="px-4 py-3 text-left font-medium">注册时间</th>
            <th className="px-4 py-3 text-right font-medium">操作</th>
          </tr>
        </thead>
        <tbody>
          {data.map((row) => (
            <tr key={row.id} className="border-b hover:bg-muted/30">
              <td className="px-4 py-3">{row.display_name ?? row.email ?? "—"}</td>
              <td className="px-4 py-3">{row.phone ?? "—"}</td>
              <td>
                <span
                  className={cn(
                    "inline-flex rounded-full px-2 py-0.5 text-xs font-medium",
                    row.subscription_tier === "pro" && "bg-primary/20 text-primary",
                    row.subscription_tier === "basic" && "bg-muted text-muted-foreground",
                    (!row.subscription_tier || row.subscription_tier === "free") && "bg-muted/80 text-muted-foreground"
                  )}
                >
                  {tierLabels[row.subscription_tier ?? "free"] ?? row.subscription_tier ?? "免费"}
                </span>
              </td>
              <td className="px-4 py-3">{row.virtual_number_count}</td>
              <td className="px-4 py-3">{row.message_count}</td>
              <td className="px-4 py-3">{row.project_count}</td>
              <td className="px-4 py-3 text-muted-foreground">
                {row.created_at ? format(new Date(row.created_at), "yyyy-MM-dd HH:mm", { locale: zhCN }) : "—"}
              </td>
              <td className="px-4 py-3 text-right">
                <Link
                  href={`/users/${row.id}`}
                  className="inline-flex items-center gap-1 rounded p-1 hover:bg-muted"
                >
                  <Eye className="h-4 w-4" /> 查看详情
                </Link>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      {totalPages > 1 && (
        <div className="flex items-center justify-between border-t px-4 py-2">
          <span className="text-muted-foreground text-sm">
            共 {total} 条，第 {page} / {totalPages} 页
          </span>
          <div className="flex gap-2">
            <button
              type="button"
              disabled={page <= 1}
              onClick={() => onPageChange(page - 1)}
              className="rounded border px-2 py-1 text-sm disabled:opacity-50"
            >
              上一页
            </button>
            <button
              type="button"
              disabled={page >= totalPages}
              onClick={() => onPageChange(page + 1)}
              className="rounded border px-2 py-1 text-sm disabled:opacity-50"
            >
              下一页
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
