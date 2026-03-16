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

const STATUS_STYLES: Record<ProjectStatus, { badge: string; text: string; dot: string }> = {
  active:    { badge: "bg-success-500/20", text: "text-success-500", dot: "bg-success-500" },
  planning:  { badge: "bg-primary-500/20", text: "text-primary-400", dot: "bg-primary-500" },
  on_hold:   { badge: "bg-warning-500/20", text: "text-warning-500", dot: "bg-warning-500" },
  completed: { badge: "bg-slate-500/20",   text: "text-slate-400",   dot: "bg-slate-500"   },
  cancelled: { badge: "bg-slate-500/20",   text: "text-slate-500",   dot: "bg-slate-600"   },
};

const PROJECT_TYPE_ICONS: Record<string, string> = {
  bathroom: "water-outline",
  kitchen: "restaurant-outline",
  roofing: "home-outline",
  flooring: "apps-outline",
  painting: "color-palette-outline",
  default: "construct-outline",
};

function getProjectIcon(name: string): string {
  const lower = name.toLowerCase();
  if (lower.includes("bath") || lower.includes("浴") || lower.includes("厕")) return PROJECT_TYPE_ICONS.bathroom;
  if (lower.includes("kitchen") || lower.includes("厨")) return PROJECT_TYPE_ICONS.kitchen;
  if (lower.includes("roof") || lower.includes("屋顶")) return PROJECT_TYPE_ICONS.roofing;
  if (lower.includes("floor") || lower.includes("地板")) return PROJECT_TYPE_ICONS.flooring;
  if (lower.includes("paint") || lower.includes("油漆") || lower.includes("涂")) return PROJECT_TYPE_ICONS.painting;
  return PROJECT_TYPE_ICONS.default;
}

type Props = { project: Project };

export function ProjectCard({ project }: Props) {
  const router = useRouter();
  const styles = STATUS_STYLES[project.status] ?? STATUS_STYLES.planning;
  const iconName = getProjectIcon(project.name) as any;

  return (
    <Pressable
      onPress={() => router.push(`/project/${project.id}`)}
      className="rounded-xl border border-slate-700/60 bg-surface-card p-4 active:bg-slate-700/60"
    >
      {/* 标题行 */}
      <View className="flex-row items-start justify-between gap-2">
        <View className="flex-row items-center gap-2 flex-1 min-w-0">
          <View className="w-8 h-8 rounded-lg bg-primary-500/15 items-center justify-center flex-shrink-0">
            <Ionicons name={iconName} size={16} color="#60A5FA" />
          </View>
          <Text className="flex-1 text-base font-semibold text-white" numberOfLines={1}>
            {project.name}
          </Text>
        </View>
        {/* 状态徽章 */}
        <View className={`flex-row items-center gap-1 rounded-badge px-2 py-1 flex-shrink-0 ${styles.badge}`}>
          <View className={`w-1.5 h-1.5 rounded-full ${styles.dot}`} />
          <Text className={`text-xs font-medium ${styles.text}`}>
            {STATUS_LABEL[project.status]}
          </Text>
        </View>
      </View>

      {/* 地址 */}
      {project.address ? (
        <View className="mt-2 flex-row items-center gap-1.5">
          <Ionicons name="location-outline" size={13} color="#64748B" />
          <Text className="flex-1 text-sm text-slate-400" numberOfLines={1}>
            {project.address}
          </Text>
        </View>
      ) : null}

      {/* 分隔线 */}
      <View className="h-px bg-slate-700/50 my-3" />

      {/* 数据行：金额 + 日期 */}
      <View className="flex-row items-center justify-between">
        <View className="flex-row items-center gap-1">
          <Ionicons name="cash-outline" size={14} color="#94A3B8" />
          <Text className="text-lg font-bold text-white">
            ${Number(project.total_cost).toLocaleString()}
          </Text>
        </View>
        {project.start_date ? (
          <View className="flex-row items-center gap-1">
            <Ionicons name="calendar-outline" size={13} color="#64748B" />
            <Text className="text-xs text-slate-500">
              {project.start_date}
            </Text>
          </View>
        ) : null}
      </View>

      {/* 进度条 (进行中项目显示) */}
      {project.status === "active" && (
        <View className="mt-3">
          <View className="flex-row items-center justify-between mb-1.5">
            <Text className="text-xs text-slate-500">项目进度</Text>
            <Text className="text-xs font-medium text-primary-400">进行中</Text>
          </View>
          <View className="h-1.5 bg-slate-700 rounded-full overflow-hidden">
            <View
              className="h-full bg-primary-500 rounded-full"
              style={{ width: "45%" }}
            />
          </View>
        </View>
      )}
    </Pressable>
  );
}
