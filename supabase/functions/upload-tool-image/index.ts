import { jsonResponse, handleOptionsRequest } from "../_shared/response.ts";
import { getUserFromRequest } from "../_shared/get-user.ts";
import { createAdminClient } from "../_shared/supabase.ts";

const BUCKET = "material-images";
/** 约 6MB 原图上限（base64 会膨胀） */
const MAX_BYTES = 6 * 1024 * 1024;

function safeFileName(name: string): string {
  const base = name.replace(/[^a-zA-Z0-9._-]/g, "_").slice(0, 80);
  return base || "image.jpg";
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
      kind?: string;
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
      return jsonResponse({ data: null, error: "invalid_body", message: "Empty image" }, 400);
    }
    if (bytes.byteLength > MAX_BYTES) {
      return jsonResponse(
        { data: null, error: "payload_too_large", message: `Image must be under ${MAX_BYTES / 1024 / 1024}MB` },
        413,
      );
    }

    const kind = body.kind === "estimate" ? "estimate" : "material";
    const ext = safeFileName(typeof body.filename === "string" ? body.filename : "photo.jpg");
    const stamp = `${Date.now()}-${crypto.randomUUID().slice(0, 8)}`;
    const objectPath =
      kind === "estimate"
        ? `estimates/${user.id}/${stamp}-${ext}`
        : `${user.id}/${stamp}-${ext}`;

    const contentType =
      typeof body.content_type === "string" && body.content_type.startsWith("image/")
        ? body.content_type
        : "image/jpeg";

    const admin = createAdminClient();
    const { data: uploaded, error: upErr } = await admin.storage.from(BUCKET).upload(objectPath, bytes, {
      contentType,
      upsert: false,
    });

    if (upErr || !uploaded?.path) {
      console.error("[upload-tool-image] storage:", upErr);
      return jsonResponse(
        {
          data: null,
          error: "storage_error",
          message: upErr?.message ?? "Storage upload failed",
        },
        500,
      );
    }

    const { data: pub } = admin.storage.from(BUCKET).getPublicUrl(uploaded.path);

    return jsonResponse({
      data: { public_url: pub.publicUrl, path: uploaded.path },
      error: null,
      message: "ok",
    });
  } catch (e) {
    console.error("[upload-tool-image]", e);
    return jsonResponse(
      {
        data: null,
        error: "internal_error",
        message: e instanceof Error ? e.message : "Upload failed",
      },
      500,
    );
  }
});
