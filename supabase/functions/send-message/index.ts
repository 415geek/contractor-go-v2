import { jsonResponse, handleOptionsRequest } from "../_shared/response.ts";
import { normalizeSmsPhone } from "../_shared/sms-phone.ts";
import {
  humanizeTelnyxSendMessageError,
  parseTelnyxMessagingProfileId,
  telnyxSendSmsWithProfileRepair,
} from "../_shared/telnyx-client.ts";
import { getUserFromRequest } from "../_shared/get-user.ts";
import { createAdminClient } from "../_shared/supabase.ts";
import { FREE_TIER_SMS_OUTBOUND_LIMIT, isProSubscriber } from "../_shared/voip-entitlements.ts";
import { countOutboundSmsForVirtualNumber } from "../_shared/voip-sms-quota.ts";

function getEnv(name: string): string {
  const v = Deno.env.get(name);
  if (!v) throw new Error(`Missing env: ${name}`);
  return v;
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
      return jsonResponse({ data: null, error: "unauthorized", message: "Invalid token" }, 401);
    }

    const body = await req.json() as {
      conversation_id?: string;
      content?: string;
      content_type?: string;
      media_urls?: string[];
      media_kind?: string;
    };
    const conversationId = typeof body.conversation_id === "string" ? body.conversation_id.trim() : "";
    const content = typeof body.content === "string" ? body.content.trim() : "";
    const mediaUrls = Array.isArray(body.media_urls)
      ? body.media_urls.filter((u): u is string => typeof u === "string" && u.startsWith("http"))
      : [];
    if (!conversationId || (!content && mediaUrls.length === 0)) {
      return jsonResponse(
        { data: null, error: "invalid_body", message: "conversation_id and (content or media_urls) required" },
        400,
      );
    }

    const admin = createAdminClient();
    const { data: conv, error: convErr } = await admin
      .from("conversations")
      .select("virtual_number_id, contact_phone, contact_language")
      .eq("id", conversationId)
      .eq("user_id", user.id)
      .single();

    if (convErr || !conv) {
      return jsonResponse({ data: null, error: "not_found", message: "Conversation not found" }, 404);
    }

    const contactPhone = (conv as { contact_phone?: string }).contact_phone;
    const contactLang = (conv as { contact_language?: string }).contact_language ?? "en";
    const vnId = (conv as { virtual_number_id?: string | null }).virtual_number_id;

    const { data: urow, error: uerr } = await admin
      .from("users")
      .select("subscription_tier, subscription_expires_at")
      .eq("id", user.id)
      .single();
    if (uerr) throw uerr;
    const tier = (urow as { subscription_tier?: string }).subscription_tier ?? "free";
    const expiresAt = (urow as { subscription_expires_at?: string | null }).subscription_expires_at ?? null;
    const pro = isProSubscriber(tier, expiresAt);

    let effectiveVnId: string | null = vnId ?? null;
    if (!effectiveVnId) {
      const { data: vnFirst } = await admin.from("virtual_numbers").select("id").eq("user_id", user.id).limit(1).maybeSingle();
      effectiveVnId = (vnFirst as { id?: string } | null)?.id ?? null;
    }

    if (!pro && effectiveVnId) {
      const outboundCount = await countOutboundSmsForVirtualNumber(admin, effectiveVnId);
      if (outboundCount >= FREE_TIER_SMS_OUTBOUND_LIMIT) {
        return jsonResponse(
          {
            data: null,
            error: "sms_quota_exceeded",
            message:
              "免费体验额度已用完（50 条出站短信）。订阅 Pro 后可无限发送，或等待后续额度策略更新。",
          },
          403,
        );
      }
    }

    let fromDid = "";
    if (effectiveVnId) {
      const { data: vn } = await admin
        .from("virtual_numbers")
        .select("phone_number")
        .eq("id", effectiveVnId)
        .maybeSingle();
      fromDid = (vn as { phone_number?: string } | null)?.phone_number ?? "";
    }

    const messagingProfileId = parseTelnyxMessagingProfileId(Deno.env.get("TELNYX_MESSAGING_PROFILE_ID"));

    if (!fromDid || !contactPhone) {
      return jsonResponse({ data: null, error: "invalid_conversation", message: "Missing virtual number or contact" }, 400);
    }

    const userRow = await admin.from("users").select("default_language").eq("id", user.id).single();
    const userLang = (userRow.data as { default_language?: string } | null)?.default_language ?? "en";

    const isVideo = body.media_kind === "video";
    const displayBody = content || (mediaUrls.length > 0 ? (isVideo ? "[视频]" : "[图片]") : "");

    let translated = content;
    if (content) {
      const translateRes = await fetch(`${getEnv("SUPABASE_URL")}/functions/v1/translate`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${getEnv("SUPABASE_ANON_KEY")}`,
        },
        body: JSON.stringify({
          text: content,
          source_lang: userLang,
          target_lang: contactLang,
        }),
      });
      let translateJson: { data?: { translated_text?: string } } = {};
      try {
        translateJson = await translateRes.json() as typeof translateJson;
      } catch {
        translateJson = {};
      }
      const tt = translateJson?.data?.translated_text;
      translated = typeof tt === "string" && tt.trim().length > 0 ? tt.trim() : content;
    } else {
      translated = "";
    }

    const toE164 = normalizeSmsPhone(contactPhone);
    const fromE164 = normalizeSmsPhone(fromDid);
    if (!toE164 || toE164.length < 8) {
      return jsonResponse({ data: null, error: "invalid_body", message: "Invalid contact_phone (E.164)" }, 400);
    }

    const isMms = mediaUrls.length > 0;
    if (!isMms && !String(translated).trim()) {
      return jsonResponse(
        { data: null, error: "invalid_body", message: "Cannot send empty SMS (translation produced no text)" },
        400,
      );
    }

    let telnyxMessageId: string | null = null;
    try {
      const sendRes = await telnyxSendSmsWithProfileRepair(getEnv("TELNYX_API_KEY"), {
        from: fromE164,
        to: toE164,
        text: translated,
        ...(messagingProfileId ? { messaging_profile_id: messagingProfileId } : {}),
        ...(mediaUrls.length > 0 ? { media_urls: mediaUrls } : {}),
      });
      telnyxMessageId = sendRes.telnyxMessageId;
      const toTail = toE164.length > 4 ? toE164.slice(-4) : "****";
      const fromTail = fromE164.length > 4 ? fromE164.slice(-4) : "****";
      console.log(
        `[send-message] telnyx accepted id=${telnyxMessageId ?? "none"} mms=${isMms} to=…${toTail} from=…${fromTail} mp=${
          messagingProfileId ? "yes" : "no"
        }`,
      );
    } catch (sendErr) {
      const raw = sendErr instanceof Error ? sendErr.message : String(sendErr);
      throw new Error(humanizeTelnyxSendMessageError(raw));
    }

    const msgType = mediaUrls.length > 0 ? (isVideo ? "video" : "image") : "text";
    const { data: msg, error: msgErr } = await admin
      .from("messages")
      .insert({
        conversation_id: conversationId,
        user_id: user.id,
        direction: "outbound",
        message_type: msgType,
        body: displayBody,
        original_content: content || displayBody,
        translated_content: translated || null,
        original_language: userLang,
        translated_language: contactLang,
        status: "sent",
        ...(telnyxMessageId ? { external_message_id: telnyxMessageId } : {}),
        ...(mediaUrls[0] ? { media_url: mediaUrls[0] } : {}),
      })
      .select()
      .single();

    if (msgErr) {
      return jsonResponse({ data: null, error: "db_error", message: msgErr.message }, 500);
    }

    return jsonResponse({ data: msg, error: null, message: "ok" });
  } catch (e) {
    console.error("[send-message]", e);
    return jsonResponse(
      { data: null, error: "internal_error", message: e instanceof Error ? e.message : "Send failed" },
      500,
    );
  }
});
