import { jsonResponse, handleOptionsRequest } from "../_shared/response.ts";
import { getUserFromRequest } from "../_shared/get-user.ts";
import { createAdminClient } from "../_shared/supabase.ts";

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

    const body = (await req.json()) as { conversation_id?: string };
    const conversationId = typeof body.conversation_id === "string" ? body.conversation_id.trim() : "";
    if (!conversationId) {
      return jsonResponse({ data: null, error: "invalid_params", message: "conversation_id required" }, 400);
    }

    const admin = createAdminClient();
    const { data: conv } = await admin
      .from("conversations")
      .select("id")
      .eq("id", conversationId)
      .eq("user_id", user.id)
      .single();

    if (!conv) {
      return jsonResponse({ data: null, error: "not_found", message: "Conversation not found" }, 404);
    }

    const { data, error } = await admin
      .from("messages")
      .select("id, conversation_id, direction, message_type, original_content, translated_content, status, created_at")
      .eq("conversation_id", conversationId)
      .order("created_at", { ascending: true });

    if (error) {
      return jsonResponse({ data: null, error: "db_error", message: error.message }, 500);
    }

    return jsonResponse({ data: data ?? [], error: null, message: "ok" });
  } catch (e) {
    console.error("[get-messages]", e);
    return jsonResponse(
      { data: null, error: "internal_error", message: e instanceof Error ? e.message : "Request failed" },
      500,
    );
  }
});
