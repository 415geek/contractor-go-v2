import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useState } from "react";
import {
  View,
  Text,
  ScrollView,
  TextInput,
  Pressable,
  ActivityIndicator,
} from "react-native";

import { PermitTimeline } from "@/components/tools/PermitTimeline";
import { usePermitSearch } from "@/hooks/usePermitSearch";

export default function PermitScreen() {
  const router = useRouter();
  const { searchPermit, isSearching, result, error, supportedCities } = usePermitSearch();
  const [address, setAddress] = useState("");

  const handleSearch = async () => {
    if (!address.trim()) return;
    try {
      await searchPermit(address);
    } catch {
      // error in state
    }
  };

  return (
    <View className="flex-1 bg-slate-950">
      <View className="border-b border-slate-800 px-4 pt-12 pb-4">
        <View className="flex-row items-center justify-between">
          <Pressable onPress={() => router.back()} className="p-1">
            <Ionicons name="arrow-back" size={24} color="#F8FAFC" />
          </Pressable>
          <Text className="text-lg font-semibold text-white">Permit 查询</Text>
          <View className="w-8" />
        </View>
      </View>
      <ScrollView className="flex-1" contentContainerClassName="px-4 py-6 pb-8">
        <View className="mb-4">
          <Text className="mb-1.5 text-sm font-medium text-slate-400">地址</Text>
          <TextInput
            value={address}
            onChangeText={setAddress}
            placeholder="输入湾区地址，如 1117 Clement St, San Francisco"
            placeholderTextColor="#64748B"
            className="rounded-xl border border-slate-700 bg-slate-800/80 px-4 py-3 text-white"
          />
        </View>
        <Pressable
          onPress={handleSearch}
          disabled={isSearching || !address.trim()}
          className="mb-6 rounded-xl bg-blue-600 py-3.5 disabled:opacity-50"
        >
          {isSearching ? (
            <ActivityIndicator color="white" />
          ) : (
            <Text className="text-center font-semibold text-white">查询</Text>
          )}
        </Pressable>

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
              {result.city ? (
                <Text className="mt-0.5 text-sm text-slate-400">{result.city}</Text>
              ) : null}
            </View>
            {result.property_info && Object.keys(result.property_info).length > 0 && (
              <View className="mb-4 rounded-xl border border-slate-700 bg-slate-800/80 p-4">
                <Text className="mb-2 text-sm font-medium text-slate-400">房屋信息</Text>
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
              <Text className="mb-3 text-sm font-medium text-slate-400">Permit 历史</Text>
              <PermitTimeline permits={result.permit_history} />
            </View>
            {result.key_insights && result.key_insights.length > 0 && (
              <View className="rounded-xl border border-slate-700 bg-slate-800/80 p-4">
                <Text className="mb-2 text-sm font-medium text-slate-400">关键洞察</Text>
                {result.key_insights.map((insight, i) => (
                  <Text key={i} className="text-slate-300">• {insight}</Text>
                ))}
              </View>
            )}
          </>
        )}
      </ScrollView>
    </View>
  );
}
