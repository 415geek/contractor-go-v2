/**
 * 当前登录用户的订阅与虚拟号用量（供 App 订阅页 / 虚拟号页展示）
 */
import { jsonResponse, handleOptionsRequest } from "../_shared/response.ts";
import { getUserFromRequest } from "../_shared/get-user.ts";
import { createAdminClient } from "../_shared/supabase.ts";
import {
  FREE_TIER_SMS_OUTBOUND_LIMIT,
  FREE_TIER_VOICE_SECONDS_LIMIT,
  isProSubscriber,
} from "../_shared/voip-entitlements.ts";
import { countOutboundSmsForVirtualNumber } from "../_shared/voip-sms-quota.ts";

Deno.serve(async (req) => {
  const opts = handleOptionsRequest(req);
  if (opts) return opts;

  if (req.method !== "GET") {
    return jsonResponse({ data: null, error: "method_not_allowed", message: "GET only" }, 405);
  }

  try {
    const user = await getUserFromRequest(req);
    if (!user) {
      return jsonResponse({ data: null, error: "unauthorized", message: "Invalid token" }, 401);
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

    const { data: vns, error: verr } = await admin
      .from("virtual_numbers")
      .select("id, phone_number, metadata, status")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false });

    if (verr) throw verr;

    const numbers = vns ?? [];
    const primary = numbers[0] as
      | {
          id: string;
          phone_number: string;
          metadata?: Record<string, unknown>;
          status?: string;
        }
      | undefined;

    let smsSent = 0;
    let voiceSecondsUsed = 0;
    if (primary?.id) {
      smsSent = await countOutboundSmsForVirtualNumber(admin, primary.id);
      const m = primary.metadata ?? {};
      voiceSecondsUsed = typeof m.voice_seconds_used === "number" ? m.voice_seconds_used : 0;
    }

    return jsonResponse({
      data: {
        subscription_tier: tier,
        subscription_expires_at: expiresAt,
        is_pro: pro,
        virtual_numbers: numbers,
        usage: {
          sms_outbound_sent: smsSent,
          sms_outbound_limit: pro ? null : FREE_TIER_SMS_OUTBOUND_LIMIT,
          voice_seconds_used: voiceSecondsUsed,
          voice_seconds_limit: pro ? null : FREE_TIER_VOICE_SECONDS_LIMIT,
        },
      },
      error: null,
      message: "ok",
    });
  } catch (e) {
    console.error("[me-profile]", e);
    return jsonResponse(
      { data: null, error: "internal_error", message: e instanceof Error ? e.message : "Failed" },
      500,
    );
  }
});
