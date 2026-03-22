import { Platform } from "react-native";
import * as FileSystem from "expo-file-system/legacy";
import { manipulateAsync, SaveFormat } from "expo-image-manipulator";

/**
 * 将相册 / 相机返回的 URI 转为纯 base64（无 data: 前缀），供 Edge 上传。
 *
 * iOS 相册常见 `ph://` / `ph-upload://`，`readAsStringAsync` 无法直接读；
 * 失败时通过 `expo-image-manipulator` 落盘为 JPEG 再读（与官方 Expo 建议一致）。
 */
export async function imageUriToBase64(uri: string): Promise<string> {
  if (Platform.OS === "web") {
    const res = await fetch(uri);
    const blob = await res.blob();
    return await new Promise<string>((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => {
        const dataUrl = reader.result;
        if (typeof dataUrl !== "string") {
          reject(new Error("无法读取图片"));
          return;
        }
        const comma = dataUrl.indexOf(",");
        resolve(comma >= 0 ? dataUrl.slice(comma + 1) : dataUrl);
      };
      reader.onerror = () => reject(new Error("读取图片失败"));
      reader.readAsDataURL(blob);
    });
  }

  try {
    return await FileSystem.readAsStringAsync(uri, { encoding: FileSystem.EncodingType.Base64 });
  } catch (e) {
    console.warn("[imageUriToBase64] direct read failed, re-encoding via ImageManipulator:", e);
    const { uri: fileUri } = await manipulateAsync(uri, [], {
      compress: 0.85,
      format: SaveFormat.JPEG,
    });
    return await FileSystem.readAsStringAsync(fileUri, { encoding: FileSystem.EncodingType.Base64 });
  }
}
