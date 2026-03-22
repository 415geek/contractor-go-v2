import { Ionicons } from "@expo/vector-icons";
import * as Linking from "expo-linking";
import { useCallback, useEffect, useState } from "react";
import {
  View,
  Text,
  ScrollView,
  TextInput,
  Pressable,
  ActivityIndicator,
  Modal,
  Platform,
  StyleSheet,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { SfPimEmbeddedMap } from "@/components/tools/SfPimEmbeddedMap";
import { ToolScreenHeader, useToolScrollBottomPadding } from "@/components/tools/ToolScreenChrome";
import { PermitTimeline } from "@/components/tools/PermitTimeline";
import { usePermitSearch } from "@/hooks/usePermitSearch";
import {
  SF_PIM_ATTRIBUTION,
  SF_PIM_BASE_URL,
  SF_PIM_HELP_URL,
  buildSfPimSearchUrl,
} from "@/lib/sf-pim";

type Mode = "pim" | "summary";

const MODE_LABEL: Record<Mode, string> = {
  pim: "规划地图",
  summary: "许可摘要",
};

const PIM_SEARCH_DEBOUNCE_MS = 550;

export default function PropertyInfoScreen() {
  const scrollPad = useToolScrollBottomPadding();
  const { searchPermit, isSearching, result, error, supportedCities } = usePermitSearch();
  const [mode, setMode] = useState<Mode>("pim");
  const [address, setAddress] = useState("");
  const [pimUri, setPimUri] = useState(SF_PIM_BASE_URL);
  /** 全屏地图：Modal 盖住底部 Tab，可视高度接近整屏 */
  const [mapFullscreen, setMapFullscreen] = useState(false);

  useEffect(() => {
    if (mode !== "pim") return;
    const id = setTimeout(() => {
      setPimUri(buildSfPimSearchUrl(address));
    }, PIM_SEARCH_DEBOUNCE_MS);
    return () => clearTimeout(id);
  }, [address, mode]);

  const openPimInBrowser = useCallback(() => {
    void Linking.openURL(buildSfPimSearchUrl(address));
  }, [address]);

  const openHelp = useCallback(() => {
    void Linking.openURL(SF_PIM_HELP_URL);
  }, []);

  const handleSummarySearch = async () => {
    if (!address.trim()) return;
    try {
      await searchPermit(address);
    } catch {
      // error in hook state
    }
  };

  useEffect(() => {
    if (mode !== "pim") setMapFullscreen(false);
  }, [mode]);

  return (
    <View className="flex-1 bg-surface-app">
      <ToolScreenHeader title="物业信息 · SF" />

      <View className="border-b border-surface-border/60 bg-surface-app px-3 pb-2 pt-1">
        {!mapFullscreen && (
          <Text className="mb-1.5 px-0.5 text-[11px] leading-4 text-ink-tertiary" numberOfLines={2}>
            与规划局 PIM 同源；输入后地图自动更新。若内嵌区域仍嫌小，请点「全屏地图」或右侧外链。
          </Text>
        )}

        <View className="mb-2 flex-row rounded-xl bg-surface-elevated p-1">
          {(["pim", "summary"] as Mode[]).map((m) => {
            const active = mode === m;
            return (
              <Pressable
                key={m}
                onPress={() => setMode(m)}
                className={`flex-1 rounded-lg py-2 ${active ? "bg-surface-highlight" : ""}`}
                accessibilityRole="tab"
                accessibilityState={{ selected: active }}
              >
                <Text
                  className={`text-center text-[13px] font-semibold ${active ? "text-white" : "text-ink-tertiary"}`}
                  numberOfLines={1}
                >
                  {MODE_LABEL[m]}
                </Text>
              </Pressable>
            );
          })}
        </View>

        <View className="flex-row items-stretch gap-2">
          <TextInput
            value={address}
            onChangeText={setAddress}
            placeholder={mode === "pim" ? "地址、地块、案号或许可号…" : "用于摘要检索的地址或关键字…"}
            placeholderTextColor="#64748b"
            className="min-h-[44px] flex-1 rounded-xl border border-surface-border bg-surface-card px-3 py-2.5 text-[15px] text-white"
            autoCapitalize="none"
            autoCorrect={false}
          />
          {mode === "pim" ? (
            <Pressable
              onPress={openPimInBrowser}
              accessibilityLabel="在系统浏览器中打开规划局地图"
              hitSlop={{ top: 8, bottom: 8, left: 4, right: 4 }}
              className="w-11 items-center justify-center rounded-xl border border-primary-500/35 bg-primary-500/15 active:opacity-80"
            >
              <Ionicons name="open-outline" size={18} color="#00a3bf" />
            </Pressable>
          ) : null}
        </View>
        <Text className="mt-1 px-0.5 text-2xs leading-4 text-ink-tertiary" numberOfLines={1}>
          示例：400 Van Ness Ave · 0787/001
        </Text>

        {mode === "pim" && !mapFullscreen ? (
          <Pressable
            onPress={() => setMapFullscreen(true)}
            className="mt-2 flex-row items-center justify-center gap-2 rounded-xl border border-electric-500/40 bg-electric-500/10 py-2.5 active:opacity-90"
          >
            <Ionicons name="expand" size={18} color="#1e90ff" />
            <Text className="text-[14px] font-semibold text-electric-400">全屏地图（推荐）</Text>
          </Pressable>
        ) : null}

        {mode === "summary" ? (
          <Pressable
            onPress={handleSummarySearch}
            disabled={isSearching || !address.trim()}
            className="mt-3 rounded-xl bg-violet-600 py-3 disabled:opacity-45"
          >
            {isSearching ? (
              <ActivityIndicator color="white" />
            ) : (
              <Text className="text-center text-[15px] font-semibold text-white">拉取开放数据并生成摘要</Text>
            )}
          </Pressable>
        ) : null}
      </View>

      {mode === "pim" && !mapFullscreen ? (
        <View className="min-h-0 flex-1">
          <View className="min-h-0 flex-1 overflow-hidden rounded-b-2xl border-x border-b border-surface-border/80 bg-slate-950">
            <View style={styles.mapFill}>
              <SfPimEmbeddedMap uri={pimUri} />
            </View>
          </View>
          <View className="gap-1 px-3 pb-2 pt-1.5">
            <Text className="text-center text-2xs leading-4 text-ink-tertiary">{SF_PIM_ATTRIBUTION}</Text>
            <View className="flex-row flex-wrap items-center justify-center gap-x-4 gap-y-1">
              <Pressable onPress={openHelp} hitSlop={6} className="active:opacity-70">
                <Text className="text-2xs font-medium text-electric-400">官方说明与数据集</Text>
              </Pressable>
              <Pressable onPress={() => void Linking.openURL("https://data.sfgov.org/")} hitSlop={6}>
                <Text className="text-2xs font-medium text-ink-tertiary">DataSF</Text>
              </Pressable>
            </View>
          </View>
        </View>
      ) : mode === "summary" ? (
        <ScrollView
          className="flex-1"
          keyboardShouldPersistTaps="handled"
          contentContainerStyle={{ paddingHorizontal: 16, paddingTop: 16, paddingBottom: scrollPad }}
        >
          <View className="mb-4 rounded-xl border border-surface-border bg-surface-card/80 p-3">
            <Text className="text-xs leading-5 text-ink-tertiary">
              摘要通过云端 <Text className="text-ink-secondary">search-permit</Text> 调用 DataSF 等开放 API。
            </Text>
          </View>

          {error && (
            <View className="mb-4 rounded-xl bg-red-900/20 p-4">
              <Text className="text-red-400">{error.message}</Text>
              <View className="mt-2">
                <Text className="text-sm text-ink-secondary">支持城市: {supportedCities.join(", ")}</Text>
              </View>
            </View>
          )}

          {result && (
            <>
              <View className="mb-4 rounded-xl border border-surface-border bg-surface-card p-4">
                <Text className="text-sm font-medium text-ink-secondary">地址确认</Text>
                <Text className="mt-1 text-base font-medium text-white">{result.address}</Text>
                {result.city ? <Text className="mt-0.5 text-sm text-ink-secondary">{result.city}</Text> : null}
              </View>
              {result.property_info && Object.keys(result.property_info).length > 0 && (
                <View className="mb-4 rounded-xl border border-surface-border bg-surface-card p-4">
                  <Text className="mb-2 text-sm font-medium text-ink-secondary">房屋信息（开放数据推断）</Text>
                  <View className="gap-1">
                    {result.property_info.lot_size_sqft != null && (
                      <Text className="text-slate-300">占地: {result.property_info.lot_size_sqft} sqft</Text>
                    )}
                    {result.property_info.year_built != null && (
                      <Text className="text-slate-300">建成年份: {result.property_info.year_built}</Text>
                    )}
                    {result.property_info.zoning && (
                      <Text className="text-slate-300">Zoning: {result.property_info.zoning}</Text>
                    )}
                    {result.property_info.bedrooms != null && (
                      <Text className="text-slate-300">卧室: {result.property_info.bedrooms}</Text>
                    )}
                    {result.property_info.bathrooms != null && (
                      <Text className="text-slate-300">浴室: {result.property_info.bathrooms}</Text>
                    )}
                  </View>
                </View>
              )}
              <View className="mb-4 rounded-xl border border-surface-border bg-surface-card p-4">
                <Text className="mb-3 text-sm font-medium text-ink-secondary">许可记录</Text>
                <PermitTimeline permits={result.permit_history} />
              </View>
              {result.key_insights && result.key_insights.length > 0 && (
                <View className="rounded-xl border border-surface-border bg-surface-card p-4">
                  <Text className="mb-2 text-sm font-medium text-ink-secondary">关键洞察</Text>
                  {result.key_insights.map((insight, i) => (
                    <Text key={i} className="text-slate-300">
                      • {insight}
                    </Text>
                  ))}
                </View>
              )}
            </>
          )}
        </ScrollView>
      ) : null}

      {/* 全屏：盖住底部 Tab，地图独占可视区 */}
      <Modal
        visible={mapFullscreen}
        animationType="slide"
        presentationStyle="fullScreen"
        statusBarTranslucent={Platform.OS === "android"}
        onRequestClose={() => setMapFullscreen(false)}
      >
        <SafeAreaView style={styles.fullscreenRoot} edges={["top", "bottom", "left", "right"]}>
          <View style={styles.fullscreenTopBar}>
            <Pressable
              onPress={() => setMapFullscreen(false)}
              hitSlop={12}
              style={styles.iconBtn}
              accessibilityLabel="退出全屏"
            >
              <Ionicons name="close" size={26} color="#fff" />
            </Pressable>
            <Text style={styles.fullscreenTitle} numberOfLines={1}>
              PIM 地图
            </Text>
            <Pressable onPress={openPimInBrowser} hitSlop={12} style={styles.iconBtn} accessibilityLabel="浏览器打开">
              <Ionicons name="open-outline" size={22} color="#00a3bf" />
            </Pressable>
          </View>
          <Text style={styles.addressHint} numberOfLines={2}>
            {address.trim() || "（输入地址后自动同步）"}
          </Text>
          <View style={styles.fullscreenMap}>
            <SfPimEmbeddedMap uri={pimUri} />
          </View>
          <View style={styles.fullscreenFooter}>
            <Text style={styles.footerTiny}>{SF_PIM_ATTRIBUTION}</Text>
          </View>
        </SafeAreaView>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  mapFill: {
    flex: 1,
    minHeight: 200,
  },
  fullscreenRoot: {
    flex: 1,
    backgroundColor: "#050a1b",
  },
  fullscreenTopBar: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 8,
    paddingVertical: 6,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: "rgba(255,255,255,0.12)",
  },
  iconBtn: {
    padding: 8,
  },
  fullscreenTitle: {
    flex: 1,
    textAlign: "center",
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
  },
  addressHint: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    color: "#8e9aaf",
    fontSize: 12,
  },
  fullscreenMap: {
    flex: 1,
    minHeight: 120,
  },
  fullscreenFooter: {
    paddingHorizontal: 10,
    paddingBottom: 10,
    paddingTop: 4,
  },
  footerTiny: {
    color: "#64748b",
    fontSize: 9,
    lineHeight: 13,
    textAlign: "center",
  },
});
