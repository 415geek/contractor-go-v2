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
      contact_phone?: string;
      contact_name?: string;
      virtual_number_id?: string;
    };
    const contactPhone = typeof body.contact_phone === "string" ? body.contact_phone.trim() : "";
    if (!contactPhone || contactPhone.length < 8) {
      return jsonResponse({ data: null, error: "invalid_body", message: "contact_phone required" }, 400);
    }

    const admin = createAdminClient();
    const { data, error } = await admin
      .from("conversations")
      .insert({
        user_id: user.id,
        contact_phone: contactPhone,
        contact_name: body.contact_name ?? contactPhone,
        contact_language: "en-US",
        virtual_number_id: body.virtual_number_id ?? null,
      })
      .select()
      .single();

    if (error) {
      return jsonResponse({ data: null, error: "db_error", message: error.message }, 500);
    }

    return jsonResponse({ data, error: null, message: "ok" });
  } catch (e) {
    console.error("[create-conversation]", e);
    return jsonResponse(
      { data: null, error: "internal_error", message: e instanceof Error ? e.message : "Request failed" },
      500,
    );
  }
});
