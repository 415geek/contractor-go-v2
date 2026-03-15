import { jsonResponse, handleOptionsRequest } from "../_shared/response.ts";
import { VoipMsClient } from "../_shared/voip-client.ts";
import { getUserFromRequest } from "../_shared/get-user.ts";
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

    const body = await req.json() as { conversation_id?: string; content?: string; content_type?: string };
    const conversationId = body.conversation_id;
    const content = typeof body.content === "string" ? body.content.trim() : "";
    if (!conversationId || !content) {
      return jsonResponse({ data: null, error: "invalid_body", message: "conversation_id and content required" }, 400);
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
    const vnId = (conv as { virtual_number_id?: string }).virtual_number_id;

    let fromDid: string;
    if (vnId) {
      const { data: vn } = await admin.from("virtual_numbers").select("phone_number").eq("id", vnId).single();
      fromDid = (vn as { phone_number?: string })?.phone_number ?? "";
    } else {
      const { data: vn } = await admin.from("virtual_numbers").select("phone_number").eq("user_id", user.id).limit(1).single();
      fromDid = (vn as { phone_number?: string })?.phone_number ?? "";
    }

    if (!fromDid || !contactPhone) {
      return jsonResponse({ data: null, error: "invalid_conversation", message: "Missing virtual number or contact" }, 400);
    }

    const userRow = await admin.from("users").select("default_language").eq("id", user.id).single();
    const userLang = (userRow.data as { default_language?: string } | null)?.default_language ?? "en";

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
    const translateJson = await translateRes.json();
    const translated = translateJson?.data?.translated_text ?? content;

    const voip = new VoipMsClient(getEnv("VOIPMS_USERNAME"), getEnv("VOIPMS_PASSWORD"));
    await voip.sendSMS(fromDid, normalizePhone(contactPhone), translated);

    const { data: msg, error: msgErr } = await admin
      .from("messages")
      .insert({
        conversation_id: conversationId,
        direction: "outbound",
        message_type: "text",
        original_content: content,
        translated_content: translated,
        original_language: userLang,
        translated_language: contactLang,
        status: "sent",
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
