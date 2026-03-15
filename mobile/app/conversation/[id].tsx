import { Ionicons } from "@expo/vector-icons";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useEffect, useState } from "react";
import { View, Text, FlatList, Pressable, ActivityIndicator } from "react-native";

import { ChatInput } from "@/components/chat/ChatInput";
import { MessageBubble } from "@/components/chat/MessageBubble";
import { useMessages } from "@/hooks/useMessages";
import { supabase } from "@/lib/supabase";

export default function ConversationScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const [contactName, setContactName] = useState("");
  const { messages, isLoading, sendMessage, sendLoading } = useMessages(id ?? null);

  useEffect(() => {
    if (!id) return;
    supabase
      .from("conversations")
      .select("contact_name, contact_phone")
      .eq("id", id)
      .single()
      .then(({ data }) => {
        setContactName((data as { contact_name?: string; contact_phone?: string })?.contact_name ?? (data as { contact_phone?: string })?.contact_phone ?? "");
      });
  }, [id]);

  if (!id) return null;

  const handleSend = async (content: string) => {
    await sendMessage({ convId: id, content });
  };

  return (
    <View className="flex-1 bg-gray-900">
      <View className="flex-row items-center pt-12 pb-4 px-4 border-b border-gray-800">
        <Pressable onPress={() => router.back()} className="p-2 -ml-2">
          <Ionicons name="arrow-back" size={24} color="white" />
        </Pressable>
        <Text className="text-white text-lg font-semibold ml-2 flex-1">
          {contactName || "对话"}
        </Text>
      </View>
      {isLoading ? (
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator color="#3B82F6" />
        </View>
      ) : (
        <FlatList
          data={[...messages].reverse()}
          keyExtractor={(item) => item.id}
          inverted
          contentContainerStyle={{ padding: 16 }}
          renderItem={({ item }) => (
            <MessageBubble
              isSent={item.direction === "outbound"}
              content={item.original_content ?? ""}
              translatedContent={item.translated_content}
              createdAt={item.created_at}
            />
          )}
        />
      )}
      <ChatInput
        onSend={handleSend}
        disabled={sendLoading}
        sourceLang="zh-CN"
        targetLang="en-US"
      />
    </View>
  );
}
