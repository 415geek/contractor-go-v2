import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";
import { corsHeaders } from "../_shared/cors.ts";
import { jsonResponse, handleOptionsRequest } from "../_shared/response.ts";
import { getUserFromRequest } from "../_shared/get-user.ts";

function getEnv(name: string): string {
  const v = Deno.env.get(name);
  if (!v) throw new Error(`Missing env: ${name}`);
  return v;
}

const CITY_APIS: Record<string, string> = {
  "San Francisco": "https://data.sfgov.org/resource/i98e-djp9.json",
  Oakland: "https://data.oaklandca.gov/resource/building-permits.json",
  "San Jose": "https://data.sanjoseca.gov/resource/permits.json",
};

const SUPPORTED_CITIES = Object.keys(CITY_APIS);

function detectCity(address: string): string | null {
  const lower = address.toLowerCase();
  if (lower.includes("san francisco") || lower.includes("sf ")) return "San Francisco";
  if (lower.includes("oakland")) return "Oakland";
  if (lower.includes("san jose") || lower.includes("sanjose")) return "San Jose";
  return null;
}

const CLAUDE_PARSE_PROMPT = (city: string, raw: string) =>
  `Parse this raw permit data from ${city}.

Raw: ${raw}

Output JSON:
{
  "address": "标准化地址",
  "parcel_number": "地块号",
  "property_info": {
    "lot_size_sqft": 5000,
    "year_built": 1960,
    "zoning": "R1",
    "bedrooms": 3,
    "bathrooms": 2
  },
  "permit_history": [
    {
      "permit_number": "B2023-001",
      "type": "类型",
      "description": "描述",
      "status": "approved|pending|finaled",
      "issued_date": "YYYY-MM-DD",
      "estimated_cost": 50000
    }
  ],
  "key_insights": ["近期完成屋顶翻新", "有未解决违规"]
}
Use null for missing fields.`;

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
    const body = (await req.json()) as { address?: string };
    const address = typeof body.address === "string" ? body.address.trim() : "";
    if (!address) {
      return jsonResponse(
        { data: null, error: "invalid_body", message: "address required" },
        400,
      );
    }

    const city = detectCity(address);
    if (!city) {
      return new Response(
        JSON.stringify({
          data: null,
          error: "unsupported_city",
          message: "Address city not supported",
          supported_cities: SUPPORTED_CITIES,
        }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    const apiUrl = CITY_APIS[city];
    const addrPart = address.replace(/'/g, "''");
    const whereClause = `address like '%${addrPart}%'`;
    const url = `${apiUrl}?$limit=20&$where=${encodeURIComponent(whereClause)}`;
    const res = await fetch(url, {
      headers: { "Accept": "application/json" },
    });
    const rawData = await res.text();
    let parsedRaw: unknown;
    try {
      parsedRaw = JSON.parse(rawData);
    } catch {
      parsedRaw = rawData;
    }

    const anthropicKey = getEnv("ANTHROPIC_API_KEY");
    const parseRes = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": anthropicKey,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model: "claude-3-5-sonnet-20241022",
        max_tokens: 2048,
        messages: [
          {
            role: "user",
            content: CLAUDE_PARSE_PROMPT(city, typeof parsedRaw === "string" ? parsedRaw : JSON.stringify(parsedRaw)),
          },
        ],
      }),
    });
    const parseJson = await parseRes.json();
    const content = parseJson.content?.[0]?.text?.trim() ?? "";
    let parsedResult: Record<string, unknown> = {};
    if (content) {
      try {
        parsedResult = JSON.parse(content);
      } catch {
        parsedResult = { address, raw_preview: rawData.slice(0, 500) };
      }
    } else {
      parsedResult = { address, raw_preview: rawData.slice(0, 500) };
    }

    const supabaseUrl = getEnv("SUPABASE_URL");
    const serviceKey = getEnv("SUPABASE_SERVICE_ROLE_KEY");
    const client = createClient(supabaseUrl, serviceKey, {
      auth: { autoRefreshToken: false, persistSession: false },
    });
    await client.from("permit_searches").insert({
      user_id: user.id,
      address,
      city,
      raw_data: parsedRaw,
      parsed_result: parsedResult,
    });

    return jsonResponse({
      data: {
        address: parsedResult.address ?? address,
        city,
        property_info: parsedResult.property_info ?? null,
        permit_history: parsedResult.permit_history ?? [],
        key_insights: parsedResult.key_insights ?? [],
      },
      error: null,
      message: "ok",
    });
  } catch (e) {
    console.error("[search-permit]", e);
    return jsonResponse(
      {
        data: null,
        error: "internal_error",
        message: e instanceof Error ? e.message : "Search failed",
      },
      500,
    );
  }
});
