import { Platform } from "react-native";
import type { TokenCache } from "@clerk/clerk-expo/dist/cache";

// Web: use localStorage; Native: use expo-secure-store
const createTokenCache = (): TokenCache => {
  if (Platform.OS === "web") {
    return {
      async getToken(key: string) {
        return localStorage.getItem(key);
      },
      async saveToken(key: string, value: string) {
        localStorage.setItem(key, value);
      },
      async clearToken(key: string) {
        localStorage.removeItem(key);
      },
    };
  }

  // Native (iOS / Android)
  const SecureStore = require("expo-secure-store");
  return {
    async getToken(key: string) {
      try {
        return await SecureStore.getItemAsync(key);
      } catch {
        return null;
      }
    },
    async saveToken(key: string, value: string) {
      await SecureStore.setItemAsync(key, value);
    },
    async clearToken(key: string) {
      await SecureStore.deleteItemAsync(key);
    },
  };
};

export const tokenCache = createTokenCache();
