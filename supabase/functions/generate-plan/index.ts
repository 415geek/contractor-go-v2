import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";
import { jsonResponse, handleOptionsRequest } from "../_shared/response.ts";
import { getUserFromRequest } from "../_shared/get-user.ts";

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

  const user = await getUserFromRequest(req);
  if (!user) {
    return jsonResponse({ data: null, error: "unauthorized", message: "Auth required" }, 401);
  }

  try {
    const body = (await req.json()) as { project_id?: string };
    const projectId = body.project_id;
    if (!projectId || typeof projectId !== "string") {
      return jsonResponse(
        { data: null, error: "invalid_body", message: "project_id required" },
        400,
      );
    }

    const supabaseUrl = getEnv("SUPABASE_URL");
    const serviceKey = getEnv("SUPABASE_SERVICE_ROLE_KEY");
    const client = createClient(supabaseUrl, serviceKey, {
      auth: { autoRefreshToken: false, persistSession: false },
    });

    const { data: project, error: fetchErr } = await client
      .from("projects")
      .select("*")
      .eq("id", projectId)
      .eq("user_id", user.id)
      .single();

    if (fetchErr || !project) {
      return jsonResponse(
        { data: null, error: "not_found", message: "Project not found" },
        404,
      );
    }

    const anthropicKey = getEnv("ANTHROPIC_API_KEY");
    const prompt = `Generate a construction plan and material list for this project. Output valid JSON only.

Project: ${project.name}
Address: ${project.address ?? "N/A"}
Client: ${project.client_name ?? "N/A"}
Total cost: ${project.total_cost}
Duration: ${project.duration_days ?? "N/A"} days

Output JSON:
{
  "construction_plan": {
    "summary": "简短施工方案摘要",
    "phases": ["阶段1", "阶段2"],
    "content": "详细施工方案正文"
  },
  "material_list": [
    { "name": "材料名", "quantity": "数量", "unit": "单位", "notes": "备注" }
  ]
}`;

    const res = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": anthropicKey,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model: "claude-3-5-sonnet-20241022",
        max_tokens: 2048,
        messages: [{ role: "user", content: prompt }],
      }),
    });

    const json = await res.json();
    const content = json.content?.[0]?.text?.trim() ?? "";
    if (!content) {
      return jsonResponse(
        {
          data: null,
          error: "generate_failed",
          message: json.error?.message ?? "No response from Claude",
        },
        500,
      );
    }

    let planPayload: { construction_plan?: unknown; material_list?: unknown[] };
    try {
      planPayload = JSON.parse(content);
    } catch {
      return jsonResponse(
        { data: null, error: "invalid_json", message: "Claude output was not valid JSON" },
        500,
      );
    }

    const { error: updateErr } = await client
      .from("projects")
      .update({
        construction_plan: planPayload.construction_plan ?? {},
        material_list: planPayload.material_list ?? [],
        updated_at: new Date().toISOString(),
      })
      .eq("id", projectId)
      .eq("user_id", user.id);

    if (updateErr) {
      return jsonResponse(
        { data: null, error: "update_failed", message: updateErr.message },
        500,
      );
    }

    return jsonResponse({
      data: {
        construction_plan: planPayload.construction_plan,
        material_list: planPayload.material_list,
      },
      error: null,
      message: "ok",
    });
  } catch (e) {
    console.error("[generate-plan]", e);
    return jsonResponse(
      {
        data: null,
        error: "internal_error",
        message: e instanceof Error ? e.message : "Generate failed",
      },
      500,
    );
  }
});
