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
import { isLocalImageUri, pickImageAsset, uploadPickedImage } from "@/lib/tool-image-pick";

const MAX_IMAGES = 5;

export default function MaterialPriceScreen() {
  const scrollPad = useToolScrollBottomPadding();
  const { user } = useUser();
  const { getToken } = useAuth();
  const { searchMaterial, isSearching, results, error, retry } = useMaterialSearch();
  const [imageUris, setImageUris] = useState<string[]>([]);
  const [description, setDescription] = useState("");
  const [uploadingCount, setUploadingCount] = useState(0);
  const isUploading = uploadingCount > 0;

  const handleSearch = async () => {
    const readyUrls = imageUris.filter((u) => u.startsWith("http"));
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

  return (
    <View className="flex-1 bg-slate-950">
      <ToolScreenHeader title="材料价格" />
      <ScrollView
        className="flex-1"
        keyboardShouldPersistTaps="handled"
        contentContainerStyle={{ paddingHorizontal: 16, paddingTop: 24, paddingBottom: scrollPad }}
      >
        <View className="mb-4">
          <Text className="mb-2 text-sm font-medium text-slate-400">上传图片（最多 {MAX_IMAGES} 张）</Text>
          <View className="flex-row flex-wrap gap-2">
            {imageUris.slice(0, MAX_IMAGES).map((uri, i) => (
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
          <Text className="mb-1.5 text-sm font-medium text-slate-400">可选描述</Text>
          <TextInput
            value={description}
            onChangeText={setDescription}
            placeholder="描述材料类型、品牌等"
            placeholderTextColor="#64748B"
            className="rounded-xl border border-slate-700 bg-slate-800/80 px-4 py-3 text-white"
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
            <Text className="text-center font-semibold text-white">搜索</Text>
          )}
        </Pressable>

        {error && (
          <View className="mb-4 rounded-xl bg-red-900/20 p-4">
            <Text className="text-red-400">{error.message}</Text>
            <Pressable onPress={retry} className="mt-2">
              <Text className="text-blue-400">材料不对，重新搜索</Text>
            </Pressable>
          </View>
        )}

        {results && (
          <>
            {results.ai_recognized && Object.keys(results.ai_recognized).length > 0 && (
              <View className="mb-4 rounded-xl border border-slate-700 bg-slate-800/80 p-4">
                <Text className="mb-2 text-sm font-medium text-slate-400">AI 识别结果</Text>
                <Text className="text-white">
                  {String(results.ai_recognized.material_name ?? results.ai_recognized.material_name_en ?? "—")}
                </Text>
                <Pressable onPress={retry} className="mt-2">
                  <Text className="text-sm text-blue-400">材料不对，重新搜索</Text>
                </Pressable>
              </View>
            )}
            <View className="mb-4">
              <Text className="mb-2 text-sm font-medium text-green-400">有现货</Text>
              <View className="gap-3">
                {results.in_stock.length === 0 ? (
                  <Text className="text-slate-500">暂无</Text>
                ) : (
                  results.in_stock.map((item, i) => (
                    <MaterialResultCard key={`in-${i}`} item={item} />
                  ))
                )}
              </View>
            </View>
            <View className="mb-4">
              <Text className="mb-2 text-sm font-medium text-red-400">无现货</Text>
              <View className="gap-3">
                {results.out_of_stock.length === 0 ? (
                  <Text className="text-slate-500">暂无</Text>
                ) : (
                  results.out_of_stock.map((item, i) => (
                    <MaterialResultCard key={`out-${i}`} item={item} />
                  ))
                )}
              </View>
            </View>
            <View>
              <Text className="mb-2 text-sm font-medium text-slate-400">库存不详</Text>
              <View className="gap-3">
                {results.unknown_stock.length === 0 ? (
                  <Text className="text-slate-500">暂无</Text>
                ) : (
                  results.unknown_stock.map((item, i) => (
                    <MaterialResultCard key={`unk-${i}`} item={item} />
                  ))
                )}
              </View>
            </View>
          </>
        )}
      </ScrollView>
    </View>
  );
}
