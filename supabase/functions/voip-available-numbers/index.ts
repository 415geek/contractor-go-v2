import { jsonResponse, handleOptionsRequest } from "../_shared/response.ts";
import { VoipMsClient, type VoipDidRow } from "../_shared/voip-client.ts";
import { didMatchesNpa, npaToVoipUsState } from "../_shared/npa-resolve.ts";

function getEnv(name: string): string {
  const v = Deno.env.get(name);
  if (!v) throw new Error(`Missing env: ${name}`);
  return v;
}

/** 单个 ratecenter */
async function loadDidsSingleRc(client: VoipMsClient, state: string, ratecenter: string): Promise<VoipDidRow[]> {
  const r = await client.getDIDsUSA(state.toUpperCase(), ratecenter.toUpperCase());
  return r.dids ?? [];
}

/** 与 mobile/lib/bay-area-voip.ts 保持一致 */
const BAY_AREA_NPAS = [
  "415",
  "628",
  "510",
  "341",
  "650",
  "408",
  "669",
  "925",
  "707",
  "831",
];

/**
 * 遍历州内多个 ratecenter，合并号码；可选只保留指定 NPA（区号）。
 * rate center 之间并行拉取（分批），显著减少总耗时。
 */
async function loadDidsUsaAggregated(
  client: VoipMsClient,
  state: string,
  options: { npaFilter?: string; maxRatecenters?: number; maxDids?: number; rcParallel?: number },
): Promise<VoipDidRow[]> {
  const st = state.toUpperCase();
  const maxRC = options.maxRatecenters ?? 32;
  const maxDids = options.maxDids ?? 120;
  const rcParallel = Math.max(1, Math.min(options.rcParallel ?? 8, 16));
  const npaF = options.npaFilter?.replace(/\D/g, "").slice(0, 3);
  if (npaF && npaF.length !== 3) {
    throw new Error("Invalid area_code for filter");
  }

  const rcResp = await client.getRateCentersUSA(st);
  const centers = (rcResp.ratecenters ?? [])
    .map((x) => String(x.ratecenter ?? "").trim().toUpperCase())
    .filter(Boolean)
    .slice(0, maxRC);

  const seen = new Set<string>();
  const out: VoipDidRow[] = [];

  for (let i = 0; i < centers.length && out.length < maxDids; i += rcParallel) {
    const chunk = centers.slice(i, i + rcParallel);
    const batch = await Promise.all(
      chunk.map(async (rc) => {
        try {
          const r = await client.getDIDsUSA(st, rc);
          return r.dids ?? [];
        } catch (e) {
          console.warn(`[voip-available-numbers] skip ${st}/${rc}:`, e);
          return [] as VoipDidRow[];
        }
      }),
    );
    for (const rows of batch) {
      for (const row of rows) {
        if (npaF && !didMatchesNpa(row.did, npaF)) continue;
        if (seen.has(row.did)) continue;
        seen.add(row.did);
        out.push(row);
        if (out.length >= maxDids) break;
      }
      if (out.length >= maxDids) break;
    }
  }
  return out;
}

Deno.serve(async (req) => {
  const opts = handleOptionsRequest(req);
  if (opts) return opts;

  if (req.method !== "GET") {
    return jsonResponse({ data: null, error: "method_not_allowed", message: "GET only" }, 405);
  }

  try {
    const url = new URL(req.url);
    const bayArea = url.searchParams.get("bay_area");
    const areaCode = url.searchParams.get("area_code");
    const state = url.searchParams.get("state")?.trim();
    const ratecenter = url.searchParams.get("ratecenter")?.trim();

    const client = new VoipMsClient(getEnv("VOIPMS_USERNAME"), getEnv("VOIPMS_PASSWORD"));
    let dids: VoipDidRow[];

    /** 单次 HTTP 合并湾区多 NPA，避免客户端连打 10 次 Edge */
    if (bayArea === "1" || bayArea === "true") {
      const perNpa = { maxRatecenters: 14, maxDids: 36, rcParallel: 8 };
      const lists = await Promise.all(
        BAY_AREA_NPAS.map(async (npa) => {
          const st = npaToVoipUsState(npa);
          if (!st) return [] as VoipDidRow[];
          try {
            return await loadDidsUsaAggregated(client, st, { npaFilter: npa, ...perNpa });
          } catch (e) {
            console.warn(`[voip-available-numbers] bay_area skip ${npa}:`, e);
            return [] as VoipDidRow[];
          }
        }),
      );
      const seen = new Set<string>();
      dids = [];
      for (const list of lists) {
        for (const row of list) {
          if (seen.has(row.did)) continue;
          seen.add(row.did);
          dids.push(row);
        }
      }
    } else if (state && /^[A-Za-z]{2}$/.test(state) && !ratecenter && !areaCode) {
      dids = await loadDidsUsaAggregated(client, state, { rcParallel: 8 });
    } else if (state && ratecenter) {
      dids = await loadDidsSingleRc(client, state, ratecenter);
    } else if (areaCode && /^\d{3}$/.test(areaCode)) {
      const st = npaToVoipUsState(areaCode);
      if (!st) {
        return jsonResponse(
          {
            data: null,
            error: "unsupported_area_code",
            message:
              `Area code ${areaCode} is not a US/Puerto Rico NPA in our database, or is Canada/Caribbean (Voip getDIDsUSA is US-focused).`,
          },
          400,
        );
      }
      dids = await loadDidsUsaAggregated(client, st, { npaFilter: areaCode, rcParallel: 8 });
    } else {
      return jsonResponse(
        {
          data: null,
          error: "invalid_params",
          message:
            "Provide bay_area=1 (SF Bay multi-NPA bundle), or state (2-letter), or state+ratecenter, or area_code (3 digits).",
        },
        400,
      );
    }

    const list = dids.map((d) => ({
      did: d.did,
      monthly: d.monthly,
      setup: d.setup,
      province: d.province,
      ratecenter: d.ratecenter,
    }));

    return jsonResponse({ data: list, error: null, message: "ok" });
  } catch (e) {
    console.error("[voip-available-numbers]", e);
    return jsonResponse(
      { data: null, error: "voip_error", message: e instanceof Error ? e.message : "Voip.ms request failed" },
      500,
    );
  }
});
