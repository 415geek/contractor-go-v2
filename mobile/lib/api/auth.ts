import type { Session, User } from "@supabase/supabase-js";

import { supabase } from "@/lib/supabase";

type ApiResponse<T> = {
  data: T | null;
  error: string | null;
  message: string;
};

type SendOtpPayload = {
  phone: string;
  retryAfter: number;
};

type VerifyOtpPayload = {
  user: User;
  session: Session;
};

export async function sendOtp(phone: string) {
  const { data, error } = await supabase.functions.invoke<ApiResponse<SendOtpPayload>>("send-otp", {
    body: { phone },
  });

  if (error) {
    throw new Error(error.message);
  }

  if (!data || data.error || !data.data) {
    throw new Error(data?.message ?? "Failed to send OTP.");
  }

  return data.data;
}

export async function verifyOtp(phone: string, code: string) {
  const { data, error } = await supabase.functions.invoke<ApiResponse<VerifyOtpPayload>>("verify-otp", {
    body: { phone, code },
  });

  if (error) {
    throw new Error(error.message);
  }

  if (!data || data.error || !data.data) {
    throw new Error(data?.message ?? "Failed to verify OTP.");
  }

  const { session } = data.data;

  await supabase.auth.setSession({
    access_token: session.access_token,
    refresh_token: session.refresh_token,
  });

  return data.data;
}
