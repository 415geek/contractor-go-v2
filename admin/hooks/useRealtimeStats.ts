"use client";

import { useQuery } from "@tanstack/react-query";

const fetchJson = async (url: string) => {
  const res = await fetch(url, { cache: "no-store" });
  if (!res.ok) throw new Error(await res.text());
  return res.json();
};

export function useRealtimeStats() {
  return useQuery({
    queryKey: ["admin", "realtime"],
    queryFn: () => fetchJson("/api/admin/analytics/realtime"),
    refetchInterval: 5000,
  });
}
