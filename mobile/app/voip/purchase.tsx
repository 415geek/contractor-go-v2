import { useRouter } from "expo-router";
import { useCallback, useEffect, useMemo, useState } from "react";
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
  ScrollView,
  useWindowDimensions,
} from "react-native";

import { NumberCard } from "@/components/voip/NumberCard";
import { VoipHeader } from "@/components/voip/VoipHeader";
import { VoipQuickNav } from "@/components/voip/VoipQuickNav";
import { VoipFeedbackBanner } from "@/components/voip/VoipFeedbackBanner";
import { useVirtualNumbers } from "@/hooks/useVirtualNumbers";
import { fetchBayAreaAvailableNumbers } from "@/lib/api/voip";
import {
  BAY_AREA_NPAS_ORDERED,
  BAY_AREA_REGIONS,
  type BayAreaRegionFilterKey,
  didMatchesRegionFilter,
  formatDidRegionLabel,
} from "@/lib/bay-area-voip";

type Row = { did: string; monthly: string; setup: string; province?: string; ratecenter?: string };

export default function VoipPurchaseScreen() {
  const router = useRouter();
  const { height: windowH } = useWindowDimensions();
  const filterPct = Platform.OS === "web" ? 0.34 : 0.38;
  const filterCap = Platform.OS === "web" ? 240 : 300;
  const filterPanelMaxH = Math.min(filterCap, Math.round(windowH * filterPct));
  const { searchAvailable, searchLoading, searchError, purchase, purchaseLoading } = useVirtualNumbers();
  const [allRows, setAllRows] = useState<Row[]>([]);
  const [areaCode, setAreaCode] = useState("");
  const [manualState, setManualState] = useState("");
  const [filterDigits, setFilterDigits] = useState("");
  const [regionFilter, setRegionFilter] = useState<BayAreaRegionFilterKey>("all");
  const [confirmDid, setConfirmDid] = useState<{ did: string; monthly: string; setup: string } | null>(null);
  const [searchedOnce, setSearchedOnce] = useState(false);
  const [banner, setBanner] = useState<{ kind: "error" | "info"; text: string } | null>(null);
  const [purchaseErr, setPurchaseErr] = useState<string | null>(null);
  const [initialLoad, setInitialLoad] = useState(true);

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

  const busy = initialLoad || searchLoading;

  const npaSummary = useMemo(() => BAY_AREA_NPAS_ORDERED.join(" / "), []);

  /** 进入页面：加载湾区多区号可购号码 */
  useEffect(() => {
    let cancelled = false;
    (async () => {
      setInitialLoad(true);
      setBanner(null);
      try {
        const list = await fetchBayAreaAvailableNumbers();
        if (cancelled) return;
        setAllRows(mapList(list));
        setSearchedOnce(true);
        setBanner({
          kind: "info",
          text: `已加载旧金山湾区及邻近共 ${BAY_AREA_NPAS_ORDERED.length} 个区号（${npaSummary}）的可选号码，共 ${list.length} 条。请用「区域」与「号码片段」筛选；也可在下方按其他美国区号或整州补充搜索。`,
        });
      } catch (e) {
        if (!cancelled) setBanner({ kind: "error", text: errMsg(e) });
      } finally {
        if (!cancelled) setInitialLoad(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [mapList, npaSummary]);

  const filteredRows = useMemo(() => {
    const q = filterDigits.replace(/\D/g, "");
    return allRows.filter((row) => {
      if (!didMatchesRegionFilter(row.did, regionFilter)) return false;
      if (q) {
        const did = row.did.replace(/\D/g, "");
        if (!did.includes(q)) return false;
      }
      return true;
    });
  }, [allRows, filterDigits, regionFilter]);

  const reloadBayArea = async () => {
    setBanner(null);
    setInitialLoad(true);
    setAreaCode("");
    setManualState("");
    setFilterDigits("");
    setRegionFilter("all");
    try {
      const list = await fetchBayAreaAvailableNumbers();
      setAllRows(mapList(list));
      setSearchedOnce(true);
      setBanner({
        kind: "info",
        text: `已重新加载湾区号码，共 ${list.length} 条（区号：${npaSummary}）。`,
      });
    } catch (e) {
      setBanner({ kind: "error", text: errMsg(e) });
    } finally {
      setInitialLoad(false);
    }
  };

  const handleSearchAreaCode = async () => {
    const code = areaCode.replace(/\D/g, "");
    if (code.length !== 3) {
      setBanner({ kind: "error", text: "请输入 3 位区号。" });
      alertNative("提示", "请输入3位区号");
      return;
    }
    setBanner(null);
    setFilterDigits("");
    setRegionFilter("all");
    try {
      const list = await searchAvailable({ area_code: code });
      const mapped = mapList(list);
      setAllRows(mapped);
      setSearchedOnce(true);
      if (mapped.length === 0) {
        setBanner({
          kind: "info",
          text: `区号 ${code} 暂无返回号码。可点击「重新加载湾区」恢复湾区列表，或换区号。`,
        });
        alertNative("暂无号码", `区号 ${code} 暂无可用号码`);
      } else {
        setBanner({
          kind: "info",
          text: `区号 ${code}：共 ${mapped.length} 个号码。非湾区号段时「区域」筛选项可能无匹配，请用「全部」或号码片段筛选。`,
        });
      }
    } catch (e) {
      const m = errMsg(e);
      setBanner({ kind: "error", text: m });
      alertNative("搜索失败", m);
    }
  };

  const handleLoadState = async () => {
    const raw = manualState.trim().toUpperCase().replace(/[^A-Z]/g, "").slice(0, 2);
    if (raw.length !== 2) {
      setBanner({ kind: "error", text: "请输入 2 位州代码，如 CA、NY、TX。" });
      return;
    }
    setBanner(null);
    setAreaCode("");
    setFilterDigits("");
    setRegionFilter("all");
    try {
      const list = await searchAvailable({ state: raw });
      const mapped = mapList(list);
      setAllRows(mapped);
      setSearchedOnce(true);
      setBanner({
        kind: "info",
        text:
          mapped.length > 0
            ? `已加载 ${raw} 全州可选号码（最多约百条）。非湾区时建议用号码片段筛选；可点「重新加载湾区」回到湾区多区号列表。`
            : `${raw} 未返回号码，可换州或按区号搜索。`,
      });
    } catch (e) {
      const m = errMsg(e);
      setBanner({ kind: "error", text: m });
      alertNative("加载失败", m);
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
      <VoipHeader title="购买号码" fallbackRoute="/voip" />
      <VoipQuickNav />

      <ScrollView
        keyboardShouldPersistTaps="handled"
        nestedScrollEnabled
        style={{ maxHeight: filterPanelMaxH }}
        contentContainerStyle={{ paddingHorizontal: 12, paddingVertical: 8 }}
        showsVerticalScrollIndicator
      >
        <View className="flex-row items-center justify-between mb-2">
          <Text className="text-gray-400 text-xs flex-1 pr-2" numberOfLines={2}>
            默认展示湾区多城市区号库存；筛选仅影响当前列表显示。
          </Text>
          <Pressable
            onPress={reloadBayArea}
            disabled={busy}
            className="bg-slate-700 px-2.5 py-1.5 rounded-md active:opacity-80 shrink-0"
          >
            <Text className="text-white text-2xs font-medium">重新加载湾区</Text>
          </Pressable>
        </View>

        <Text className="text-gray-500 text-[10px] uppercase tracking-wide mb-1">区域（湾区城市带）</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} className="mb-2 -mx-1">
          <View className="flex-row flex-wrap gap-1.5 px-1 pb-1">
            {BAY_AREA_REGIONS.map((r) => {
              const active = regionFilter === r.key;
              return (
                <Pressable
                  key={r.key}
                  onPress={() => setRegionFilter(r.key)}
                  className={`px-3 py-1.5 rounded-full border ${active ? "bg-blue-600 border-blue-500" : "bg-gray-800 border-gray-600"}`}
                >
                  <Text className={`text-xs font-medium ${active ? "text-white" : "text-gray-300"}`}>{r.label}</Text>
                </Pressable>
              );
            })}
          </View>
        </ScrollView>

        <Text className="text-gray-500 text-[10px] uppercase tracking-wide mb-0.5">筛选号码</Text>
        <TextInput
          value={filterDigits}
          onChangeText={setFilterDigits}
          placeholder="数字片段，如 415、650、后四位"
          placeholderTextColor="#6B7280"
          keyboardType="number-pad"
          className="bg-gray-800 text-white rounded-md px-2 py-1.5 mb-2 text-sm font-mono"
        />

        <Text className="text-gray-500 text-[10px] uppercase tracking-wide mb-0.5">其他美国区号 / 州</Text>
        <View className="flex-row gap-1.5 items-center mb-1.5 flex-wrap">
          <Text className="text-gray-500 text-[10px] w-7">州</Text>
          <TextInput
            value={manualState}
            onChangeText={(t) => setManualState(t.toUpperCase().replace(/[^A-Z]/g, "").slice(0, 2))}
            placeholder="CA"
            placeholderTextColor="#6B7280"
            maxLength={2}
            autoCapitalize="characters"
            className="w-11 bg-gray-800 text-white rounded-md px-1.5 py-1.5 text-center text-sm font-mono"
          />
          <Pressable
            onPress={handleLoadState}
            disabled={busy}
            className="bg-gray-700 px-2.5 py-1.5 rounded-md justify-center active:opacity-80"
          >
            <Text className="text-white text-xs font-medium">加载州</Text>
          </Pressable>
          <View className="w-2" />
          <Text className="text-gray-500 text-[10px]">区号</Text>
          <TextInput
            value={areaCode}
            onChangeText={(t) => setAreaCode(t.replace(/\D/g, "").slice(0, 3))}
            placeholder="650"
            placeholderTextColor="#6B7280"
            keyboardType="number-pad"
            maxLength={3}
            className="w-12 bg-gray-800 text-white rounded-md px-1 py-1.5 text-center text-sm font-mono"
          />
          <Pressable
            onPress={handleSearchAreaCode}
            disabled={busy}
            className="bg-blue-600 px-3 py-1.5 rounded-md justify-center active:opacity-80"
          >
            {searchLoading && !initialLoad ? (
              <ActivityIndicator size="small" color="white" />
            ) : (
              <Text className="text-white text-xs font-medium">搜索</Text>
            )}
          </Pressable>
        </View>

        {searchError != null && (
          <Text className="text-red-400 text-xs mb-1" numberOfLines={2}>
            {errMsg(searchError)}
          </Text>
        )}
        {banner != null && <VoipFeedbackBanner kind={banner.kind} text={banner.text} compact />}
      </ScrollView>

      <View className="flex-1 px-3 pt-1 border-t border-gray-800" style={{ minHeight: 0 }}>
        <Text className="text-gray-500 text-xs mb-1">
          显示 {filteredRows.length} / {allRows.length} 条
          {regionFilter !== "all" ? ` · 区域：${BAY_AREA_REGIONS.find((x) => x.key === regionFilter)?.label}` : ""}
        </Text>
        {busy && allRows.length === 0 ? (
          <View className="flex-1 justify-center items-center py-16">
            <ActivityIndicator size="large" color="#3B82F6" />
            <Text className="text-gray-500 mt-4">正在加载湾区各城市号码…</Text>
          </View>
        ) : filteredRows.length > 0 ? (
          <FlatList
            data={filteredRows}
            keyExtractor={(item) => item.did}
            style={{ flex: 1 }}
            contentContainerClassName="pb-20 gap-2"
            renderItem={({ item }) => (
              <NumberCard
                did={item.did}
                monthly={item.monthly}
                status="available"
                subtitle={formatDidRegionLabel(item.did, item.ratecenter)}
                actionLabel="购买"
                onAction={() => handlePurchase(item.did, item.monthly, item.setup)}
              />
            )}
          />
        ) : (
          <View className="flex-1 justify-center items-center py-12 px-4">
            <Text className="text-gray-500 text-center">
              {searchedOnce && allRows.length > 0
                ? "当前筛选下没有号码。可切换「区域」或清空号码片段，或点「重新加载湾区」。"
                : searchedOnce
                  ? "暂无号码。请稍后再试或联系支持。"
                  : "正在准备…"}
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
