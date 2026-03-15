"use client";

import { useState, useCallback } from "react";
import { useUsersList } from "@/hooks/useUsers";
import { UserTable } from "@/components/users/UserTable";

const tierOptions = [
  { value: "", label: "全部" },
  { value: "free", label: "免费" },
  { value: "basic", label: "基础" },
  { value: "pro", label: "专业" },
];

export default function UsersPage() {
  const [page, setPage] = useState(1);
  const [pageSize] = useState(20);
  const [search, setSearch] = useState("");
  const [tier, setTier] = useState("");
  const [searchInput, setSearchInput] = useState("");

  const { data, isLoading, error } = useUsersList({
    page,
    pageSize,
    search,
    tier,
  });

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSearch(searchInput);
    setPage(1);
  };

  const handleExportCsv = useCallback(() => {
    if (!data?.data?.length) return;
    const headers = ["用户名", "手机号", "邮箱", "订阅等级", "虚拟号码数", "消息数", "项目数", "注册时间"];
    const rows = data.data.map((u: { display_name?: string; phone?: string; email?: string; subscription_tier?: string; virtual_number_count: number; message_count: number; project_count: number; created_at: string }) =>
      [
        u.display_name ?? "",
        u.phone ?? "",
        u.email ?? "",
        u.subscription_tier ?? "free",
        u.virtual_number_count,
        u.message_count,
        u.project_count,
        u.created_at ? new Date(u.created_at).toLocaleString("zh-CN") : "",
      ].join(",")
    );
    const csv = [headers.join(","), ...rows].join("\n");
    const blob = new Blob(["\uFEFF" + csv], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `users-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }, [data]);

  if (error) {
    return (
      <div className="rounded-lg border border-destructive/50 bg-destructive/10 p-4 text-destructive">
        加载失败: {(error as Error).message}
      </div>
    );
  }

  const list = data?.data ?? [];
  const total = data?.total ?? 0;

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-semibold">用户管理</h1>
      <div className="flex flex-wrap items-center gap-4">
        <form onSubmit={handleSearchSubmit} className="flex gap-2">
          <input
            type="search"
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            placeholder="手机号 / 姓名"
            className="rounded-md border border-input bg-background px-3 py-2 text-sm"
          />
          <button
            type="submit"
            className="rounded-md bg-primary px-3 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90"
          >
            搜索
          </button>
        </form>
        <select
          value={tier}
          onChange={(e) => {
            setTier(e.target.value);
            setPage(1);
          }}
          className="rounded-md border border-input bg-background px-3 py-2 text-sm"
        >
          {tierOptions.map((o) => (
            <option key={o.value} value={o.value}>
              {o.label}
            </option>
          ))}
        </select>
        <button
          type="button"
          onClick={handleExportCsv}
          disabled={list.length === 0}
          className="rounded-md border px-3 py-2 text-sm hover:bg-muted disabled:opacity-50"
        >
          导出 CSV
        </button>
      </div>
      {isLoading ? (
        <div className="text-muted-foreground">加载中…</div>
      ) : (
        <UserTable
          data={list}
          total={total}
          page={page}
          pageSize={pageSize}
          onPageChange={setPage}
        />
      )}
    </div>
  );
}
