import { jsonResponse, handleOptionsRequest } from "../_shared/response.ts";
import { VoipMsClient } from "../_shared/voip-client.ts";
import { getUserFromRequest } from "../_shared/get-user.ts";
import { createAdminClient } from "../_shared/supabase.ts";

function getEnv(name: string): string {
  const v = Deno.env.get(name);
  if (!v) throw new Error(`Missing env: ${name}`);
  return v;
}

function normalizeDid(did: string): string {
  const d = did.replace(/\D/g, "");
  return d.length === 10 ? `+1${d}` : d.length === 11 && d.startsWith("1") ? `+${d}` : `+${d}`;
}

Deno.serve(async (req) => {
  const opts = handleOptionsRequest(req);
  if (opts) return opts;

  if (req.method !== "POST") {
    return jsonResponse({ data: null, error: "method_not_allowed", message: "POST only" }, 405);
  }

  try {
    const user = await getUserFromRequest(req);
    if (!user) {
      return jsonResponse({ data: null, error: "unauthorized", message: "Invalid or missing token" }, 401);
    }

    let body: { did: string; monthly?: string; setup?: string };
    try {
      body = await req.json();
    } catch {
      return jsonResponse({ data: null, error: "invalid_body", message: "Invalid JSON" }, 400);
    }

    const did = typeof body.did === "string" ? body.did.trim() : "";
    if (!did || did.length < 10) {
      return jsonResponse({ data: null, error: "invalid_did", message: "did required" }, 400);
    }

    const phoneNumber = normalizeDid(did);
    const client = new VoipMsClient(getEnv("VOIPMS_USERNAME"), getEnv("VOIPMS_PASSWORD"));
    const monthlyStr = typeof body.monthly === "string" ? body.monthly.trim() : "";
    const setupStr = typeof body.setup === "string" ? body.setup.trim() : "";
    await client.orderDID(did, {
      monthly: monthlyStr || undefined,
      setup: setupStr || undefined,
    });

    const admin = createAdminClient();
    const monthly = typeof body.monthly === "string" ? parseFloat(body.monthly) || 0 : 0;
    const { data: row, error } = await admin
      .from("virtual_numbers")
      .insert({
        user_id: user.id,
        phone_number: phoneNumber,
        provider: "voipms",
        status: "active",
        metadata: { monthly_cost: monthly },
      })
      .select()
      .single();

    if (error) {
      console.error("[voip-purchase-number] insert error:", error);
      return jsonResponse(
        { data: null, error: "db_error", message: error.message },
        500,
      );
    }

    return jsonResponse({
      data: row,
      error: null,
      message: "ok",
    });
  } catch (e) {
    console.error("[voip-purchase-number]", e);
    return jsonResponse(
      { data: null, error: "voip_error", message: e instanceof Error ? e.message : "Purchase failed" },
      500,
    );
  }
});
