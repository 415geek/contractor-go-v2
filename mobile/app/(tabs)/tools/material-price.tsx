import { Ionicons } from "@expo/vector-icons";
import { useState } from "react";
import {
  View,
  Text,
  ScrollView,
  TextInput,
  Pressable,
  ActivityIndicator,
  Image,
} from "react-native";

import { useAuth, useUser } from "@clerk/clerk-expo";

import { alertCrossPlatform } from "@/lib/alert-cross-platform";
import { ToolScreenHeader, useToolScrollBottomPadding } from "@/components/tools/ToolScreenChrome";
import { MaterialResultCard } from "@/components/tools/MaterialResultCard";
import { useMaterialSearch } from "@/hooks/useMaterialSearch";
import type { MaterialClarificationOption } from "@/lib/nova-act-search";
import { isLocalImageUri, pickImageAsset, uploadPickedImage } from "@/lib/tool-image-pick";

const MAX_IMAGES = 5;

export default function MaterialPriceScreen() {
  const scrollPad = useToolScrollBottomPadding();
  const { user } = useUser();
  const { getToken } = useAuth();
  const { searchMaterial, isSearching, results, error, clearResults } = useMaterialSearch();
  const [imageUris, setImageUris] = useState<string[]>([]);
  const [description, setDescription] = useState("");
  const [customFocus, setCustomFocus] = useState("");
  const [uploadingCount, setUploadingCount] = useState(0);
  const isUploading = uploadingCount > 0;

  const readyUrls = imageUris.filter((u) => u.startsWith("http"));

  const handleSearch = async () => {
    if (readyUrls.length === 0 && !description.trim()) {
      alertCrossPlatform("提示", "请上传图片或输入描述");
      return;
    }
    if (isUploading || imageUris.some(isLocalImageUri)) {
      alertCrossPlatform("提示", "图片正在上传中，请稍候再搜索");
      return;
    }
    try {
      await searchMaterial(readyUrls, description.trim() || undefined);
    } catch (e) {
      alertCrossPlatform("搜索失败", e instanceof Error ? e.message : String(e));
    }
  };

  const runRefinedSearch = async (keywords: string[]) => {
    if (keywords.length === 0) return;
    try {
      await searchMaterial(readyUrls, description.trim() || undefined, keywords);
    } catch (e) {
      alertCrossPlatform("搜索失败", e instanceof Error ? e.message : String(e));
    }
  };

  const handlePickOption = (opt: MaterialClarificationOption) => {
    void runRefinedSearch(opt.search_keywords);
  };

  const handleCustomSearch = () => {
    const t = customFocus.trim();
    if (!t) {
      alertCrossPlatform("提示", "请输入自定义搜索词（建议英文商品名 + 规格）");
      return;
    }
    void runRefinedSearch([t]);
  };

  const handleWrongMaterial = () => {
    clearResults();
    setCustomFocus("");
  };

  const handleNewSearch = () => {
    clearResults();
    setImageUris([]);
    setDescription("");
    setCustomFocus("");
  };

  const handleAddImage = async () => {
    if (!user?.id) {
      alertCrossPlatform("提示", "请先登录后再上传图片");
      return;
    }
    const result = await pickImageAsset();
    if (result.canceled || !result.assets?.[0]?.uri) return;
    const asset = result.assets[0];
    const localUri = asset.uri;

    setImageUris((prev) => [...prev, localUri].slice(0, MAX_IMAGES));
    setUploadingCount((c) => c + 1);
    try {
      const { publicUrl } = await uploadPickedImage(getToken, localUri, asset, "material");
      setImageUris((prev) => prev.map((u) => (u === localUri ? publicUrl : u)));
    } catch (e) {
      setImageUris((prev) => prev.filter((u) => u !== localUri));
      const msg = e instanceof Error ? e.message : String(e);
      alertCrossPlatform("上传失败", msg || "请检查网络后重试");
    } finally {
      setUploadingCount((c) => Math.max(0, c - 1));
    }
  };

  const consensusZh =
    results?.ai_recognized && typeof results.ai_recognized.expert_consensus_zh === "string"
      ? results.ai_recognized.expert_consensus_zh
      : "";

  const showClarification = results?.needs_clarification === true;

  return (
    <View className="flex-1 bg-slate-950">
      <ToolScreenHeader title="材料比价" />
      <ScrollView
        className="flex-1"
        keyboardShouldPersistTaps="handled"
        contentContainerStyle={{ paddingHorizontal: 16, paddingTop: 24, paddingBottom: scrollPad }}
      >
        <Text className="mb-3 text-xs leading-5 text-slate-500">
          上传照片并描述需求后，将由大模型综合「北美建材技术专家、Home Depot / Lowe's
          采购视角、本地建材门店采购」分析；若图中有多类材料或不确定，会先让您点选要比价的一项或自定义关键词，再查价。
        </Text>

        <View className="mb-4">
          <Text className="mb-2 text-sm font-medium text-slate-400">上传图片（最多 {MAX_IMAGES} 张）</Text>
          <View className="flex-row flex-wrap gap-2">
            {imageUris.slice(0, MAX_IMAGES).map((uri, i) => (
              <View key={`${uri}-${i}`} className="h-20 w-20 overflow-hidden rounded-lg bg-slate-800">
                <Image source={{ uri }} style={{ width: "100%", height: "100%" }} resizeMode="cover" />
                {isLocalImageUri(uri) ? (
                  <View className="absolute inset-0 items-center justify-center bg-black/35">
                    <ActivityIndicator color="#fff" />
                  </View>
                ) : null}
              </View>
            ))}
            {imageUris.length < MAX_IMAGES && (
              <Pressable
                onPress={() => {
                  void handleAddImage();
                }}
                className="h-20 w-20 items-center justify-center rounded-lg border border-dashed border-slate-600 bg-slate-800/50 active:opacity-80"
              >
                <Ionicons name="add" size={32} color="#64748B" />
              </Pressable>
            )}
          </View>
        </View>
        <View className="mb-4">
          <Text className="mb-1.5 text-sm font-medium text-slate-400">描述（可选但建议填写）</Text>
          <TextInput
            value={description}
            onChangeText={setDescription}
            placeholder="品牌、规格、用途，例如：车库地坪用水泥、2x4 松木龙骨…"
            placeholderTextColor="#64748B"
            multiline
            className="min-h-[88px] rounded-xl border border-slate-700 bg-slate-800/80 px-4 py-3 text-white"
          />
        </View>
        <Pressable
          onPress={() => void handleSearch()}
          disabled={isSearching || isUploading}
          className="mb-6 rounded-xl bg-blue-600 py-3.5 disabled:opacity-50"
        >
          {isSearching ? (
            <ActivityIndicator color="white" />
          ) : (
            <Text className="text-center font-semibold text-white">智能分析并比价</Text>
          )}
        </Pressable>

        {error && (
          <View className="mb-4 rounded-xl bg-red-900/20 p-4">
            <Text className="text-red-400">{error.message}</Text>
            <Pressable onPress={handleWrongMaterial} className="mt-3 rounded-lg bg-slate-700 py-2">
              <Text className="text-center text-slate-200">清除后重试</Text>
            </Pressable>
          </View>
        )}

        {results && (
          <>
            {consensusZh ? (
              <View className="mb-4 rounded-xl border border-slate-600 bg-slate-900/90 p-4">
                <Text className="mb-1 text-xs font-medium uppercase tracking-wide text-emerald-400/90">
                  多角色分析摘要
                </Text>
                <Text className="text-[15px] leading-[22px] text-slate-200">{consensusZh}</Text>
              </View>
            ) : null}

            {showClarification ? (
              <View className="mb-6 rounded-xl border border-amber-500/40 bg-amber-950/30 p-4">
                <Text className="mb-2 text-base font-semibold text-amber-100">需要您确认要比价的内容</Text>
                <Text className="mb-4 text-[15px] leading-[22px] text-amber-100/85">
                  {results.clarification_question_zh || "请选择一项或输入自定义搜索词。"}
                </Text>
                <View className="gap-2">
                  {results.clarification_options.map((opt) => (
                    <Pressable
                      key={opt.id}
                      onPress={() => handlePickOption(opt)}
                      disabled={isSearching}
                      className="rounded-xl border border-slate-600 bg-slate-800/90 px-4 py-3.5 active:bg-slate-700 disabled:opacity-50"
                    >
                      <Text className="text-[16px] font-medium text-white">{opt.label_zh}</Text>
                    </Pressable>
                  ))}
                </View>
                {results.allow_custom_focus ? (
                  <View className="mt-4">
                    <Text className="mb-2 text-sm text-slate-400">自定义搜索（建议英文 + 规格，如 Quikrete 5000 80 lb）</Text>
                    <TextInput
                      value={customFocus}
                      onChangeText={setCustomFocus}
                      placeholder="输入后点击下方按钮比价"
                      placeholderTextColor="#64748B"
                      className="mb-3 rounded-xl border border-slate-600 bg-slate-900 px-4 py-3 text-white"
                    />
                    <Pressable
                      onPress={handleCustomSearch}
                      disabled={isSearching}
                      className="rounded-xl border border-blue-500/50 bg-blue-900/40 py-3 disabled:opacity-50"
                    >
                      <Text className="text-center font-semibold text-blue-200">使用自定义关键词比价</Text>
                    </Pressable>
                  </View>
                ) : null}
                <Pressable onPress={handleWrongMaterial} className="mt-4 py-2">
                  <Text className="text-center text-sm text-slate-500">取消并重新上传/描述</Text>
                </Pressable>
              </View>
            ) : null}

            {!showClarification && Object.keys(results.ai_recognized).length > 0 ? (
              <View className="mb-4 rounded-xl border border-slate-700 bg-slate-800/80 p-4">
                <Text className="mb-2 text-sm font-medium text-slate-400">识别要点</Text>
                <Text className="text-white">
                  {String(results.ai_recognized.material_name ?? results.ai_recognized.material_name_en ?? "—")}
                </Text>
              </View>
            ) : null}

            {!showClarification ? (
              <>
                <View className="mb-4">
                  <Text className="mb-2 text-sm font-medium text-green-400">有现货</Text>
                  <View className="gap-3">
                    {results.in_stock.length === 0 ? (
                      <Text className="text-slate-500">暂无</Text>
                    ) : (
                      results.in_stock.map((item, i) => <MaterialResultCard key={`in-${i}`} item={item} />)
                    )}
                  </View>
                </View>
                <View className="mb-4">
                  <Text className="mb-2 text-sm font-medium text-red-400">无现货</Text>
                  <View className="gap-3">
                    {results.out_of_stock.length === 0 ? (
                      <Text className="text-slate-500">暂无</Text>
                    ) : (
                      results.out_of_stock.map((item, i) => <MaterialResultCard key={`out-${i}`} item={item} />)
                    )}
                  </View>
                </View>
                <View className="mb-2">
                  <Text className="mb-2 text-sm font-medium text-slate-400">库存不详</Text>
                  <View className="gap-3">
                    {results.unknown_stock.length === 0 ? (
                      <Text className="text-slate-500">暂无</Text>
                    ) : (
                      results.unknown_stock.map((item, i) => <MaterialResultCard key={`unk-${i}`} item={item} />)
                    )}
                  </View>
                </View>

                <View className="mt-6 flex-row gap-3">
                  <Pressable
                    onPress={handleWrongMaterial}
                    className="flex-1 rounded-xl border border-slate-500 bg-slate-800 py-3.5 active:opacity-80"
                  >
                    <Text className="text-center text-[15px] font-semibold text-slate-200">材料不对，重新搜索</Text>
                  </Pressable>
                  <Pressable
                    onPress={handleNewSearch}
                    className="flex-1 rounded-xl bg-emerald-600 py-3.5 active:opacity-90"
                  >
                    <Text className="text-center text-[15px] font-semibold text-white">新搜索</Text>
                  </Pressable>
                </View>
              </>
            ) : null}
          </>
        )}
      </ScrollView>
    </View>
  );
}
