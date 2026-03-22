import { Ionicons } from "@expo/vector-icons";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useCallback, useState } from "react";
import { Pressable, Text, View, Platform } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { findCameraById } from "@/lib/mock-site-cameras";

const BOTTOM_INSET = Platform.OS === "ios" ? 108 : 96;

function ControlButton({
  active,
  onPress,
  icon,
  label,
  activeColor,
}: {
  active?: boolean;
  onPress: () => void;
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  activeColor: string;
}) {
  return (
    <Pressable
      onPress={onPress}
      className={`min-w-[76px] items-center rounded-2xl border px-3 py-3 active:opacity-80 ${
        active ? "border-white/25 bg-white/12" : "border-slate-600/80 bg-slate-800/90"
      }`}
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityState={{ selected: !!active }}
    >
      <Ionicons name={icon} size={26} color={active ? activeColor : "#94A3B8"} />
      <Text className={`mt-1.5 text-center text-[11px] font-semibold ${active ? "text-white" : "text-slate-400"}`}>
        {label}
      </Text>
    </Pressable>
  );
}

export default function CameraLiveScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const camera = id ? findCameraById(id) : undefined;

  const [recording, setRecording] = useState(false);
  const [alarmOn, setAlarmOn] = useState(false);
  const [talking, setTalking] = useState(false);

  const toggleRecord = useCallback(() => {
    setRecording((r) => !r);
  }, []);
  const toggleAlarm = useCallback(() => {
    setAlarmOn((a) => !a);
  }, []);
  const toggleTalk = useCallback(() => {
    setTalking((t) => !t);
  }, []);

  if (!camera) {
    return (
      <SafeAreaView className="flex-1 items-center justify-center bg-surface-app px-6" edges={["top"]}>
        <Ionicons name="alert-circle-outline" size={48} color="#64748B" />
        <Text className="mt-4 text-center text-base font-semibold text-white">未找到该摄像头</Text>
        <Pressable onPress={() => router.back()} className="mt-6 rounded-xl bg-primary-600 px-6 py-3">
          <Text className="font-semibold text-white">返回</Text>
        </Pressable>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-black" edges={["top"]}>
      <View className="flex-row items-center px-2 py-2">
        <Pressable
          onPress={() => router.back()}
          hitSlop={12}
          className="h-10 w-10 items-center justify-center rounded-full active:bg-white/10"
          accessibilityRole="button"
          accessibilityLabel="返回"
        >
          <Ionicons name="chevron-back" size={26} color="#F8FAFC" />
        </Pressable>
        <View className="min-w-0 flex-1 pr-10">
          <Text className="text-center text-base font-semibold text-white" numberOfLines={1}>
            {camera.cameraLabel}
          </Text>
          <Text className="text-center text-xs text-slate-500" numberOfLines={1}>
            {camera.siteName}
          </Text>
        </View>
      </View>

      {/* 实况占位：后续可换 expo-av / WebRTC / 厂商 SDK */}
      <View className="mx-4 mt-2 flex-1 min-h-[220px] overflow-hidden rounded-2xl border border-slate-700/80 bg-slate-900">
        <View className="flex-1 items-center justify-center px-6">
          <View className="mb-4 h-20 w-20 items-center justify-center rounded-full bg-slate-800">
            <Ionicons name="videocam" size={40} color="#475569" />
          </View>
          <Text className="text-center text-sm font-medium text-slate-400">实时画面预览</Text>
          <Text className="mt-2 text-center text-xs leading-5 text-slate-600">
            接入流媒体地址后，此处显示 HLS / WebRTC 画面。当前为演示 UI。
          </Text>
          {recording ? (
            <View className="mt-4 flex-row items-center gap-2 rounded-full bg-red-500/20 px-3 py-1.5">
              <View className="h-2 w-2 rounded-full bg-red-500" />
              <Text className="text-xs font-semibold text-red-400">正在录影…</Text>
            </View>
          ) : null}
        </View>
      </View>

      <View className="px-5 pb-2 pt-6" style={{ paddingBottom: BOTTOM_INSET }}>
        <Text className="mb-3 text-center text-[11px] font-semibold uppercase tracking-wider text-slate-500">
          云台与设备
        </Text>
        <View className="flex-row flex-wrap justify-center gap-3">
          <ControlButton
            active={recording}
            onPress={toggleRecord}
            icon={recording ? "stop-circle" : "radio-button-on"}
            label={recording ? "停止录影" : "录影"}
            activeColor="#F87171"
          />
          <ControlButton
            active={alarmOn}
            onPress={toggleAlarm}
            icon={alarmOn ? "notifications" : "notifications-outline"}
            label={alarmOn ? "警报开" : "警报"}
            activeColor="#FBBF24"
          />
          <ControlButton
            active={talking}
            onPress={toggleTalk}
            icon={talking ? "mic" : "mic-outline"}
            label={talking ? "对讲中" : "对讲"}
            activeColor="#34D399"
          />
        </View>
        <Text className="mt-4 text-center text-[11px] text-slate-600">
          录影、警报与对讲需对接设备能力；当前仅切换本地状态示意。
        </Text>
      </View>
    </SafeAreaView>
  );
}
