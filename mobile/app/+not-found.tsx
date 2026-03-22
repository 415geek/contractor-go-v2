import { Link, Stack } from "expo-router";
import { Text, View } from "react-native";

export default function NotFoundScreen() {
  return (
    <>
      <Stack.Screen options={{ title: "Not Found" }} />
      <View className="flex-1 items-center justify-center gap-4 bg-surface-app px-6">
        <Text className="text-2xl font-semibold text-ink">页面不存在</Text>
        <Link href="/" className="text-base font-semibold text-primary-400">
          返回首页
        </Link>
      </View>
    </>
  );
}
