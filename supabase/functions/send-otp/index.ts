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
    const { phone } = await request.json();

    if (typeof phone !== "string" || phone.trim().length < 8) {
      return jsonResponse(
        { data: null, error: "invalid_phone", message: "A valid phone number is required." },
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

    const { data: rateLimitRow, error: rateLimitError } = await adminClient
      .from("otp_rate_limits")
      .select("last_sent_at")
      .eq("phone", normalizedPhone)
      .maybeSingle();

    if (rateLimitError) {
      return jsonResponse(
        { data: null, error: "rate_limit_lookup_failed", message: rateLimitError.message },
        500,
      );
    }

    if (rateLimitRow?.last_sent_at) {
      const lastSentAt = new Date(rateLimitRow.last_sent_at).getTime();
      const secondsSinceLastAttempt = Math.floor((Date.now() - lastSentAt) / 1000);

      if (secondsSinceLastAttempt < 60) {
        return jsonResponse(
          {
            data: { retryAfter: 60 - secondsSinceLastAttempt },
            error: "otp_rate_limited",
            message: "Please wait before requesting another code.",
          },
          429,
        );
      }
    }

    const { error: otpError } = await authClient.auth.signInWithOtp({
      phone: normalizedPhone,
      options: {
        shouldCreateUser: true,
      },
    });

    if (otpError) {
      return jsonResponse(
        { data: null, error: "otp_send_failed", message: otpError.message },
        400,
      );
    }

    const { error: upsertError } = await adminClient
      .from("otp_rate_limits")
      .upsert(
        {
          phone: normalizedPhone,
          last_sent_at: new Date().toISOString(),
        },
        { onConflict: "phone" },
      );

    if (upsertError) {
      return jsonResponse(
        { data: null, error: "rate_limit_update_failed", message: upsertError.message },
        500,
      );
    }

    return jsonResponse({
      data: {
        phone: normalizedPhone,
        retryAfter: 60,
      },
      error: null,
      message: "OTP sent successfully.",
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unexpected server error.";

    return jsonResponse(
      { data: null, error: "internal_server_error", message },
      500,
    );
  }
});
