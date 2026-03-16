import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { Pressable, ScrollView, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

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
    name: "Permit查询",
    description: "湾区许可证\n公开数据",
    icon: "document-text-outline",
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

function ToolCard({ tool, onPress }: { tool: Tool; onPress: () => void }) {
  return (
    <Pressable
      onPress={onPress}
      className="flex-1 min-w-0 rounded-tool-card border border-slate-700/60 bg-surface-card p-4 active:bg-slate-700/60"
      style={{ minHeight: 140 }}
    >
      {/* 图标 */}
      <View className={`w-12 h-12 rounded-xl ${tool.iconBg} items-center justify-center mb-3`}>
        <Ionicons name={tool.icon as any} size={24} color={tool.color} />
      </View>

      {/* 名称 */}
      <Text className="text-white font-semibold text-base mb-1">{tool.name}</Text>

      {/* 描述 */}
      <Text className="text-slate-400 text-xs leading-relaxed flex-1">{tool.description}</Text>

      {/* 徽章 */}
      {tool.badge && (
        <View className="mt-2 self-start">
          {tool.badge === "pro" ? (
            <View className="bg-accent-500/20 rounded px-2 py-0.5">
              <Text className="text-accent-400 text-2xs font-semibold">Pro</Text>
            </View>
          ) : (
            <View className="bg-success-500/20 rounded px-2 py-0.5">
              <Text className="text-success-500 text-2xs font-semibold">免费</Text>
            </View>
          )}
        </View>
      )}
    </Pressable>
  );
}

export default function ToolsScreen() {
  const router = useRouter();

  const rows: Tool[][] = [];
  for (let i = 0; i < TOOLS.length; i += 2) {
    rows.push(TOOLS.slice(i, i + 2));
  }

  return (
    <SafeAreaView className="flex-1 bg-surface-app" edges={["top"]}>
      {/* 标题 */}
      <View className="px-4 pt-2 pb-3">
        <Text className="text-2xl font-bold text-white">工具中心</Text>
        <Text className="text-sm text-slate-400 mt-0.5">提升效率的专业工具</Text>
      </View>

      <ScrollView
        contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 40 }}
        showsVerticalScrollIndicator={false}
      >
        {/* 工具网格 */}
        {rows.map((row, rowIdx) => (
          <View key={rowIdx} className="flex-row gap-3 mb-3">
            {row.map((tool) => (
              <ToolCard
                key={tool.id}
                tool={tool}
                onPress={() => router.push(tool.route as never)}
              />
            ))}
            {/* 补齐奇数行 */}
            {row.length === 1 && <View className="flex-1" />}
          </View>
        ))}

        {/* Pro升级卡片 */}
        <Pressable
          onPress={() => {}}
          className="mt-3 rounded-xl border border-accent-500/40 bg-accent-500/10 p-4 flex-row items-center gap-3 active:bg-accent-500/20"
        >
          <View className="w-10 h-10 rounded-xl bg-accent-500/20 items-center justify-center">
            <Ionicons name="star" size={20} color="#F97316" />
          </View>
          <View className="flex-1">
            <Text className="text-white font-semibold">升级 Pro 会员</Text>
            <Text className="text-slate-400 text-sm mt-0.5">解锁全部工具，7天免费试用</Text>
          </View>
          <Ionicons name="chevron-forward" size={18} color="#F97316" />
        </Pressable>
      </ScrollView>
    </SafeAreaView>
  );
}
