import { useState, useCallback } from "react";
import { useAuth } from "@clerk/clerk-expo";

import { supabase } from "@/lib/supabase";

export type EstimateSegment = {
  id: string;
  material_type?: string;
  material_name?: string;
  quantity?: { value: number; unit: string };
  price_per_unit?: { min: number; max: number };
  total_price?: { min: number; max: number };
};

export type TotalEstimate = {
  materials_only?: { min: number; max: number };
  with_labor?: { min: number; max: number };
};

export type HouseEstimateResult = {
  room_type?: string;
  quality_level?: string;
  segments: EstimateSegment[];
  total_estimate: TotalEstimate;
  estimate_id?: string | null;
};

export function useHouseEstimate() {
  const [isEstimating, setIsEstimating] = useState(false);
  const [result, setResult] = useState<HouseEstimateResult | null>(null);
  const [error, setError] = useState<Error | null>(null);
  const { getToken: _getToken } = useAuth();
  const getToken = () => _getToken({ template: 'supabase' });

  const estimateHouse = useCallback(async (imageUrls: string[]) => {
    if (imageUrls.length === 0) return;
    setIsEstimating(true);
    setError(null);
    setResult(null);
    try {
      const token = await getToken();
      if (!token) throw new Error("Not authenticated");
      const { data, error: fnError } = await supabase.functions.invoke<{
        data?: HouseEstimateResult;
        error?: string;
      }>("estimate-house", {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
        body: { image_urls: imageUrls },
      });
      if (fnError) throw fnError;
      if (data?.error) throw new Error(String(data.error));
      if (data?.data) setResult(data.data);
    } catch (e) {
      const err = e instanceof Error ? e : new Error(String(e));
      setError(err);
      throw err;
    } finally {
      setIsEstimating(false);
    }
  }, [_getToken]);

  const retrySegment = useCallback(async (_segmentId: string, _imageUrls: string[]) => {
    await estimateHouse(_imageUrls);
  }, [estimateHouse]);

  return { estimateHouse, isEstimating, result, error, retrySegment };
}
