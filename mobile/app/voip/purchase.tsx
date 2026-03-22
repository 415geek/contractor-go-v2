import { useRouter } from "expo-router";
import { useCallback, useState } from "react";
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
import { VoipHeader } from "@/components/voip/VoipHeader";
import { VoipQuickNav } from "@/components/voip/VoipQuickNav";
import { VoipFeedbackBanner } from "@/components/voip/VoipFeedbackBanner";
import { useVirtualNumbers } from "@/hooks/useVirtualNumbers";

type Row = { did: string; monthly: string; setup: string; province?: string; ratecenter?: string };

function subtitleForRow(item: Row): string {
  const parts = [item.province, item.ratecenter].filter((x) => (x ?? "").trim().length > 0);
  return parts.length > 0 ? parts.join(" · ") : "美国号码";
}

export default function VoipPurchaseScreen() {
  const router = useRouter();
  const { searchAvailable, searchLoading, searchError, purchase, purchaseLoading } = useVirtualNumbers();
  const [rows, setRows] = useState<Row[]>([]);
  const [areaCode, setAreaCode] = useState("");
  const [lastSearchedCode, setLastSearchedCode] = useState<string | null>(null);
  const [confirmDid, setConfirmDid] = useState<{ did: string; monthly: string; setup: string } | null>(null);
  const [banner, setBanner] = useState<{ kind: "error" | "info"; text: string } | null>(null);
  const [purchaseErr, setPurchaseErr] = useState<string | null>(null);

  const errMsg = (e: unknown) => (e instanceof Error ? e.message : String(e));

  const alertNative = (title: string, message?: string) => {
    if (Platform.OS !== "web") Alert.alert(title, message);
  };

  const mapList = useCallback(
    (list: { did: string; monthly: string; setup: string; province?: string; ratecenter?: string }[]) =>
      list.map((d) => ({
        did: d.did,
        monthly: d.monthly,
        setup: d.setup,
        province: d.province,
        ratecenter: d.ratecenter,
      })),
    [],
  );

  const handleSearch = async () => {
    const code = areaCode.replace(/\D/g, "");
    if (code.length !== 3) {
      setBanner({ kind: "error", text: "请输入 3 位美国区号（NPA），例如 415、650。" });
      alertNative("提示", "请输入 3 位区号");
      return;
    }
    setBanner(null);
    try {
      const list = await searchAvailable({ area_code: code });
      const mapped = mapList(list);
      setRows(mapped);
      setLastSearchedCode(code);
      if (mapped.length === 0) {
        setBanner({
          kind: "info",
          text: `区号 ${code} 暂无可用号码，请换其他区号再试。`,
        });
        alertNative("暂无号码", `区号 ${code} 暂无返回号码`);
      } else {
        setBanner({
          kind: "info",
          text: `区号 ${code}：共 ${mapped.length} 个可选号码。`,
        });
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

  const busy = searchLoading;

  return (
    <View className="flex-1 bg-gray-900">
      <VoipHeader title="购买号码" fallbackRoute="/voip" />
      <VoipQuickNav />

      <View className="px-3 pt-3 pb-2 border-b border-gray-800">
        <Text className="text-gray-400 text-sm mb-2">输入 3 位区号搜索可购号码（美国 NPA，如 415、212、650）。</Text>
        <View className="flex-row gap-2 items-center">
          <TextInput
            value={areaCode}
            onChangeText={(t) => setAreaCode(t.replace(/\D/g, "").slice(0, 3))}
            placeholder="415"
            placeholderTextColor="#6B7280"
            keyboardType="number-pad"
            maxLength={3}
            returnKeyType="search"
            onSubmitEditing={() => void handleSearch()}
            className="flex-1 bg-gray-800 text-white rounded-lg px-3 py-3 text-base font-mono"
          />
          <Pressable
            onPress={() => void handleSearch()}
            disabled={busy}
            className="bg-blue-600 px-5 py-3 rounded-lg justify-center active:opacity-80 min-w-[88px] items-center"
          >
            {busy ? <ActivityIndicator size="small" color="white" /> : <Text className="text-white font-semibold">搜索</Text>}
          </Pressable>
        </View>
        {searchError != null && (
          <Text className="text-red-400 text-xs mt-2" numberOfLines={3}>
            {errMsg(searchError)}
          </Text>
        )}
        {banner != null && (
          <View className="mt-2">
            <VoipFeedbackBanner kind={banner.kind} text={banner.text} compact />
          </View>
        )}
      </View>

      <View className="flex-1 px-3 pt-2" style={{ minHeight: 0 }}>
        {lastSearchedCode != null && (
          <Text className="text-gray-500 text-xs mb-2">
            区号 {lastSearchedCode} · {rows.length} 条
          </Text>
        )}
        {busy && rows.length === 0 ? (
          <View className="flex-1 justify-center items-center py-16">
            <ActivityIndicator size="large" color="#3B82F6" />
            <Text className="text-gray-500 mt-4">正在搜索…</Text>
          </View>
        ) : rows.length > 0 ? (
          <FlatList
            data={rows}
            keyExtractor={(item) => item.did}
            style={{ flex: 1 }}
            contentContainerClassName="pb-20 gap-2"
            renderItem={({ item }) => (
              <NumberCard
                did={item.did}
                monthly={item.monthly}
                status="available"
                subtitle={subtitleForRow(item)}
                actionLabel="购买"
                onAction={() => handlePurchase(item.did, item.monthly, item.setup)}
              />
            )}
          />
        ) : (
          <View className="flex-1 justify-center items-center py-16 px-4">
            <Text className="text-gray-500 text-center text-base">
              {lastSearchedCode
                ? "该区号下没有可选号码，请尝试其他区号。"
                : "在上方输入区号，点击「搜索」查看可购号码。"}
            </Text>
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
                <Text className="text-gray-400 mb-1">
                  月费: ${confirmDid.monthly?.trim() ? confirmDid.monthly : "0"}
                </Text>
                <Text className="text-gray-400 mb-4">
                  开通费: ${confirmDid.setup?.trim() ? confirmDid.setup : "0"}
                </Text>
              </>
            )}
            {purchaseErr != null && <Text className="text-red-400 text-sm mb-3">{purchaseErr}</Text>}
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
