import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import {
  View,
  Text,
  FlatList,
  RefreshControl,
  ActivityIndicator,
  Pressable,
} from "react-native";

import { ProjectCard } from "@/components/project/ProjectCard";
import { useProjects } from "@/hooks/useProjects";

import type { Project, ProjectStatus } from "@/hooks/useProjects";

const SECTIONS: { key: "active" | "planning" | "completed"; label: string; status: ProjectStatus[] }[] = [
  { key: "active", label: "进行中", status: ["active"] },
  { key: "planning", label: "计划中", status: ["planning", "on_hold"] },
  { key: "completed", label: "已完成", status: ["completed", "cancelled"] },
];

function useGroupedProjects() {
  const { projects, isLoading, refetch } = useProjects();
  const grouped = SECTIONS.map((s) => ({
    ...s,
    data: projects.filter((p) => s.status.includes(p.status)),
  }));
  return { grouped, isLoading, refetch, total: projects.length };
}

export default function ProjectsScreen() {
  const router = useRouter();
  const { grouped, isLoading, refetch, total } = useGroupedProjects();

  return (
    <View className="flex-1 bg-slate-950">
      <View className="border-b border-slate-800 px-4 pt-12 pb-4">
        <Text className="text-2xl font-bold text-white">项目管理</Text>
        <Text className="mt-1 text-sm text-slate-400">
          共 {total} 个项目
        </Text>
      </View>
      {isLoading && total === 0 ? (
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator size="large" color="#3B82F6" />
        </View>
      ) : (
        <FlatList
          data={grouped}
          keyExtractor={(item) => item.key}
          refreshControl={
            <RefreshControl
              refreshing={isLoading}
              onRefresh={refetch}
              tintColor="#3B82F6"
            />
          }
          contentContainerClassName="px-4 py-4 pb-24"
          renderItem={({ item }) => (
            <View className="mb-6">
              <Text className="mb-3 text-sm font-medium uppercase tracking-wider text-slate-400">
                {item.label}
              </Text>
              {item.data.length === 0 ? (
                <Text className="py-2 text-sm text-slate-500">暂无</Text>
              ) : (
                <View className="gap-3">
                  {item.data.map((p) => (
                    <ProjectCard key={p.id} project={p} />
                  ))}
                </View>
              )}
            </View>
          )}
        />
      )}
      <Pressable
        onPress={() => router.push("/project/create")}
        className="absolute bottom-6 right-6 h-14 w-14 items-center justify-center rounded-full bg-blue-600 shadow-lg"
      >
        <Ionicons name="sparkles" size={26} color="white" />
      </Pressable>
    </View>
  );
}
