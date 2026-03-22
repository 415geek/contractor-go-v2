import type { ImagePickerAsset, ImagePickerResult } from "expo-image-picker";
import { Platform } from "react-native";

/**
 * Expo ImagePicker 在 Web 上会先 `await` 权限再触发隐藏的 file input；
 * `await` 让出执行栈后浏览器会判定失去「用户手势」，文件选择器常被静默拦截。
 * 另：其生成的 `accept` 可能以 `,` 开头，部分环境下异常。
 *
 * 使用标准 `<input type="file" accept="image/*">` 并在调用栈内同步 `.click()`，
 * 返回结构与 `expo-image-picker` 一致。
 */
export function launchImageLibraryWeb(): Promise<ImagePickerResult> {
  if (typeof document === "undefined") {
    return Promise.resolve({ canceled: true, assets: null });
  }

  return new Promise((resolve) => {
    const input = document.createElement("input");
    input.type = "file";
    input.accept = "image/*";
    input.style.display = "none";
    document.body.appendChild(input);

    const done = (r: ImagePickerResult) => {
      try {
        document.body.removeChild(input);
      } catch {
        /* noop */
      }
      resolve(r);
    };

    input.addEventListener("change", () => {
      const file = input.files?.[0];
      if (!file) {
        done({ canceled: true, assets: null });
        return;
      }

      const reader = new FileReader();
      reader.onerror = () => done({ canceled: true, assets: null });
      reader.onload = () => {
        const dataUrl = reader.result;
        if (typeof dataUrl !== "string") {
          done({ canceled: true, assets: null });
          return;
        }

        const Img = typeof window !== "undefined" ? window.Image : null;
        const baseAsset: ImagePickerAsset = {
          uri: dataUrl,
          width: 0,
          height: 0,
          mimeType: file.type || "image/jpeg",
          fileName: file.name,
          fileSize: file.size,
          type: "image",
          file: file,
        };

        if (!Img) {
          done({ canceled: false, assets: [baseAsset] });
          return;
        }

        const img = new Img();
        img.onload = () => {
          done({
            canceled: false,
            assets: [
              {
                ...baseAsset,
                width: img.naturalWidth || img.width,
                height: img.naturalHeight || img.height,
              },
            ],
          });
        };
        img.onerror = () => {
          done({ canceled: false, assets: [baseAsset] });
        };
        img.src = dataUrl;
      };
      reader.readAsDataURL(file);
    });

    input.click();
  });
}

export function shouldUseWebFilePicker(): boolean {
  return Platform.OS === "web";
}
