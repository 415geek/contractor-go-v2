import { jsonResponse, handleOptionsRequest } from "../_shared/response.ts";
import {
  normalizeToE164US,
  telnyxCreateNumberOrder,
  telnyxWaitNumberOrderSuccess,
} from "../_shared/telnyx-client.ts";
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
    const e164 = normalizeToE164US(did);
    const apiKey = getEnv("TELNYX_API_KEY");
    const messagingProfileId = Deno.env.get("TELNYX_MESSAGING_PROFILE_ID")?.trim();
    const connectionId = Deno.env.get("TELNYX_CONNECTION_ID")?.trim();

    const t0 = performance.now();
    const order = await telnyxCreateNumberOrder(apiKey, e164, {
      messaging_profile_id: messagingProfileId || undefined,
      connection_id: connectionId || undefined,
    });
    const orderId = order.id;
    if (!orderId) {
      throw new Error("Telnyx 未返回 number_order id");
    }
    await telnyxWaitNumberOrderSuccess(apiKey, orderId);
    console.log(`[voip-purchase-number] Telnyx order ${orderId} ok in ${Math.round(performance.now() - t0)}ms`);

    const monthlyStr = typeof body.monthly === "string" ? body.monthly.trim() : "";
    const monthly = monthlyStr ? parseFloat(monthlyStr) || 0 : 0;

    const admin = createAdminClient();
    const { data: row, error } = await admin
      .from("virtual_numbers")
      .insert({
        user_id: user.id,
        phone_number: phoneNumber,
        provider: "telnyx",
        status: "active",
        metadata: {
          monthly_cost: monthly,
          telnyx_number_order_id: orderId,
        },
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
      { data: null, error: "telnyx_error", message: e instanceof Error ? e.message : "Purchase failed" },
      500,
    );
  }
});
