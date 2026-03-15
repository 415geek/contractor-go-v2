"use client";

import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { useUserDetail, useUpdatePermissions, useUpdateSubscription } from "@/hooks/useUsers";
import { PermissionEditor as PermissionEditorComponent } from "@/components/users/PermissionEditor";
import { format } from "date-fns";
import { zhCN } from "date-fns/locale";
import { ArrowLeft } from "lucide-react";
import { useState } from "react";

const tierLabels: Record<string, string> = {
  free: "免费",
  basic: "基础",
  pro: "专业",
};

export default function UserDetailPage() {
  const params = useParams();
  const id = params.id as string;
  const router = useRouter();
  const { data: user, isLoading, error } = useUserDetail(id);
  const updatePerms = useUpdatePermissions(id);
  const updateSub = useUpdateSubscription(id);
  const [tab, setTab] = useState<"overview" | "permissions" | "analytics" | "subscription">("overview");

  if (isLoading || !user) {
    return <div className="text-muted-foreground">加载中…</div>;
  }
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
        <Link
          href="/users"
          className="rounded p-1 hover:bg-muted"
        >
          <ArrowLeft className="h-5 w-5" />
        </Link>
        <h1 className="text-2xl font-semibold">用户详情</h1>
      </div>

      <div className="flex gap-2 border-b">
        {(["overview", "permissions", "analytics", "subscription"] as const).map((t) => (
          <button
            key={t}
            type="button"
            onClick={() => setTab(t)}
            className={`border-b-2 px-4 py-2 text-sm font-medium ${
              tab === t ? "border-primary text-primary" : "border-transparent text-muted-foreground hover:text-foreground"
            }`}
          >
            {t === "overview" && "概览"}
            {t === "permissions" && "权限管理"}
            {t === "analytics" && "行为分析"}
            {t === "subscription" && "订阅管理"}
          </button>
        ))}
      </div>

      {tab === "overview" && (
        <div className="space-y-4">
          <div className="rounded-lg border p-4">
            <h2 className="mb-3 font-medium">基本信息</h2>
            <dl className="grid gap-2 sm:grid-cols-2">
              <dt className="text-muted-foreground text-sm">用户名</dt>
              <dd>{user.display_name ?? user.email ?? "—"}</dd>
              <dt className="text-muted-foreground text-sm">手机号</dt>
              <dd>{user.phone ?? "—"}</dd>
              <dt className="text-muted-foreground text-sm">邮箱</dt>
              <dd>{user.email ?? "—"}</dd>
              <dt className="text-muted-foreground text-sm">注册时间</dt>
              <dd>{user.created_at ? format(new Date(user.created_at), "yyyy-MM-dd HH:mm", { locale: zhCN }) : "—"}</dd>
            </dl>
          </div>
          <div className="rounded-lg border p-4">
            <h2 className="mb-3 font-medium">统计数据</h2>
            <p>虚拟号码数: {(user as { virtual_numbers?: unknown[] }).virtual_numbers?.length ?? 0}</p>
            <p>消息数: {(user as { message_count?: number }).message_count ?? 0}</p>
            <p>项目数: {(user as { projects?: unknown[] }).projects?.length ?? 0}</p>
          </div>
          <div className="rounded-lg border p-4">
            <h2 className="mb-3 font-medium">虚拟号码列表</h2>
            <ul className="space-y-1 text-sm">
              {((user as { virtual_numbers?: { phone_number: string; status: string }[] }).virtual_numbers ?? []).map((vn) => (
                <li key={vn.phone_number}>
                  {vn.phone_number} — {vn.status}
                </li>
              ))}
              {((user as { virtual_numbers?: unknown[] }).virtual_numbers?.length ?? 0) === 0 && (
                <li className="text-muted-foreground">暂无</li>
              )}
            </ul>
          </div>
        </div>
      )}

      {tab === "permissions" && (
        <PermissionEditorComponent
          permissions={user.permissions ?? {}}
          onSave={(p) => updatePerms.mutate(p)}
          saving={updatePerms.isPending}
        />
      )}

      {tab === "analytics" && (
        <div className="rounded-lg border p-4">
          <p className="text-muted-foreground text-sm">该用户的行为时间线需在行为分析中按用户筛选查看，或接入实时活动流。</p>
        </div>
      )}

      {tab === "subscription" && (
        <div className="space-y-4 rounded-lg border p-4">
          <h2 className="font-medium">当前订阅</h2>
          <p>
            等级: {tierLabels[user.subscription_tier ?? "free"] ?? user.subscription_tier}
          </p>
          <p className="text-muted-foreground text-sm">
            到期: {user.subscription_expires_at ? format(new Date(user.subscription_expires_at), "yyyy-MM-dd", { locale: zhCN }) : "—"}
          </p>
          <div className="flex gap-2">
            {(["free", "basic", "pro"] as const).map((t) => (
              <button
                key={t}
                type="button"
                onClick={() => updateSub.mutate({ subscription_tier: t })}
                disabled={updateSub.isPending || user.subscription_tier === t}
                className="rounded-md border px-3 py-1.5 text-sm disabled:opacity-50"
              >
                {tierLabels[t]}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
