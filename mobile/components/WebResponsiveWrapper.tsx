import { Platform, StyleSheet, View } from "react-native";

const styles = StyleSheet.create({
  mobile: { flex: 1 },
  web: {
    flex: 1,
    maxWidth: 430,
    width: "100%",
    alignSelf: "center",
    minHeight: "100vh",
  },
});

export function WebResponsiveWrapper({ children }: { children: React.ReactNode }) {
  return (
    <View style={Platform.OS === "web" ? styles.web : styles.mobile}>
      {children}
    </View>
  );
}
