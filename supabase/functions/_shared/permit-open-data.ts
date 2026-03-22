/**
 * 各城市建筑许可开放数据接入（对齐各市政府 / DBI 公开 API 文档习惯）。
 *
 * - **San Francisco**：DataSF (Socrata) — Building Permits，`i98e-djp9`。
 *   文档：https://dev.socrata.com/docs/queries/q.html 使用 `$q` 对多字段全文检索
 *   （该表无单一 `address` 列，勿用 `$where=address like`）。
 * - **San Jose**：市开放数据门户 CKAN Datastore — Active Building Permits。
 *   使用 `datastore_search` 的 `q` 对整行全文检索（含 `gx_location` 地址字段）。
 */

export const SUPPORTED_PERMIT_CITIES = ["San Francisco", "San Jose"] as const;
export type PermitCity = (typeof SUPPORTED_PERMIT_CITIES)[number];

/** 用户常见拼写错误，避免误判「不支持的城市」 */
export function normalizePermitAddressTypos(address: string): string {
  return address
    .replace(/franciaco/gi, "francisco")
    .replace(/fransisco/gi, "francisco")
    .replace(/franciso\b/gi, "francisco")
    .replace(/sanfransisco/gi, "san francisco")
    .replace(/sanfrancisco/gi, "san francisco");
}

/** SF DataSF — DBI Building Permit Tracking */
const SF_RESOURCE = "https://data.sfgov.org/resource/i98e-djp9.json";

/** San Jose — Active Building Permits (CKAN datastore resource id) */
const SJ_DATASTORE_RESOURCE_ID = "761b7ae8-3be1-4ad6-923d-c7af6404a904";
const SJ_CKAN_SEARCH = "https://data.sanjoseca.gov/api/3/action/datastore_search";

export function detectPermitCity(address: string): PermitCity | null {
  const lower = normalizePermitAddressTypos(address).toLowerCase().normalize("NFKC");
  /** 常见 SF / SJ 邮编，便于用户只写门牌不写城市名 */
  if (
    lower.includes("san francisco") ||
    /\bsf\b/.test(lower) ||
    /\b941\d{2}\b/.test(lower)
  ) {
    return "San Francisco";
  }
  if (lower.includes("san jose") || lower.includes("sanjose") || /\b951\d{2}\b/.test(lower)) {
    return "San Jose";
  }
  return null;
}

/** 去掉城市/州后缀，提高 open data 关键词命中率 */
export function permitSearchQuery(address: string, city: PermitCity): string {
  let q = normalizePermitAddressTypos(address).trim();
  if (city === "San Francisco") {
    q = q
      .replace(/,?\s*san\s+francisco\b/gi, "")
      .replace(/,?\s*\bsf\b/gi, "")
      .replace(/,?\s*ca\b\.?/gi, "")
      .replace(/,?\s*california\b/gi, "");
  }
  if (city === "San Jose") {
    q = q.replace(/,?\s*san\s+jose\b/gi, "").replace(/,?\s*ca\b\.?/gi, "").replace(/,?\s*california\b/gi, "");
  }
  q = q.replace(/\s+/g, " ").trim();
  return q.length >= 2 ? q : address.trim();
}

export type PermitFetchResult = {
  city: PermitCity;
  /** 供审计 / 排错（勿记录密钥） */
  source_hint: string;
  rows: unknown[];
};

export async function fetchPermitRowsFromOpenData(
  city: PermitCity,
  address: string,
): Promise<PermitFetchResult> {
  const q = permitSearchQuery(address, city);
  const token = Deno.env.get("SOCRATA_APP_TOKEN")?.trim();

  if (city === "San Francisco") {
    const url = `${SF_RESOURCE}?$limit=35&$q=${encodeURIComponent(q)}`;
    const headers: Record<string, string> = { Accept: "application/json" };
    if (token) headers["X-App-Token"] = token;
    const res = await fetch(url, { headers });
    const text = await res.text();
    let rows: unknown[];
    try {
      const parsed = JSON.parse(text) as unknown;
      rows = Array.isArray(parsed) ? parsed : [];
    } catch {
      rows = [];
    }
    return {
      city,
      source_hint: "data.sfgov.org/resource/i98e-djp9 (Socrata $q)",
      rows,
    };
  }

  const res = await fetch(SJ_CKAN_SEARCH, {
    method: "POST",
    headers: { Accept: "application/json", "Content-Type": "application/json" },
    body: JSON.stringify({
      resource_id: SJ_DATASTORE_RESOURCE_ID,
      q,
      limit: 35,
    }),
  });
  const json = (await res.json()) as {
    success?: boolean;
    result?: { records?: Record<string, unknown>[] };
  };
  const records = json.success && Array.isArray(json.result?.records) ? json.result!.records : [];
  return {
    city,
    source_hint: "data.sanjoseca.gov CKAN datastore_search (Active Building Permits)",
    rows: records,
  };
}
