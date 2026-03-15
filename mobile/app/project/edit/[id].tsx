import { Ionicons } from "@expo/vector-icons";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useEffect, useState } from "react";
import {
  View,
  Text,
  ScrollView,
  TextInput,
  Pressable,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
} from "react-native";

import { useProject, useProjects } from "@/hooks/useProjects";

export default function EditProjectScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { project, isLoading } = useProject(id);
  const { update, updateLoading } = useProjects();
  const [name, setName] = useState("");
  const [address, setAddress] = useState("");
  const [clientName, setClientName] = useState("");
  const [clientPhone, setClientPhone] = useState("");
  const [totalCost, setTotalCost] = useState("");
  const [startDate, setStartDate] = useState("");
  const [durationDays, setDurationDays] = useState("");

  useEffect(() => {
    if (project) {
      setName(project.name);
      setAddress(project.address ?? "");
      setClientName(project.client_name ?? "");
      setClientPhone(project.client_phone ?? "");
      setTotalCost(project.total_cost ? String(project.total_cost) : "");
      setStartDate(project.start_date ?? "");
      setDurationDays(project.duration_days ? String(project.duration_days) : "");
    }
  }, [project]);

  const handleSave = async () => {
    if (!id || !name.trim()) return;
    const cost = parseFloat(totalCost) || 0;
    const days = durationDays ? parseInt(durationDays, 10) : undefined;
    await update({
      id,
      name: name.trim(),
      address: address.trim() || null,
      client_name: clientName.trim() || null,
      client_phone: clientPhone.trim() || null,
      total_cost: cost,
      start_date: startDate.trim() || null,
      duration_days: days,
    });
    router.back();
  };

  if (isLoading && !project) {
    return (
      <View className="flex-1 items-center justify-center bg-slate-950">
        <ActivityIndicator size="large" color="#3B82F6" />
      </View>
    );
  }

  if (!project) {
    return (
      <View className="flex-1 bg-slate-950 px-4 pt-14">
        <Pressable onPress={() => router.back()} className="py-2">
          <Ionicons name="arrow-back" size={24} color="#F8FAFC" />
        </Pressable>
        <Text className="mt-8 text-slate-400">项目不存在</Text>
      </View>
    );
  }

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : undefined}
      className="flex-1 bg-slate-950"
    >
      <View className="border-b border-slate-800 px-4 pt-12 pb-4">
        <View className="flex-row items-center justify-between">
          <Pressable onPress={() => router.back()} className="p-1">
            <Ionicons name="arrow-back" size={24} color="#F8FAFC" />
          </Pressable>
          <Text className="text-lg font-semibold text-white">编辑项目</Text>
          <View className="w-8" />
        </View>
      </View>
      <ScrollView
        className="flex-1"
        contentContainerClassName="px-4 py-6 pb-8"
        keyboardShouldPersistTaps="handled"
      >
        <View className="gap-4">
          <View>
            <Text className="mb-1.5 text-sm font-medium text-slate-400">项目名称 *</Text>
            <TextInput
              value={name}
              onChangeText={setName}
              placeholder="请输入项目名称"
              placeholderTextColor="#64748B"
              className="rounded-xl border border-slate-700 bg-slate-800/80 px-4 py-3 text-white"
            />
          </View>
          <View>
            <Text className="mb-1.5 text-sm font-medium text-slate-400">地址</Text>
            <TextInput
              value={address}
              onChangeText={setAddress}
              placeholder="请输入地址"
              placeholderTextColor="#64748B"
              className="rounded-xl border border-slate-700 bg-slate-800/80 px-4 py-3 text-white"
            />
          </View>
          <View>
            <Text className="mb-1.5 text-sm font-medium text-slate-400">客户名</Text>
            <TextInput
              value={clientName}
              onChangeText={setClientName}
              placeholder="客户姓名"
              placeholderTextColor="#64748B"
              className="rounded-xl border border-slate-700 bg-slate-800/80 px-4 py-3 text-white"
            />
          </View>
          <View>
            <Text className="mb-1.5 text-sm font-medium text-slate-400">电话</Text>
            <TextInput
              value={clientPhone}
              onChangeText={setClientPhone}
              placeholder="客户电话"
              placeholderTextColor="#64748B"
              keyboardType="phone-pad"
              className="rounded-xl border border-slate-700 bg-slate-800/80 px-4 py-3 text-white"
            />
          </View>
          <View>
            <Text className="mb-1.5 text-sm font-medium text-slate-400">总价</Text>
            <TextInput
              value={totalCost}
              onChangeText={setTotalCost}
              placeholder="0"
              placeholderTextColor="#64748B"
              keyboardType="decimal-pad"
              className="rounded-xl border border-slate-700 bg-slate-800/80 px-4 py-3 text-white"
            />
          </View>
          <View>
            <Text className="mb-1.5 text-sm font-medium text-slate-400">开工日期</Text>
            <TextInput
              value={startDate}
              onChangeText={setStartDate}
              placeholder="YYYY-MM-DD"
              placeholderTextColor="#64748B"
              className="rounded-xl border border-slate-700 bg-slate-800/80 px-4 py-3 text-white"
            />
          </View>
          <View>
            <Text className="mb-1.5 text-sm font-medium text-slate-400">工期（天）</Text>
            <TextInput
              value={durationDays}
              onChangeText={setDurationDays}
              placeholder="天数"
              placeholderTextColor="#64748B"
              keyboardType="number-pad"
              className="rounded-xl border border-slate-700 bg-slate-800/80 px-4 py-3 text-white"
            />
          </View>
        </View>
        <Pressable
          onPress={handleSave}
          disabled={!name.trim() || updateLoading}
          className="mt-8 rounded-xl bg-blue-600 py-3.5 active:bg-blue-700 disabled:opacity-50"
        >
          {updateLoading ? (
            <ActivityIndicator color="white" />
          ) : (
            <Text className="text-center font-semibold text-white">保存更新</Text>
          )}
        </Pressable>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
