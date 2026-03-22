import { jsonResponse, handleOptionsRequest } from "../_shared/response.ts";
import { didMatchesNpa, npaToVoipUsState } from "../_shared/npa-resolve.ts";
import {
  type TelnyxDidRow,
  telnyxListAvailablePhoneNumbers,
} from "../_shared/telnyx-client.ts";

function getEnv(name: string): string {
  const v = Deno.env.get(name);
  if (!v) throw new Error(`Missing env: ${name}`);
  return v;
}

/** 与 mobile/lib/bay-area-voip.ts `BAY_AREA_NPAS_ORDERED` 保持一致 */
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
] as const;

function didMatchesAnyBayAreaNpa(did: string): boolean {
  for (const npa of BAY_AREA_NPAS) {
    if (didMatchesNpa(did, npa)) return true;
  }
  return false;
}

/** 湾区：按 NPA 并行查询 Telnyx available_phone_numbers（比按 rate center 扫全州更稳） */
async function loadBayAreaBundle(apiKey: string): Promise<TelnyxDidRow[]> {
  const perNpaLimit = 40;
  const maxTotal = 200;
  const parallel = 5;
  const seen = new Set<string>();
  const out: TelnyxDidRow[] = [];

  for (let i = 0; i < BAY_AREA_NPAS.length; i += parallel) {
    const chunk = BAY_AREA_NPAS.slice(i, i + parallel);
    const batches = await Promise.all(
      chunk.map(async (npa) => {
        try {
          return await telnyxListAvailablePhoneNumbers(apiKey, {
            country_code: "US",
            national_destination_code: npa,
            limit: perNpaLimit,
            features: ["sms", "voice"],
          });
        } catch (e) {
          console.warn(`[voip-available-numbers] bay_area npa ${npa}:`, e);
          return [] as TelnyxDidRow[];
        }
      }),
    );
    for (const rows of batches) {
      for (const row of rows) {
        if (!didMatchesAnyBayAreaNpa(row.did)) continue;
        if (seen.has(row.did)) continue;
        seen.add(row.did);
        out.push(row);
        if (out.length >= maxTotal) return out;
      }
    }
  }
  return out;
}

async function loadByState(apiKey: string, state: string, maxDids: number): Promise<TelnyxDidRow[]> {
  return await telnyxListAvailablePhoneNumbers(apiKey, {
    country_code: "US",
    administrative_area: state.toUpperCase(),
    limit: Math.min(maxDids, 100),
    features: ["sms", "voice"],
  });
}

async function loadByStateAndRateCenter(
  apiKey: string,
  state: string,
  ratecenter: string,
): Promise<TelnyxDidRow[]> {
  const rc = ratecenter.trim();
  return await telnyxListAvailablePhoneNumbers(apiKey, {
    country_code: "US",
    administrative_area: state.toUpperCase(),
    rate_center: rc,
    limit: 50,
    features: ["sms", "voice"],
  });
}

async function loadByAreaCode(
  apiKey: string,
  state: string,
  areaCode: string,
): Promise<TelnyxDidRow[]> {
  const npa = areaCode.replace(/\D/g, "").slice(0, 3);
  return await telnyxListAvailablePhoneNumbers(apiKey, {
    country_code: "US",
    administrative_area: state.toUpperCase(),
    national_destination_code: npa,
    limit: 80,
    features: ["sms", "voice"],
  });
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

    const apiKey = getEnv("TELNYX_API_KEY");
    let dids: TelnyxDidRow[];

    if (bayArea === "1" || bayArea === "true") {
      dids = await loadBayAreaBundle(apiKey);
    } else if (state && /^[A-Za-z]{2}$/.test(state) && !ratecenter && !areaCode) {
      dids = await loadByState(apiKey, state, 120);
    } else if (state && ratecenter) {
      dids = await loadByStateAndRateCenter(apiKey, state, ratecenter);
    } else if (areaCode && /^\d{3}$/.test(areaCode)) {
      const st = npaToVoipUsState(areaCode);
      if (!st) {
        return jsonResponse(
          {
            data: null,
            error: "unsupported_area_code",
            message:
              `Area code ${areaCode} is not a US/Puerto Rico NPA in our database, or is Canada/Caribbean.`,
          },
          400,
        );
      }
      dids = await loadByAreaCode(apiKey, st, areaCode);
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
      { data: null, error: "telnyx_error", message: e instanceof Error ? e.message : "Telnyx request failed" },
      500,
    );
  }
});
