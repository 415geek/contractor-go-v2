import { useState, useCallback } from "react";
import { useAuth } from "@clerk/clerk-expo";

import { searchPermitViaEdge, type PermitSearchApiResult } from "@/lib/api/permit-search";

export type PropertyInfo = {
  lot_size_sqft?: number;
  year_built?: number;
  zoning?: string;
  bedrooms?: number;
  bathrooms?: number;
};

export type PermitItem = {
  permit_number?: string;
  type?: string;
  description?: string;
  status?: "approved" | "pending" | "finaled";
  issued_date?: string;
  estimated_cost?: number;
};

export type PermitSearchResult = {
  address: string;
  city?: string;
  property_info: PropertyInfo | null;
  permit_history: PermitItem[];
  key_insights: string[];
};

/** 与 Edge `search-permit` / `permit-open-data.ts` 一致（开放 API 可接入的城市） */
const SUPPORTED_CITIES = ["San Francisco", "San Jose"];

function normalizeResult(data: PermitSearchApiResult): PermitSearchResult {
  return {
    address: data.address,
    city: data.city,
    property_info: (data.property_info ?? null) as PropertyInfo | null,
    permit_history: (data.permit_history ?? []) as PermitItem[],
    key_insights: Array.isArray(data.key_insights) ? data.key_insights : [],
  };
}

export function usePermitSearch() {
  const [isSearching, setIsSearching] = useState(false);
  const [result, setResult] = useState<PermitSearchResult | null>(null);
  const [error, setError] = useState<Error | null>(null);
  const { getToken: _getToken } = useAuth();
  const getToken = () => _getToken();

  const searchPermit = useCallback(async (address: string) => {
    const trimmed = address.trim();
    if (!trimmed) return;
    setIsSearching(true);
    setError(null);
    setResult(null);
    try {
      const token = await getToken();
      if (!token) throw new Error("Not authenticated");
      const data = await searchPermitViaEdge(token, trimmed);
      setResult(normalizeResult(data));
    } catch (e) {
      const err = e instanceof Error ? e : new Error(String(e));
      setError(err);
      throw err;
    } finally {
      setIsSearching(false);
    }
  }, [_getToken]);

  return {
    searchPermit,
    isSearching,
    result,
    error,
    supportedCities: SUPPORTED_CITIES,
  };
}
