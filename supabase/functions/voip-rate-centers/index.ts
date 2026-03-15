import { jsonResponse, handleOptionsRequest } from "../_shared/response.ts";
import { VoipMsClient } from "../_shared/voip-client.ts";

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
    const state = url.searchParams.get("state");
    if (!state || state.length !== 2) {
      return jsonResponse(
        { data: null, error: "invalid_params", message: "state (2-letter) required" },
        400,
      );
    }

    const client = new VoipMsClient(getEnv("VOIPMS_USERNAME"), getEnv("VOIPMS_PASSWORD"));
    const resp = await client.getRateCentersUSA(state.toUpperCase());
    const ratecenters = (resp as { ratecenters?: Array<{ ratecenter: string }> }).ratecenters ?? [];
    const list = ratecenters.map((r) => r.ratecenter);

    return jsonResponse({ data: list, error: null, message: "ok" });
  } catch (e) {
    console.error("[voip-rate-centers]", e);
    return jsonResponse(
      { data: null, error: "voip_error", message: e instanceof Error ? e.message : "Voip.ms request failed" },
      500,
    );
  }
});
