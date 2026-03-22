import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@clerk/clerk-expo";

import { fetchAvailableNumbers, purchaseVoipNumber } from "@/lib/api/voip";
import { invokeEdgeWithClerk } from "@/lib/api/edge-functions";
import { ME_PROFILE_QUERY_KEY } from "@/hooks/useMeProfile";

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
  return invokeEdgeWithClerk<VirtualNumber[]>("voip-my-numbers", token, { method: "GET" });
}

async function searchAvailableNumbers(params: { area_code?: string; state?: string; ratecenter?: string }): Promise<AvailableDid[]> {
  return fetchAvailableNumbers(params);
}

async function purchaseNumber(
  getToken: () => Promise<string | null>,
  did: string,
  monthly?: string,
  setup?: string,
): Promise<VirtualNumber> {
  const token = await getToken();
  if (!token) throw new Error("Not authenticated");
  return purchaseVoipNumber(token, { did, monthly, setup }) as VirtualNumber;
}

export function useVirtualNumbers() {
  const qc = useQueryClient();
  const { getToken: _getToken, isLoaded, isSignedIn } = useAuth();
  const getToken = () => _getToken();
  const query = useQuery({
    queryKey: ["virtualNumbers"],
    queryFn: () => fetchMyNumbers(getToken),
    enabled: isLoaded && !!isSignedIn,
  });
  const searchMutation = useMutation({
    mutationFn: searchAvailableNumbers,
  });
  const purchaseMutation = useMutation({
    mutationFn: ({ did, monthly, setup }: { did: string; monthly?: string; setup?: string }) =>
      purchaseNumber(getToken, did, monthly, setup),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ["virtualNumbers"] });
      void qc.invalidateQueries({ queryKey: ME_PROFILE_QUERY_KEY });
    },
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
