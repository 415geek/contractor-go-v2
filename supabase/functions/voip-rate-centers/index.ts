import { jsonResponse, handleOptionsRequest } from "../_shared/response.ts";

/**
 * Telnyx 无「列出某州全部 rate center」的独立接口；此处返回美国常见 rate center 名称
 * （与 Telnyx 控制台 / available_phone_numbers 中 region 展示一致，多为大写+空格）。
 * 购号页优先使用 area_code / bay_area；本接口供高级筛选。
 */
const US_STATE_RATE_CENTERS: Record<string, string[]> = {
  CA: [
    "SAN FRANCISCO",
    "SAN JOSE",
    "OAKLAND",
    "BERKELEY",
    "SAN MATEO",
    "PALO ALTO",
    "REDWOOD CITY",
    "SUNNYVALE",
    "SANTA CLARA",
    "FREMONT",
    "HAYWARD",
    "CONCORD",
    "WALNUT CREEK",
    "ANTIOCH",
    "LOS ANGELES",
    "SAN DIEGO",
    "SACRAMENTO",
    "NAPA",
    "SANTA ROSA",
    "SANTA CRUZ",
    "MONTEREY",
    "SALINAS",
  ],
  NY: ["NEW YORK", "BROOKLYN", "BUFFALO", "ROCHESTER", "ALBANY"],
  TX: ["HOUSTON", "DALLAS", "AUSTIN", "SAN ANTONIO"],
  FL: ["MIAMI", "TAMPA", "ORLANDO", "JACKSONVILLE"],
  IL: ["CHICAGO"],
  NV: ["LAS VEGAS", "RENO"],
  GA: ["ATLANTA"],
  WA: ["SEATTLE", "SPOKANE"],
};

Deno.serve(async (req) => {
  const opts = handleOptionsRequest(req);
  if (opts) return opts;

  if (req.method !== "GET") {
    return jsonResponse({ data: null, error: "method_not_allowed", message: "GET only" }, 405);
  }

  try {
    const url = new URL(req.url);
    const state = url.searchParams.get("state");
    if (!state || state.length !== 2) {
      return jsonResponse(
        { data: null, error: "invalid_params", message: "state (2-letter) required" },
        400,
      );
    }

    const st = state.toUpperCase();
    const list = US_STATE_RATE_CENTERS[st] ?? [];

    return jsonResponse({ data: list, error: null, message: "ok" });
  } catch (e) {
    console.error("[voip-rate-centers]", e);
    return jsonResponse(
      { data: null, error: "internal_error", message: e instanceof Error ? e.message : "Failed" },
      500,
    );
  }
});
