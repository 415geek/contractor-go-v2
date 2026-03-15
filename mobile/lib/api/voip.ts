const getFunctionsUrl = () => {
  const url = process.env.EXPO_PUBLIC_SUPABASE_URL;
  const key = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key) throw new Error("Missing Supabase env");
  return { url, key };
};

export async function fetchAvailableNumbers(params: {
  area_code?: string;
  state?: string;
  ratecenter?: string;
}): Promise<{ did: string; monthly: string; setup: string; province: string; ratecenter: string }[]> {
  const { url, key } = getFunctionsUrl();
  const search = new URLSearchParams(params as Record<string, string>);
  const res = await fetch(`${url}/functions/v1/voip-available-numbers?${search.toString()}`, {
    method: "GET",
    headers: {
      Authorization: `Bearer ${key}`,
      "Content-Type": "application/json",
    },
  });
  const json = await res.json();
  if (json.error) throw new Error(json.message ?? json.error);
  return json.data ?? [];
}
