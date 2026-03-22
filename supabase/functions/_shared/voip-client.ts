/** 直连 Voip.ms；若设置 VOIP_RELAY_URL，则请求发往你的固定 IP 服务器，由中继转发到 Voip.ms。 */
const VOIP_DIRECT_BASE = "https://voip.ms/api/v1/rest.php";

/** 规范化中继 URL，避免 hostname 末尾多写 `.`（如 api.example.io./voip）导致 Edge/DNS 解析失败 */
function normalizeVoipRelayUrl(raw: string): string {
  const trimmed = raw.trim().replace(/\/$/, "");
  try {
    const u = new URL(trimmed);
    if (u.hostname.endsWith(".")) {
      u.hostname = u.hostname.slice(0, -1);
    }
    const path = u.pathname === "/" ? "" : u.pathname.replace(/\/$/, "");
    return `${u.origin}${path}`;
  } catch {
    return trimmed.replace(/(\.[a-z0-9-]+)\.\//i, "$1/");
  }
}

function voipRequestBase(): string {
  const relay = Deno.env.get("VOIP_RELAY_URL")?.trim();
  if (relay) {
    return normalizeVoipRelayUrl(relay);
  }
  return VOIP_DIRECT_BASE;
}

function voipRelayHeaders(): HeadersInit {
  const secret = Deno.env.get("VOIP_RELAY_SECRET")?.trim();
  if (!secret) return {};
  return { Authorization: `Bearer ${secret}` };
}

/**
 * Voip.ms REST 文档（WSDL / 官方示例）：`did` 为纯数字，美国号码一般为 11 位 `1NXXNXXXXXX`，不要 `+`。
 * @see docs/VOIP_MS_API_REFERENCE.md
 */
export function formatDidForVoipApi(input: string): string {
  const d = input.replace(/\D/g, "");
  if (d.length === 10) return `1${d}`;
  if (d.length === 11 && d.startsWith("1")) return d;
  return d;
}

/**
 * Voip 常把列表序列化为 JSON 对象 `{"0":{...},"1":{...}}`；偶发单条为裸对象。
 */
export function voipListToArray<T extends Record<string, unknown>>(raw: unknown): T[] {
  if (raw == null) return [];
  if (Array.isArray(raw)) return raw as T[];
  if (typeof raw !== "object") return [];
  const o = raw as Record<string, unknown>;
  if ("did" in o && typeof (o as { did?: unknown }).did === "string") {
    return [o as T];
  }
  if ("ratecenter" in o && typeof (o as { ratecenter?: unknown }).ratecenter === "string") {
    return [o as T];
  }
  const vals = Object.values(o).filter((v): v is Record<string, unknown> =>
    v !== null && typeof v === "object" && !Array.isArray(v)
  );
  return vals as T[];
}

export type VoipApiResponse<T = unknown> = {
  status: string;
  [key: string]: T | string | unknown;
};

export type VoipDidRow = {
  did: string;
  monthly: string;
  setup: string;
  province: string;
  ratecenter: string;
};

export class VoipMsClient {
  private username: string;
  private password: string;

  constructor(username: string, password: string) {
    this.username = username.trim();
    this.password = password;
  }

  async request<T = VoipApiResponse>(
    method: string,
    params: Record<string, string | number | boolean> = {},
  ): Promise<T> {
    const search = new URLSearchParams({
      api_username: this.username,
      api_password: this.password,
      method,
      ...Object.fromEntries(
        Object.entries(params).map(([k, v]) => [k, String(v)]),
      ),
    });
    const base = voipRequestBase();
    const url = `${base}?${search.toString()}`;
    console.log(`[VoipMs] ${method} request${base !== VOIP_DIRECT_BASE ? " (via relay)" : ""}`);
    /** Voip.ms 偶发慢响应；超时避免 Edge 长时间挂起（官方无固定 SLA，默认 120s） */
    const timeoutMs = Math.max(15_000, Math.min(Number(Deno.env.get("VOIP_HTTP_TIMEOUT_MS") ?? "120000"), 180_000));
    const ac = new AbortController();
    const tid = setTimeout(() => ac.abort(), timeoutMs);
    let res: Response;
    try {
      res = await fetch(url, { headers: voipRelayHeaders(), signal: ac.signal });
    } finally {
      clearTimeout(tid);
    }
    const text = await res.text();
    const trimmed = text.trim();
    if (!trimmed.startsWith("{") && !trimmed.startsWith("[")) {
      const hint =
        base !== VOIP_DIRECT_BASE
          ? " 中继(VOIP_RELAY_URL)返回了网页/HTML 而非 JSON：请检查反代路径是否把 /voip 转到中继、证书与 401/404。"
          : "";
      console.error(`[VoipMs] non-JSON body HTTP ${res.status}:`, trimmed.slice(0, 300));
      throw new Error(
        `Voip 响应不是 JSON (HTTP ${res.status})${hint} 开头: ${trimmed.slice(0, 80).replace(/\s+/g, " ")}`,
      );
    }
    let json: VoipApiResponse;
    try {
      json = JSON.parse(trimmed) as VoipApiResponse;
    } catch {
      throw new Error(`Voip 响应解析失败 (HTTP ${res.status}): ${trimmed.slice(0, 120)}`);
    }
    const st = json.status;
    if (String(st).toLowerCase() !== "success") {
      const err = (json as { status?: string; message?: string }).message ?? json.status ?? "Unknown Voip.ms error";
      console.error(`[VoipMs] ${method} error:`, err);
      throw new Error(String(err));
    }
    return json as T;
  }

  async getDIDsUSA(state: string, ratecenter: string) {
    const json = await this.request<VoipApiResponse & { dids?: unknown }>(
      "getDIDsUSA",
      { state: state.toUpperCase(), ratecenter: ratecenter.toUpperCase() },
    );
    const dids = voipListToArray<VoipDidRow>(json.dids);
    return { ...json, dids };
  }

  async getRateCentersUSA(state: string) {
    const json = await this.request<VoipApiResponse & { ratecenters?: unknown }>(
      "getRateCentersUSA",
      { state: state.toUpperCase() },
    );
    const ratecenters = voipListToArray<{ ratecenter: string }>(json.ratecenters);
    return { ...json, ratecenters };
  }

  /**
   * orderDID：did 必须为文档要求的数字格式；monthly/setup 宜使用 getDIDsUSA 返回值（官方 WSDL）。
   */
  async orderDID(
    did: string,
    options: {
      routing?: string;
      billingType?: number;
      account?: string;
      monthly?: string;
      setup?: string;
      minute?: string;
      test?: number;
    } = {},
  ) {
    const didFmt = formatDidForVoipApi(did);
    const params: Record<string, string | number | boolean> = {
      did: didFmt,
      routing: options.routing ?? "account:main",
      billing_type: options.billingType ?? 1,
      account: options.account ?? "main",
    };
    if (options.monthly != null && String(options.monthly).trim() !== "") {
      params.monthly = String(options.monthly).trim();
    }
    if (options.setup != null && String(options.setup).trim() !== "") {
      params.setup = String(options.setup).trim();
    }
    if (options.minute != null && String(options.minute).trim() !== "") {
      params.minute = String(options.minute).trim();
    }
    if (options.test !== undefined) {
      params.test = options.test;
    }
    return this.request("orderDID", params);
  }

  async sendSMS(did: string, dst: string, message: string) {
    return this.request("sendSMS", {
      did: formatDidForVoipApi(did),
      dst: formatDidForVoipApi(dst),
      message,
    });
  }
}

const AREA_CODE_TO_STATE_RATECENTER: Record<string, [string, string]> = {
  "415": ["CA", "SANFRANCISCO"],
  "212": ["NY", "NEWYORK"],
  "310": ["CA", "LOSANGELES"],
  "305": ["FL", "MIAMI"],
  "702": ["NV", "LASVEGAS"],
  "312": ["IL", "CHICAGO"],
  "404": ["GA", "ATLANTA"],
  "713": ["TX", "HOUSTON"],
  "214": ["TX", "DALLAS"],
  /** 与 Voip getRateCentersUSA(CA) 中名称一致 */
  "408": ["CA", "SANJOSE"],
  "646": ["NY", "NEWYORK"],
  "917": ["NY", "NEWYORK"],
};

export function resolveAreaCode(areaCode: string): [string, string] | null {
  const n = areaCode.replace(/\D/g, "");
  return AREA_CODE_TO_STATE_RATECENTER[n] ?? null;
}
