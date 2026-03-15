import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";

export type SendOtpPayload = {
  phone: string;
};

export type VerifyOtpPayload = {
  phone: string;
  token: string;
};

const PHONE_REGEX = /^\+[1-9]\d{7,14}$/;
const OTP_REGEX = /^\d{6}$/;

export function getSupabaseEnv() {
  const supabaseUrl = Deno.env.get("SUPABASE_URL");
  const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY");
  const supabaseServiceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

  if (!supabaseUrl || !supabaseAnonKey || !supabaseServiceRoleKey) {
    throw new Error(
      "Missing SUPABASE_URL, SUPABASE_ANON_KEY, or SUPABASE_SERVICE_ROLE_KEY.",
    );
  }

  return {
    supabaseUrl,
    supabaseAnonKey,
    supabaseServiceRoleKey,
  };
}

export function createServiceRoleClient() {
  const { supabaseUrl, supabaseServiceRoleKey } = getSupabaseEnv();

  return createClient(supabaseUrl, supabaseServiceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
}

export function createAnonClient(authHeader?: string) {
  const { supabaseUrl, supabaseAnonKey } = getSupabaseEnv();

  return createClient(supabaseUrl, supabaseAnonKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
    global: authHeader
      ? {
          headers: {
            Authorization: authHeader,
          },
        }
      : undefined,
  });
}

export async function parseJsonBody<T>(request: Request): Promise<T> {
  try {
    return await request.json();
  } catch {
    throw new Error("Invalid JSON body.");
  }
}

export function normalizePhone(phone: string) {
  const normalized = phone.replace(/[^\d+]/g, "");

  if (!PHONE_REGEX.test(normalized)) {
    throw new Error("Phone number must be a valid E.164 string.");
  }

  return normalized;
}

export function validateOtpToken(token: string) {
  const normalized = token.trim();

  if (!OTP_REGEX.test(normalized)) {
    throw new Error("OTP token must be a 6-digit code.");
  }

  return normalized;
}
