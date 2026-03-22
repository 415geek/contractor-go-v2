/**
 * Telnyx REST API v2
 * @see https://developers.telnyx.com/docs/overview
 * - 号码搜索: GET /available_phone_numbers
 * - 订购: POST /number_orders
 * - 发短信: POST /messages
 */

const TELNYX_API_BASE = "https://api.telnyx.com/v2";

export type TelnyxAvailableFilters = {
  country_code?: string;
  national_destination_code?: string;
  administrative_area?: string;
  rate_center?: string;
  locality?: string;
  limit?: number;
  features?: string[];
};

export type TelnyxAvailablePhoneNumber = {
  phone_number: string;
  region_information?: Array<{ region_type: string; region_name: string }>;
  cost_information?: {
    upfront_cost?: string;
    monthly_cost?: string;
    currency?: string;
  };
};

export type TelnyxDidRow = {
  /** 美国号码多为 11 位以 1 开头，与旧 Voip 列表字段一致 */
  did: string;
  monthly: string;
  setup: string;
  province: string;
  ratecenter: string;
};

function getTelnyxTimeoutMs(): number {
  return Math.max(15_000, Math.min(Number(Deno.env.get("TELNYX_HTTP_TIMEOUT_MS") ?? "120000"), 180_000));
}

async function telnyxFetch(
  apiKey: string,
  path: string,
  init: RequestInit = {},
): Promise<Response> {
  const timeoutMs = getTelnyxTimeoutMs();
  const ac = new AbortController();
  const tid = setTimeout(() => ac.abort(), timeoutMs);
  try {
    return await fetch(`${TELNYX_API_BASE}${path}`, {
      ...init,
      signal: ac.signal,
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
        ...init.headers,
      },
    });
  } finally {
    clearTimeout(tid);
  }
}

function telnyxErrorMessage(json: unknown): string {
  const j = json as { errors?: Array<{ detail?: string; title?: string }> };
  const e = j?.errors?.[0];
  return (e?.detail ?? e?.title ?? "Telnyx API error").trim();
}

/** 构建 available_phone_numbers 查询（filter[*] 形式） */
export function buildAvailablePhoneNumbersQuery(f: TelnyxAvailableFilters): string {
  const p = new URLSearchParams();
  const limit = f.limit ?? 50;
  p.set("filter[limit]", String(limit));
  if (f.country_code) p.set("filter[country_code]", f.country_code);
  if (f.administrative_area) p.set("filter[administrative_area]", f.administrative_area.toUpperCase());
  if (f.national_destination_code) {
    p.set("filter[national_destination_code]", f.national_destination_code.replace(/\D/g, "").slice(0, 3));
  }
  if (f.rate_center) p.set("filter[rate_center]", f.rate_center);
  if (f.locality) p.set("filter[locality]", f.locality);
  if (f.features?.length) {
    for (const feat of f.features) {
      p.append("filter[features][]", feat);
    }
  }
  return p.toString();
}

export function mapTelnyxAvailableToRow(item: TelnyxAvailablePhoneNumber): TelnyxDidRow {
  const e164 = item.phone_number ?? "";
  const digits = e164.replace(/\D/g, "");
  let did: string;
  if (digits.length === 10) did = `1${digits}`;
  else if (digits.length === 11 && digits.startsWith("1")) did = digits;
  else did = digits;
  const regions = item.region_information ?? [];
  const province = regions.find((r) => r.region_type === "state")?.region_name ??
    regions.find((r) => r.region_type === "country_code")?.region_name ?? "";
  const ratecenter = regions.find((r) => r.region_type === "rate_center")?.region_name ?? "";
  const monthly = item.cost_information?.monthly_cost ?? "0";
  const setup = item.cost_information?.upfront_cost ?? "0";
  return { did, monthly, setup, province, ratecenter };
}

