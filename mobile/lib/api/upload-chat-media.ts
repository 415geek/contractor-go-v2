import { edgeFunctionClerkHeaders, edgeFunctionUrl, requireSupabasePublicEnv } from "@/lib/api/supabase-edge";

export type UploadChatMediaResult = {
  public_url: string;
  path: string;
  content_type: string;
};

export async function uploadChatMediaBase64(
  clerkJwt: string,
  base64: string,
  filename: string,
  contentType: string,
): Promise<UploadChatMediaResult> {
  const { url, anonKey } = requireSupabasePublicEnv();
  const res = await fetch(edgeFunctionUrl(url, "upload-chat-media"), {
    method: "POST",
    headers: {
      ...edgeFunctionClerkHeaders(anonKey, clerkJwt),
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      base64,
      filename,
      content_type: contentType,
    }),
  });
  const text = await res.text();
  let json: { data?: UploadChatMediaResult; error?: string | null; message?: string };
  try {
    json = JSON.parse(text) as typeof json;
  } catch {
    throw new Error(res.ok ? "upload-chat-media 返回非 JSON" : `上传失败 (HTTP ${res.status})`);
  }
  if (!res.ok || json.error) {
    throw new Error((json.message ?? json.error ?? "").trim() || `上传失败 (HTTP ${res.status})`);
  }
  const d = json.data;
  if (!d?.public_url) throw new Error("无 public_url");
  return d;
}
