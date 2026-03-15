import { Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { View, Text, Pressable } from "react-native";

type VoiceRecorderProps = {
  isRecording: boolean;
  duration: number;
  onPressIn: () => void;
  onPressOut: () => void;
};

export function VoiceRecorder({ isRecording, duration, onPressIn, onPressOut }: VoiceRecorderProps) {
  return (
    <View className="items-center">
      <Pressable
        onPressIn={() => {
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
          onPressIn();
        }}
        onPressOut={() => {
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
          onPressOut();
        }}
        className={`p-2 rounded-full ${isRecording ? "bg-red-900/30" : ""}`}
      >
        <Ionicons
          name="mic"
          size={24}
          color={isRecording ? "#EF4444" : "#9CA3AF"}
        />
      </Pressable>
      {isRecording && (
        <Text className="text-red-400 text-xs mt-1">{duration}s</Text>
      )}
    </View>
  );
}
