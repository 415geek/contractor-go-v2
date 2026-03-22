import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { Pressable, ScrollView, Text, View, Platform } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { MOCK_CONSTRUCTION_SITES, type SiteCamera } from "@/lib/mock-site-cameras";

const BOTTOM_INSET = Platform.OS === "ios" ? 108 : 96;

function statusMeta(s: SiteCamera["status"]) {
  switch (s) {
    case "online":
      return { label: "在线", dot: "bg-emerald-400", text: "text-emerald-400" };
    case "weak":
      return { label: "信号弱", dot: "bg-amber-400", text: "text-amber-400" };
    default:
      return { label: "离线", dot: "bg-slate-500", text: "text-slate-500" };
  }
}

export default function SiteMonitoringScreen() {
  const router = useRouter();

  return (
    <SafeAreaView className="flex-1 bg-surface-app" edges={["top"]}>
      <View className="flex-row items-center border-b border-slate-800/80 px-4 py-3">
        <Pressable
          onPress={() => router.back()}
          hitSlop={12}
          className="mr-2 h-10 w-10 items-center justify-center rounded-full active:bg-slate-800"
          accessibilityRole="button"
          accessibilityLabel="返回"
        >
          <Ionicons name="chevron-back" size={26} color="#F8FAFC" />
        </Pressable>
        <View className="min-w-0 flex-1">
          <Text className="text-lg font-bold text-white">工地监控</Text>
          <Text className="text-xs text-slate-500">选择工地与摄像头查看实况</Text>
        </View>
      </View>

      <ScrollView
        className="flex-1"
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: BOTTOM_INSET, paddingHorizontal: 20, paddingTop: 16 }}
      >
        {MOCK_CONSTRUCTION_SITES.map((site) => (
          <View key={site.id} className="mb-6">
            <Text className="mb-1 text-base font-semibold text-white">{site.name}</Text>
            <Text className="mb-3 text-xs text-slate-500">{site.address}</Text>
            <View className="gap-2.5">
              {site.cameras.map((cam) => {
                const st = statusMeta(cam.status);
                return (
                  <Pressable
                    key={cam.id}
                    onPress={() => router.push(`/home/camera/${cam.id}` as never)}
                    className="flex-row items-center rounded-2xl border border-slate-700/80 bg-slate-800/60 px-4 py-3.5 active:opacity-85"
                  >
                    <View className="mr-3 h-12 w-12 items-center justify-center rounded-xl bg-slate-700/90">
                      <Ionicons name="videocam-outline" size={24} color="#94A3B8" />
                    </View>
                    <View className="min-w-0 flex-1">
                      <Text className="font-semibold text-white">{cam.cameraLabel}</Text>
                      <View className="mt-1 flex-row items-center gap-2">
                        <View className={`h-1.5 w-1.5 rounded-full ${st.dot}`} />
                        <Text className={`text-xs font-medium ${st.text}`}>{st.label}</Text>
                        {cam.lastSeen ? (
                          <Text className="text-xs text-slate-500">· {cam.lastSeen}</Text>
                        ) : null}
                      </View>
                    </View>
                    <Ionicons name="chevron-forward" size={20} color="#64748B" />
                  </Pressable>
                );
              })}
            </View>
          </View>
        ))}

        <View className="rounded-2xl border border-dashed border-slate-700 bg-slate-900/40 px-4 py-3">
          <Text className="text-center text-xs leading-5 text-slate-500">
            演示数据。接入真实设备后，此处将显示 NVR / 云摄像头的在线状态与预览缩略图。
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
