import { useState, useCallback } from "react";
import { useAuth } from "@clerk/clerk-expo";

import { supabase } from "@/lib/supabase";

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

const SUPPORTED_CITIES = ["San Francisco", "Oakland", "San Jose"];

export function usePermitSearch() {
  const [isSearching, setIsSearching] = useState(false);
  const [result, setResult] = useState<PermitSearchResult | null>(null);
  const [error, setError] = useState<Error | null>(null);
  const { getToken: _getToken } = useAuth();
  const getToken = () => _getToken({ template: 'supabase' });

  const searchPermit = useCallback(async (address: string) => {
    const trimmed = address.trim();
    if (!trimmed) return;
    setIsSearching(true);
    setError(null);
    setResult(null);
    try {
      const token = await getToken();
      if (!token) throw new Error("Not authenticated");
      const { data, error: fnError } = await supabase.functions.invoke<{
        data?: PermitSearchResult & { city?: string };
        error?: string;
        supported_cities?: string[];
      }>("search-permit", {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
        body: { address: trimmed },
      });
      if (data?.error === "unsupported_city") {
        setError(new Error(`该地址所在城市暂不支持，支持城市: ${(data.supported_cities ?? SUPPORTED_CITIES).join(", ")}`));
        return;
      }
      if (fnError) throw fnError;
      if (data?.error) throw new Error(String(data.error));
      if (data?.data) setResult(data.data);
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
