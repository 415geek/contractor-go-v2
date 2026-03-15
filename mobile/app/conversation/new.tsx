import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useState } from "react";
import { View, Text, TextInput, Pressable, ActivityIndicator } from "react-native";

import { useConversations } from "@/hooks/useConversations";
import { useVirtualNumbers } from "@/hooks/useVirtualNumbers";

function normalizePhone(p: string): string {
  const d = p.replace(/\D/g, "");
  if (d.length === 10) return `+1${d}`;
  if (d.length === 11 && d.startsWith("1")) return `+${d}`;
  return p.startsWith("+") ? p : `+${p}`;
}

export default function NewConversationScreen() {
  const router = useRouter();
  const { createConversation, createLoading } = useConversations();
  const { numbers } = useVirtualNumbers();
  const [phone, setPhone] = useState("");
  const [name, setName] = useState("");

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
      console.error(e);
    }
  };

  return (
    <View className="flex-1 bg-gray-900">
      <View className="flex-row items-center px-4 pt-12 pb-4 border-b border-gray-800">
        <Pressable onPress={() => router.back()} className="p-2 -ml-2">
          <Ionicons name="arrow-back" size={24} color="white" />
        </Pressable>
        <Text className="text-white text-xl font-semibold ml-2">新对话</Text>
      </View>
      <View className="p-4">
        <Text className="text-gray-400 mb-2">对方手机号</Text>
        <TextInput
          value={phone}
          onChangeText={setPhone}
          placeholder="+14155551234"
          placeholderTextColor="#6B7280"
          keyboardType="phone-pad"
          className="bg-gray-800 text-white rounded-lg px-4 py-3 mb-4"
        />
        <Text className="text-gray-400 mb-2">备注名（可选）</Text>
        <TextInput
          value={name}
          onChangeText={setName}
          placeholder="联系人名称"
          placeholderTextColor="#6B7280"
          className="bg-gray-800 text-white rounded-lg px-4 py-3 mb-6"
        />
        <Pressable
          onPress={handleCreate}
          disabled={createLoading || phone.trim().length < 10}
          className="bg-blue-600 py-3 rounded-lg items-center disabled:opacity-50"
        >
          {createLoading ? (
            <ActivityIndicator color="white" />
          ) : (
            <Text className="text-white font-medium">开始对话</Text>
          )}
        </Pressable>
      </View>
    </View>
  );
}
