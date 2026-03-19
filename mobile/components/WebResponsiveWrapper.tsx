import { Platform, StyleSheet, View } from "react-native";
import { useEffect, useState } from "react";

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

  return (
    <View
      style={[
        styles.web,
        { minHeight: windowHeight },
      ]}
    >
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  mobile: { flex: 1 },
  web: {
    flex: 1,
    maxWidth: 430,
    width: "100%",
    alignSelf: "center",
  },
});
