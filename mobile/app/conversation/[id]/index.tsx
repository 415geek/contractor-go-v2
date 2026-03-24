import { useAuth } from "@clerk/clerk-expo";
import * as ImagePicker from "expo-image-picker";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useCallback, useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  Text,
  View,
} from "react-native";

import { ChatInput } from "@/components/chat/ChatInput";
import { IOSConversationHeader } from "@/components/chat/IOSConversationHeader";
import { MessageBubble } from "@/components/chat/MessageBubble";
import { alertCrossPlatform } from "@/lib/alert-cross-platform";
import { uploadChatMediaBase64 } from "@/lib/api/upload-chat-media";
import { assertChatMediaSizeUnderLimit, uriToBase64ForChat } from "@/lib/chat-media";
import { CONTACT_LANGUAGE_OPTIONS, contactLanguageLabel } from "@/lib/contact-languages";
import { getClerkSessionTokenForEdge } from "@/lib/clerk-session-token";
import { iosComm } from "@/lib/ios-comm-theme";
import { useConversations } from "@/hooks/useConversations";
import { useMeProfile } from "@/hooks/useMeProfile";
import { useMessages } from "@/hooks/useMessages";

export default function ConversationScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { getToken } = useAuth();
  const { data: me } = useMeProfile();
  const { conversations, isLoading: convListLoading, refetch: refetchConversations, updateConversation } =
    useConversations();
  const {
    messages,
    isLoading,
    sendMessage,
    sendLoading,
    sendMediaMessage,
    sendMediaLoading,
  } = useMessages(id ?? null);

  const conv = useMemo(() => conversations.find((c) => c.id === id), [conversations, id]);
  const [langModalOpen, setLangModalOpen] = useState(false);

  useEffect(() => {
    if (!id || conv || convListLoading) return;
    void refetchConversations();
  }, [id, conv, convListLoading, refetchConversations]);

  const displayTitle = useMemo(() => {
    const name = conv?.contact_name?.trim();
    const phone = conv?.contact_phone ?? "";
    return name || phone || "信息";
  }, [conv]);

  const subtitle = useMemo(() => {
    const phone = conv?.contact_phone ?? "";
    return phone && phone !== displayTitle ? phone : undefined;
  }, [conv, displayTitle]);

  const sourceLang = me?.default_language?.trim() || "zh-CN";
  const targetLang = conv?.contact_language?.trim() || "en";

  const handleSend = async (content: string) => {
    if (!id) return;
    try {
      await sendMessage({ convId: id, content });
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      alertCrossPlatform("未能发送", msg);
      throw e;
    }
  };

  const handleAttach = useCallback(async () => {
    if (!id) return;
    const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!perm.granted) {
      alertCrossPlatform("需要相册权限", "请在系统设置中允许访问相册，以便发送图片或视频。");
      return;
    }
    const pick = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.All,
      allowsEditing: false,
      quality: 0.85,
      videoMaxDuration: 60,
    });
    if (pick.canceled || !pick.assets?.[0]) return;
    const asset = pick.assets[0];
    const isVideo = asset.type === "video" || (asset.mimeType?.startsWith("video/") ?? false);
    const kind = isVideo ? "video" : "image";
    const filename = asset.fileName ?? (isVideo ? "clip.mp4" : "photo.jpg");
    const mime = asset.mimeType ?? (isVideo ? "video/mp4" : "image/jpeg");

    try {
      const b64 = await uriToBase64ForChat(asset.uri, kind);
      assertChatMediaSizeUnderLimit(b64);
      const jwt = await getClerkSessionTokenForEdge(() => getToken());
      const up = await uploadChatMediaBase64(jwt, b64, filename, mime);
      await sendMediaMessage({ convId: id, mediaUrls: [up.public_url], mediaKind: kind });
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      alertCrossPlatform("未能发送附件", msg);
    }
  }, [getToken, id, sendMediaMessage]);

  const pickContactLanguage = async (value: string) => {
    if (!id) return;
    setLangModalOpen(false);
    try {
      await updateConversation({ conversation_id: id, contact_language: value });
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      alertCrossPlatform("未能保存语言", msg);
    }
  };

  if (!id) return null;

  if (convListLoading && !conv) {
    return (
      <View className="flex-1 items-center justify-center" style={{ backgroundColor: iosComm.bg }}>
        <ActivityIndicator color={iosComm.systemBlue} />
      </View>
    );
  }

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
        onContactPress={() => router.push(`/conversation/${id}/contact` as never)}
        onCallPress={() =>
          alertCrossPlatform("通话", "虚拟号码语音通话能力接入后，将可在此直接回拨。")
        }
        languageLine={`对方看到的语言 · ${contactLanguageLabel(targetLang)}`}
        onLanguagePress={() => setLangModalOpen(true)}
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
              status={item.status}
              messageType={item.message_type}
              mediaUrl={item.media_url}
            />
          )}
        />
      )}
      <ChatInput
        onSend={handleSend}
        onAttachPress={handleAttach}
        disabled={sendLoading || sendMediaLoading}
        attachDisabled={sendLoading || sendMediaLoading}
        sourceLang={sourceLang}
        targetLang={targetLang}
      />

      <Modal visible={langModalOpen} transparent animationType="fade" onRequestClose={() => setLangModalOpen(false)}>
        <Pressable
          style={{ flex: 1, backgroundColor: "rgba(0,0,0,0.45)", justifyContent: "flex-end" }}
          onPress={() => setLangModalOpen(false)}
        >
          <Pressable
            onPress={(e) => e.stopPropagation()}
            style={{
              backgroundColor: iosComm.elevated,
              borderTopLeftRadius: 14,
              borderTopRightRadius: 14,
              paddingBottom: 28,
              maxHeight: "55%",
            }}
          >
            <Text style={{ color: iosComm.label, fontSize: 17, fontWeight: "600", padding: 16, textAlign: "center" }}>
              对方看到的语言
            </Text>
            <Text style={{ color: iosComm.secondaryLabel, fontSize: 13, paddingHorizontal: 20, paddingBottom: 12 }}>
              出站短信会翻译成该语言；可随时按对方习惯修改。
            </Text>
            <FlatList
              data={CONTACT_LANGUAGE_OPTIONS}
              keyExtractor={(item) => item.value}
              keyboardShouldPersistTaps="handled"
              renderItem={({ item }) => (
                <Pressable
                  onPress={() => void pickContactLanguage(item.value)}
                  style={{
                    paddingVertical: 14,
                    paddingHorizontal: 20,
                    borderTopWidth: 0.33,
                    borderTopColor: iosComm.separator,
                  }}
                >
                  <Text style={{ color: iosComm.label, fontSize: 17 }}>
                    {item.label}
                    {item.value === targetLang ? "  ✓" : ""}
                  </Text>
                </Pressable>
              )}
            />
            <Pressable
              onPress={() => setLangModalOpen(false)}
              style={{ marginTop: 8, paddingVertical: 14, alignItems: "center" }}
            >
              <Text style={{ color: iosComm.systemBlue, fontSize: 17 }}>取消</Text>
            </Pressable>
          </Pressable>
        </Pressable>
      </Modal>
    </KeyboardAvoidingView>
  );
}
