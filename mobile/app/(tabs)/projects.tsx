import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import {
  View,
  Text,
  SectionList,
  RefreshControl,
  ActivityIndicator,
  Pressable,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { ProjectCard } from "@/components/project/ProjectCard";
import { useProjects } from "@/hooks/useProjects";

import type { Project, ProjectStatus } from "@/hooks/useProjects";

const SECTIONS: { key: "active" | "planning" | "completed"; label: string; status: ProjectStatus[] }[] = [
  { key: "active",    label: "进行中", status: ["active"] },
  { key: "planning",  label: "计划中", status: ["planning", "on_hold"] },
  { key: "completed", label: "已完成", status: ["completed", "cancelled"] },
];

const SECTION_ICON: Record<string, string> = {
  active:    "flash",
  planning:  "time-outline",
  completed: "checkmark-circle-outline",
};

const SECTION_COLOR: Record<string, string> = {
  active:    "text-success-500",
  planning:  "text-primary-400",
  completed: "text-slate-500",
};

function useGroupedProjects() {
  const { projects, isLoading, refetch } = useProjects();
  const sections = SECTIONS.map((s) => ({
    ...s,
    data: projects.filter((p) => s.status.includes(p.status)),
  })).filter((s) => s.data.length > 0);
  return { sections, isLoading, refetch, total: projects.length };
}

export default function ProjectsScreen() {
  const router = useRouter();
  const { sections, isLoading, refetch, total } = useGroupedProjects();

  return (
    <SafeAreaView className="flex-1 bg-surface-app" edges={["top"]}>
      {/* 顶部标题 */}
      <View className="flex-row items-center justify-between px-4 pt-2 pb-3">
        <View>
          <Text className="text-2xl font-bold text-white">项目管理</Text>
          <Text className="text-sm text-slate-400 mt-0.5">共 {total} 个项目</Text>
        </View>
        <Pressable
          className="w-10 h-10 rounded-full bg-surface-elevated items-center justify-center active:opacity-70"
          accessibilityLabel="筛选"
          hitSlop={8}
        >
          <Ionicons name="filter-outline" size={20} color="#94A3B8" />
        </Pressable>
      </View>

      {isLoading && total === 0 ? (
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator size="large" color="#2563EB" />
        </View>
      ) : sections.length === 0 ? (
        <View className="flex-1 items-center justify-center px-8">
          <View className="w-20 h-20 rounded-full bg-surface-card items-center justify-center mb-4">
            <Ionicons name="briefcase-outline" size={40} color="#475569" />
          </View>
          <Text className="text-white text-lg font-semibold text-center">还没有项目</Text>
          <Text className="text-slate-400 text-sm text-center mt-2">点击右下角创建第一个项目</Text>
        </View>
      ) : (
        <SectionList
          sections={sections}
          keyExtractor={(item) => item.id}
          refreshControl={
            <RefreshControl refreshing={isLoading} onRefresh={refetch} tintColor="#2563EB" />
          }
          contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 100 }}
          stickySectionHeadersEnabled={false}
          renderSectionHeader={({ section }) => (
            <View className="flex-row items-center gap-1.5 mt-5 mb-2">
              <Ionicons
                name={SECTION_ICON[section.key] as any}
                size={14}
                color={section.key === "active" ? "#22C55E" : section.key === "planning" ? "#60A5FA" : "#6B7280"}
              />
              <Text className={`text-sm font-semibold uppercase tracking-wider ${SECTION_COLOR[section.key]}`}>
                {section.label}
              </Text>
              <View className="bg-surface-elevated rounded-full px-1.5 py-0.5 ml-1">
                <Text className="text-xs text-slate-400">{section.data.length}</Text>
              </View>
            </View>
          )}
          renderItem={({ item }) => (
            <View className="mb-2.5">
              <ProjectCard project={item} />
            </View>
          )}
        />
      )}

      {/* 悬浮操作按钮 */}
      <Pressable
        onPress={() => router.push("/project/create")}
        className="absolute bottom-6 right-6 h-14 w-14 items-center justify-center rounded-full bg-primary-600 active:bg-primary-700"
        style={{ shadowColor: "#2563EB", shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.4, shadowRadius: 12 }}
        accessibilityLabel="AI新建项目"
      >
        <Ionicons name="sparkles" size={26} color="white" />
      </Pressable>
    </SafeAreaView>
  );
}
