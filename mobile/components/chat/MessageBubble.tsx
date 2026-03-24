import { View, Text } from "react-native";

import { iosComm } from "@/lib/ios-comm-theme";

type MessageBubbleProps = {
  isSent: boolean;
  content: string;
  translatedContent?: string | null;
  createdAt: string;
};

function formatTime(iso: string) {
  const d = new Date(iso);
  return d.toLocaleTimeString("zh-CN", { hour: "numeric", minute: "2-digit" });
}

/**
 * iOS「信息」式气泡：发出右对齐蓝底，收到左对齐灰底；译文与原文分层展示。
 */
export function MessageBubble({ isSent, content, translatedContent, createdAt }: MessageBubbleProps) {
  const mainText = isSent ? translatedContent || content : translatedContent || content;
  const subText = isSent
    ? translatedContent && translatedContent !== content
      ? content
      : null
    : content && content !== translatedContent
      ? content
      : null;

  return (
    <View className={`max-w-[76%] mb-2 ${isSent ? "self-end" : "self-start"}`}>
      <View
        style={{
          borderRadius: iosComm.bubbleRadius,
          paddingHorizontal: 14,
          paddingVertical: 8,
          backgroundColor: isSent ? iosComm.bubbleSent : iosComm.bubbleReceived,
          ...(isSent
            ? { borderBottomRightRadius: 4 }
            : { borderBottomLeftRadius: 4 }),
        }}
      >
        {!isSent && subText ? (
          <Text style={{ color: iosComm.tertiaryLabel, fontSize: 12, marginBottom: 4 }} numberOfLines={4}>
            {subText}
          </Text>
        ) : null}
        <Text style={{ color: iosComm.label, fontSize: 17, lineHeight: 22 }}>{mainText}</Text>
        {isSent && subText ? (
          <Text style={{ color: "rgba(255,255,255,0.75)", fontSize: 12, marginTop: 6 }} numberOfLines={4}>
            {subText}
          </Text>
        ) : null}
      </View>
      <Text
        style={{
          color: iosComm.tertiaryLabel,
          fontSize: 11,
          marginTop: 4,
          textAlign: isSent ? "right" : "left",
        }}
      >
        {formatTime(createdAt)}
      </Text>
    </View>
  );
}
