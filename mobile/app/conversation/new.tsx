import { useLocalSearchParams, useRouter } from "expo-router";
import { useEffect, useState } from "react";
import {
  View,
  Text,
  TextInput,
  Pressable,
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { IOSConversationHeader } from "@/components/chat/IOSConversationHeader";
import { useConversations } from "@/hooks/useConversations";
import { useVirtualNumbers } from "@/hooks/useVirtualNumbers";
import { iosComm } from "@/lib/ios-comm-theme";

function normalizePhone(p: string): string {
  const d = p.replace(/\D/g, "");
  if (d.length === 10) return `+1${d}`;
  if (d.length === 11 && d.startsWith("1")) return `+${d}`;
  return p.startsWith("+") ? p : `+${p}`;
}

/**
 * 类 iOS「撰写新信息」：收件人号码 + 可选备注，分组列表视觉。
 */
export default function NewConversationScreen() {
  const router = useRouter();
  const { phone: phoneParam } = useLocalSearchParams<{ phone?: string }>();
  const insets = useSafeAreaInsets();
  const { createConversation, createLoading } = useConversations();
  const { numbers } = useVirtualNumbers();
  const [phone, setPhone] = useState("");
  const [name, setName] = useState("");

  useEffect(() => {
    const raw = typeof phoneParam === "string" ? phoneParam : Array.isArray(phoneParam) ? phoneParam[0] : "";
    if (raw) {
      try {
        setPhone(decodeURIComponent(raw));
      } catch {
        setPhone(raw);
      }
    }
  }, [phoneParam]);

  const handleCreate = async () => {
    const p = normalizePhone(phone.trim());
    if (p.length < 10) return;
    try {
      const conv = await createConversation({
        contact_phone: p,
        contact_name: name.trim() || p,
        virtual_number_id: numbers[0]?.id,
      });
      router.replace(`/conversation/${conv.id}`);
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      Alert.alert("无法创建对话", msg);
    }
  };

  const digits = phone.replace(/\D/g, "");
  const canSubmit = digits.length >= 10;

  return (
    <KeyboardAvoidingView
      className="flex-1"
      style={{ backgroundColor: iosComm.bg }}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      <IOSConversationHeader title="新信息" />
      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{
          paddingHorizontal: iosComm.screenPaddingH,
          paddingTop: 20,
          paddingBottom: Math.max(insets.bottom, 24),
        }}
        keyboardShouldPersistTaps="handled"
      >
        <Text style={{ color: iosComm.secondaryLabel, fontSize: 13, marginBottom: 8, marginLeft: 4 }}>
          收件人
        </Text>
        <View
          style={{
            backgroundColor: iosComm.groupedSecondary,
            borderRadius: 10,
            overflow: "hidden",
          }}
        >
          <View style={{ flexDirection: "row", alignItems: "center", minHeight: 44, paddingHorizontal: 14 }}>
            <Text style={{ color: iosComm.secondaryLabel, fontSize: 17, width: 72 }}>电话号码</Text>
            <TextInput
              value={phone}
              onChangeText={setPhone}
              placeholder="必填"
              placeholderTextColor={iosComm.tertiaryLabel as string}
              keyboardType="phone-pad"
              autoCorrect={false}
              style={{
                flex: 1,
                color: iosComm.label,
                fontSize: 17,
                paddingVertical: 12,
              }}
            />
          </View>
          <View style={{ height: 0.33, backgroundColor: iosComm.separator, marginLeft: 86 }} />
          <View style={{ flexDirection: "row", alignItems: "center", minHeight: 44, paddingHorizontal: 14 }}>
            <Text style={{ color: iosComm.secondaryLabel, fontSize: 17, width: 72 }}>姓名</Text>
            <TextInput
              value={name}
              onChangeText={setName}
              placeholder="选填"
              placeholderTextColor={iosComm.tertiaryLabel as string}
              style={{
                flex: 1,
                color: iosComm.label,
                fontSize: 17,
                paddingVertical: 12,
              }}
            />
          </View>
        </View>

        <Text style={{ color: iosComm.tertiaryLabel, fontSize: 13, marginTop: 12, lineHeight: 18 }}>
          将使用您已绑定的虚拟号码发送短信。格式示例：4155551234 或 +14155551234。
        </Text>

        <Pressable
          onPress={handleCreate}
          disabled={createLoading || !canSubmit}
          style={{
            marginTop: 28,
            minHeight: 50,
            borderRadius: 12,
            backgroundColor: canSubmit && !createLoading ? iosComm.systemGreen : iosComm.groupedSecondary,
            alignItems: "center",
            justifyContent: "center",
            opacity: createLoading ? 0.85 : 1,
          }}
        >
          {createLoading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={{ color: "#fff", fontSize: 17, fontWeight: "600" }}>开始对话</Text>
          )}
        </Pressable>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
