import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";
import { corsHeaders } from "../_shared/cors.ts";
import {
  detectPermitCity,
  fetchPermitRowsFromOpenData,
  normalizePermitAddressTypos,
  SUPPORTED_PERMIT_CITIES,
  type PermitCity,
} from "../_shared/permit-open-data.ts";
import { openAiChatCompletion, stripJsonFence } from "../_shared/openai-chat.ts";
import { jsonResponse, handleOptionsRequest } from "../_shared/response.ts";
import { getUserFromRequest } from "../_shared/get-user.ts";

function getEnv(name: string): string {
  const v = Deno.env.get(name);
  if (!v) throw new Error(`Missing env: ${name}`);
  return v;
}

const CLAUDE_PARSE_PROMPT = (city: PermitCity, sourceHint: string, raw: string) =>
  `You are parsing official municipal open data rows for building/construction permits.

City: ${city}
Source: ${sourceHint}

The JSON below is from the city's public permit API (e.g. San Francisco DBI-style fields such as permit_number, street_number, street_name, street_suffix, description, status, filed_date, issued_date, estimated_cost; San Jose may use FOLDERNUMBER, gx_location, WORKDESCRIPTION, ISSUEDATE, etc.).

Raw rows (JSON array):
${raw}

Output a single valid json object only (no markdown):
{
  "address": "normalized address string in Chinese or English as appropriate",
  "parcel_number": "string or null",
  "property_info": { "lot_size_sqft": null, "year_built": null, "zoning": null, "bedrooms": null, "bathrooms": null },
  "permit_history": [
    {
      "permit_number": "string",
      "type": "string",
      "description": "string",
      "status": "approved|pending|finaled",
      "issued_date": "YYYY-MM-DD or null",
      "estimated_cost": number or null
    }
  ],
  "key_insights": ["short bullet in Chinese"]
}
Use null for unknown fields. Map status from raw values sensibly. If rows are empty array, return permit_history: [] and key_insights explaining no matches.`;

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
    const address = normalizePermitAddressTypos(
      typeof body.address === "string" ? body.address.trim() : "",
    ).trim();
    if (!address) {
      return jsonResponse(
        { data: null, error: "invalid_body", message: "address required" },
        400,
      );
    }

    const city = detectPermitCity(address);
    if (!city) {
      return new Response(
        JSON.stringify({
          data: null,
          error: "unsupported_city",
          message:
            "未识别为当前已接入开放数据的城市。请在地址中写明 San Francisco 或 San Jose（或 SF），以便查询对应市政府公开许可数据。",
          supported_cities: [...SUPPORTED_PERMIT_CITIES],
        }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    const { rows, source_hint } = await fetchPermitRowsFromOpenData(city, address);
    const rawPayload = rows.slice(0, 28);
    const rawStr = JSON.stringify(rawPayload);

    const ai = await openAiChatCompletion({
      messages: [
        {
          role: "system",
          content:
            "You normalize municipal permit open data into structured JSON. Respond with one valid JSON object only.",
        },
        { role: "user", content: PERMIT_PARSE_PROMPT(city, source_hint, rawStr) },
      ],
      maxTokens: 2048,
      responseFormatJsonObject: true,
    });

    let parsedResult: Record<string, unknown> = {};
    if (ai.ok) {
      try {
        parsedResult = JSON.parse(stripJsonFence(ai.content));
      } catch {
        parsedResult = {
          address,
          permit_history: [],
          key_insights: ["无法解析 AI 输出，请稍后重试。"],
          raw_preview: rawStr.slice(0, 500),
        };
      }
    } else {
      parsedResult = {
        address,
        permit_history: [],
        key_insights: [`OpenAI: ${ai.message}`],
      };
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
      raw_data: { source_hint, row_count: rows.length, sample: rawPayload },
      parsed_result: parsedResult,
    });

    return jsonResponse({
      data: {
        address: (parsedResult.address as string) ?? address,
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
