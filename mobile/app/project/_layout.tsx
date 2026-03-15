import { Stack } from "expo-router";

export default function ProjectLayout() {
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
