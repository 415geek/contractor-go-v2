import { Stack } from "expo-router";

export default function ToolsLayout() {
  return (
    <Stack
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: "#111827" },
        animation: "fade",
      }}
    />
  );
}
