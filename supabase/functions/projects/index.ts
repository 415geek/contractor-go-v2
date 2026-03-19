import { jsonResponse, handleOptionsRequest } from "../_shared/response.ts";
import { getUserFromRequest } from "../_shared/get-user.ts";
import { createAdminClient } from "../_shared/supabase.ts";

type ProjectStatus = "planning" | "active" | "on_hold" | "completed" | "cancelled";

type ProjectInsert = {
  name: string;
  address?: string | null;
  client_name?: string | null;
  client_phone?: string | null;
  client_email?: string | null;
  total_cost?: number;
  labor_cost?: number;
  material_cost?: number;
  contract_type?: string | null;
  start_date?: string | null;
  end_date?: string | null;
  duration_days?: number | null;
  status?: ProjectStatus;
  notes?: string | null;
};

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
      action: "list" | "get" | "create" | "update" | "delete";
      status?: ProjectStatus;
      id?: string;
      row?: ProjectInsert;
      updates?: Partial<ProjectInsert>;
    };

    const action = body?.action;
    if (!action || !["list", "get", "create", "update", "delete"].includes(action)) {
      return jsonResponse({ data: null, error: "invalid_body", message: "action required: list|get|create|update|delete" }, 400);
    }

    const admin = createAdminClient();

    if (action === "list") {
      let q = admin
        .from("projects")
        .select("*")
        .eq("user_id", user.id)
        .order("start_date", { ascending: false, nullsFirst: false });
      if (body.status) q = q.eq("status", body.status);
      const { data, error } = await q;
      if (error) return jsonResponse({ data: null, error: "db_error", message: error.message }, 500);
      return jsonResponse({ data: data ?? [], error: null, message: "ok" });
    }

    if (action === "get") {
      const id = body.id;
      if (!id) return jsonResponse({ data: null, error: "invalid_body", message: "id required" }, 400);
      const { data, error } = await admin
        .from("projects")
        .select("*")
        .eq("id", id)
        .eq("user_id", user.id)
        .single();
      if (error) {
        if (error.code === "PGRST116") return jsonResponse({ data: null, error: null, message: "ok" });
        return jsonResponse({ data: null, error: "db_error", message: error.message }, 500);
      }
      return jsonResponse({ data, error: null, message: "ok" });
    }

    if (action === "create") {
      const row = body.row;
      if (!row?.name?.trim()) return jsonResponse({ data: null, error: "invalid_body", message: "row.name required" }, 400);
      const { data, error } = await admin
        .from("projects")
        .insert({
          user_id: user.id,
          name: row.name.trim(),
          address: row.address ?? null,
          client_name: row.client_name ?? null,
          client_phone: row.client_phone ?? null,
          client_email: row.client_email ?? null,
          total_cost: row.total_cost ?? 0,
          labor_cost: row.labor_cost ?? 0,
          material_cost: row.material_cost ?? 0,
          contract_type: row.contract_type ?? null,
          start_date: row.start_date ?? null,
          end_date: row.end_date ?? null,
          duration_days: row.duration_days ?? null,
          status: row.status ?? "planning",
          notes: row.notes ?? null,
        })
        .select()
        .single();
      if (error) return jsonResponse({ data: null, error: "db_error", message: error.message }, 500);
      return jsonResponse({ data, error: null, message: "ok" });
    }

    if (action === "update") {
      const id = body.id;
      const updates = body.updates ?? {};
      if (!id) return jsonResponse({ data: null, error: "invalid_body", message: "id required" }, 400);
      const { data, error } = await admin
        .from("projects")
        .update({
          ...updates,
          updated_at: new Date().toISOString(),
        })
        .eq("id", id)
        .eq("user_id", user.id)
        .select()
        .single();
      if (error) return jsonResponse({ data: null, error: "db_error", message: error.message }, 500);
      return jsonResponse({ data, error: null, message: "ok" });
    }

    if (action === "delete") {
      const id = body.id;
      if (!id) return jsonResponse({ data: null, error: "invalid_body", message: "id required" }, 400);
      const { error } = await admin.from("projects").delete().eq("id", id).eq("user_id", user.id);
      if (error) return jsonResponse({ data: null, error: "db_error", message: error.message }, 500);
      return jsonResponse({ data: null, error: null, message: "ok" });
    }

    return jsonResponse({ data: null, error: "invalid_action", message: "Unknown action" }, 400);
  } catch (e) {
    console.error("[projects]", e);
    return jsonResponse(
      { data: null, error: "internal_error", message: e instanceof Error ? e.message : "Request failed" },
      500,
    );
  }
});
