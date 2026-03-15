"use client";

import { useQuery } from "@tanstack/react-query";

const fetchJson = async (url: string) => {
  const res = await fetch(url);
  if (!res.ok) throw new Error(await res.text());
  return res.json();
};

export function useAnalytics(range: "7" | "30" | "90") {
  return useQuery({
    queryKey: ["admin", "analytics", range],
    queryFn: () => fetchJson(`/api/admin/analytics?range=${range}`),
  });
}
