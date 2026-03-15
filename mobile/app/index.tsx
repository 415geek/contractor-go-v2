import { Redirect } from "expo-router";
import { ActivityIndicator, View } from "react-native";

import { useAuth } from "@/hooks/useAuth";

export default function IndexScreen() {
  const initialized = useAuth((state) => state.initialized);
  const isLoading = useAuth((state) => state.isLoading);
  const session = useAuth((state) => state.session);

  if (!initialized || isLoading) {
    return (
      <View className="flex-1 items-center justify-center bg-gray-900">
        <ActivityIndicator color="#3B82F6" size="large" />
      </View>
    );
  }

  return <Redirect href={session ? "/(tabs)" : "/(auth)/login"} />;
}
