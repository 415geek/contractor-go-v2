import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@clerk/clerk-expo";

import { fetchMeProfile, type MeProfileData } from "@/lib/api/me-profile";
import { getClerkSessionTokenForEdge } from "@/lib/clerk-session-token";

export const ME_PROFILE_QUERY_KEY = ["meProfile"] as const;

export function useMeProfile() {
  const { getToken: _getToken, isLoaded, isSignedIn, sessionId } = useAuth();
  const getToken = () => _getToken();

  return useQuery<MeProfileData, Error>({
    queryKey: ME_PROFILE_QUERY_KEY,
    queryFn: async () => {
      const token = await getClerkSessionTokenForEdge(getToken);
      return fetchMeProfile(token);
    },
    enabled: isLoaded && !!isSignedIn && !!sessionId,
    staleTime: 60 * 1000,
  });
}

export function useInvalidateMeProfile() {
  const qc = useQueryClient();
  return () => qc.invalidateQueries({ queryKey: ME_PROFILE_QUERY_KEY });
}
