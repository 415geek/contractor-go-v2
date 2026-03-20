import { router } from "expo-router";
import { Platform } from "react-native";

function isWebBrowser() {
  return Platform.OS === "web" && typeof window !== "undefined";
}

export function pushPath(path: string) {
  if (isWebBrowser()) {
    window.location.assign(path);
    return;
  }
  router.push(path as never);
}

export function replacePath(path: string) {
  if (isWebBrowser()) {
    window.location.replace(path);
    return;
  }
  router.replace(path as never);
}

export function replaceSignedInHome() {
  replacePath(Platform.OS === "web" ? "/" : "/(tabs)");
}
