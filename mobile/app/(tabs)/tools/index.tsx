import { Ionicons } from "@expo/vector-icons";
import { Pressable, ScrollView, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useBottomTabBarHeight } from "@react-navigation/bottom-tabs";

import { pushPath } from "@/lib/web-navigation";

type Tool = {
  id: string;
  name: string;
  description: string;
  icon: string;
  color: string;
  iconBg: string;
  route: string;
  badge?: "free" | "pro";
};

const TOOLS: Tool[] = [
  {
    id: "ar-measure",
    name: "AR 测量",
    description: "相机取点测距\n气泡水平仪",
    icon: "scan-circle-outline",
    color: "#34D399",
    iconBg: "bg-emerald-500/15",
    route: "/tools/ar-measure",
    badge: "free",
  },
  {
    id: "material-price",
    name: "材料比价",
    description: "拍照识别\n全网比价",
    icon: "pricetag-outline",
    color: "#22C55E",
    iconBg: "bg-success-500/15",
    route: "/tools/material-price",
    badge: "free",
  },
  {
    id: "house-estimate",
    name: "房屋估价",
    description: "AI分割材料\n智能估算",
    icon: "home-outline",
    color: "#F97316",
    iconBg: "bg-accent-500/15",
    route: "/tools/house-estimate",
    badge: "pro",
  },
  {
    id: "permit",
    name: "物业信息",
    description: "SF 规划局地图\n开放数据摘要",
    icon: "map-outline",
    color: "#8B5CF6",
    iconBg: "bg-purple-500/15",
    route: "/tools/permit",
    badge: "free",
  },
  {
    id: "voip",
    name: "虚拟号码",
    description: "独立手机号\n专业接单",
    icon: "call-outline",
    color: "#2563EB",
    iconBg: "bg-primary-500/15",
    route: "/voip",
    badge: "pro",
  },
];

function ToolCard({ tool }: { tool: Tool }) {
  return (
    <Pressable
      onPress={() => pushPath(tool.route)}
      className="flex-1 min-w-0 rounded-tool-card border border-slate-700/60 bg-surface-card p-4 active:bg-slate-700/60"
      style={{ minHeight: 140 }}
    >
      <View className={`mb-3 h-12 w-12 items-center justify-center rounded-xl ${tool.iconBg}`}>
        <Ionicons name={tool.icon as never} size={24} color={tool.color} />
      </View>
      <Text className="mb-1 text-base font-semibold text-white">{tool.name}</Text>
      <Text className="flex-1 text-xs leading-relaxed text-slate-400">{tool.description}</Text>
      {tool.badge && (
        <View className="mt-2 self-start">
          {tool.badge === "pro" ? (
            <View className="rounded bg-accent-500/20 px-2 py-0.5">
              <Text className="text-2xs font-semibold text-accent-400">Pro</Text>
            </View>
          ) : (
            <View className="rounded bg-success-500/20 px-2 py-0.5">
              <Text className="text-2xs font-semibold text-success-500">免费</Text>
            </View>
          )}
        </View>
      )}
    </Pressable>
  );
}

export default function ToolsHubScreen() {
  const tabBarH = useBottomTabBarHeight();

  const rows: Tool[][] = [];
  for (let i = 0; i < TOOLS.length; i += 2) {
    rows.push(TOOLS.slice(i, i + 2));
  }

  return (
    <SafeAreaView className="flex-1 bg-surface-app" edges={["top"]}>
      <View className="px-4 pb-3 pt-2">
        <Text className="text-2xl font-bold text-white">工具中心</Text>
        <Text className="mt-0.5 text-sm text-slate-400">提升效率的专业工具</Text>
      </View>

      <ScrollView
        contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: tabBarH + 28 }}
        showsVerticalScrollIndicator={false}
      >
        {rows.map((row, rowIdx) => (
          <View key={rowIdx} className="mb-3 flex-row gap-3">
            {row.map((tool) => (
              <ToolCard key={tool.id} tool={tool} />
            ))}
            {row.length === 1 && <View className="flex-1" />}
          </View>
        ))}

        <Pressable className="mt-3 flex-row items-center gap-3 rounded-xl border border-accent-500/40 bg-accent-500/10 p-4 active:bg-accent-500/20">
          <View className="h-10 w-10 items-center justify-center rounded-xl bg-accent-500/20">
            <Ionicons name="star" size={20} color="#F97316" />
          </View>
          <View className="flex-1">
            <Text className="font-semibold text-white">升级 Pro 会员</Text>
            <Text className="mt-0.5 text-sm text-slate-400">解锁全部工具，7天免费试用</Text>
          </View>
          <Ionicons name="chevron-forward" size={18} color="#F97316" />
        </Pressable>
      </ScrollView>
    </SafeAreaView>
  );
}
