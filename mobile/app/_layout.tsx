import "../global.css";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { useEffect } from "react";
import { SafeAreaProvider } from "react-native-safe-area-context";

import { WebResponsiveWrapper } from "@/components/WebResponsiveWrapper";
import { useAuth } from "@/hooks/useAuth";

const queryClient = new QueryClient();

export default function RootLayout() {
  const initialize = useAuth((state) => state.initialize);

  useEffect(() => {
    initialize().catch((error: unknown) => {
      console.error("Failed to initialize auth state", error);
    });
  }, [initialize]);

  return (
    <QueryClientProvider client={queryClient}>
      <SafeAreaProvider>
        <WebResponsiveWrapper>
          <StatusBar style="light" />
          <Stack
            screenOptions={{
              headerShown: false,
              contentStyle: { backgroundColor: "#0F172A" },
              animation: "fade",
            }}
          />
        </WebResponsiveWrapper>
      </SafeAreaProvider>
    </QueryClientProvider>
  );
}
