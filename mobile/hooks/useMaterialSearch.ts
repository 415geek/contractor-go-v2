import { useAuth } from "@clerk/clerk-expo";
import { useCallback, useState } from "react";

import { searchMaterialPrices } from "@/lib/nova-act-search";
import type { MaterialSearchResponse } from "@/lib/nova-act-search";

type MaterialSearchState = {
  isSearching: boolean;
  results: MaterialSearchResponse | null;
  error: Error | null;
};

export function useMaterialSearch() {
  const { getToken } = useAuth();
  const [state, setState] = useState<MaterialSearchState>({
    isSearching: false,
    results: null,
    error: null,
  });

  const searchMaterial = useCallback(
    async (imageUrls: string[], description?: string, searchKeywords?: string[]) => {
      setState((s) => ({ ...s, isSearching: true, error: null }));
      try {
        const results = await searchMaterialPrices(getToken, {
          image_urls: imageUrls.length > 0 ? imageUrls : undefined,
          description: description || undefined,
          search_keywords: searchKeywords && searchKeywords.length > 0 ? searchKeywords : undefined,
        });
        setState({ isSearching: false, results, error: null });
        return results;
      } catch (e) {
        const err = e instanceof Error ? e : new Error(String(e));
        setState((s) => ({ ...s, isSearching: false, error: err }));
        throw err;
      }
    },
    [getToken],
  );

  /** 清空结果与错误，保留表单（材料不对时重新搜） */
  const clearResults = useCallback(() => {
    setState({ isSearching: false, results: null, error: null });
  }, []);

  return {
    searchMaterial,
    isSearching: state.isSearching,
    results: state.results,
    error: state.error,
    clearResults,
  };
}

export type { MaterialSearchHit, MaterialSearchResponse } from "@/lib/nova-act-search";
