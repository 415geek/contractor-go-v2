import { Platform, StyleSheet, View } from "react-native";
import { useEffect, useState } from "react";

import { theme } from "@/lib/theme";

export function WebResponsiveWrapper({ children }: { children: React.ReactNode }) {
  const [windowHeight, setWindowHeight] = useState<number | string>("100%");

  useEffect(() => {
    if (Platform.OS !== "web") return;

    const updateHeight = () => {
      setWindowHeight(window.innerHeight);
    };

    updateHeight();
    window.addEventListener("resize", updateHeight);
    window.visualViewport?.addEventListener("resize", updateHeight);

    return () => {
      window.removeEventListener("resize", updateHeight);
      window.visualViewport?.removeEventListener("resize", updateHeight);
    };
  }, []);

  if (Platform.OS !== "web") {
    return <View style={styles.mobile}>{children}</View>;
  }

  const minH = typeof windowHeight === "number" ? windowHeight : undefined;

  return (
    <View
      style={[
        styles.web,
        minH != null && { minHeight: minH },
        { backgroundColor: theme.bg },
      ]}
    >
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  mobile: { flex: 1, backgroundColor: theme.bg },
  web: {
    flex: 1,
    maxWidth: 430,
    width: "100%",
    alignSelf: "center",
  },
});
