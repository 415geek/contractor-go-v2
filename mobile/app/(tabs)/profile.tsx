import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import { Pressable, ScrollView, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { useAuth as useClerkAuth, useUser } from "@clerk/clerk-expo";
import { pushPath } from "@/lib/web-navigation";
import { useMeProfile } from "@/hooks/useMeProfile";

type SettingRow = {
  icon: string;
  iconColor: string;
  iconBg: string;
  label: string;
  value?: string;
  onPress: () => void;
  danger?: boolean;
};

type SettingSection = {
  title: string;
  rows: SettingRow[];
};

function StatCard({ label, value }: { label: string; value: string }) {
  return (
    <View className="flex-1 items-center">
      <Text className="text-xl font-bold text-ink">{value}</Text>
      <Text className="text-xs text-ink-secondary mt-0.5">{label}</Text>
    </View>
  );
}

function SettingItem({ row }: { row: SettingRow }) {
  return (
    <Pressable
      onPress={row.onPress}
      className={`flex-row items-center px-4 py-3.5 active:bg-surface-elevated ${row.danger ? "" : ""}`}
    >
      <View className={`w-8 h-8 rounded-lg ${row.iconBg} items-center justify-center mr-3`}>
        <Ionicons name={row.icon as any} size={16} color={row.iconColor} />
      </View>
      <Text className={`flex-1 text-base ${row.danger ? "text-error-500" : "text-ink"}`}>
        {row.label}
      </Text>
      {row.value && (
        <Text className="text-ink-tertiary text-sm mr-2">{row.value}</Text>
      )}
      <Ionicons
        name="chevron-forward"
        size={16}
        color={row.danger ? "#EF4444" : "#C7C7CC"}
      />
    </Pressable>
  );
}

export default function ProfileScreen() {
  const { signOut } = useClerkAuth();
  const { user } = useUser();
  const { data: meProfile } = useMeProfile();

  const phone =
    user?.phoneNumbers[0]?.phoneNumber ??
    user?.primaryEmailAddress?.emailAddress ??
    "未登录";
  const displayPhone = phone.replace(/(\+\d{1,2})(\d{3})(\d{3})(\d+)/, "$1 $2-$3-$4");

  async function handleSignOut() {
    await signOut!();
    router.replace("/(auth)/login");
  }

  const SECTIONS: SettingSection[] = [
    {
      title: "账户",
      rows: [
        {
          icon: "card-outline",
          iconColor: "#F97316",
          iconBg: "bg-accent-500/15",
          label: "订阅与用量",
          value: meProfile?.is_pro ? "Pro" : "免费",
          onPress: () => pushPath("/subscription"),
        },
        {
          icon: "call-outline",
          iconColor: "#2563EB",
          iconBg: "bg-primary-500/15",
          label: "我的虚拟号码",
          onPress: () => pushPath("/voip"),
        },
        {
          icon: "language-outline",
          iconColor: "#22C55E",
          iconBg: "bg-success-500/15",
          label: "语言设置",
          value: "中文",
          onPress: () => {},
        },
        {
          icon: "moon-outline",
          iconColor: "#8B5CF6",
          iconBg: "bg-purple-500/15",
          label: "深色模式",
          onPress: () => {},
        },
      ],
    },
    {
      title: "支持",
      rows: [
        {
          icon: "help-circle-outline",
          iconColor: "#F97316",
          iconBg: "bg-accent-500/15",
          label: "帮助中心",
          onPress: () => {},
        },
        {
          icon: "chatbubble-outline",
          iconColor: "#2563EB",
          iconBg: "bg-primary-500/15",
          label: "联系客服",
          onPress: () => {},
        },
        {
          icon: "star-outline",
          iconColor: "#EAB308",
          iconBg: "bg-warning-500/15",
          label: "给我们评分",
          onPress: () => {},
        },
      ],
    },
    {
      title: "关于",
      rows: [
        {
          icon: "document-text-outline",
          iconColor: "#94A3B8",
          iconBg: "bg-slate-500/15",
          label: "用户协议",
          onPress: () => {},
        },
        {
          icon: "shield-outline",
          iconColor: "#94A3B8",
          iconBg: "bg-slate-500/15",
          label: "隐私政策",
          onPress: () => {},
        },
        {
          icon: "information-circle-outline",
          iconColor: "#94A3B8",
          iconBg: "bg-slate-500/15",
          label: "关于我们",
          value: "v2.0.0",
          onPress: () => {},
        },
      ],
    },
  ];

  return (
    <SafeAreaView className="flex-1 bg-surface-app" edges={["top"]}>
      <ScrollView showsVerticalScrollIndicator={false}>
        {/* 标题 */}
        <View className="px-4 pt-2 pb-3">
          <Text className="text-2xl font-bold text-ink">我的</Text>
        </View>

        {/* 用户信息卡片 */}
        <View className="mx-4 mb-4 rounded-2xl border border-surface-border bg-surface-card p-5 shadow-card">
          <View className="flex-row items-center gap-4">
            {/* 头像 */}
            <View className="w-16 h-16 rounded-full bg-primary-500 items-center justify-center">
              <Text className="text-white text-2xl font-bold">
                {phone.slice(-2, -1) || "?"}
              </Text>
            </View>
            {/* 信息 */}
            <View className="flex-1">
              <Text className="text-ink text-xl font-bold">您好！</Text>
              <Text className="text-ink-secondary text-sm mt-0.5">{displayPhone}</Text>
            </View>
            <Pressable
              className="w-9 h-9 rounded-full bg-surface-elevated items-center justify-center active:opacity-70"
              accessibilityLabel="编辑资料"
            >
              <Ionicons name="create-outline" size={18} color="#8e9aaf" />
            </Pressable>
          </View>

          {/* 统计数据 */}
          <View className="mt-4 pt-4 border-t border-surface-border flex-row">
            <StatCard label="项目数" value="0" />
            <View className="w-px bg-surface-border" />
            <StatCard label="总金额" value="$0" />
            <View className="w-px bg-surface-border" />
            <StatCard label="好评率" value="—" />
          </View>
        </View>

        {/* 订阅状态卡片 */}
        <Pressable
          onPress={() => pushPath("/subscription")}
          className="mx-4 mb-4 rounded-2xl border border-accent-500/35 bg-accent-500/10 p-4 flex-row items-center gap-3 active:bg-accent-500/15"
        >
          <View className="w-10 h-10 rounded-xl bg-accent-500/20 items-center justify-center">
            <Ionicons name="star" size={20} color="#F97316" />
          </View>
          <View className="flex-1">
            <Text className="text-ink font-semibold">
              {meProfile?.is_pro ? "Pro 订阅" : "免费版"}
            </Text>
            <Text className="text-ink-secondary text-sm mt-0.5">
              {meProfile?.is_pro
                ? "虚拟号短信无限制 · 查看用量"
                : "50 条短信 + 约 10 分钟通话体验 · 升级 Pro 解锁"}
            </Text>
          </View>
          {!meProfile?.is_pro && (
            <View className="bg-accent-500 rounded-lg px-3 py-1.5">
              <Text className="text-white text-xs font-bold">升级</Text>
            </View>
          )}
        </Pressable>

        {/* 设置列表 */}
        {SECTIONS.map((section, sIdx) => (
          <View key={sIdx} className="mb-3">
            <Text className="px-4 mb-1 text-xs font-semibold uppercase tracking-wider text-ink-tertiary">
              {section.title}
            </Text>
            <View className="mx-4 rounded-2xl border border-surface-border bg-surface-card overflow-hidden shadow-card">
              {section.rows.map((row, rIdx) => (
                <View key={rIdx}>
                  {rIdx > 0 && <View className="h-px bg-surface-border mx-4" />}
                  <SettingItem row={row} />
                </View>
              ))}
            </View>
          </View>
        ))}

        {/* 退出登录 */}
        <View className="mx-4 mt-2 mb-8">
          <Pressable
            onPress={() => { void handleSignOut(); }}
            className="rounded-xl border border-error-500/30 bg-error-500/10 py-3.5 items-center active:bg-error-500/20"
          >
            <Text className="text-error-500 font-semibold">退出登录</Text>
          </Pressable>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
