import { jsonResponse, handleOptionsRequest } from "../_shared/response.ts";
import { getUserFromRequest } from "../_shared/get-user.ts";
import { createAdminClient } from "../_shared/supabase.ts";

const BUCKET = "chat-media";
/** Telnyx MMS 总媒体约 1MB 上限；略放宽以留编码余量 */
const MAX_BYTES = 900 * 1024;

function safeFileName(name: string): string {
  const base = name.replace(/[^a-zA-Z0-9._-]/g, "_").slice(0, 80);
  return base || "file.bin";
}

function base64ToBytes(b64: string): Uint8Array {
  const clean = b64.replace(/\s/g, "").replace(/^data:[^;]+;base64,/, "");
  const binary = atob(clean);
  const len = binary.length;
  const out = new Uint8Array(len);
  for (let i = 0; i < len; i++) out[i] = binary.charCodeAt(i);
  return out;
}

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
    const body = (await req.json()) as {
      base64?: string;
      filename?: string;
      content_type?: string;
    };
    const b64 = typeof body.base64 === "string" ? body.base64 : "";
    if (!b64) {
      return jsonResponse({ data: null, error: "invalid_body", message: "base64 required" }, 400);
    }

    let bytes: Uint8Array;
    try {
      bytes = base64ToBytes(b64);
    } catch {
      return jsonResponse({ data: null, error: "invalid_body", message: "Invalid base64" }, 400);
    }
    if (bytes.byteLength === 0) {
      return jsonResponse({ data: null, error: "invalid_body", message: "Empty file" }, 400);
    }
    if (bytes.byteLength > MAX_BYTES) {
      return jsonResponse(
        {
          data: null,
          error: "payload_too_large",
          message: `附件需小于 ${Math.round(MAX_BYTES / 1024)}KB（MMS 限制）。视频可压缩后再试。`,
        },
        413,
      );
    }

    const ct = typeof body.content_type === "string" ? body.content_type : "application/octet-stream";
    if (!ct.startsWith("image/") && !ct.startsWith("video/")) {
      return jsonResponse({ data: null, error: "invalid_body", message: "Only image/* or video/* allowed" }, 400);
    }

    const ext = safeFileName(typeof body.filename === "string" ? body.filename : "media.jpg");
    const stamp = `${Date.now()}-${crypto.randomUUID().slice(0, 8)}`;
    const objectPath = `${user.id}/${stamp}-${ext}`;

    const admin = createAdminClient();
    const { data: uploaded, error: upErr } = await admin.storage.from(BUCKET).upload(objectPath, bytes, {
      contentType: ct,
      upsert: false,
    });

    if (upErr || !uploaded?.path) {
      console.error("[upload-chat-media] storage:", upErr);
      return jsonResponse(
        { data: null, error: "storage_error", message: upErr?.message ?? "Storage upload failed" },
        500,
      );
    }

    const { data: pub } = admin.storage.from(BUCKET).getPublicUrl(uploaded.path);

    return jsonResponse({
      data: { public_url: pub.publicUrl, path: uploaded.path, content_type: ct },
      error: null,
      message: "ok",
    });
  } catch (e) {
    console.error("[upload-chat-media]", e);
    return jsonResponse(
      { data: null, error: "internal_error", message: e instanceof Error ? e.message : "Upload failed" },
      500,
    );
  }
});
