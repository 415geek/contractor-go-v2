import { View, Text } from "react-native";

type MessageBubbleProps = {
  isSent: boolean;
  content: string;
  translatedContent?: string | null;
  createdAt: string;
};

function formatTime(iso: string) {
  const d = new Date(iso);
  return d.toLocaleTimeString("zh-CN", { hour: "2-digit", minute: "2-digit" });
}

export function MessageBubble({ isSent, content, translatedContent, createdAt }: MessageBubbleProps) {
  const mainText = isSent ? (translatedContent || content) : (translatedContent || content);
  const subText = isSent ? (translatedContent && translatedContent !== content ? content : null) : (content && content !== translatedContent ? content : null);

  return (
    <View className={`max-w-[80%] mb-3 ${isSent ? "self-end" : "self-start"}`}>
      <View
        className={`rounded-2xl px-4 py-3 ${
          isSent ? "bg-blue-600 rounded-br-md" : "bg-gray-700 rounded-bl-md"
        }`}
      >
        {!isSent && subText && <Text className="text-gray-400 text-xs mb-1">{subText}</Text>}
        <Text className="text-white text-base">{mainText}</Text>
        {isSent && subText && <Text className="text-blue-200 text-xs mt-1">{subText}</Text>}
      </View>
      <Text
        className={`text-gray-500 text-xs mt-1 ${isSent ? "text-right" : "text-left"}`}
      >
        {formatTime(createdAt)}
      </Text>
    </View>
  );
}
