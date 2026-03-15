import { supabase } from "@/lib/supabase";

export type MaterialSearchHit = {
  product_name: string;
  price: string;
  image_url: string;
  product_url: string;
  store: "HomeDepot" | "Lowes";
  stock_status: "in_stock" | "out_of_stock" | "unknown";
};

export type MaterialSearchPayload = {
  image_urls?: string[];
  description?: string;
};

export type MaterialSearchResponse = {
  ai_recognized: Record<string, unknown>;
  in_stock: MaterialSearchHit[];
  out_of_stock: MaterialSearchHit[];
  unknown_stock: MaterialSearchHit[];
  search_id: string | null;
};

export async function searchMaterialPrices(
  payload: MaterialSearchPayload
): Promise<MaterialSearchResponse> {
  const { data: { session } } = await supabase.auth.getSession();
  if (!session?.access_token) throw new Error("Not authenticated");
  const { data, error } = await supabase.functions.invoke<{
    data?: MaterialSearchResponse;
    error?: string;
  }>("search-material", {
    method: "POST",
    headers: { Authorization: `Bearer ${session.access_token}` },
    body: payload,
  });
  if (error) throw error;
  if (data?.error) throw new Error(String(data.error));
  if (!data?.data) throw new Error("No data returned");
  return data.data;
}
