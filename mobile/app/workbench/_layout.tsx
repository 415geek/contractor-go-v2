import { Stack } from "expo-router";

/** 旧路径 /workbench/* 兼容：各子页 Redirect 到 /tools/* */
export default function WorkbenchLayout() {
  return <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: "#020617" } }} />;
}
