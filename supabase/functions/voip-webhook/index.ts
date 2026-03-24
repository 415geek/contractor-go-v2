import { jsonResponse, handleOptionsRequest } from "../_shared/response.ts";
import { normalizeSmsPhone } from "../_shared/sms-phone.ts";
import { createAdminClient } from "../_shared/supabase.ts";

function getEnv(name: string): string {
  const v = Deno.env.get(name);
  if (!v) throw new Error(`Missing env: ${name}`);
  return v;
}

/** 从 Telnyx payload 取号码：支持 E.164 字符串或 { phone_number } */
function phoneFromField(v: unknown): string {
  if (typeof v === "string" && v.trim()) return v.trim();
  if (v && typeof v === "object" && "phone_number" in v && typeof (v as { phone_number?: string }).phone_number === "string") {
    return (v as { phone_number: string }).phone_number.trim();
  }
  return "";
}

function toDestFromPayload(pl: Record<string, unknown>): string {
  const t = pl.to;
  if (typeof t === "string" && t.trim()) return t.trim();
  if (Array.isArray(t) && t.length > 0) {
    const first = phoneFromField(t[0]);
    if (first) return first;
  }
  return "";
}

/** 出站送达终态：更新 messages.status，便于区分「API 成功但运营商未送达」 */
function mapTelnyxToStatus(carrierStatus: string): "sent" | "delivered" | "failed" {
  const s = carrierStatus.toLowerCase();
  if (s === "delivered") return "delivered";
  if (s === "delivery_failed" || s === "sending_failed" || s === "expired") return "failed";
  return "sent";
}

async function handleMessageFinalized(
  admin: ReturnType<typeof createAdminClient>,
  raw: Record<string, unknown>,
): Promise<boolean> {
  const data = raw?.data as
    | { event_type?: string; payload?: Record<string, unknown> }
    | undefined;
  if (data?.event_type !== "message.finalized" || !data.payload || typeof data.payload !== "object") {
    return false;
  }
  const pl = data.payload as Record<string, unknown>;
  const telnyxId = typeof pl.id === "string" ? pl.id.trim() : "";
  if (!telnyxId) return true;

  const toArr = Array.isArray(pl.to) ? pl.to as Array<{ status?: string }> : [];
  const carrierStatus = typeof toArr[0]?.status === "string" ? toArr[0].status : "";
  let dbStatus = mapTelnyxToStatus(carrierStatus || "sent");
  const hasErrors = pl.errors && Array.isArray(pl.errors) && pl.errors.length > 0;
  if (hasErrors && dbStatus !== "delivered") {
    dbStatus = "failed";
  }

  if (hasErrors) {
    console.warn("[voip-webhook] message.finalized errors:", telnyxId, JSON.stringify(pl.errors));
  }
  console.log("[voip-webhook] message.finalized", telnyxId, carrierStatus, "->", dbStatus);

  const { data: rows, error: selErr } = await admin
    .from("messages")
    .select("id")
    .eq("external_message_id", telnyxId)
    .limit(1);
  if (selErr) {
    console.error("[voip-webhook] finalize lookup:", selErr.message);
    return true;
  }
  if (!rows?.length) {
    console.warn("[voip-webhook] message.finalized: no local row for external_message_id", telnyxId);
    return true;
  }

  const { error: upErr } = await admin.from("messages").update({ status: dbStatus }).eq("external_message_id", telnyxId);
  if (upErr) console.error("[voip-webhook] finalize update:", upErr.message);
  return true;
}

/** Telnyx `message.received` 与旧版简单 JSON 兼容 */
function parseInboundJson(raw: Record<string, unknown>): { from: string; to: string; message: string } | null {
  const data = raw?.data as
    | {
        event_type?: string;
        payload?: Record<string, unknown>;
      }
    | undefined;

  if (data?.event_type === "message.received" && data.payload && typeof data.payload === "object") {
    const pl = data.payload as Record<string, unknown>;
    const from = phoneFromField(pl.from);
    const to = toDestFromPayload(pl);
    const message =
      typeof pl.text === "string"
        ? pl.text
        : typeof pl.body === "string"
          ? pl.body
          : "";
    if (from && to) {
      return { from, to, message: message || "(无文本内容)" };
    }
  }

  const legacy = raw as { from?: string; to?: string; message?: string };
  if (legacy.from && legacy.to && legacy.message) {
    return { from: legacy.from, to: legacy.to, message: legacy.message };
  }

  return null;
}

