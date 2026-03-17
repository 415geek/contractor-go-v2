"use client";

import { useState } from "react";
import { useClerk } from "@clerk/nextjs";
import { ChevronDown, LogOut, User } from "lucide-react";

export function Header({ onMenuClick }: { onMenuClick?: () => void }) {
  const [open, setOpen] = useState(false);
  const { signOut } = useClerk();

  async function handleLogout() {
    await signOut({ redirectUrl: "/login" });
  }

  return (
    <header className="sticky top-0 z-20 flex h-14 items-center justify-between border-b bg-background px-4 lg:px-6">
      <button
        type="button"
        onClick={onMenuClick}
        className="rounded-md p-1 hover:bg-muted lg:hidden"
        aria-label="菜单"
      >
        <span className="sr-only">打开菜单</span>
      </button>
      <div className="flex-1" />
      <div className="relative">
        <button
          type="button"
          onClick={() => setOpen((o) => !o)}
          className="flex items-center gap-2 rounded-full border p-1.5 hover:bg-muted"
        >
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10">
            <User className="h-4 w-4 text-primary" />
          </div>
          <ChevronDown className="h-4 w-4 text-muted-foreground" />
        </button>
        {open && (
          <>
            <div
              className="fixed inset-0 z-40"
              onClick={() => setOpen(false)}
              aria-hidden
            />
            <div className="absolute right-0 top-full z-50 mt-1 w-48 rounded-md border bg-popover py-1 shadow-md">
              <button
                type="button"
                onClick={() => {
                  setOpen(false);
                  handleLogout();
                }}
                className="flex w-full items-center gap-2 px-3 py-2 text-sm text-foreground hover:bg-muted"
              >
                <LogOut className="h-4 w-4" />
                退出登录
              </button>
            </div>
          </>
        )}
      </div>
    </header>
  );
}
