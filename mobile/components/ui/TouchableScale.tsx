import { useRef } from "react";
import {
  Animated,
  GestureResponderEvent,
  Platform,
  Pressable,
  PressableProps,
  StyleProp,
  ViewStyle,
} from "react-native";
import * as Haptics from "expo-haptics";

export interface TouchableScaleProps extends Omit<PressableProps, "style"> {
  children: React.ReactNode;
  style?: StyleProp<ViewStyle>;
  activeScale?: number;
  haptic?: boolean;
  hapticStyle?: Haptics.ImpactFeedbackStyle;
}

export function TouchableScale({
  children,
  style,
  onPressIn,
  onPressOut,
  onPress,
  activeScale = 0.97,
  haptic = true,
  hapticStyle = Haptics.ImpactFeedbackStyle.Light,
  disabled,
  ...props
}: TouchableScaleProps) {
  const scale = useRef(new Animated.Value(1)).current;

  const handlePressIn = (e: GestureResponderEvent) => {
    Animated.spring(scale, {
      toValue: activeScale,
      useNativeDriver: true,
      speed: 50,
      bounciness: 4,
    }).start();
    onPressIn?.(e);
  };

  const handlePressOut = (e: GestureResponderEvent) => {
    Animated.spring(scale, {
      toValue: 1,
      useNativeDriver: true,
      speed: 50,
      bounciness: 4,
    }).start();
    onPressOut?.(e);
  };

  const handlePress = async (e: GestureResponderEvent) => {
    if (haptic && Platform.OS !== "web") {
      try {
        await Haptics.impactAsync(hapticStyle);
      } catch {
        // Haptics not available
      }
    }
    onPress?.(e);
  };

  return (
    <Pressable
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      onPress={handlePress}
      disabled={disabled}
      {...props}
    >
      <Animated.View
        style={[
          style,
          { transform: [{ scale }], opacity: disabled ? 0.5 : 1 },
        ]}
      >
        {children}
      </Animated.View>
    </Pressable>
  );
}
