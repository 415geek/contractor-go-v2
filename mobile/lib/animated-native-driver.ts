import { Platform } from "react-native";

/** RN Web 无原生 Animated 驱动；`useNativeDriver: true` 会打 error 并回退 JS。iOS/Android 保持 true。 */
export const animatedUseNativeDriver = Platform.OS === "ios" || Platform.OS === "android";
