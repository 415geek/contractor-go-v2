import { Ionicons } from "@expo/vector-icons";
import * as ImagePicker from "expo-image-picker";
import { useState } from "react";
import {
  View,
  Text,
  ScrollView,
  TextInput,
  Pressable,
  ActivityIndicator,
  Image,
  Alert,
} from "react-native";

import { useAuth, useUser } from "@clerk/clerk-expo";

import { ToolScreenHeader, useToolScrollBottomPadding } from "@/components/tools/ToolScreenChrome";
import { MaterialResultCard } from "@/components/tools/MaterialResultCard";
import { useMaterialSearch } from "@/hooks/useMaterialSearch";
import { uploadToolImageViaEdge } from "@/lib/api/upload-tool-image";
import { imageUriToBase64 } from "@/lib/image-base64";
import { launchImageLibraryWeb, shouldUseWebFilePicker } from "@/lib/launch-image-library-web";

const MAX_IMAGES = 5;

async function pickAndUploadImage(
  getToken: () => Promise<string | null>,
): Promise<{ url: string | null; error?: string }> {
  // Web：任何 await 都会丢失用户手势，必须用同步触发的 <input type="file">（见 launch-image-library-web）
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
  const fileName = `photo.${safeExt}`;
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
      kind: "material",
      contentType: mime,
    });
    return { url: publicUrl };
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    return { url: null, error: msg || "上传失败" };
  }
}

export default function MaterialPriceScreen() {
  const scrollPad = useToolScrollBottomPadding();
  const { user } = useUser();
  const { getToken } = useAuth();
  const { searchMaterial, isSearching, results, error, retry } = useMaterialSearch();
  const [imageUris, setImageUris] = useState<string[]>([]);
  const [description, setDescription] = useState("");

  const handleSearch = async () => {
    if (imageUris.length === 0 && !description.trim()) {
      Alert.alert("提示", "请上传图片或输入描述");
      return;
    }
    try {
      await searchMaterial(imageUris, description.trim() || undefined);
    } catch {
      // error in state
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
              <View key={i} className="h-20 w-20 overflow-hidden rounded-lg bg-slate-800">
                <Image source={{ uri }} className="h-full w-full" resizeMode="cover" />
              </View>
            ))}
            {imageUris.length < MAX_IMAGES && (
              <Pressable
                onPress={async () => {
                  if (!user?.id) {
                    Alert.alert("提示", "请先登录后再上传图片");
                    return;
                  }
                  const { url, error: upErr } = await pickAndUploadImage(getToken);
                  if (url) setImageUris((prev) => [...prev.slice(0, MAX_IMAGES - 1), url]);
                  else if (upErr) Alert.alert("上传失败", upErr);
                }}
                className="h-20 w-20 items-center justify-center rounded-lg border border-dashed border-slate-600 bg-slate-800/50"
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
          onPress={handleSearch}
          disabled={isSearching}
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
