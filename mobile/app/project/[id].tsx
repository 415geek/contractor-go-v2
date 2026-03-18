import { Ionicons } from "@expo/vector-icons";
import { useLocalSearchParams, useRouter } from "expo-router";
import {
  View,
  Text,
  ScrollView,
  Pressable,
  ActivityIndicator,
  Alert,
} from "react-native";

import { useProject, useProjects } from "@/hooks/useProjects";

export default function ProjectDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { project, isLoading, error } = useProject(id);
  const { remove } = useProjects();

  const handleDelete = () => {
    if (!id || !project) return;
    Alert.alert("删除项目", `确定要删除「${project.name}」吗？`, [
      { text: "取消", style: "cancel" },
      {
        text: "删除",
        style: "destructive",
        onPress: async () => {
          await remove(id);
          router.back();
        },
      },
    ]);
  };

  if (isLoading && !project) {
    return (
      <View className="flex-1 items-center justify-center bg-slate-950">
        <ActivityIndicator size="large" color="#3B82F6" />
      </View>
    );
  }

  if (error || !project) {
    return (
      <View className="flex-1 bg-slate-950 px-4 pt-14">
        <Pressable onPress={() => router.back()} className="py-2">
          <Ionicons name="arrow-back" size={24} color="#F8FAFC" />
        </Pressable>
        <View className="mt-8 rounded-xl bg-red-900/20 p-4">
          <Text className="text-red-400">
            {error ? (error instanceof Error ? error.message : (error as { message?: string })?.message ?? String(error)) : "项目不存在"}
          </Text>
        </View>
      </View>
    );
  }

  const plan = project.construction_plan as Record<string, unknown> | null;
  const materials = Array.isArray(project.material_list) ? project.material_list : [];

  return (
    <View className="flex-1 bg-slate-950">
      <View className="border-b border-slate-800 px-4 pt-12 pb-4">
        <View className="flex-row items-center justify-between">
          <Pressable onPress={() => router.back()} className="p-1">
            <Ionicons name="arrow-back" size={24} color="#F8FAFC" />
          </Pressable>
          <View className="flex-row gap-2">
            <Pressable
              onPress={() => router.push(`/project/edit/${project.id}`)}
              className="rounded-lg bg-slate-700 px-3 py-2"
            >
              <Text className="text-sm font-medium text-white">编辑</Text>
            </Pressable>
            <Pressable
              onPress={handleDelete}
              className="rounded-lg bg-red-900/40 px-3 py-2"
            >
              <Text className="text-sm font-medium text-red-400">删除</Text>
            </Pressable>
          </View>
        </View>
        <Text className="mt-4 text-2xl font-bold text-white">{project.name}</Text>
        {project.address ? (
          <Text className="mt-1 text-slate-400">{project.address}</Text>
        ) : null}
      </View>
      <ScrollView
        className="flex-1"
        contentContainerClassName="px-4 py-4 pb-8"
        showsVerticalScrollIndicator={false}
      >
        <View className="rounded-xl border border-slate-700 bg-slate-800/80 p-4">
          <Text className="text-sm font-medium uppercase tracking-wider text-slate-400">
            基本信息
          </Text>
          <View className="mt-3 gap-2">
            {project.client_name ? (
              <Text className="text-white">客户: {project.client_name}</Text>
            ) : null}
            {project.client_phone ? (
              <Text className="text-slate-300">电话: {project.client_phone}</Text>
            ) : null}
            <Text className="text-lg font-semibold text-white">
              总价: ${Number(project.total_cost).toLocaleString()}
            </Text>
            {project.start_date ? (
              <Text className="text-slate-300">开工: {project.start_date}</Text>
            ) : null}
            {project.duration_days ? (
              <Text className="text-slate-300">工期: {project.duration_days} 天</Text>
            ) : null}
          </View>
        </View>

        {plan && Object.keys(plan).length > 0 ? (
          <View className="mt-4 rounded-xl border border-slate-700 bg-slate-800/80 p-4">
            <Text className="text-sm font-medium uppercase tracking-wider text-slate-400">
              施工方案
            </Text>
            <Text className="mt-2 text-slate-300">
              {typeof plan.content === "string"
                ? plan.content
                : JSON.stringify(plan)}
            </Text>
          </View>
        ) : null}

        {materials.length > 0 ? (
          <View className="mt-4 rounded-xl border border-slate-700 bg-slate-800/80 p-4">
            <Text className="text-sm font-medium uppercase tracking-wider text-slate-400">
              建材清单
            </Text>
            <View className="mt-2">
              {materials.map((item: unknown, i: number) => (
                <Text key={i} className="text-slate-300">
                  {typeof item === "string"
                    ? item
                    : typeof item === "object" && item !== null && "name" in (item as object)
                      ? String((item as { name: string }).name)
                      : JSON.stringify(item)}
                </Text>
              ))}
            </View>
          </View>
        ) : null}

        {project.notes ? (
          <View className="mt-4 rounded-xl border border-slate-700 bg-slate-800/80 p-4">
            <Text className="text-sm font-medium uppercase tracking-wider text-slate-400">
              备注
            </Text>
            <Text className="mt-2 text-slate-300">{project.notes}</Text>
          </View>
        ) : null}
      </ScrollView>
    </View>
  );
}
