import "../global.css";
import * as WebBrowser from "expo-web-browser";

import { ClerkProvider, useAuth } from "@clerk/clerk-expo";
import { tokenCache } from "@/lib/clerk-token-cache";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Stack, useRouter, useSegments } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { useEffect } from "react";
import { ActivityIndicator, Platform, View } from "react-native";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { GestureHandlerRootView } from "react-native-gesture-handler";

import { WebResponsiveWrapper } from "@/components/WebResponsiveWrapper";

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
    const inAuthGroup = segments[0] === "(auth)";
    const inLanding = segments[0] === "landing";
    const inSSO = segments[0] === "sso-callback";
    const inTabs = segments[0] === "(tabs)";

    if (isSignedIn && !inTabs) {
      router.replace("/(tabs)");
    } else if (!isSignedIn && !inAuthGroup && !inLanding && !inSSO) {
      router.replace("/landing");
    }
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

export default function RootLayout() {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <ClerkProvider
        publishableKey={process.env.EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY!}
        tokenCache={tokenCache}
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
  );
}
