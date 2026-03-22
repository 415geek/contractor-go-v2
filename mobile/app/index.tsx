import { useAuth } from "@clerk/clerk-expo";
import { Redirect } from "expo-router";
import { ActivityIndicator, View } from "react-native";

export default function IndexScreen() {
  const { isSignedIn, isLoaded } = useAuth();

  if (!isLoaded) {
    return (
      <View className="flex-1 items-center justify-center bg-surface-app">
        <ActivityIndicator color="#007AFF" size="large" />
      </View>
    );
  }

  return <Redirect href={(isSignedIn ? "/home" : "/landing") as never} />;
}
