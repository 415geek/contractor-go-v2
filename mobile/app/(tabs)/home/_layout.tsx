import { Stack } from "expo-router";

import { theme } from "@/lib/theme";

export default function HomeStackLayout() {
  return (
    <Stack
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: theme.bg },
        animation: "slide_from_right",
      }}
    />
  );
}
