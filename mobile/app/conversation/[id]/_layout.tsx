import { Stack } from "expo-router";

import { iosComm } from "@/lib/ios-comm-theme";

export default function ConversationIdLayout() {
  return (
    <Stack
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: iosComm.bg },
        animation: "slide_from_right",
      }}
    />
  );
}
