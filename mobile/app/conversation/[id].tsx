import { useLocalSearchParams } from "expo-router";
import { useEffect, useState } from "react";
import { View, FlatList, ActivityIndicator, Alert, KeyboardAvoidingView, Platform } from "react-native";

import { ChatInput } from "@/components/chat/ChatInput";
import { IOSConversationHeader } from "@/components/chat/IOSConversationHeader";
import { MessageBubble } from "@/components/chat/MessageBubble";
import { useMessages } from "@/hooks/useMessages";
import { iosComm } from "@/lib/ios-comm-theme";
import { supabase } from "@/lib/supabase";

export default function ConversationScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const [contactName, setContactName] = useState("");
  const [contactPhone, setContactPhone] = useState("");
  const { messages, isLoading, sendMessage, sendLoading } = useMessages(id ?? null);

  useEffect(() => {
    if (!id) return;
    supabase
      .from("conversations")
      .select("contact_name, contact_phone")
      .eq("id", id)
      .single()
      .then(({ data }) => {
        const row = data as { contact_name?: string | null; contact_phone?: string | null } | null;
        const phone = row?.contact_phone ?? "";
        setContactPhone(phone);
        setContactName(row?.contact_name?.trim() || phone || "");
      });
  }, [id]);

  if (!id) return null;

  const handleSend = async (content: string) => {
    try {
      await sendMessage({ convId: id, content });
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      Alert.alert("未能发送", msg);
    }
  };

  const displayTitle = contactName || "信息";
  const subtitle = contactPhone && contactPhone !== displayTitle ? contactPhone : undefined;

  return (
    <KeyboardAvoidingView
      className="flex-1"
      style={{ backgroundColor: iosComm.bg }}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
      keyboardVerticalOffset={Platform.OS === "ios" ? 0 : 0}
    >
      <IOSConversationHeader
        title={displayTitle}
        subtitle={subtitle}
        onCallPress={() =>
          Alert.alert("通话", "虚拟号码语音通话能力接入后，将可在此直接回拨。")
        }
      />
      {isLoading ? (
        <View className="flex-1 items-center justify-center" style={{ backgroundColor: iosComm.bg }}>
          <ActivityIndicator color={iosComm.systemBlue} />
        </View>
      ) : (
        <FlatList
          style={{ flex: 1, backgroundColor: iosComm.bg }}
          data={[...messages].reverse()}
          keyExtractor={(item) => item.id}
          inverted
          contentContainerStyle={{ paddingHorizontal: 12, paddingVertical: 10 }}
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
    </KeyboardAvoidingView>
  );
}
