import { Ionicons } from "@expo/vector-icons";
import * as ImagePicker from "expo-image-picker";
import { useState } from "react";
import { View, Text, ScrollView, Pressable, ActivityIndicator, Image, Alert } from "react-native";

import { useAuth, useUser } from "@clerk/clerk-expo";

import { ToolScreenHeader, useToolScrollBottomPadding } from "@/components/tools/ToolScreenChrome";
import { EstimateSegment } from "@/components/tools/EstimateSegment";
import { useHouseEstimate } from "@/hooks/useHouseEstimate";
import { uploadToolImageViaEdge } from "@/lib/api/upload-tool-image";
import { imageUriToBase64 } from "@/lib/image-base64";
import { launchImageLibraryWeb, shouldUseWebFilePicker } from "@/lib/launch-image-library-web";

async function pickAndUploadImage(
  getToken: () => Promise<string | null>,
): Promise<{ url: string | null; error?: string }> {
  let result: ImagePicker.ImagePickerResult;
  if (shouldUseWebFilePicker()) {
    result = await launchImageLibraryWeb();
  } else {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== "granted") {
      return { url: null, error: "需要相册权限" };
    }
    result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ["images"],
      allowsEditing: true,
      quality: 0.85,
    });
  }
  if (result.canceled || !result.assets?.[0]?.uri) return { url: null };
  const uri = result.assets[0].uri;
  const asset = result.assets[0];
  const ext = uri.split(".").pop()?.split("?")[0]?.toLowerCase() || "jpg";
  const safeExt = ext.length > 5 ? "jpg" : ext;
  const fileName = `estimate.${safeExt}`;
  const mime =
    asset.mimeType && asset.mimeType.startsWith("image/")
      ? asset.mimeType
      : safeExt === "png"
        ? "image/png"
        : "image/jpeg";
  try {
    const token = await getToken();
    if (!token) return { url: null, error: "请先登录" };
    const base64 = await imageUriToBase64(uri);
    const { publicUrl } = await uploadToolImageViaEdge(token, {
      base64,
      filename: fileName,
      kind: "estimate",
      contentType: mime,
    });
    return { url: publicUrl };
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    return { url: null, error: msg || "上传失败" };
  }
}

export default function HouseEstimateScreen() {
  const scrollPad = useToolScrollBottomPadding();
  const { user } = useUser();
  const { getToken } = useAuth();
  const { estimateHouse, isEstimating, result, error } = useHouseEstimate();
  const [imageUrls, setImageUrls] = useState<string[]>([]);

  const handleAddImage = async () => {
    if (!user?.id) {
      Alert.alert("提示", "请先登录后再上传图片");
      return;
    }
    const { url, error: upErr } = await pickAndUploadImage(getToken);
    if (url) setImageUrls((prev) => [...prev, url].slice(0, 5));
    else if (upErr) Alert.alert("上传失败", upErr);
  };

  const handleAnalyze = async () => {
    if (imageUrls.length === 0) {
      Alert.alert("提示", "请先上传装修照片");
      return;
    }
    try {
      await estimateHouse(imageUrls);
    } catch {
      // error in state
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
              <View key={i} className="h-20 w-20 overflow-hidden rounded-lg bg-slate-800">
                <Image source={{ uri }} className="h-full w-full" resizeMode="cover" />
              </View>
            ))}
            {imageUrls.length < 5 && (
              <Pressable
                onPress={handleAddImage}
                className="h-20 w-20 items-center justify-center rounded-lg border border-dashed border-slate-600 bg-slate-800/50"
              >
                <Ionicons name="add" size={32} color="#64748B" />
              </Pressable>
            )}
          </View>
        </View>
        <Pressable
          onPress={handleAnalyze}
          disabled={isEstimating || imageUrls.length === 0}
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
