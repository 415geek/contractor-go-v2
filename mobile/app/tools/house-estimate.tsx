import { Ionicons } from "@expo/vector-icons";
import * as ImagePicker from "expo-image-picker";
import { useRouter } from "expo-router";
import { useState } from "react";
import {
  View,
  Text,
  ScrollView,
  Pressable,
  ActivityIndicator,
  Image,
  Alert,
} from "react-native";

import { EstimateSegment } from "@/components/tools/EstimateSegment";
import { useHouseEstimate } from "@/hooks/useHouseEstimate";
import { supabase } from "@/lib/supabase";

async function pickAndUploadImage(): Promise<string | null> {
  const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
  if (status !== "granted") {
    Alert.alert("需要相册权限");
    return null;
  }
  const result = await ImagePicker.launchImageLibraryAsync({
    mediaTypes: ["images"],
    allowsEditing: true,
    quality: 0.8,
  });
  if (result.canceled || !result.assets?.[0]?.uri) return null;
  const uri = result.assets[0].uri;
  try {
    const res = await fetch(uri);
    const blob = await res.blob();
    const fileName = `${Date.now()}.jpg`;
    const { data: { session } } = await supabase.auth.getSession();
    if (!session?.user?.id) return null;
    const path = `estimates/${session.user.id}/${fileName}`;
    const { data: up, error } = await supabase.storage.from("material-images").upload(path, blob, { upsert: true });
    if (error) throw error;
    const { data: urlData } = supabase.storage.from("material-images").getPublicUrl(up.path);
    return urlData?.publicUrl ?? null;
  } catch {
    return null;
  }
}

export default function HouseEstimateScreen() {
  const router = useRouter();
  const { estimateHouse, isEstimating, result, error } = useHouseEstimate();
  const [imageUrls, setImageUrls] = useState<string[]>([]);

  const handleAddImage = async () => {
    const url = await pickAndUploadImage();
    if (url) setImageUrls((prev) => [...prev, url].slice(0, 5));
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

  const segments = (result?.segments ?? []) as Array<{
    id: string;
    material_type?: string;
    material_name?: string;
    quantity?: { value: number; unit: string };
    price_per_unit?: { min: number; max: number };
    total_price?: { min: number; max: number };
  }>;
  const total = result?.total_estimate as { materials_only?: { min: number; max: number }; with_labor?: { min: number; max: number } } | undefined;

  return (
    <View className="flex-1 bg-slate-950">
      <View className="border-b border-slate-800 px-4 pt-12 pb-4">
        <View className="flex-row items-center justify-between">
          <Pressable onPress={() => router.back()} className="p-1">
            <Ionicons name="arrow-back" size={24} color="#F8FAFC" />
          </Pressable>
          <Text className="text-lg font-semibold text-white">房屋估价</Text>
          <View className="w-8" />
        </View>
      </View>
      <ScrollView className="flex-1" contentContainerClassName="px-4 py-6 pb-8">
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
