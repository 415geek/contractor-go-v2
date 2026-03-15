import { jsonResponse, handleOptionsRequest } from "../_shared/response.ts";
import { VoipMsClient, resolveAreaCode } from "../_shared/voip-client.ts";

function getEnv(name: string): string {
  const v = Deno.env.get(name);
  if (!v) throw new Error(`Missing env: ${name}`);
  return v;
}

Deno.serve(async (req) => {
  const opts = handleOptionsRequest(req);
  if (opts) return opts;

  if (req.method !== "GET") {
    return jsonResponse({ data: null, error: "method_not_allowed", message: "GET only" }, 405);
  }

  try {
    const url = new URL(req.url);
    const areaCode = url.searchParams.get("area_code");
    const state = url.searchParams.get("state");
    const ratecenter = url.searchParams.get("ratecenter");

    let s: string;
    let r: string;

    if (areaCode && /^\d{3}$/.test(areaCode)) {
      const resolved = resolveAreaCode(areaCode);
      if (!resolved) {
        return jsonResponse(
          { data: null, error: "unsupported_area_code", message: `Area code ${areaCode} not mapped. Use state and ratecenter.` },
          400,
        );
      }
      [s, r] = resolved;
    } else if (state && ratecenter) {
      s = state;
      r = ratecenter;
    } else {
      return jsonResponse(
        { data: null, error: "invalid_params", message: "Provide area_code (3 digits) or state and ratecenter" },
        400,
      );
    }

    const client = new VoipMsClient(getEnv("VOIPMS_USERNAME"), getEnv("VOIPMS_PASSWORD"));
    const resp = await client.getDIDsUSA(s, r);
    const dids = (resp as { dids?: Array<{ did: string; monthly: string; setup: string; province: string; ratecenter: string }> }).dids ?? [];
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
