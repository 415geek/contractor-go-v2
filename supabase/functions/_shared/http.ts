export const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

type ApiEnvelope<T> = {
  data: T | null;
  error: string | null;
  message: string;
};

export function jsonResponse<T>(body: ApiEnvelope<T>, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      ...corsHeaders,
      'Content-Type': 'application/json',
    },
  });
}

export function errorResponse(message: string, status = 400, error?: string) {
  return jsonResponse(
    {
      data: null,
      error: error ?? message,
      message,
    },
    status,
  );
}
