import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@clerk/clerk-expo";

import { fetchAvailableNumbers } from "@/lib/api/voip";
import { supabase } from "@/lib/supabase";

export type VirtualNumber = {
  id: string;
  user_id: string;
  provider: string;
  phone_number: string;
  status: string;
  metadata?: { monthly_cost?: number };
  created_at?: string;
};

export type AvailableDid = {
  did: string;
  monthly: string;
  setup: string;
  province: string;
  ratecenter: string;
};

async function fetchMyNumbers(getToken: () => Promise<string | null>): Promise<VirtualNumber[]> {
  const token = await getToken();
  if (!token) throw new Error("Not authenticated");
  const { data, error } = await supabase.functions.invoke<{ data: VirtualNumber[]; error: string | null }>("voip-my-numbers", {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (error) throw error;
  if (data?.error) throw new Error(data.error as string);
  return data?.data ?? [];
}

async function searchAvailableNumbers(params: { area_code?: string; state?: string; ratecenter?: string }): Promise<AvailableDid[]> {
  return fetchAvailableNumbers(params);
}

async function purchaseNumber(
  getToken: () => Promise<string | null>,
  did: string,
  monthly?: string,
): Promise<VirtualNumber> {
  const token = await getToken();
  if (!token) throw new Error("Not authenticated");
  const { data, error } = await supabase.functions.invoke<{ data: VirtualNumber; error: string | null }>("voip-purchase-number", {
    method: "POST",
    headers: { Authorization: `Bearer ${token}` },
    body: { did, monthly },
  });
  if (error) throw error;
  if (data?.error) throw new Error(data.error as string);
  if (!data?.data) throw new Error("No data returned");
  return data.data;
}

export function useVirtualNumbers() {
  const qc = useQueryClient();
  const { getToken, isLoaded, isSignedIn } = useAuth();
  const query = useQuery({
    queryKey: ["virtualNumbers"],
    queryFn: () => fetchMyNumbers(getToken),
    enabled: isLoaded && !!isSignedIn,
  });
  const searchMutation = useMutation({
    mutationFn: searchAvailableNumbers,
  });
  const purchaseMutation = useMutation({
    mutationFn: ({ did, monthly }: { did: string; monthly?: string }) => purchaseNumber(getToken, did, monthly),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["virtualNumbers"] }),
  });
  return {
    numbers: query.data ?? [],
    isLoading: query.isLoading,
    error: query.error,
    refetch: query.refetch,
    searchAvailable: searchMutation.mutateAsync,
    searchLoading: searchMutation.isPending,
    searchError: searchMutation.error,
    purchase: purchaseMutation.mutateAsync,
    purchaseLoading: purchaseMutation.isPending,
    purchaseError: purchaseMutation.error,
  };
}
