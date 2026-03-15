"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";

export type SubscriptionTier = "free" | "basic" | "pro";

export type UserPermissions = {
  voip?: {
    canPurchaseNumber?: boolean;
    maxNumbers?: number;
    sms?: boolean;
    voice?: boolean;
  };
  translation?: {
    enabled?: boolean;
    voiceEnabled?: boolean;
    monthlyTokenLimit?: number;
  };
  project?: {
    maxProjects?: number;
    aiPlanEnabled?: boolean;
    materialListEnabled?: boolean;
  };
  tools?: {
    materialPriceCompare?: boolean;
    houseEstimate?: boolean;
    arMeasure?: boolean;
    blueprint?: boolean;
    permit?: boolean;
  };
};

export type UserRow = {
  id: string;
  email?: string | null;
  phone?: string | null;
  display_name?: string | null;
  subscription_tier?: SubscriptionTier;
  subscription_expires_at?: string | null;
  created_at: string;
  virtual_number_count: number;
  message_count: number;
  project_count: number;
  permissions: UserPermissions;
};

export type UserDetail = UserRow & {
  virtual_numbers: { id: string; phone_number: string; status: string; purchased_at: string }[];
  projects: { id: string; name: string; status: string; created_at: string }[];
  message_count: number;
};

const fetchJson = async (url: string) => {
  const res = await fetch(url);
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || res.statusText);
  }
  return res.json();
};

export function useDashboardStats() {
  return useQuery({
    queryKey: ["admin", "stats"],
    queryFn: () => fetchJson("/api/admin/stats"),
  });
}

export function useUsersList(params: { page: number; pageSize: number; search: string; tier: string }) {
  const search = new URLSearchParams({
    page: String(params.page),
    pageSize: String(params.pageSize),
    search: params.search,
    tier: params.tier,
  });
  return useQuery({
    queryKey: ["admin", "users", params],
    queryFn: () => fetchJson(`/api/admin/users?${search}`),
  });
}

export function useUserDetail(id: string | null) {
  return useQuery({
    queryKey: ["admin", "users", id],
    queryFn: () => fetchJson(`/api/admin/users/${id}`),
    enabled: !!id,
  });
}

export function useUpdatePermissions(userId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (permissions: UserPermissions) =>
      fetch(`/api/admin/users/${userId}/permissions`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(permissions),
      }).then((r) => (r.ok ? r.json() : r.json().then((e) => Promise.reject(new Error(e.error))))),
    onSuccess: (_, __, ctx) => {
      qc.invalidateQueries({ queryKey: ["admin", "users", userId] });
      qc.invalidateQueries({ queryKey: ["admin", "users"] });
    },
  });
}

export function useUpdateSubscription(userId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: { subscription_tier?: SubscriptionTier; subscription_expires_at?: string | null }) =>
      fetch(`/api/admin/users/${userId}/subscription`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      }).then((r) => (r.ok ? r.json() : r.json().then((e) => Promise.reject(new Error(e.error))))),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin", "users", userId] });
      qc.invalidateQueries({ queryKey: ["admin", "users"] });
    },
  });
}
