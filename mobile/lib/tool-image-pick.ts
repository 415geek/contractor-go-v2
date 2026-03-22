import type { ImagePickerAsset } from "expo-image-picker";
import * as ImagePicker from "expo-image-picker";

import { alertCrossPlatform } from "@/lib/alert-cross-platform";
import { uploadToolImageViaEdge, type UploadToolImageKind } from "@/lib/api/upload-tool-image";
import { imageUriToBase64 } from "@/lib/image-base64";
import { launchImageLibraryWeb, shouldUseWebFilePicker } from "@/lib/launch-image-library-web";

/**
 * 选取单张图片。关闭 allowsEditing，避免部分机型裁剪页「确认」后仍返回 canceled。
 */
export async function pickImageAsset(): Promise<ImagePicker.ImagePickerResult> {
  if (shouldUseWebFilePicker()) {
    return launchImageLibraryWeb();
  }
  const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
  if (status !== "granted") {
    alertCrossPlatform("无法访问相册", "请在系统设置中允许 Contractor GO 访问照片。");
    return { canceled: true, assets: null };
  }
  return ImagePicker.launchImageLibraryAsync({
    mediaTypes: ImagePicker.MediaTypeOptions.Images,
    allowsEditing: false,
    quality: 0.85,
  });
}

/** 是否为尚未上传完成的本地预览（含 iOS 相册 ph:// 等） */
export function isLocalImageUri(uri: string): boolean {
  if (!uri) return true;
  const u = uri.toLowerCase();
  return (
    u.startsWith("data:") ||
    u.startsWith("blob:") ||
    u.startsWith("file:") ||
    u.startsWith("content:") ||
    u.startsWith("ph://") ||
    u.startsWith("ph-upload://") ||
    u.startsWith("assets-library://") ||
    u.startsWith("phasset://")
  );
}

export async function uploadPickedImage(
  getToken: () => Promise<string | null>,
  uri: string,
  asset: ImagePickerAsset,
  kind: UploadToolImageKind,
): Promise<{ publicUrl: string }> {
  const token = await getToken();
  if (!token) throw new Error("请先登录");
  const ext = uri.split(".").pop()?.split("?")[0]?.toLowerCase() || "jpg";
  const safeExt = ext.length > 5 ? "jpg" : ext;
  const fileName = kind === "estimate" ? `estimate.${safeExt}` : `photo.${safeExt}`;
  const mime =
    asset.mimeType && asset.mimeType.startsWith("image/")
      ? asset.mimeType
      : safeExt === "png"
        ? "image/png"
        : "image/jpeg";
  const base64 = await imageUriToBase64(uri);
  return uploadToolImageViaEdge(token, {
    base64,
    filename: fileName,
    kind,
    contentType: mime,
  });
}
