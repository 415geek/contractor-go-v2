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
  Platform,
} from "react-native";

import { NumberCard } from "@/components/voip/NumberCard";
import { VoipFeedbackBanner } from "@/components/voip/VoipFeedbackBanner";
import { useVirtualNumbers } from "@/hooks/useVirtualNumbers";

export default function VoipPurchaseScreen() {
  const router = useRouter();
  const { searchAvailable, searchLoading, searchError, purchase, purchaseLoading } = useVirtualNumbers();
  const [areaCode, setAreaCode] = useState("");
  const [available, setAvailable] = useState<{ did: string; monthly: string; setup: string }[]>([]);
  const [confirmDid, setConfirmDid] = useState<{ did: string; monthly: string; setup: string } | null>(null);
  /** 是否已完成一次搜索（用于区分「还没搜」和「搜过但为空」） */
  const [searchedOnce, setSearchedOnce] = useState(false);
  /** Web 上 Alert 常不弹出，必须用页面内文案反馈 */
  const [banner, setBanner] = useState<{ kind: "error" | "info"; text: string } | null>(null);
  const [purchaseErr, setPurchaseErr] = useState<string | null>(null);

  const errMsg = (e: unknown) => (e instanceof Error ? e.message : String(e));

  const alertNative = (title: string, message?: string) => {
    if (Platform.OS !== "web") Alert.alert(title, message);
  };

  const handleSearch = async () => {
    const code = areaCode.replace(/\D/g, "");
    if (code.length !== 3) {
      setBanner({ kind: "error", text: "请输入 3 位区号，例如 415。" });
      alertNative("提示", "请输入3位区号，如415");
      return;
    }
    setSearchedOnce(false);
    setBanner(null);
    try {
      const list = await searchAvailable({ area_code: code });
      const mapped = list.map((d) => ({ did: d.did, monthly: d.monthly, setup: d.setup }));
      setAvailable(mapped);
      setSearchedOnce(true);
      if (mapped.length === 0) {
        setBanner({
          kind: "info",
          text: "该区号暂无可用号码（Voip 无库存或区号未映射）。可试 415、212、310 等。",
        });
        alertNative(
          "暂无号码",
          "该区号当前没有返回可用号码（Voip 库存为空或区号未映射）。可换 415、212、310 等已支持区号再试。",
        );
      } else {
        setBanner({ kind: "info", text: `找到 ${mapped.length} 个可选号码。` });
      }
    } catch (e) {
      const m = errMsg(e);
      setBanner({ kind: "error", text: m });
      alertNative("搜索失败", m);
    }
  };

  const handlePurchase = (did: string, monthly: string, setup: string) => {
    setPurchaseErr(null);
    setConfirmDid({ did, monthly, setup });
  };

  const confirmPurchase = async () => {
    if (!confirmDid) return;
    setPurchaseErr(null);
    try {
      await purchase({
        did: confirmDid.did,
        monthly: confirmDid.monthly,
        setup: confirmDid.setup,
      });
      setConfirmDid(null);
      router.replace("/voip");
    } catch (e) {
      const m = errMsg(e);
      setPurchaseErr(m);
      alertNative("购买失败", m);
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
        {searchError != null && (
          <Text className="text-red-400 mt-2">{errMsg(searchError)}</Text>
        )}
        {banner != null && <VoipFeedbackBanner kind={banner.kind} text={banner.text} />}
      </View>
      <View className="flex-1 min-h-[220px]">
        {available.length > 0 ? (
          <FlatList
            data={available}
            keyExtractor={(item) => item.did}
            contentContainerClassName="p-4 gap-4 pb-8"
            renderItem={({ item }) => (
              <NumberCard
                did={item.did}
                monthly={item.monthly}
                status="available"
                actionLabel="购买"
                onAction={() => handlePurchase(item.did, item.monthly, item.setup)}
              />
            )}
          />
        ) : (
          <View className="flex-1 justify-center items-center px-6 py-12">
            {searchLoading ? (
              <ActivityIndicator size="large" color="#3B82F6" />
            ) : (
              <Text className="text-gray-500 text-center text-base leading-6">
                {searchedOnce
                  ? "列表为空：该区号没有返回号码，或请查看上方蓝色/红色提示。"
                  : "输入 3 位区号（如 415）后点击「搜索」。"}
              </Text>
            )}
          </View>
        )}
      </View>
      <Modal visible={!!confirmDid} transparent animationType="fade">
        <View className="flex-1 bg-black/50 justify-center items-center p-6">
          <View className="bg-gray-800 rounded-xl p-6 w-full max-w-sm">
            <Text className="text-white text-lg font-semibold mb-2">确认购买</Text>
            {confirmDid && (
              <>
                <Text className="text-white font-mono text-xl mb-2">{confirmDid.did}</Text>
                <Text className="text-gray-400 mb-1">月费: ${confirmDid.monthly}</Text>
                <Text className="text-gray-400 mb-4">开通费: ${confirmDid.setup}</Text>
              </>
            )}
            {purchaseErr != null && (
              <Text className="text-red-400 text-sm mb-3">{purchaseErr}</Text>
            )}
            <View className="flex-row gap-3">
              <Pressable
                onPress={() => {
                  setPurchaseErr(null);
                  setConfirmDid(null);
                }}
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
