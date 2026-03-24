import { Platform } from "react-native";
import * as FileSystem from "expo-file-system/legacy";

import { imageUriToBase64 } from "@/lib/image-base64";

/** 与 Edge `upload-chat-media` 的 MAX_BYTES 一致，用于客户端预检 */
export const CHAT_MEDIA_MAX_BYTES = 900 * 1024;

function base64ByteLength(b64: string): number {
  const clean = b64.replace(/\s/g, "").replace(/^data:[^;]+;base64,/, "");
  const pad = clean.endsWith("==") ? 2 : clean.endsWith("=") ? 1 : 0;
  return Math.floor((clean.length * 3) / 4) - pad;
}

/**
 * 相册 / 相机 URI 转纯 base64（无 data: 前缀）。图片走 `imageUriToBase64`；视频走直接读文件（体积需 &lt; MMS 上限）。
 */
export async function uriToBase64ForChat(uri: string, kind: "image" | "video"): Promise<string> {
  if (kind === "image") {
    return imageUriToBase64(uri);
  }
  if (Platform.OS === "web") {
    const res = await fetch(uri);
    const blob = await res.blob();
    return await new Promise<string>((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => {
        const dataUrl = reader.result;
        if (typeof dataUrl !== "string") {
          reject(new Error("无法读取视频"));
          return;
        }
        const comma = dataUrl.indexOf(",");
        resolve(comma >= 0 ? dataUrl.slice(comma + 1) : dataUrl);
      };
      reader.onerror = () => reject(new Error("读取视频失败"));
      reader.readAsDataURL(blob);
    });
  }
  return FileSystem.readAsStringAsync(uri, { encoding: FileSystem.EncodingType.Base64 });
}

export function assertChatMediaSizeUnderLimit(base64: string): void {
  const n = base64ByteLength(base64);
  if (n > CHAT_MEDIA_MAX_BYTES) {
    throw new Error(`附件约 ${Math.round(n / 1024)}KB，需小于 ${Math.round(CHAT_MEDIA_MAX_BYTES / 1024)}KB（MMS 限制）。请选较小图片或压缩视频。`);
  }
}
