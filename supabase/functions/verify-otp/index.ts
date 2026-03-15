import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

type JsonResponse = {
  data: Record<string, unknown> | null;
  error: string | null;
  message: string;
};

function jsonResponse(body: JsonResponse, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      ...corsHeaders,
      "Content-Type": "application/json",
    },
  });
}

function normalizePhone(phone: string) {
  const normalized = phone.replace(/[^\d+]/g, "");
  return normalized.startsWith("+") ? normalized : `+${normalized}`;
}

function getEnv(name: string) {
  const value = Deno.env.get(name);

  if (!value) {
    throw new Error(`Missing environment variable: ${name}`);
  }

  return value;
}

Deno.serve(async (request) => {
  if (request.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  if (request.method !== "POST") {
    return jsonResponse(
      { data: null, error: "method_not_allowed", message: "Only POST requests are supported." },
      405,
    );
  }

  try {
    const { phone, code } = await request.json();

    if (typeof phone !== "string" || phone.trim().length < 8) {
      return jsonResponse(
        { data: null, error: "invalid_phone", message: "A valid phone number is required." },
        400,
      );
    }

    if (typeof code !== "string" || !/^\d{6}$/.test(code)) {
      return jsonResponse(
        { data: null, error: "invalid_code", message: "A 6-digit verification code is required." },
        400,
      );
    }

    const normalizedPhone = normalizePhone(phone.trim());
    const supabaseUrl = getEnv("SUPABASE_URL");
    const supabaseAnonKey = getEnv("SUPABASE_ANON_KEY");
    const supabaseServiceRoleKey = getEnv("SUPABASE_SERVICE_ROLE_KEY");

    const authClient = createClient(supabaseUrl, supabaseAnonKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    });

    const adminClient = createClient(supabaseUrl, supabaseServiceRoleKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    });

    const { data, error } = await authClient.auth.verifyOtp({
      phone: normalizedPhone,
      token: code,
      type: "sms",
    });

    if (error || !data.user || !data.session) {
      return jsonResponse(
        {
          data: null,
          error: "otp_verification_failed",
          message: error?.message ?? "Unable to verify the provided code.",
        },
        400,
      );
    }

    const { error: upsertError } = await adminClient.from("users").upsert(
      {
        id: data.user.id,
        phone: normalizedPhone,
      },
      { onConflict: "id" },
    );

    if (upsertError) {
      return jsonResponse(
        { data: null, error: "profile_upsert_failed", message: upsertError.message },
        500,
      );
    }

    await adminClient.from("otp_rate_limits").delete().eq("phone", normalizedPhone);

    return jsonResponse({
      data: {
        user: data.user,
        session: data.session,
      },
      error: null,
      message: "OTP verified successfully.",
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unexpected server error.";

    return jsonResponse(
      { data: null, error: "internal_server_error", message },
      500,
    );
  }
});
