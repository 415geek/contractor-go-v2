import React, { Component, ErrorInfo, ReactNode } from "react";
import { Platform, ScrollView, Text, View } from "react-native";

import { theme } from "@/lib/theme";

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false, error: null };

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    if (Platform.OS === "web" && typeof console !== "undefined") {
      console.error("[ErrorBoundary]", error, errorInfo);
    }
  }

  render() {
    if (this.state.hasError && this.state.error) {
      const msg = this.state.error.message || String(this.state.error);
      return (
        <View
          style={{
            flex: 1,
            backgroundColor: theme.bg,
            padding: 24,
            justifyContent: "center",
            alignItems: "center",
          }}
        >
          <ScrollView
            style={{ maxWidth: 400 }}
            contentContainerStyle={{ paddingVertical: 24 }}
          >
            <Text
              style={{
                color: theme.danger,
                fontSize: 18,
                fontWeight: "600",
                marginBottom: 12,
              }}
            >
              加载出错
            </Text>
            <Text
              style={{
                color: theme.inkSecondary,
                fontSize: 14,
                lineHeight: 20,
                marginBottom: 16,
              }}
            >
              {msg}
            </Text>
            <Text
              style={{
                color: theme.inkTertiary,
                fontSize: 12,
                lineHeight: 18,
              }}
            >
              {(() => {
                const m = msg.toLowerCase();
                if (m.includes("expo_public_supabase")) {
                  return (
                    "请检查：\n" +
                    "1) Vercel → contractorgo-web → Settings → Environment Variables：为 Production 添加 " +
                    "EXPO_PUBLIC_SUPABASE_URL、EXPO_PUBLIC_SUPABASE_ANON_KEY（与 mobile/.env.example 一致即可），保存后 Redeploy；\n" +
                    "2) 本地开发：在 mobile/.env 配置上述两项后重启 expo；\n" +
                    "3) F12 控制台查看 Network / 其它报错。"
                  );
                }
                if (m.includes("clerk") || m.includes("publishable")) {
                  return (
                    "请检查：1) Clerk 控制台是否已添加 www.contractorgo.io；2) 生产是否使用 pk_live_；3) F12 查看详细错误。"
                  );
                }
                return (
                  "请检查：1) Supabase / Clerk 等 EXPO_PUBLIC_* 是否已在 Vercel 构建环境配置并重新部署；2) F12 查看详细错误。"
                );
              })()}
            </Text>
          </ScrollView>
        </View>
      );
    }
    return this.props.children;
  }
}
