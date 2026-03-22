import { Alert, Platform } from "react-native";

/** Web 上 `Alert.alert` 常不可靠；统一用原生弹窗或 `window.alert` */
export function alertCrossPlatform(title: string, message?: string) {
  if (Platform.OS === "web" && typeof window !== "undefined" && window.alert) {
    window.alert(message ? `${title}\n\n${message}` : title);
    return;
  }
  Alert.alert(title, message);
}
