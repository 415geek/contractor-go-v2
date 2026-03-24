import { Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { View, Text, Pressable } from "react-native";

import { iosComm } from "@/lib/ios-comm-theme";

type VoiceRecorderProps = {
  isRecording: boolean;
  duration: number;
  onPressIn: () => void;
  onPressOut: () => void;
};

export function VoiceRecorder({ isRecording, duration, onPressIn, onPressOut }: VoiceRecorderProps) {
  return (
    <View className="items-center justify-end" style={{ marginBottom: 2 }}>
      <Pressable
        onPressIn={() => {
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
          onPressIn();
        }}
        onPressOut={() => {
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
          onPressOut();
        }}
        style={{
          width: 34,
          height: 34,
          borderRadius: 17,
          alignItems: "center",
          justifyContent: "center",
          backgroundColor: isRecording ? "rgba(255, 69, 58, 0.25)" : "transparent",
        }}
      >
        <Ionicons
          name="mic"
          size={22}
          color={isRecording ? "#FF453A" : iosComm.secondaryLabel}
        />
      </Pressable>
      {isRecording ? (
        <Text style={{ color: "#FF453A", fontSize: 11, marginTop: 2 }}>{duration}s</Text>
      ) : null}
    </View>
  );
}
