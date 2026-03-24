import { View, Text, Image, Pressable, Linking } from "react-native";

import { iosComm } from "@/lib/ios-comm-theme";

type MessageBubbleProps = {
  isSent: boolean;
  content: string;
  translatedContent?: string | null;
  createdAt: string;
  /** outbound 乐观更新时为 sending */
  status?: string;
  messageType?: string;
  mediaUrl?: string | null;
};

function formatTime(iso: string) {
  const d = new Date(iso);
  return d.toLocaleTimeString("zh-CN", { hour: "numeric", minute: "2-digit" });
}

/**
 * iOS「信息」式气泡：发出右对齐蓝底，收到左对齐灰底；译文与原文分层展示。
 */
export function MessageBubble({
  isSent,
  content,
  translatedContent,
  createdAt,
  status,
  messageType = "text",
  mediaUrl,
}: MessageBubbleProps) {
  const pending = status === "sending";
  const deliveryHint = (() => {
    if (!isSent || pending) return "";
    if (status === "failed") return "未送达 ";
    if (status === "delivered") return "已送达 ";
    if (status === "sent") return "已发送 ";
    return "";
  })();
  const hasMedia = !!(mediaUrl && (messageType === "image" || messageType === "video"));
  const placeholderOnly = content === "[图片]" || content === "[视频]";
  const mainText = isSent ? translatedContent || content : translatedContent || content;
  const subText = isSent
    ? translatedContent && translatedContent !== content
      ? content
      : null
    : content && content !== translatedContent
      ? content
      : null;

  const showMainLine = !hasMedia || !placeholderOnly;
  const subColorSent = "rgba(255,255,255,0.75)";

  return (
    <View className={`max-w-[76%] mb-2 ${isSent ? "self-end" : "self-start"}`}>
      <View
        style={{
          borderRadius: iosComm.bubbleRadius,
          paddingHorizontal: 14,
          paddingVertical: 8,
          opacity: pending ? 0.88 : 1,
          backgroundColor: isSent ? iosComm.bubbleSent : iosComm.bubbleReceived,
          ...(isSent
            ? { borderBottomRightRadius: 4 }
            : { borderBottomLeftRadius: 4 }),
        }}
      >
        {hasMedia && messageType === "image" ? (
          <Image
            source={{ uri: mediaUrl! }}
            style={{ width: 200, height: 200, borderRadius: 8, marginBottom: showMainLine ? 6 : 0 }}
            resizeMode="cover"
            accessibilityLabel="图片附件"
          />
        ) : null}
        {hasMedia && messageType === "video" ? (
          <Pressable
            onPress={() => Linking.openURL(mediaUrl!)}
            style={{
              width: 200,
              minHeight: 100,
              borderRadius: 8,
              marginBottom: showMainLine ? 6 : 0,
              backgroundColor: "rgba(0,0,0,0.25)",
              alignItems: "center",
              justifyContent: "center",
              paddingVertical: 16,
            }}
            accessibilityRole="button"
            accessibilityLabel="打开视频"
          >
            <Text style={{ color: isSent ? "#FFFFFF" : iosComm.label, fontSize: 15 }}>▶ 视频</Text>
            <Text style={{ color: isSent ? subColorSent : iosComm.secondaryLabel, fontSize: 12, marginTop: 4 }}>
              点击查看
            </Text>
          </Pressable>
        ) : null}
        {!isSent && subText && !placeholderOnly ? (
          <Text style={{ color: iosComm.tertiaryLabel, fontSize: 12, marginBottom: 4 }} numberOfLines={4}>
            {subText}
          </Text>
        ) : null}
        {showMainLine ? (
          <Text style={{ color: iosComm.label, fontSize: 17, lineHeight: 22 }}>{mainText}</Text>
        ) : null}
        {isSent && subText && !placeholderOnly ? (
          <Text style={{ color: subColorSent, fontSize: 12, marginTop: 6 }} numberOfLines={4}>
            {subText}
          </Text>
        ) : null}
      </View>
      <Text
        style={{
          color: isSent && status === "failed" ? "#FF453A" : iosComm.tertiaryLabel,
          fontSize: 11,
          marginTop: 4,
          textAlign: isSent ? "right" : "left",
        }}
      >
        {pending ? "发送中… " : deliveryHint}
        {formatTime(createdAt)}
      </Text>
    </View>
  );
}
