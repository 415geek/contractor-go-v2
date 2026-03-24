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

    const body = (await req.json()) as {
      conversation_id?: string;
      contact_name?: string | null;
      contact_company?: string | null;
      contact_notes?: string | null;
      contact_phone?: string | null;
      contact_language?: string | null;
    };

    const conversationId = typeof body.conversation_id === "string" ? body.conversation_id.trim() : "";
    if (!conversationId) {
      return jsonResponse({ data: null, error: "invalid_body", message: "conversation_id required" }, 400);
    }

    const patch: Record<string, string | null> = {};
    if (body.contact_name !== undefined) patch.contact_name = body.contact_name?.trim() || null;
    if (body.contact_company !== undefined) patch.contact_company = body.contact_company?.trim() || null;
    if (body.contact_notes !== undefined) patch.contact_notes = body.contact_notes?.trim() || null;
    if (body.contact_phone !== undefined) {
      const p = (body.contact_phone ?? "").trim();
      if (p.length > 0 && p.length < 8) {
        return jsonResponse({ data: null, error: "invalid_body", message: "contact_phone invalid" }, 400);
      }
      patch.contact_phone = p.length >= 8 ? p : null;
    }
    if (body.contact_language !== undefined) {
      const l = body.contact_language?.trim() || "";
      patch.contact_language = l.length > 0 ? l : "en";
    }

    if (Object.keys(patch).length === 0) {
      return jsonResponse({ data: null, error: "invalid_body", message: "No fields to update" }, 400);
    }

    const admin = createAdminClient();
    const { data, error } = await admin
      .from("conversations")
      .update(patch)
      .eq("id", conversationId)
      .eq("user_id", user.id)
      .select()
      .single();

    if (error) {
      return jsonResponse({ data: null, error: "db_error", message: error.message }, 500);
    }
    if (!data) {
      return jsonResponse({ data: null, error: "not_found", message: "Conversation not found" }, 404);
    }

    return jsonResponse({ data, error: null, message: "ok" });
  } catch (e) {
    console.error("[update-conversation]", e);
    return jsonResponse(
      { data: null, error: "internal_error", message: e instanceof Error ? e.message : "Request failed" },
      500,
    );
  }
});
