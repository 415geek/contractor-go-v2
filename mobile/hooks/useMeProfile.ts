import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@clerk/clerk-expo";

import { fetchMeProfile, type MeProfileData } from "@/lib/api/me-profile";

export const ME_PROFILE_QUERY_KEY = ["meProfile"] as const;

export function useMeProfile() {
  const { getToken: _getToken, isLoaded, isSignedIn } = useAuth();
  const getToken = () => _getToken();

  return useQuery<MeProfileData, Error>({
    queryKey: ME_PROFILE_QUERY_KEY,
    queryFn: async () => {
      const token = await getToken();
      if (!token) throw new Error("Not authenticated");
      return fetchMeProfile(token);
    },
    enabled: isLoaded && !!isSignedIn,
    staleTime: 60 * 1000,
  });
}

export function useInvalidateMeProfile() {
  const qc = useQueryClient();
  return () => qc.invalidateQueries({ queryKey: ME_PROFILE_QUERY_KEY });
}
