import { Redirect } from "expo-router";
import { ActivityIndicator, View } from "react-native";

import { useAuth } from "@/hooks/useAuth";

export default function IndexScreen() {
  const initialized = useAuth((state) => state.initialized);
  const isLoading = useAuth((state) => state.isLoading);
  const session = useAuth((state) => state.session);

  if (!initialized || isLoading) {
    return (
      <View className="flex-1 items-center justify-center bg-surface-app">
        <ActivityIndicator color="#2563EB" size="large" />
      </View>
    );
  }

  // 已登录 → 主界面，未登录 → 落地页
  return <Redirect href={session ? "/(tabs)" : "/landing"} />;
}
