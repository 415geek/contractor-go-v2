import { jsonResponse, handleOptionsRequest } from "../_shared/response.ts";
import { createAdminClient } from "../_shared/supabase.ts";

function getEnv(name: string): string {
  const v = Deno.env.get(name);
  if (!v) throw new Error(`Missing env: ${name}`);
  return v;
}

function normalizePhone(p: string): string {
  const d = p.replace(/\D/g, "");
  return d.length === 10 ? `+1${d}` : d.startsWith("1") && d.length === 11 ? `+${d}` : p.startsWith("+") ? p : `+${p}`;
}

/** Telnyx `message.received` 与旧版简单 JSON 兼容 */
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

  const data = raw?.data as
    | {
        event_type?: string;
        payload?: {
          from?: { phone_number?: string };
          to?: Array<{ phone_number?: string }>;
          text?: string;
        };
      }
    | undefined;

  if (data?.event_type === "message.received" && data.payload) {
    const pl = data.payload;
    const from = pl.from?.phone_number;
    const to = pl.to?.[0]?.phone_number;
    const message = typeof pl.text === "string" ? pl.text : "";
    if (from && to && message) {
      return { from, to, message };
    }
  }

  const legacy = raw as { from?: string; to?: string; message?: string };
  if (legacy.from && legacy.to && legacy.message) {
    return { from: legacy.from, to: legacy.to, message: legacy.message };
  }

  return null;
}

Deno.serve(async (req) => {
  const opts = handleOptionsRequest(req);
  if (opts) return opts;

  if (req.method !== "POST") {
    return jsonResponse({ data: null, error: "method_not_allowed", message: "POST only" }, 405);
  }

  try {
    const body = await parseInbound(req);
    if (!body) {
      return jsonResponse({ data: null, error: "invalid_body", message: "Unrecognized webhook payload" }, 400);
    }

    const toNormalized = normalizePhone(body.to);
    const fromNormalized = normalizePhone(body.from);

    const admin = createAdminClient();
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
        direction: "inbound",
        message_type: "text",
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
  } catch (e) {
    console.error("[voip-webhook]", e);
    return jsonResponse(
      { data: null, error: "internal_error", message: e instanceof Error ? e.message : "Webhook failed" },
      500,
    );
  }
});
