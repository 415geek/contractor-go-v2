import { useState } from "react";
import { View, TextInput, Pressable, Text, Platform } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { useRealtimeTranslation } from "@/hooks/useRealtimeTranslation";
import { useVoiceRecording } from "@/hooks/useVoiceRecording";
import { iosComm } from "@/lib/ios-comm-theme";

import { VoiceRecorder } from "./VoiceRecorder";

type ChatInputProps = {
  onSend: (text: string) => void | Promise<void>;
  disabled?: boolean;
  sourceLang?: string;
  targetLang?: string;
};

/**
 * 类 iOS「信息」输入栏：底栏 + 圆角输入框 + 发送（有内容时高亮）。
 */
export function ChatInput({ onSend, disabled, sourceLang = "zh-CN", targetLang = "en-US" }: ChatInputProps) {
  const [text, setText] = useState("");
  const insets = useSafeAreaInsets();
  const { translatedText, isTranslating, error: translateError } = useRealtimeTranslation({
    text,
    sourceLang,
    targetLang,
    debounceMs: 300,
  });
  const { isRecording, duration, startRecording, stopRecording } = useVoiceRecording();

  const handleSend = async () => {
    const t = text.trim();
    if (!t || disabled) return;
    try {
      await onSend(t);
      setText("");
    } catch {
      /* 错误由上层 alert；保留输入内容 */
    }
  };

  const handleVoiceRelease = async () => {
    const uri = await stopRecording();
    if (uri) {
      await onSend(`[语音消息待实现]`);
    }
  };

  const canSend = text.trim().length > 0 && !disabled;
  const bottomPad = Math.max(insets.bottom, 8);

  return (
      <View
        style={{
          borderTopWidth: 0.33,
          borderTopColor: iosComm.separator,
          backgroundColor: iosComm.elevated,
          paddingBottom: bottomPad,
          paddingTop: 8,
          paddingHorizontal: 8,
        }}
      >
        {text.trim() ? (
          <View className="px-2 pb-2">
            <Text style={{ color: iosComm.tertiaryLabel, fontSize: 11, marginBottom: 2 }}>翻译预览</Text>
            {translateError ? (
              <Text style={{ color: "#FF453A", fontSize: 13 }}>{translateError.message}</Text>
            ) : (
              <Text style={{ color: iosComm.secondaryLabel, fontSize: 13 }}>
                {isTranslating ? "…" : translatedText || "—"}
              </Text>
            )}
          </View>
        ) : null}
        <View className="flex-row items-end gap-1.5">
          <VoiceRecorder
            isRecording={isRecording}
            duration={duration}
            onPressIn={startRecording}
            onPressOut={handleVoiceRelease}
          />
          <TextInput
            value={text}
            onChangeText={setText}
            placeholder="短信"
            placeholderTextColor={iosComm.tertiaryLabel as string}
            multiline
            maxLength={500}
            editable={!disabled}
            style={{
              flex: 1,
              minHeight: 36,
              maxHeight: 100,
              backgroundColor: iosComm.inputFill,
              color: iosComm.label,
              borderRadius: 20,
              paddingHorizontal: 14,
              paddingVertical: Platform.OS === "ios" ? 8 : 6,
              fontSize: 17,
            }}
          />
          <Pressable
            onPress={handleSend}
            disabled={!canSend}
            accessibilityRole="button"
            accessibilityLabel="发送"
            style={{
              width: 34,
              height: 34,
              borderRadius: 17,
              backgroundColor: canSend ? iosComm.systemBlue : iosComm.inputFill,
              alignItems: "center",
              justifyContent: "center",
              marginBottom: 2,
              opacity: disabled ? 0.5 : 1,
            }}
          >
            <Ionicons name="arrow-up" size={20} color={canSend ? "#FFFFFF" : iosComm.tertiaryLabel} />
          </Pressable>
        </View>
      </View>
  );
}
