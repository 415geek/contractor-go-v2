import { Ionicons } from "@expo/vector-icons";
import * as Linking from "expo-linking";
import { useCallback, useState } from "react";
import {
  View,
  Text,
  ScrollView,
  TextInput,
  Pressable,
  ActivityIndicator,
} from "react-native";

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
  pim: "规划地图（PIM）",
  summary: "许可 AI 摘要",
};

export default function PropertyInfoScreen() {
  const scrollPad = useToolScrollBottomPadding();
  const { searchPermit, isSearching, result, error, supportedCities } = usePermitSearch();
  const [mode, setMode] = useState<Mode>("pim");
  const [address, setAddress] = useState("");
  const [pimUri, setPimUri] = useState(SF_PIM_BASE_URL);

  const openPimSearch = useCallback(() => {
    setPimUri(buildSfPimSearchUrl(address));
  }, [address]);

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

  return (
    <View className="flex-1 bg-slate-950">
      <ToolScreenHeader title="物业信息 · SF" />

      <View className="border-b border-slate-800/80 px-4 pb-3 pt-2">
        <Text className="mb-2 text-xs leading-5 text-slate-500">
          与旧金山规划局{" "}
          <Text className="font-semibold text-slate-400">Property Information Map</Text>{" "}
          相同的数据与查询方式；地图为官方页面内嵌，摘要来自本市开放数据 + AI 整理。
        </Text>

        {/* 模式切换 — Apple 风格分段 */}
        <View className="mb-3 flex-row rounded-xl bg-slate-900 p-1">
          {(["pim", "summary"] as Mode[]).map((m) => {
            const active = mode === m;
            return (
              <Pressable
                key={m}
                onPress={() => setMode(m)}
                className={`flex-1 rounded-lg py-2.5 ${active ? "bg-slate-700 shadow-sm" : ""}`}
                accessibilityRole="tab"
                accessibilityState={{ selected: active }}
              >
                <Text
                  className={`text-center text-sm font-semibold ${active ? "text-white" : "text-slate-500"}`}
                  numberOfLines={1}
                >
                  {MODE_LABEL[m]}
                </Text>
              </Pressable>
            );
          })}
        </View>

        <Text className="mb-1.5 text-sm font-medium text-slate-400">查询</Text>
        <TextInput
          value={address}
          onChangeText={setAddress}
          placeholder="地址、地块号、规划案号或许可号（与 PIM 一致）"
          placeholderTextColor="#64748B"
          className="rounded-xl border border-slate-700 bg-slate-800/80 px-4 py-3 text-white"
        />
        <Text className="mt-1.5 text-2xs text-slate-600">
          示例：400 Van Ness Ave · 0787/001 · 2014-000362PRJ · 建筑许可编号等 — 详见官方帮助页。
        </Text>

        <View className="mt-3 flex-col gap-2">
          {mode === "pim" ? (
            <>
              <Text className="text-2xs text-slate-600">
                官方地图站点较大，在 App 内可能较慢；优先使用浏览器可获得完整体验。
              </Text>
              <Pressable
                onPress={openPimInBrowser}
                className="flex-row items-center justify-center gap-2 rounded-xl bg-cyan-600 py-3.5 active:bg-cyan-700"
              >
                <Ionicons name="open-outline" size={20} color="#fff" />
                <Text className="font-semibold text-white">浏览器打开地图（推荐）</Text>
              </Pressable>
              <Pressable
                onPress={openPimSearch}
                className="flex-row items-center justify-center gap-2 rounded-xl border border-slate-600 bg-slate-800 py-3.5 active:bg-slate-700"
              >
                <Ionicons name="phone-portrait-outline" size={18} color="#94A3B8" />
                <Text className="font-semibold text-slate-200">应用内刷新地图</Text>
              </Pressable>
            </>
          ) : (
            <Pressable
              onPress={handleSummarySearch}
              disabled={isSearching || !address.trim()}
              className="flex-1 rounded-xl bg-violet-600 py-3.5 disabled:opacity-50"
            >
              {isSearching ? (
                <ActivityIndicator color="white" />
              ) : (
                <Text className="text-center font-semibold text-white">拉取开放数据并生成摘要</Text>
              )}
            </Pressable>
          )}
        </View>
      </View>

      {mode === "pim" ? (
        <View className="min-h-0 flex-1 px-4 pb-2 pt-2">
          <View className="min-h-0 flex-1 overflow-hidden rounded-2xl border border-slate-700/90 bg-slate-900 shadow-lg shadow-black/40">
            <SfPimEmbeddedMap uri={pimUri} />
          </View>
          <View className="gap-2 py-3">
            <Text className="text-center text-2xs leading-5 text-slate-600">{SF_PIM_ATTRIBUTION}</Text>
            <View className="flex-row flex-wrap items-center justify-center gap-3">
              <Pressable onPress={openHelp} hitSlop={6} className="active:opacity-70">
                <Text className="text-2xs font-semibold text-blue-400">官方使用说明与数据集列表</Text>
              </Pressable>
              <Pressable onPress={() => void Linking.openURL("https://data.sfgov.org/")} hitSlop={6}>
                <Text className="text-2xs font-semibold text-slate-500">DataSF 门户</Text>
              </Pressable>
            </View>
          </View>
        </View>
      ) : (
        <ScrollView
          className="flex-1"
          keyboardShouldPersistTaps="handled"
          contentContainerStyle={{ paddingHorizontal: 16, paddingTop: 16, paddingBottom: scrollPad }}
        >
          <View className="mb-4 rounded-xl border border-slate-800 bg-slate-900/60 p-3">
            <Text className="text-xs leading-5 text-slate-500">
              摘要模式通过云端 <Text className="text-slate-400">search-permit</Text>{" "}
              调用市政府公开 API（如 SF DataSF 建筑许可），与{" "}
              <Text className="text-slate-400">Nova Act</Text>{" "}
              无关——后者在本应用中用于材料比价爬虫。后续可在 Edge 层继续接入更多 DataSF 图层。
            </Text>
          </View>

          {error && (
            <View className="mb-4 rounded-xl bg-red-900/20 p-4">
              <Text className="text-red-400">{error.message}</Text>
              <View className="mt-2">
                <Text className="text-sm text-slate-400">支持城市: {supportedCities.join(", ")}</Text>
              </View>
            </View>
          )}

          {result && (
            <>
              <View className="mb-4 rounded-xl border border-slate-700 bg-slate-800/80 p-4">
                <Text className="text-sm font-medium text-slate-400">地址确认</Text>
                <Text className="mt-1 text-base font-medium text-white">{result.address}</Text>
                {result.city ? <Text className="mt-0.5 text-sm text-slate-400">{result.city}</Text> : null}
              </View>
              {result.property_info && Object.keys(result.property_info).length > 0 && (
                <View className="mb-4 rounded-xl border border-slate-700 bg-slate-800/80 p-4">
                  <Text className="mb-2 text-sm font-medium text-slate-400">房屋信息（开放数据推断）</Text>
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
              <View className="mb-4 rounded-xl border border-slate-700 bg-slate-800/80 p-4">
                <Text className="mb-3 text-sm font-medium text-slate-400">许可记录</Text>
                <PermitTimeline permits={result.permit_history} />
              </View>
              {result.key_insights && result.key_insights.length > 0 && (
                <View className="rounded-xl border border-slate-700 bg-slate-800/80 p-4">
                  <Text className="mb-2 text-sm font-medium text-slate-400">关键洞察</Text>
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
      )}
    </View>
  );
}
