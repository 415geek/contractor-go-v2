import { useState, useCallback } from "react";

import {
  searchMaterialPrices,
  type MaterialSearchHit,
  type MaterialSearchResponse,
} from "@/lib/nova-act-search";

type MaterialSearchState = {
  isSearching: boolean;
  results: MaterialSearchResponse | null;
  error: Error | null;
};

export function useMaterialSearch() {
  const [state, setState] = useState<MaterialSearchState>({
    isSearching: false,
    results: null,
    error: null,
  });

  const searchMaterial = useCallback(
    async (imageUrls: string[], description?: string) => {
      setState((s) => ({ ...s, isSearching: true, error: null }));
      try {
        const results = await searchMaterialPrices({
          image_urls: imageUrls.length > 0 ? imageUrls : undefined,
          description: description || undefined,
        });
        setState({ isSearching: false, results, error: null });
        return results;
      } catch (e) {
        const err = e instanceof Error ? e : new Error(String(e));
        setState((s) => ({ ...s, isSearching: false, error: err }));
        throw err;
      }
    },
    []
  );

  const retry = useCallback(() => {
    setState((s) => ({ ...s, error: null, results: null }));
  }, []);

  return {
    searchMaterial,
    isSearching: state.isSearching,
    results: state.results,
    error: state.error,
    retry,
  };
}

export type { MaterialSearchHit, MaterialSearchResponse };
