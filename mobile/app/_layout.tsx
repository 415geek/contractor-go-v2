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
import { theme } from "@/lib/theme";

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
    if (isSignedIn) return;

    // 未登录：非 auth / landing / sso-callback 时，默认回落地页
    // （Web OAuth 完成地址已统一为 /sso-callback，见 login.tsx，避免先到 /home 再误判）
    const inAuthGroup = segments[0] === "(auth)";
    const inLanding = segments[0] === "landing";
    const inSSO = segments[0] === "sso-callback";

    if (inAuthGroup || inLanding || inSSO) return;

    router.replace("/landing");
  }, [isSignedIn, isLoaded, segments, router]);

  if (!isLoaded) {
    return (
      <View style={{ flex: 1, backgroundColor: theme.bg, alignItems: "center", justifyContent: "center" }}>
        <ActivityIndicator size="large" color={theme.primary} />
      </View>
    );
  }

  return (
    <Stack
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: theme.bg },
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
      <View style={{ flex: 1, backgroundColor: theme.bg, padding: 24, justifyContent: "center" }}>
        <Text style={{ color: theme.danger, fontSize: 16 }}>缺少 EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY，请在 .env 中配置</Text>
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