export async function telnyxListAvailablePhoneNumbers(
  apiKey: string,
  filters: TelnyxAvailableFilters,
): Promise<TelnyxDidRow[]> {
  const run = async (f: TelnyxAvailableFilters) => {
    const qs = buildAvailablePhoneNumbersQuery(f);
    const res = await telnyxFetch(apiKey, `/available_phone_numbers?${qs}`, { method: "GET" });
    const text = await res.text();
    let json: unknown;
    try {
      json = JSON.parse(text);
    } catch {
      throw new Error(`Telnyx 返回非 JSON (HTTP ${res.status})`);
    }
    if (!res.ok) {
      throw new Error(telnyxErrorMessage(json));
    }
    const data = (json as { data?: TelnyxAvailablePhoneNumber[] }).data ?? [];
    return data.map(mapTelnyxAvailableToRow);
  };

  try {
    return await run(filters);
  } catch (e) {
    if (filters.features?.length) {
      console.warn("[telnyx] listAvailable retry without features:", e);
      return await run({ ...filters, features: undefined });
    }
    throw e;
  }
}

/** E.164，美国号码 +1… */
export function normalizeToE164US(did: string): string {
  const d = did.replace(/\D/g, "");
  if (d.length === 10) return `+1${d}`;
  if (d.length === 11 && d.startsWith("1")) return `+${d}`;
  return did.startsWith("+") ? did : `+${d}`;
}

export type TelnyxNumberOrderData = {
  id?: string;
  status?: string;
  phone_numbers?: Array<{ phone_number?: string }>;
};

export async function telnyxCreateNumberOrder(
  apiKey: string,
  phoneNumberE164: string,
  options: { messaging_profile_id?: string; connection_id?: string } = {},
): Promise<TelnyxNumberOrderData> {
  const body: Record<string, unknown> = {
    phone_numbers: [{ phone_number: phoneNumberE164 }],
  };
  if (options.messaging_profile_id) body.messaging_profile_id = options.messaging_profile_id;
  if (options.connection_id) body.connection_id = options.connection_id;

  const res = await telnyxFetch(apiKey, "/number_orders", {
    method: "POST",
    body: JSON.stringify(body),
  });
  const text = await res.text();
  let json: unknown;
  try {
    json = JSON.parse(text);
  } catch {
    throw new Error(`Telnyx 订购返回非 JSON (HTTP ${res.status})`);
  }
  if (!res.ok) {
    throw new Error(telnyxErrorMessage(json));
  }
  return (json as { data?: TelnyxNumberOrderData }).data ?? {};
}

export async function telnyxGetNumberOrder(apiKey: string, orderId: string): Promise<TelnyxNumberOrderData> {
  const res = await telnyxFetch(apiKey, `/number_orders/${orderId}`, { method: "GET" });
  const text = await res.text();
  let json: unknown;
  try {
    json = JSON.parse(text);
  } catch {
    throw new Error(`Telnyx 订购查询非 JSON (HTTP ${res.status})`);
  }
  if (!res.ok) {
    throw new Error(telnyxErrorMessage(json));
  }
  return (json as { data?: TelnyxNumberOrderData }).data ?? {};
}

/** 轮询直至 success / failure 或超时 */
export async function telnyxWaitNumberOrderSuccess(
  apiKey: string,
  orderId: string,
  opts: { maxAttempts?: number; delayMs?: number } = {},
): Promise<TelnyxNumberOrderData> {
  const max = opts.maxAttempts ?? 30;
  const delayMs = opts.delayMs ?? 2000;
  let last: TelnyxNumberOrderData = {};
  for (let i = 0; i < max; i++) {
    last = await telnyxGetNumberOrder(apiKey, orderId);
    const st = String(last.status ?? "").toLowerCase();
    if (st === "success") return last;
    if (st === "failure") {
      throw new Error("Telnyx 号码订购失败（failure）");
    }
    await new Promise((r) => setTimeout(r, delayMs));
  }
  throw new Error("Telnyx 号码订购超时，请稍后在控制台查看订单状态");
}

export async function telnyxSendSms(
  apiKey: string,
  params: { from: string; to: string; text: string },
): Promise<void> {
  const from = params.from.startsWith("+") ? params.from : normalizeToE164US(params.from);
  const to = params.to.startsWith("+") ? params.to : normalizeToE164US(params.to);
  const res = await telnyxFetch(apiKey, "/messages", {
    method: "POST",
    body: JSON.stringify({
      from,
      to,
      text: params.text,
    }),
  });
  const text = await res.text();
  let json: unknown;
  try {
    json = JSON.parse(text);
  } catch {
    throw new Error(`Telnyx 短信返回非 JSON (HTTP ${res.status})`);
  }
  if (!res.ok) {
    throw new Error(telnyxErrorMessage(json));
  }
}
