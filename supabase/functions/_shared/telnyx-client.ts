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

/**
 * 将 Telnyx 订购接口的英文错误转为产品侧可读说明（避免与「免费试用仅 1 个号码」混淆）。
 * @see https://telnyx.com/pricing — 试用/低等级账号常有「整账号仅允许 1 笔 number order」限制
 */
export function humanizeTelnyxNumberOrderError(raw: string): string {
  const t = raw.trim();
  const lower = t.toLowerCase();
  if (
    lower.includes("only 1 order") ||
    lower.includes("one order is allowed") ||
    lower.includes("telnyx.com/upgrade") ||
    lower.includes("account level")
  ) {
    return [
      "Telephony 供应商 Telnyx 拒绝了本次订购：当前使用的 API Key 对应账号在 Telnyx 侧已达到「可下订单」上限（常见于试用/未升级账号；若团队多人共用同一 Key，也可能被他人占用）。",
      "这与 Contractor GO「免费档每用户 1 个号码」不是同一概念：若订购失败，App 内「我的号码」不会显示新号码。",
      "请在 Telnyx 控制台升级套餐或检查是否已有号码/未完成订单；必要时更换专用生产 API Key。",
    ].join(" ");
  }
  return t;
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

/**
 * Messaging Profile ID 在 Telnyx 为 UUID。若误把 API Key（KEY…）或 Stripe sk_ 写入 Secret，订购会报 Invalid Messaging Profile ID。
 * 返回 undefined 时不传该字段，号码仍可订购，稍后在控制台把号码绑定到 Profile。
 */
export function parseTelnyxMessagingProfileId(raw: string | undefined | null): string | undefined {
  if (raw == null) return undefined;
  const t = String(raw).trim();
  if (!t) return undefined;
  if (t.startsWith("KEY")) {
    console.warn(
      "[telnyx] TELNYX_MESSAGING_PROFILE_ID looks like an API key (KEY…); omitting — set a Messaging Profile UUID from portal.telnyx.com",
    );
    return undefined;
  }
  const lower = t.toLowerCase();
  if (lower.startsWith("sk_live") || lower.startsWith("sk_test")) {
    console.warn("[telnyx] TELNYX_MESSAGING_PROFILE_ID looks like a Stripe secret; omitting");
    return undefined;
  }
  const uuid =
    /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  if (uuid.test(t)) return t;
  console.warn(
    "[telnyx] TELNYX_MESSAGING_PROFILE_ID is not a UUID; omitting — fix Supabase secret or bind the number in Telnyx portal",
  );
  return undefined;
}

/** Connection ID 通常为 UUID；误填 KEY 时同样省略。 */
export function parseTelnyxConnectionId(raw: string | undefined | null): string | undefined {
  if (raw == null) return undefined;
  const t = String(raw).trim();
  if (!t) return undefined;
  if (t.startsWith("KEY")) {
    console.warn("[telnyx] TELNYX_CONNECTION_ID looks like an API key; omitting");
    return undefined;
  }
  const uuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  if (uuid.test(t)) return t;
  console.warn("[telnyx] TELNYX_CONNECTION_ID is not a UUID; omitting");
  return undefined;
}

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

export type TelnyxSendSmsResult = { telnyxMessageId: string | null };

export async function telnyxSendSms(
  apiKey: string,
  params: { from: string; to: string; text: string; messaging_profile_id?: string },
): Promise<TelnyxSendSmsResult> {
  const from = params.from.startsWith("+") ? params.from : normalizeToE164US(params.from);
  const to = params.to.startsWith("+") ? params.to : normalizeToE164US(params.to);
  const body: Record<string, unknown> = {
    from,
    to,
    text: params.text,
    type: "SMS",
  };
  if (params.messaging_profile_id) {
    body.messaging_profile_id = params.messaging_profile_id;
  }
  const res = await telnyxFetch(apiKey, "/messages", {
    method: "POST",
    body: JSON.stringify(body),
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
  const mid = (json as { data?: { id?: string } }).data?.id;
  const telnyxMessageId = typeof mid === "string" && mid.trim() ? mid.trim() : null;
  return { telnyxMessageId };
}

/** Telnyx 报错：from 与 Messaging Profile 不匹配（可尝试 PATCH 号码绑定后重发）。 */
export function isTelnyxMessagingProfileMismatchError(msg: string): boolean {
  const lower = msg.toLowerCase();
  return lower.includes("messaging profile") &&
    (lower.includes("from") || lower.includes("valid number"));
}

/**
 * 将账号下指定 E.164 号码绑定到 Messaging Profile（修复早期购号未带 Profile、或控制台被改过的情况）。
 * @see PATCH /v2/phone_numbers/{id}
 */
export async function telnyxAttachPhoneToMessagingProfile(
  apiKey: string,
  e164From: string,
  messagingProfileId: string,
): Promise<void> {
  const e164 = e164From.startsWith("+") ? e164From : normalizeToE164US(e164From);
  const qs = new URLSearchParams();
  qs.set("filter[phone_number]", e164);
  qs.set("page[size]", "1");
  const listRes = await telnyxFetch(apiKey, `/phone_numbers?${qs}`, { method: "GET" });
  const listText = await listRes.text();
  let listJson: unknown;
  try {
    listJson = JSON.parse(listText);
  } catch {
    throw new Error(`Telnyx 查询号码列表返回非 JSON (HTTP ${listRes.status})`);
  }
  if (!listRes.ok) {
    throw new Error(telnyxErrorMessage(listJson));
  }
  const rows = (listJson as { data?: Array<{ id?: string }> }).data ?? [];
  const id = rows[0]?.id;
  if (!id) {
    throw new Error(
      `Telnyx 账号中未找到号码 ${e164}：请确认 TELNYX_API_KEY 与购号所用 Telnyx 项目一致，且该号码仍在账号内。`,
    );
  }
  // Telnyx v2：messaging_profile_id 必须在子资源上更新，不能 PATCH /phone_numbers/{id} 根路径。
  // @see https://developers.telnyx.com/api-reference/number-settings/update-the-messaging-profile-andor-messaging-product-of-a-phone-number
  const patchRes = await telnyxFetch(apiKey, `/phone_numbers/${id}/messaging`, {
    method: "PATCH",
    body: JSON.stringify({ messaging_profile_id: messagingProfileId }),
  });
  const patchText = await patchRes.text();
  let patchJson: unknown;
  try {
    patchJson = JSON.parse(patchText);
  } catch {
    throw new Error(`Telnyx 更新号码短信配置返回非 JSON (HTTP ${patchRes.status})`);
  }
  if (!patchRes.ok) {
    throw new Error(telnyxErrorMessage(patchJson));
  }
}

/**
 * 发送短信；若因「from 与 Messaging Profile 不匹配」失败且已配置 messaging_profile_id，
 * 则自动 PATCH /phone_numbers/{id}/messaging 绑定后重试一次。
 */
export async function telnyxSendSmsWithProfileRepair(
  apiKey: string,
  params: { from: string; to: string; text: string; messaging_profile_id?: string },
): Promise<TelnyxSendSmsResult> {
  try {
    return await telnyxSendSms(apiKey, params);
  } catch (e) {
    const raw = e instanceof Error ? e.message : String(e);
    const mp = params.messaging_profile_id;
    if (!mp || !isTelnyxMessagingProfileMismatchError(raw)) {
      throw e;
    }
    console.warn("[telnyx] SMS profile mismatch, attaching number then retry once:", raw);
    await telnyxAttachPhoneToMessagingProfile(apiKey, params.from, mp);
    return await telnyxSendSms(apiKey, params);
  }
}

/** 将 Telnyx 发短信常见错误转为可操作的说明（中英混排原文仍保留在括号内便于搜日志）。 */
export function humanizeTelnyxSendMessageError(raw: string): string {
  const t = raw.trim();
  const lower = t.toLowerCase();
  if (lower.includes("from") && lower.includes("messaging profile")) {
    return [
      "发短信失败：虚拟号码未绑定到 Telnyx 的 Messaging Profile，或 Secret「TELNYX_MESSAGING_PROFILE_ID」与号码所在 Profile 不一致。",
      "若已在 Supabase 配置正确的 Profile UUID，系统会在首次失败时尝试通过 API 把该号码绑定到该 Profile 并重试；若仍失败，请到 Telnyx：Phone Numbers → 该号码 → Messaging 手动核对。",
      "请确认 TELNYX_API_KEY 与号码所在 Telnyx 账号一致。",
      `（Telnyx：${t}）`,
    ].join(" ");
  }
  if (lower.includes("not reachable") && lower.includes("messaging_profile_id")) {
    return [
      "绑定 Messaging Profile 的 API 路径已过期或错误；请更新 Edge Function 至最新版本（应使用 PATCH /v2/phone_numbers/{id}/messaging）。",
      `（Telnyx：${t}）`,
    ].join(" ");
  }
  return t;
}
