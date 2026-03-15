import { Stack } from "expo-router";

export default function VoipLayout() {
  return (
    <Stack
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: "#111827" },
      }}
    />
  );
}
