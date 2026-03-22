import { edgeFunctionUrl, requireSupabasePublicEnv } from "@/lib/api/supabase-edge";

export type UploadToolImageKind = "material" | "estimate";

export async function uploadToolImageViaEdge(
  clerkJwt: string,
  params: {
    base64: string;
    filename: string;
    kind: UploadToolImageKind;
    contentType?: string;
  },
): Promise<{ publicUrl: string; path: string }> {
  const { url, anonKey } = requireSupabasePublicEnv();
  const res = await fetch(edgeFunctionUrl(url, "upload-tool-image"), {
    method: "POST",
    headers: {
      Authorization: `Bearer ${clerkJwt}`,
      apikey: anonKey,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      base64: params.base64,
      filename: params.filename,
      kind: params.kind,
      content_type: params.contentType ?? "image/jpeg",
    }),
  });
  const text = await res.text();
  let json: { data?: { public_url?: string; path?: string }; error?: string | null; message?: string };
  try {
    json = JSON.parse(text) as typeof json;
  } catch {
    throw new Error(res.ok ? "上传服务返回非 JSON" : `上传失败 (HTTP ${res.status})`);
  }
  if (!res.ok || json.error) {
    throw new Error((json.message ?? json.error ?? "").trim() || `上传失败 (HTTP ${res.status})`);
  }
  const publicUrl = json.data?.public_url;
  const path = json.data?.path;
  if (!publicUrl || !path) throw new Error(json.message ?? "未返回图片地址");
  return { publicUrl, path };
}
