import { useAuth, useClerk } from "@clerk/clerk-expo";
import { useEffect, useState } from "react";
import { Platform, ActivityIndicator, Text, View } from "react-native";

import { replacePath, replaceSignedInHome } from "@/lib/web-navigation";

export default function SSOCallbackPage() {
  const { handleRedirectCallback } = useClerk();
  const { isSignedIn, isLoaded } = useAuth();
  const [debugInfo, setDebugInfo] = useState("initializing...");

  // Step 1: Capture URL immediately on mount (before anything else runs)
  const [capturedUrl, setCapturedUrl] = useState("");
  useEffect(() => {
    if (Platform.OS === "web" && typeof window !== "undefined") {
      setCapturedUrl(window.location.href);
    }
  }, []);

  useEffect(() => {
    if (!isLoaded) {
      setDebugInfo(`isLoaded=false, isSignedIn=${isSignedIn}`);
      return;
    }

    const info = `isLoaded=true, isSignedIn=${isSignedIn}, url=${capturedUrl.slice(0, 120)}`;
    setDebugInfo(info);

    if (isSignedIn) {
      // ClerkProvider already processed the handshake and established session.
      replaceSignedInHome();
      return;
    }

    // ClerkProvider did NOT auto-establish session — call handleRedirectCallback.
    void (async () => {
      try {
        await handleRedirectCallback({});
        setDebugInfo("handleRedirectCallback succeeded");
        // 让 Clerk 在下一帧更新 session，再进 /home，避免与 RootNavigator 守卫竞态
        await new Promise<void>((r) => setTimeout(r, 50));
        replaceSignedInHome();
      } catch (err) {
        const errMsg = err instanceof Error ? err.message : String(err);
        setDebugInfo(`handleRedirectCallback FAILED: ${errMsg} | isSignedIn=${isSignedIn}`);
        // Don't redirect to landing if session might still be set via ClerkProvider.
        // Wait 1s for ClerkProvider to finish, then decide.
        setTimeout(() => {
          replacePath("/landing");
        }, 1500);
      }
    })();
  }, [isLoaded, isSignedIn, capturedUrl]);

  return (
    <View
      style={{
        flex: 1,
        backgroundColor: "#0F172A",
        alignItems: "center",
        justifyContent: "center",
        padding: 24,
      }}
    >
      <ActivityIndicator size="large" color="#2563EB" />
      <Text style={{ color: "#94A3B8", marginTop: 16, textAlign: "center", fontSize: 12 }}>
        {debugInfo}
      </Text>
    </View>
  );
}
