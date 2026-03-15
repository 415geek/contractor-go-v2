import { corsHeaders } from "./cors.ts";

type ApiEnvelope<T> = {
  data: T | null;
  error: string | null;
  message: string;
};

export function jsonResponse<T>(
  payload: ApiEnvelope<T>,
  status = 200,
): Response {
  return new Response(JSON.stringify(payload), {
    status,
    headers: {
      ...corsHeaders,
      "Content-Type": "application/json",
    },
  });
}

export function handleOptionsRequest(request: Request): Response | null {
  if (request.method !== "OPTIONS") {
    return null;
  }

  return new Response("ok", {
    headers: corsHeaders,
  });
}
