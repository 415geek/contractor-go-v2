import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useState } from "react";
import {
  View,
  Text,
  TextInput,
  Pressable,
  FlatList,
  ActivityIndicator,
  Alert,
  Modal,
} from "react-native";

import { NumberCard } from "@/components/voip/NumberCard";
import { useVirtualNumbers } from "@/hooks/useVirtualNumbers";

export default function VoipPurchaseScreen() {
  const router = useRouter();
  const { searchAvailable, searchLoading, searchError, purchase, purchaseLoading } = useVirtualNumbers();
  const [areaCode, setAreaCode] = useState("");
  const [available, setAvailable] = useState<{ did: string; monthly: string; setup: string }[]>([]);
  const [confirmDid, setConfirmDid] = useState<{ did: string; monthly: string } | null>(null);

  const handleSearch = async () => {
    const code = areaCode.replace(/\D/g, "");
    if (code.length !== 3) {
      Alert.alert("提示", "请输入3位区号，如415");
      return;
    }
    try {
      const list = await searchAvailable({ area_code: code });
      setAvailable(list.map((d) => ({ did: d.did, monthly: d.monthly, setup: d.setup })));
    } catch (e) {
      Alert.alert("搜索失败", String(e));
    }
  };

  const handlePurchase = (did: string, monthly: string) => {
    setConfirmDid({ did, monthly });
  };

  const confirmPurchase = async () => {
    if (!confirmDid) return;
    try {
      await purchase({ did: confirmDid.did, monthly: confirmDid.monthly });
      setConfirmDid(null);
      router.replace("/voip");
    } catch (e) {
      Alert.alert("购买失败", String(e));
    }
  };

  return (
    <View className="flex-1 bg-gray-900">
      <View className="flex-row items-center px-4 pt-12 pb-4 border-b border-gray-800">
        <Pressable onPress={() => router.back()} className="p-2 -ml-2">
          <Ionicons name="arrow-back" size={24} color="white" />
        </Pressable>
        <Text className="text-white text-xl font-semibold ml-2">购买号码</Text>
      </View>
      <View className="p-4">
        <Text className="text-gray-400 mb-2">区号（3位数字，如415）</Text>
        <View className="flex-row gap-2">
          <TextInput
            value={areaCode}
            onChangeText={setAreaCode}
            placeholder="415"
            placeholderTextColor="#6B7280"
            keyboardType="number-pad"
            maxLength={3}
            className="flex-1 bg-gray-800 text-white rounded-lg px-4 py-3 font-mono text-lg"
          />
          <Pressable
            onPress={handleSearch}
            disabled={searchLoading}
            className="bg-blue-600 px-6 py-3 rounded-lg justify-center"
          >
            {searchLoading ? (
              <ActivityIndicator size="small" color="white" />
            ) : (
              <Text className="text-white font-medium">搜索</Text>
            )}
          </Pressable>
        </View>
        {searchError && (
          <Text className="text-red-400 mt-2">{String(searchError)}</Text>
        )}
      </View>
      <FlatList
        data={available}
        keyExtractor={(item) => item.did}
        contentContainerClassName="p-4 gap-4"
        renderItem={({ item }) => (
          <NumberCard
            did={item.did}
            monthly={item.monthly}
            status="available"
            actionLabel="购买"
            onAction={() => handlePurchase(item.did, item.monthly)}
          />
        )}
      />
      <Modal visible={!!confirmDid} transparent animationType="fade">
        <View className="flex-1 bg-black/50 justify-center items-center p-6">
          <View className="bg-gray-800 rounded-xl p-6 w-full max-w-sm">
            <Text className="text-white text-lg font-semibold mb-2">确认购买</Text>
            {confirmDid && (
              <>
                <Text className="text-white font-mono text-xl mb-2">{confirmDid.did}</Text>
                <Text className="text-gray-400 mb-4">月费: ${confirmDid.monthly}</Text>
              </>
            )}
            <View className="flex-row gap-3">
              <Pressable
                onPress={() => setConfirmDid(null)}
                className="flex-1 bg-gray-700 py-3 rounded-lg items-center"
              >
                <Text className="text-white">取消</Text>
              </Pressable>
              <Pressable
                onPress={confirmPurchase}
                disabled={purchaseLoading}
                className="flex-1 bg-blue-600 py-3 rounded-lg items-center"
              >
                {purchaseLoading ? (
                  <ActivityIndicator size="small" color="white" />
                ) : (
                  <Text className="text-white font-medium">确认</Text>
                )}
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}
