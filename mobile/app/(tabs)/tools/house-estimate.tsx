import { Ionicons } from "@expo/vector-icons";
import { useState } from "react";
import { View, Text, ScrollView, Pressable, ActivityIndicator, Image } from "react-native";

import { useAuth, useUser } from "@clerk/clerk-expo";

import { alertCrossPlatform } from "@/lib/alert-cross-platform";
import { ToolScreenHeader, useToolScrollBottomPadding } from "@/components/tools/ToolScreenChrome";
import { EstimateSegment } from "@/components/tools/EstimateSegment";
import { useHouseEstimate } from "@/hooks/useHouseEstimate";
import { isLocalImageUri, pickImageAsset, uploadPickedImage } from "@/lib/tool-image-pick";

export default function HouseEstimateScreen() {
  const scrollPad = useToolScrollBottomPadding();
  const { user } = useUser();
  const { getToken } = useAuth();
  const { estimateHouse, isEstimating, result, error } = useHouseEstimate();
  const [imageUrls, setImageUrls] = useState<string[]>([]);
  const [uploadingCount, setUploadingCount] = useState(0);
  const isUploading = uploadingCount > 0;

  const readyHttpsUrls = () => imageUrls.filter((u) => u.startsWith("http"));

  const handleAddImage = async () => {
    if (!user?.id) {
      alertCrossPlatform("提示", "请先登录后再上传图片");
      return;
    }
    const result = await pickImageAsset();
    if (result.canceled || !result.assets?.[0]?.uri) return;
    const asset = result.assets[0];
    const localUri = asset.uri;

    setImageUrls((prev) => [...prev, localUri].slice(0, 5));
    setUploadingCount((c) => c + 1);
    try {
      const { publicUrl } = await uploadPickedImage(getToken, localUri, asset, "estimate");
      setImageUrls((prev) => prev.map((u) => (u === localUri ? publicUrl : u)));
    } catch (e) {
      setImageUrls((prev) => prev.filter((u) => u !== localUri));
      const msg = e instanceof Error ? e.message : String(e);
      alertCrossPlatform("上传失败", msg || "请检查网络后重试");
    } finally {
      setUploadingCount((c) => Math.max(0, c - 1));
    }
  };

  const handleAnalyze = async () => {
    const urls = readyHttpsUrls();
    if (urls.length === 0) {
      if (imageUrls.some(isLocalImageUri)) {
        alertCrossPlatform("提示", "图片正在上传中，请稍候再分析");
        return;
      }
      alertCrossPlatform("提示", "请先上传装修照片");
      return;
    }
    try {
      await estimateHouse(urls);
    } catch (e) {
      alertCrossPlatform("分析失败", e instanceof Error ? e.message : String(e));
    }
  };

  const segments = (result?.segments ?? []) as {
    id: string;
    material_type?: string;
    material_name?: string;
    quantity?: { value: number; unit: string };
    price_per_unit?: { min: number; max: number };
    total_price?: { min: number; max: number };
  }[];
  const total = result?.total_estimate as
    | { materials_only?: { min: number; max: number }; with_labor?: { min: number; max: number } }
    | undefined;

  const canAnalyze =
    readyHttpsUrls().length > 0 && !isEstimating && !isUploading && !imageUrls.some(isLocalImageUri);

  return (
    <View className="flex-1 bg-slate-950">
      <ToolScreenHeader title="房屋估价" />
      <ScrollView
        className="flex-1"
        keyboardShouldPersistTaps="handled"
        contentContainerStyle={{ paddingHorizontal: 16, paddingTop: 24, paddingBottom: scrollPad }}
      >
        <View className="mb-4">
          <Text className="mb-2 text-sm font-medium text-slate-400">上传装修照片</Text>
          <View className="flex-row flex-wrap gap-2">
            {imageUrls.map((uri, i) => (
              <View key={`${uri}-${i}`} className="h-20 w-20 overflow-hidden rounded-lg bg-slate-800">
                <Image
                  source={{ uri }}
                  style={{ width: "100%", height: "100%" }}
                  resizeMode="cover"
                />
                {isLocalImageUri(uri) ? (
                  <View className="absolute inset-0 items-center justify-center bg-black/35">
                    <ActivityIndicator color="#fff" />
                  </View>
                ) : null}
              </View>
            ))}
            {imageUrls.length < 5 && (
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
        <Pressable
          onPress={() => void handleAnalyze()}
          disabled={!canAnalyze}
          className="mb-6 rounded-xl bg-blue-600 py-3.5 disabled:opacity-50"
        >
          {isEstimating ? (
            <ActivityIndicator color="white" />
          ) : (
            <Text className="text-center font-semibold text-white">分析估价</Text>
          )}
        </Pressable>

        {error && (
          <View className="mb-4 rounded-xl bg-red-900/20 p-4">
            <Text className="text-red-400">{error.message}</Text>
          </View>
        )}

        {result && (
          <>
            <View className="mb-4 flex-row gap-2">
              {result.room_type ? (
                <View className="rounded-lg bg-slate-700 px-3 py-1.5">
                  <Text className="text-sm text-slate-200">{result.room_type}</Text>
                </View>
              ) : null}
              {result.quality_level ? (
                <View className="rounded-lg bg-slate-700 px-3 py-1.5">
                  <Text className="text-sm text-slate-200">{result.quality_level}</Text>
                </View>
              ) : null}
            </View>
            <View className="mb-4">
              <Text className="mb-2 text-sm font-medium text-slate-400">材料分割</Text>
              <View className="gap-3">
                {segments.map((seg) => (
                  <EstimateSegment key={seg.id} segment={seg} />
                ))}
              </View>
            </View>
            {total && (total.materials_only || total.with_labor) && (
              <View className="rounded-xl border border-slate-700 bg-slate-800/80 p-4">
                <Text className="mb-2 text-sm font-medium text-slate-400">总价</Text>
                {total.materials_only && (
                  <Text className="text-xl font-bold text-white">
                    材料费: ${total.materials_only.min} - ${total.materials_only.max}
                  </Text>
                )}
                {total.with_labor && (
                  <Text className="mt-2 text-xl font-bold text-white">
                    含人工: ${total.with_labor.min} - ${total.with_labor.max}
                  </Text>
                )}
              </View>
            )}
          </>
        )}
      </ScrollView>
    </View>
  );
}
