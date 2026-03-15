import { useState } from "react";
import { View, TextInput, Pressable, Text } from "react-native";
import { Ionicons } from "@expo/vector-icons";

import { useRealtimeTranslation } from "@/hooks/useRealtimeTranslation";
import { useVoiceRecording } from "@/hooks/useVoiceRecording";

import { VoiceRecorder } from "./VoiceRecorder";

type ChatInputProps = {
  onSend: (text: string) => void | Promise<void>;
  disabled?: boolean;
  sourceLang?: string;
  targetLang?: string;
};

export function ChatInput({ onSend, disabled, sourceLang = "zh-CN", targetLang = "en-US" }: ChatInputProps) {
  const [text, setText] = useState("");
  const { translatedText, isTranslating } = useRealtimeTranslation({
    text,
    sourceLang,
    targetLang,
    debounceMs: 300,
  });
  const { isRecording, duration, startRecording, stopRecording } = useVoiceRecording();

  const handleSend = async () => {
    const t = text.trim();
    if (!t || disabled) return;
    setText("");
    await onSend(t);
  };

  const handleVoiceRelease = async () => {
    const uri = await stopRecording();
    if (uri) {
      await onSend(`[语音消息待实现]`);
    }
  };

  return (
    <View className="border-t border-gray-800 bg-gray-900 p-3">
      {text.trim() && (
        <View className="mb-2 px-2">
          <Text className="text-gray-400 text-xs">翻译预览</Text>
          <Text className="text-white text-sm">{isTranslating ? "..." : translatedText || "-"}</Text>
        </View>
      )}
      <View className="flex-row items-end gap-2">
        <VoiceRecorder
          isRecording={isRecording}
          duration={duration}
          onPressIn={startRecording}
          onPressOut={handleVoiceRelease}
        />
        <TextInput
          value={text}
          onChangeText={setText}
          placeholder="输入消息..."
          placeholderTextColor="#6B7280"
          multiline
          maxLength={500}
          editable={!disabled}
          className="flex-1 bg-gray-800 text-white rounded-xl px-4 py-3 max-h-24"
        />
        <Pressable
          onPress={handleSend}
          disabled={disabled || !text.trim()}
          className="p-2 rounded-full bg-blue-600 disabled:opacity-50"
        >
          <Ionicons name="send" size={20} color="white" />
        </Pressable>
      </View>
    </View>
  );
}
