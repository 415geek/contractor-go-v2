import { useLocalSearchParams, useRouter } from "expo-router";
import { useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { alertCrossPlatform } from "@/lib/alert-cross-platform";
import { CONTACT_LANGUAGE_OPTIONS, contactLanguageLabel } from "@/lib/contact-languages";
import { iosComm } from "@/lib/ios-comm-theme";
import { useConversations } from "@/hooks/useConversations";

export default function ConversationContactScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { conversations, isLoading, refetch, updateConversation, updateConversationLoading } = useConversations();

  const conv = useMemo(() => conversations.find((c) => c.id === id), [conversations, id]);

  const [name, setName] = useState("");
  const [company, setCompany] = useState("");
  const [phone, setPhone] = useState("");
  const [notes, setNotes] = useState("");
  const [language, setLanguage] = useState("en");

  useEffect(() => {
    if (!id || isLoading) return;
    if (!conv) void refetch();
  }, [id, conv, isLoading, refetch]);

  useEffect(() => {
    if (!conv) return;
    setName(conv.contact_name?.trim() ?? "");
    setCompany(conv.contact_company?.trim() ?? "");
    setPhone(conv.contact_phone?.trim() ?? "");
    setNotes(conv.contact_notes?.trim() ?? "");
    setLanguage(conv.contact_language?.trim() || "en");
  }, [conv]);

  const save = async () => {
    if (!id) return;
    const digits = phone.replace(/\D/g, "");
    if (phone.trim().length > 0 && digits.length < 8) {
      alertCrossPlatform("号码无效", "请填写完整电话号码（至少 8 位数字）。");
      return;
    }
    try {
      await updateConversation({
        conversation_id: id,
        contact_name: name.trim() || null,
        contact_company: company.trim() || null,
        contact_notes: notes.trim() || null,
        contact_phone: phone.trim() || null,
        contact_language: language,
      });
      router.back();
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      alertCrossPlatform("未能保存", msg);
    }
  };

  if (!id) return null;

  if (isLoading && !conv) {
    return (
      <View className="flex-1 items-center justify-center" style={{ backgroundColor: iosComm.bg }}>
        <ActivityIndicator color={iosComm.systemBlue} />
      </View>
    );
  }

  if (!conv) {
    return (
      <View className="flex-1 items-center justify-center px-6" style={{ backgroundColor: iosComm.bg }}>
        <Text style={{ color: iosComm.secondaryLabel, textAlign: "center" }}>找不到该会话，请返回列表重试。</Text>
        <Pressable onPress={() => router.back()} style={{ marginTop: 16 }}>
          <Text style={{ color: iosComm.systemBlue, fontSize: 17 }}>返回</Text>
        </Pressable>
      </View>
    );
  }

  const inputStyle = {
    backgroundColor: iosComm.inputFill,
    color: iosComm.label,
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: Platform.OS === "ios" ? 12 : 10,
    fontSize: 17,
    marginTop: 8,
  };

  return (
    <KeyboardAvoidingView
      className="flex-1"
      style={{ backgroundColor: iosComm.bg }}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      <View
        style={{
          paddingTop: Math.max(insets.top, 8),
          paddingBottom: 12,
          borderBottomWidth: 0.33,
          borderBottomColor: iosComm.navSeparator,
          flexDirection: "row",
          alignItems: "center",
          paddingHorizontal: 8,
        }}
      >
        <Pressable onPress={() => router.back()} hitSlop={12} style={{ paddingVertical: 8, paddingHorizontal: 8 }}>
          <Text style={{ color: iosComm.systemBlue, fontSize: 17 }}>取消</Text>
        </Pressable>
        <Text className="flex-1 text-center text-[17px] font-semibold" style={{ color: iosComm.label }}>
          联系人信息
        </Text>
        <Pressable
          onPress={() => void save()}
          disabled={updateConversationLoading}
          hitSlop={12}
          style={{ paddingVertical: 8, paddingHorizontal: 8, opacity: updateConversationLoading ? 0.5 : 1 }}
        >
          <Text style={{ color: iosComm.systemBlue, fontSize: 17, fontWeight: "600" }}>完成</Text>
        </Pressable>
      </View>

      <ScrollView
        className="flex-1 px-4 pt-4"
        contentContainerStyle={{ paddingBottom: Math.max(insets.bottom, 24) + 24 }}
        keyboardShouldPersistTaps="handled"
      >
        <Text style={{ color: iosComm.secondaryLabel, fontSize: 13 }}>姓名</Text>
        <TextInput
          value={name}
          onChangeText={setName}
          placeholder="显示名称"
          placeholderTextColor={iosComm.tertiaryLabel as string}
          style={inputStyle}
        />

        <Text style={{ color: iosComm.secondaryLabel, fontSize: 13, marginTop: 20 }}>公司</Text>
        <TextInput
          value={company}
          onChangeText={setCompany}
          placeholder="公司（可选）"
          placeholderTextColor={iosComm.tertiaryLabel as string}
          style={inputStyle}
        />

        <Text style={{ color: iosComm.secondaryLabel, fontSize: 13, marginTop: 20 }}>电话</Text>
        <TextInput
          value={phone}
          onChangeText={setPhone}
          placeholder="E.164 或本地号码"
          placeholderTextColor={iosComm.tertiaryLabel as string}
          keyboardType="phone-pad"
          style={inputStyle}
        />

        <Text style={{ color: iosComm.secondaryLabel, fontSize: 13, marginTop: 20 }}>备注</Text>
        <TextInput
          value={notes}
          onChangeText={setNotes}
          placeholder="备注（仅自己可见）"
          placeholderTextColor={iosComm.tertiaryLabel as string}
          multiline
          style={[inputStyle, { minHeight: 100, textAlignVertical: "top" }]}
        />

        <Text style={{ color: iosComm.secondaryLabel, fontSize: 13, marginTop: 20 }}>对方看到的语言</Text>
        <Text style={{ color: iosComm.tertiaryLabel, fontSize: 12, marginTop: 4 }}>
          当前：{contactLanguageLabel(language)}。点选下方语言保存后生效。
        </Text>
        <View style={{ marginTop: 12, gap: 8 }}>
          {CONTACT_LANGUAGE_OPTIONS.map((opt) => {
            const on = opt.value === language;
            return (
              <Pressable
                key={opt.value}
                onPress={() => setLanguage(opt.value)}
                style={{
                  paddingVertical: 14,
                  paddingHorizontal: 16,
                  borderRadius: 10,
                  backgroundColor: on ? iosComm.systemBlue : iosComm.inputFill,
                }}
              >
                <Text style={{ color: on ? "#FFFFFF" : iosComm.label, fontSize: 17 }}>
                  {opt.label}
                  {on ? "  ✓" : ""}
                </Text>
              </Pressable>
            );
          })}
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
