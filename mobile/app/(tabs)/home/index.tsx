import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useMemo } from "react";
import {
  View,
  Text,
  ScrollView,
  Pressable,
  RefreshControl,
  ActivityIndicator,
  Platform,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { ProjectCard } from "@/components/project/ProjectCard";
import { useProjects, type Project } from "@/hooks/useProjects";
import { pushPath } from "@/lib/web-navigation";

const BOTTOM_INSET = Platform.OS === "ios" ? 108 : 96;

function StatTile({
  label,
  value,
  accent,
}: {
  label: string;
  value: number;
  accent: "default" | "success" | "primary";
}) {
  const ring =
    accent === "success"
      ? "border-emerald-500/35 bg-emerald-500/10"
      : accent === "primary"
        ? "border-primary-500/35 bg-primary-500/10"
        : "border-surface-border bg-surface-card";
  const numColor =
    accent === "success" ? "text-emerald-400" : accent === "primary" ? "text-primary-400" : "text-ink";
  return (
    <View className={`min-w-0 flex-1 rounded-2xl border px-3 py-3 shadow-sm ${ring}`}>
      <Text className="text-[11px] font-medium uppercase tracking-wide text-ink-tertiary">{label}</Text>
      <Text className={`mt-1 text-2xl font-bold tabular-nums ${numColor}`}>{value}</Text>
    </View>
  );
}

function useProjectStats(projects: Project[]) {
  return useMemo(() => {
    const total = projects.length;
    const active = projects.filter((p) => p.status === "active").length;
    const done = projects.filter((p) => p.status === "completed").length;
    return { total, active, done };
  }, [projects]);
}

export default function HomeDashboardScreen() {
  const router = useRouter();
  const { projects, isLoading, refetch } = useProjects();
  const { total, active, done } = useProjectStats(projects);
  const preview = projects.slice(0, 6);

  const greeting = useMemo(() => {
    const h = new Date().getHours();
    if (h < 12) return "上午好";
    if (h < 18) return "下午好";
    return "晚上好";
  }, []);

  return (
    <SafeAreaView className="flex-1 bg-surface-app" edges={["top"]}>
      <ScrollView
        className="flex-1"
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={isLoading} onRefresh={refetch} tintColor="#00a3bf" />}
        contentContainerStyle={{ paddingBottom: BOTTOM_INSET }}
      >
        {/* 顶栏 */}
        <View className="px-5 pt-1 pb-4">
          <Text className="text-[13px] font-medium text-ink-secondary">{greeting}</Text>
          <View className="mt-1 flex-row items-end justify-between">
            <Text className="text-3xl font-bold tracking-tight text-ink">工作台</Text>
            <Pressable
              onPress={() => pushPath("/voip")}
              className="flex-row items-center gap-1.5 rounded-full bg-primary-500/12 px-3 py-1.5 active:opacity-70"
              hitSlop={8}
            >
              <Ionicons name="call-outline" size={16} color="#1e90ff" />
              <Text className="text-xs font-semibold text-electric-400">虚拟号码</Text>
            </Pressable>
          </View>
        </View>

        {/* 数据概览 */}
        <View className="px-5 pb-5">
          <Text className="mb-3 text-xs font-semibold uppercase tracking-wider text-ink-tertiary">项目概览</Text>
          <View className="flex-row gap-2.5">
            <StatTile label="全部" value={total} accent="default" />
            <StatTile label="进行中" value={active} accent="primary" />
            <StatTile label="已完成" value={done} accent="success" />
          </View>
        </View>

        {/* 工地监控主 CTA */}
        <View className="px-5 pb-6">
          <Text className="mb-3 text-xs font-semibold uppercase tracking-wider text-ink-tertiary">现场</Text>
          <Pressable
            onPress={() => router.push("/home/monitoring" as never)}
            className="overflow-hidden rounded-3xl border border-primary-500/30 bg-primary-500/10 active:opacity-90"
          >
            <View className="flex-row items-center p-5">
              <View className="mr-4 h-14 w-14 items-center justify-center rounded-2xl bg-primary-500/20">
                <Ionicons name="videocam" size={30} color="#00d4e8" />
              </View>
              <View className="min-w-0 flex-1">
                <Text className="text-lg font-bold text-ink">工地监控</Text>
                <Text className="mt-1 text-sm leading-5 text-ink-secondary">
                  查看各工地摄像头实况、录影与对讲
                </Text>
              </View>
              <Ionicons name="chevron-forward" size={22} color="#8e9aaf" />
            </View>
          </Pressable>
        </View>

        {/* 项目卡片 */}
        <View className="px-5 pb-4">
          <View className="mb-3 flex-row items-center justify-between">
            <Text className="text-xs font-semibold uppercase tracking-wider text-ink-tertiary">我的项目</Text>
            <Pressable onPress={() => router.push("/projects")} hitSlop={8}>
              <Text className="text-sm font-semibold text-primary-400">全部</Text>
            </Pressable>
          </View>

          {isLoading && projects.length === 0 ? (
            <View className="items-center py-16">
              <ActivityIndicator size="large" color="#00a3bf" />
            </View>
          ) : preview.length === 0 ? (
            <View className="items-center rounded-2xl border border-dashed border-surface-border bg-surface-card px-6 py-12">
              <Ionicons name="cube-outline" size={40} color="#64748b" />
              <Text className="mt-3 text-center text-base font-semibold text-ink">暂无项目</Text>
              <Text className="mt-1 text-center text-sm text-ink-secondary">创建项目后，将在这里快速打开</Text>
              <Pressable
                onPress={() => router.push("/project/create")}
                className="mt-5 rounded-xl bg-primary-500 px-5 py-3 active:bg-primary-600 shadow-button"
              >
                <Text className="font-semibold text-white">新建项目</Text>
              </Pressable>
            </View>
          ) : (
            <View className="gap-3">
              {preview.map((p) => (
                <ProjectCard key={p.id} project={p} />
              ))}
            </View>
          )}
        </View>

        {/* 次要入口：消息 */}
        <View className="mx-5 mb-4 rounded-2xl border border-surface-border bg-surface-card p-4 shadow-card">
          <Pressable onPress={() => router.push("/")} className="flex-row items-center active:opacity-70">
            <View className="mr-3 h-10 w-10 items-center justify-center rounded-xl bg-surface-elevated">
              <Ionicons name="chatbubbles-outline" size={20} color="#1e90ff" />
            </View>
            <View className="min-w-0 flex-1">
              <Text className="font-semibold text-ink">客户消息</Text>
              <Text className="text-xs text-ink-secondary">与业主的会话与翻译</Text>
            </View>
            <Ionicons name="chevron-forward" size={18} color="#8e9aaf" />
          </Pressable>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
