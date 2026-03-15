import { jsonResponse, handleOptionsRequest } from "../_shared/response.ts";
import { getUserFromRequest } from "../_shared/get-user.ts";
import { createAdminClient } from "../_shared/supabase.ts";

Deno.serve(async (req) => {
  const opts = handleOptionsRequest(req);
  if (opts) return opts;

  if (req.method !== "GET" && req.method !== "POST") {
    return jsonResponse({ data: null, error: "method_not_allowed", message: "GET or POST" }, 405);
  }

  try {
    const user = await getUserFromRequest(req);
    if (!user) {
      return jsonResponse({ data: null, error: "unauthorized", message: "Invalid or missing token" }, 401);
    }

    const admin = createAdminClient();
    const { data, error } = await admin
      .from("virtual_numbers")
      .select("*")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false });

    if (error) {
      return jsonResponse({ data: null, error: "db_error", message: error.message }, 500);
    }

    return jsonResponse({ data: data ?? [], error: null, message: "ok" });
  } catch (e) {
    console.error("[voip-my-numbers]", e);
    return jsonResponse(
      { data: null, error: "internal_error", message: e instanceof Error ? e.message : "Request failed" },
      500,
    );
  }
});
