"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect } from "react";
import { cn } from "@/lib/utils";
import {
  LayoutDashboard,
  Users,
  BarChart3,
  Activity,
  Settings,
  PanelLeftClose,
  PanelLeft,
  X,
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

  useEffect(() => {
    if (open) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [open]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && open) {
        onOpenChange(false);
      }
    };
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [open, onOpenChange]);

  return (
    <>
      <button
        type="button"
        onClick={() => onOpenChange(!open)}
        className={cn(
          "fixed z-50 rounded-lg border bg-background/80 backdrop-blur-sm p-2.5 lg:hidden",
          "transition-all duration-200 active:scale-95",
          "left-[max(1rem,var(--safe-area-inset-left))]",
          "top-[max(1rem,calc(var(--safe-area-inset-top)+0.25rem))]",
          "shadow-sm hover:shadow-md"
        )}
        aria-label="切换侧边栏"
      >
        {open ? <PanelLeftClose className="h-5 w-5" /> : <PanelLeft className="h-5 w-5" />}
      </button>

      <div
        className={cn(
          "fixed inset-0 z-30 bg-black/60 backdrop-blur-sm lg:hidden",
          "transition-opacity duration-300",
          open ? "opacity-100" : "opacity-0 pointer-events-none"
        )}
        onClick={() => onOpenChange(false)}
        aria-hidden
      />

      <aside
        className={cn(
          "fixed left-0 top-0 z-40 h-screen w-72 border-r bg-card/95 backdrop-blur-md",
          "transition-transform duration-300 ease-out lg:translate-x-0 lg:w-64",
          "safe-area-top safe-area-bottom safe-area-left",
          open ? "translate-x-0" : "-translate-x-full"
        )}
      >
        <div className="flex h-14 items-center justify-between border-b px-4 mt-[var(--safe-area-inset-top)]">
          <div className="flex items-center gap-2">
            <div className="h-8 w-8 rounded-lg bg-primary flex items-center justify-center">
              <span className="text-primary-foreground font-bold text-sm">C</span>
            </div>
            <span className="font-semibold">Contractor GO</span>
          </div>
          <button
            type="button"
            onClick={() => onOpenChange(false)}
            className="lg:hidden p-1.5 rounded-md hover:bg-muted transition-colors active:scale-95"
            aria-label="关闭侧边栏"
          >
            <X className="h-5 w-5 text-muted-foreground" />
          </button>
        </div>
        <nav className="flex flex-col gap-1 p-3">
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
                  "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium",
                  "transition-all duration-150 active:scale-[0.98]",
                  isActive
                    ? "bg-primary text-primary-foreground shadow-sm"
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
    </>
  );
}
