"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import {
  LayoutDashboard,
  Users,
  BarChart3,
  Activity,
  Settings,
  PanelLeftClose,
  PanelLeft,
} from "lucide-react";

const nav = [
  { label: "概览", href: "/", icon: LayoutDashboard },
  { label: "用户管理", href: "/users", icon: Users },
  { label: "行为分析", href: "/analytics", icon: BarChart3 },
  { label: "实时监控", href: "/analytics/realtime", icon: Activity },
  { label: "系统配置", href: "/system", icon: Settings },
];

export function Sidebar({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const pathname = usePathname();

  return (
    <>
      <button
        type="button"
        onClick={() => onOpenChange(!open)}
        className="fixed left-4 top-4 z-50 rounded-md border bg-background p-2 lg:hidden"
        aria-label="切换侧边栏"
      >
        {open ? <PanelLeftClose className="h-5 w-5" /> : <PanelLeft className="h-5 w-5" />}
      </button>
      <aside
        className={cn(
          "fixed left-0 top-0 z-40 h-screen w-64 border-r bg-card transition-transform lg:translate-x-0",
          open ? "translate-x-0" : "-translate-x-full"
        )}
      >
        <div className="flex h-14 items-center gap-2 border-b px-4">
          <span className="font-semibold">Contractor GO</span>
        </div>
        <nav className="flex flex-col gap-1 p-2">
          {nav.map((item) => {
            const isActive =
              item.href === "/"
                ? pathname === "/"
                : pathname.startsWith(item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => onOpenChange(false)}
                className={cn(
                  "flex items-center gap-2 rounded-md px-3 py-2 text-sm font-medium transition-colors",
                  isActive
                    ? "bg-primary text-primary-foreground"
                    : "text-muted-foreground hover:bg-muted hover:text-foreground"
                )}
              >
                <item.icon className="h-4 w-4 shrink-0" />
                {item.label}
              </Link>
            );
          })}
        </nav>
      </aside>
      {open && (
        <div
          className="fixed inset-0 z-30 bg-black/50 lg:hidden"
          onClick={() => onOpenChange(false)}
          aria-hidden
        />
      )}
    </>
  );
}
