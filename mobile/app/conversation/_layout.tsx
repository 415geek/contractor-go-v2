import { Stack } from "expo-router";

export default function ConversationLayout() {
  return (
    <Stack
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: "#111827" },
      }}
    />
  );
}
