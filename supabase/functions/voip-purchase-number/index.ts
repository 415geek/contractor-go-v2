import { jsonResponse, handleOptionsRequest } from "../_shared/response.ts";
import {
  normalizeToE164US,
  parseTelnyxConnectionId,
  parseTelnyxMessagingProfileId,
  telnyxCreateNumberOrder,
  telnyxWaitNumberOrderSuccess,
} from "../_shared/telnyx-client.ts";
import { getUserFromRequest } from "../_shared/get-user.ts";
import { createAdminClient } from "../_shared/supabase.ts";
import {
  FREE_TIER_SMS_OUTBOUND_LIMIT,
  FREE_TIER_VOICE_SECONDS_LIMIT,
  isProSubscriber,
} from "../_shared/voip-entitlements.ts";

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

    const admin = createAdminClient();

    const { data: urow, error: uerr } = await admin
      .from("users")
      .select("subscription_tier, subscription_expires_at")
      .eq("id", user.id)
      .maybeSingle();
    if (uerr) throw uerr;

    const tier = (urow as { subscription_tier?: string } | null)?.subscription_tier ?? "free";
    const expiresAt = (urow as { subscription_expires_at?: string | null } | null)?.subscription_expires_at ?? null;
    const pro = isProSubscriber(tier, expiresAt);

    const { count: existingCount, error: cntErr } = await admin
      .from("virtual_numbers")
      .select("*", { count: "exact", head: true })
      .eq("user_id", user.id);
    if (cntErr) throw cntErr;
    if ((existingCount ?? 0) >= 1) {
      return jsonResponse(
        {
          data: null,
          error: "already_has_number",
          message: "每位用户仅可绑定一个虚拟号码。若需更换，请先联系客服或后续支持「释放号码」功能。",
        },
        403,
      );
    }

    // 再次确保 public.users 存在该行（virtual_numbers.user_id FK）
    const { error: ensureUserErr } = await admin.from("users").upsert({ id: user.id }, { onConflict: "id" });
    if (ensureUserErr) {
      console.error("[voip-purchase-number] public.users upsert failed:", ensureUserErr);
      return jsonResponse(
        { data: null, error: "user_sync_failed", message: ensureUserErr.message },
        500,
      );
    }
    if (user.email) {
      const { error: emailErr } = await admin.from("users").update({ email: user.email }).eq("id", user.id);
      if (emailErr) console.warn("[voip-purchase-number] email update skipped:", emailErr.message);
    }

    const phoneNumber = normalizeDid(did);
    const e164 = normalizeToE164US(did);
    const apiKey = getEnv("TELNYX_API_KEY");
    const messagingProfileId = parseTelnyxMessagingProfileId(Deno.env.get("TELNYX_MESSAGING_PROFILE_ID"));
    const connectionId = parseTelnyxConnectionId(Deno.env.get("TELNYX_CONNECTION_ID"));

    const t0 = performance.now();
    const order = await telnyxCreateNumberOrder(apiKey, e164, {
      messaging_profile_id: messagingProfileId,
      connection_id: connectionId,
    });
    const orderId = order.id;
    if (!orderId) {
      throw new Error("Telnyx 未返回 number_order id");
    }
    await telnyxWaitNumberOrderSuccess(apiKey, orderId);
    console.log(`[voip-purchase-number] Telnyx order ${orderId} ok in ${Math.round(performance.now() - t0)}ms`);

    const monthlyStr = typeof body.monthly === "string" ? body.monthly.trim() : "";
    const monthly = monthlyStr ? parseFloat(monthlyStr) || 0 : 0;

    const metadata: Record<string, unknown> = {
      monthly_cost: monthly,
      telnyx_number_order_id: orderId,
      entitlement: pro ? "pro" : "free_limited",
    };
    if (!pro) {
      metadata.free_limit_sms = FREE_TIER_SMS_OUTBOUND_LIMIT;
      metadata.free_limit_voice_seconds = FREE_TIER_VOICE_SECONDS_LIMIT;
      metadata.voice_seconds_used = 0;
    }

    const { data: row, error } = await admin
      .from("virtual_numbers")
      .insert({
        user_id: user.id,
        phone_number: phoneNumber,
        provider: "telnyx",
        status: "active",
        metadata,
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
