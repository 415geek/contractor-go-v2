import React, { Component, ErrorInfo, ReactNode } from "react";
import { Platform, ScrollView, Text, View } from "react-native";

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
            backgroundColor: "#0F172A",
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
                color: "#EF4444",
                fontSize: 18,
                fontWeight: "600",
                marginBottom: 12,
              }}
            >
              加载出错
            </Text>
            <Text
              style={{
                color: "#94A3B8",
                fontSize: 14,
                lineHeight: 20,
                marginBottom: 16,
              }}
            >
              {msg}
            </Text>
            <Text
              style={{
                color: "#64748B",
                fontSize: 12,
                lineHeight: 18,
              }}
            >
              请检查：1) Clerk 控制台是否已添加 www.contractorgo.io 域名；
              2) 生产环境是否使用 pk_live_ 密钥；3) 控制台 (F12) 查看详细错误。
            </Text>
          </ScrollView>
        </View>
      );
    }
    return this.props.children;
  }
}
