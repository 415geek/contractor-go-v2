import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { Pressable, Text, View } from "react-native";

import type { Project, ProjectStatus } from "@/hooks/useProjects";

const STATUS_LABEL: Record<ProjectStatus, string> = {
  planning: "计划中",
  active: "进行中",
  on_hold: "暂停",
  completed: "已完成",
  cancelled: "已取消",
};

const STATUS_BG: Record<string, string> = {
  planning: "bg-blue-500/20",
  active: "bg-green-500/20",
  on_hold: "bg-amber-500/20",
  completed: "bg-slate-500/20",
  cancelled: "bg-slate-500/20",
};

const STATUS_TEXT: Record<string, string> = {
  planning: "text-blue-400",
  active: "text-green-400",
  on_hold: "text-amber-400",
  completed: "text-slate-400",
  cancelled: "text-slate-400",
};

type Props = { project: Project };

export function ProjectCard({ project }: Props) {
  const router = useRouter();
  const badge = STATUS_BG[project.status] ?? "bg-slate-500/20";
  const textCls = STATUS_TEXT[project.status] ?? "text-slate-400";

  return (
    <Pressable
      onPress={() => router.push(`/project/${project.id}`)}
      className="rounded-xl border border-slate-700 bg-slate-800/80 p-4 active:bg-slate-700/80"
    >
      <View className="flex-row items-start justify-between gap-2">
        <Text className="flex-1 text-base font-semibold text-white" numberOfLines={1}>
          {project.name}
        </Text>
        <View className={`rounded-lg px-2 py-1 ${badge}`}>
          <Text className={`text-xs font-medium ${textCls}`}>
            {STATUS_LABEL[project.status]}
          </Text>
        </View>
      </View>
      {project.address ? (
        <View className="mt-2 flex-row items-center gap-1.5">
          <Ionicons name="location-outline" size={14} color="#94A3B8" />
          <Text className="flex-1 text-sm text-slate-400" numberOfLines={1}>
            {project.address}
          </Text>
        </View>
      ) : null}
      <View className="mt-3 flex-row items-center justify-between">
        <Text className="text-lg font-bold text-white">
          ${Number(project.total_cost).toLocaleString()}
        </Text>
        {project.start_date ? (
          <Text className="text-xs text-slate-500">
            开工: {project.start_date}
          </Text>
        ) : null}
      </View>
    </Pressable>
  );
}