async function parseInbound(req: Request): Promise<{ from: string; to: string; message: string } | null> {
  const ct = req.headers.get("content-type") ?? "";
  if (!ct.includes("application/json")) {
    const text = await req.text();
    const params = new URLSearchParams(text);
    const from = params.get("from");
    const to = params.get("to");
    const message = params.get("message");
    return from && to && message ? { from, to, message } : null;
  }

  const raw = await req.json() as Record<string, unknown>;
  return parseInboundJson(raw);
}

async function processInboundSms(
  admin: ReturnType<typeof createAdminClient>,
  body: { from: string; to: string; message: string },
): Promise<Response> {
  const toNormalized = normalizeSmsPhone(body.to);
  const fromNormalized = normalizeSmsPhone(body.from);

  const { data: vn } = await admin
    .from("virtual_numbers")
    .select("id, user_id")
    .eq("phone_number", toNormalized)
    .single();

  if (!vn) {
    console.warn("[voip-webhook] Unknown number:", toNormalized);
    return jsonResponse({ data: null, error: "unknown_number", message: "Number not found" }, 404);
  }

  const userId = (vn as { user_id: string }).user_id;
  const vnId = (vn as { id: string }).id;

  const { data: user } = await admin.from("users").select("default_language").eq("id", userId).single();
  const userLang = (user as { default_language?: string } | null)?.default_language ?? "en";

  const translateRes = await fetch(`${getEnv("SUPABASE_URL")}/functions/v1/translate`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${getEnv("SUPABASE_ANON_KEY")}`,
    },
    body: JSON.stringify({
      text: body.message,
      source_lang: "auto",
      target_lang: userLang,
    }),
  });
  const translateJson = await translateRes.json();
  const translated = translateJson?.data?.translated_text ?? body.message;

  let { data: conv } = await admin
    .from("conversations")
    .select("id")
    .eq("user_id", userId)
    .eq("virtual_number_id", vnId)
    .eq("contact_phone", fromNormalized)
    .single();

  if (!conv) {
    const { data: newConv, error: convErr } = await admin
      .from("conversations")
      .insert({
        user_id: userId,
        virtual_number_id: vnId,
        contact_phone: fromNormalized,
        contact_name: fromNormalized,
        contact_language: "en",
      })
      .select("id")
      .single();
    if (convErr) throw convErr;
    conv = newConv;
  }

  const convId = (conv as { id: string }).id;
  const { data: msg, error: msgErr } = await admin
    .from("messages")
    .insert({
      conversation_id: convId,
      user_id: userId,
      direction: "inbound",
      message_type: "text",
      body: body.message,
      original_content: body.message,
      translated_content: translated,
      original_language: "en",
      translated_language: userLang,
      status: "sent",
    })
    .select()
    .single();

  if (msgErr) throw msgErr;

  return jsonResponse({ data: { id: (msg as { id: string })?.id }, error: null, message: "ok" });
}

Deno.serve(async (req) => {
  const opts = handleOptionsRequest(req);
  if (opts) return opts;

  if (req.method !== "POST") {
    return jsonResponse({ data: null, error: "method_not_allowed", message: "POST only" }, 405);
  }

  try {
    const admin = createAdminClient();
    const ct = req.headers.get("content-type") ?? "";

    if (ct.includes("application/json")) {
      const raw = await req.json() as Record<string, unknown>;
      const eventType = (raw?.data as { event_type?: string } | undefined)?.event_type;
      const finalized = await handleMessageFinalized(admin, raw);
      if (finalized && eventType === "message.finalized") {
        return jsonResponse({ data: { handled: "message.finalized" }, error: null, message: "ok" });
      }
      const body = parseInboundJson(raw);
      if (!body) {
        if (typeof eventType === "string" && eventType.startsWith("message.")) {
          return jsonResponse({ data: { ack: true, event: eventType }, error: null, message: "ok" });
        }
        return jsonResponse({ data: null, error: "invalid_body", message: "Unrecognized webhook payload" }, 400);
      }
      return await processInboundSms(admin, body);
    }

    const body = await parseInbound(req);
    if (!body) {
      return jsonResponse({ data: null, error: "invalid_body", message: "Unrecognized webhook payload" }, 400);
    }
    return await processInboundSms(admin, body);
  } catch (e) {
    console.error("[voip-webhook]", e);
    return jsonResponse(
      { data: null, error: "internal_error", message: e instanceof Error ? e.message : "Webhook failed" },
      500,
    );
  }
});
