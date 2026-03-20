import "../global.css";
import * as WebBrowser from "expo-web-browser";

import { ClerkProvider, useAuth } from "@clerk/clerk-expo";
import { tokenCache } from "@/lib/clerk-token-cache";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Stack, useRouter, useSegments } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { useEffect } from "react";
import { ActivityIndicator, Platform, Text, View } from "react-native";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { GestureHandlerRootView } from "react-native-gesture-handler";

import { WebResponsiveWrapper } from "@/components/WebResponsiveWrapper";
import { ErrorBoundary } from "@/components/ErrorBoundary";

WebBrowser.maybeCompleteAuthSession({ skipRedirectCheck: true });

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000,
      retry: 1,
    },
  },
});

function RootNavigator() {
  const { isSignedIn, isLoaded } = useAuth();
  const segments = useSegments();
  const router = useRouter();

  useEffect(() => {
    if (!isLoaded) return;
    // 仅处理未登录：非 auth/landing/sso 时跳转登录页
    if (!isSignedIn) {
      const inAuthGroup = segments[0] === "(auth)";
      const inLanding = segments[0] === "landing";
      const inSSO = segments[0] === "sso-callback";
      if (!inAuthGroup && !inLanding && !inSSO) {
        router.replace("/landing");
      }
    }
    // 已登录用户的跳转由 app/index.tsx 处理（/ -> /(tabs)），此处不再重定向
  }, [isSignedIn, isLoaded, segments]);

  if (!isLoaded) {
    return (
      <View style={{ flex: 1, backgroundColor: "#0F172A", alignItems: "center", justifyContent: "center" }}>
        <ActivityIndicator size="large" color="#2563EB" />
      </View>
    );
  }

  return (
    <Stack
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: "#0F172A" },
        animation: Platform.OS === "ios" ? "slide_from_right" : "fade",
        animationDuration: 250,
        gestureEnabled: Platform.OS === "ios",
        gestureDirection: "horizontal",
        fullScreenGestureEnabled: true,
      }}
    />
  );
}

const clerkKey = process.env.EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY;

export default function RootLayout() {
  if (!clerkKey?.trim()) {
    return (
      <View style={{ flex: 1, backgroundColor: "#0F172A", padding: 24, justifyContent: "center" }}>
        <Text style={{ color: "#EF4444", fontSize: 16 }}>缺少 EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY，请在 .env 中配置</Text>
      </View>
    );
  }
  return (
    <ErrorBoundary>
      <GestureHandlerRootView style={{ flex: 1 }}>
        <ClerkProvider
          publishableKey={clerkKey}
          tokenCache={Platform.OS === "web" ? undefined : tokenCache}
        >
        <QueryClientProvider client={queryClient}>
          <SafeAreaProvider>
            <WebResponsiveWrapper>
              <StatusBar style="light" />
              <RootNavigator />
            </WebResponsiveWrapper>
          </SafeAreaProvider>
        </QueryClientProvider>
      </ClerkProvider>
    </GestureHandlerRootView>
    </ErrorBoundary>
  );
}
