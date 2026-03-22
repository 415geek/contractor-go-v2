import { Ionicons } from "@expo/vector-icons";
import { CameraView, useCameraPermissions } from "expo-camera";
import * as Haptics from "expo-haptics";
import { Accelerometer } from "expo-sensors";
import { useCallback, useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Platform,
  Pressable,
  Text,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import Svg, { Circle, Line } from "react-native-svg";

import { ToolScreenHeader } from "@/components/tools/ToolScreenChrome";

/** 典型手机主摄水平视场角（度），用于无 LiDAR 时的平面距离估算 */
const DEFAULT_H_FOV_DEG = 64;

type Pt = { x: number; y: number };

type Mode = "measure" | "level";

function clamp(n: number, min: number, max: number) {
  return Math.min(max, Math.max(min, n));
}

function distanceMetersBetweenPixels(
  a: Pt,
  b: Pt,
  frameW: number,
  planeDistanceM: number,
  hFovDeg: number,
): number {
  if (frameW <= 0) return 0;
  const halfRad = ((hFovDeg * Math.PI) / 180) * 0.5;
  const planeWidthM = 2 * planeDistanceM * Math.tan(halfRad);
  const mPerPx = planeWidthM / frameW;
  const px = Math.hypot(b.x - a.x, b.y - a.y);
  return px * mPerPx;
}

function LevelGauge({
  x,
  y,
  z,
}: {
  x: number;
  y: number;
  z: number;
}) {
  const mag = Math.sqrt(x * x + y * y + z * z) || 1;
  const nx = x / mag;
  const ny = y / mag;
  const nz = z / mag;
  const tiltDeg = (Math.acos(clamp(Math.abs(nz), 0, 1)) * 180) / Math.PI;
  const isLevel = tiltDeg < 0.8;
  const R = 112;
  const bubbleR = 14;
  const scale = R * 0.85;
  const bx = clamp(nx * scale, -R + bubbleR, R - bubbleR);
  const by = clamp(ny * scale, -R + bubbleR, R - bubbleR);

  return (
    <View className="flex-1 items-center justify-center px-6">
      <Text className="mb-6 text-center text-sm text-slate-400">
        将手机平放在待测表面上，观察气泡是否居中（演示级水平仪，非 LiDAR）。
      </Text>
      <View
        className="items-center justify-center rounded-full border-2 border-slate-600 bg-slate-900/80"
        style={{ width: R * 2 + 48, height: R * 2 + 48 }}
      >
        <View
          className="items-center justify-center rounded-full border border-slate-700"
          style={{ width: R * 2, height: R * 2 }}
        >
          <View
            style={{
              position: "absolute",
              width: R * 2,
              height: R * 2,
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <View
              className="rounded-full"
              style={{
                width: bubbleR * 2,
                height: bubbleR * 2,
                backgroundColor: isLevel ? "#34D399" : "#FBBF24",
                opacity: 0.95,
                transform: [{ translateX: bx }, { translateY: -by }],
              }}
            />
          </View>
          <View
            className="absolute h-px w-full bg-slate-600/80"
            style={{ top: "50%" }}
          />
          <View
            className="absolute h-full w-px bg-slate-600/80"
            style={{ left: "50%" }}
          />
        </View>
      </View>
      <Text
        className={`mt-8 text-3xl font-semibold tabular-nums ${isLevel ? "text-emerald-400" : "text-white"}`}
      >
        {tiltDeg.toFixed(1)}°
      </Text>
      <Text className="mt-1 text-sm text-slate-500">与水平面夹角</Text>
    </View>
  );
}

function MeasureBody() {
  const [permission, requestPermission] = useCameraPermissions();
  const [layout, setLayout] = useState({ w: 0, h: 0 });
  const [p0, setP0] = useState<Pt | null>(null);
  const [p1, setP1] = useState<Pt | null>(null);
  const [planeM, setPlaneM] = useState(1.0);

  const distanceM = useMemo(() => {
    if (!p0 || !p1 || layout.w <= 0) return 0;
    return distanceMetersBetweenPixels(p0, p1, layout.w, planeM, DEFAULT_H_FOV_DEG);
  }, [p0, p1, layout.w, planeM]);

  const onOverlayPress = useCallback(
    (locationX: number, locationY: number) => {
      const pt = { x: locationX, y: locationY };
      if (!p0) {
        void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        setP0(pt);
        return;
      }
      if (!p1) {
        void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
        setP1(pt);
        return;
      }
      void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      setP0(pt);
      setP1(null);
    },
    [p0, p1],
  );

  const bumpPlane = (delta: number) => {
    setPlaneM((v) => clamp(Number((v + delta).toFixed(2)), 0.3, 12));
  };

  if (Platform.OS === "web") {
    return (
      <View className="flex-1 justify-center px-6">
        <Ionicons name="phone-portrait-outline" size={48} color="#64748B" style={{ alignSelf: "center" }} />
        <Text className="mt-4 text-center text-base font-semibold text-white">请在 iOS / Android 应用中使用</Text>
        <Text className="mt-2 text-center text-sm leading-6 text-slate-400">
          测距需要本机相机实时预览；网页端无法达到测距仪体验。可切换到「水平仪」在支持设备上试用（部分浏览器不可用）。
        </Text>
      </View>
    );
  }

  if (!permission) {
    return (
      <View className="flex-1 items-center justify-center px-6">
        <ActivityIndicator color="#94A3B8" />
      </View>
    );
  }

  if (!permission.granted) {
    return (
      <View className="flex-1 items-center justify-center px-6">
        <Text className="text-center text-base text-slate-300">需要相机权限以显示取景画面并取点测距。</Text>
        <Pressable
          onPress={() => void requestPermission()}
          className="mt-4 rounded-xl bg-emerald-600 px-5 py-3 active:opacity-90"
        >
          <Text className="text-center font-semibold text-white">授权相机</Text>
        </Pressable>
      </View>
    );
  }

  return (
    <View className="flex-1 bg-black">
      <View className="px-4 py-2">
        <Text className="text-center text-xs leading-5 text-amber-200/90">
          演示估算：假定目标在与镜头相距约 {planeM.toFixed(1)} m 的竖直平面；非 Apple 测距仪/LiDAR，结果仅供参考。
        </Text>
      </View>

      <View className="flex-1" onLayout={(e) => setLayout({ w: e.nativeEvent.layout.width, h: e.nativeEvent.layout.height })}>
        {layout.w > 0 && layout.h > 0 && (
          <CameraView style={{ flex: 1 }} facing="back" />
        )}
        <Pressable
          className="absolute inset-0"
          onPress={(e) => onOverlayPress(e.nativeEvent.locationX, e.nativeEvent.locationY)}
        >
          {layout.w > 0 && layout.h > 0 && (
            <Svg width={layout.w} height={layout.h} style={{ position: "absolute", left: 0, top: 0 }} pointerEvents="none">
              {p0 && <Circle cx={p0.x} cy={p0.y} r={10} fill="#34D399" stroke="#022C22" strokeWidth={2} />}
              {p1 && <Circle cx={p1.x} cy={p1.y} r={10} fill="#F97316" stroke="#431407" strokeWidth={2} />}
              {p0 && p1 && (
                <Line x1={p0.x} y1={p0.y} x2={p1.x} y2={p1.y} stroke="#F8FAFC" strokeWidth={3} strokeDasharray="12 8" />
              )}
            </Svg>
          )}
        </Pressable>
      </View>

      <View className="border-t border-slate-800 bg-slate-950 px-4 py-3">
        <Text className="text-center text-sm text-slate-400">
          点按画面：第 1 点绿、第 2 点橙；再点一次重新取起点。
        </Text>
        <View className="mt-3 flex-row items-center justify-between gap-3">
          <Text className="text-slate-400">目标距离</Text>
          <View className="flex-row items-center gap-2">
            <Pressable onPress={() => bumpPlane(-0.1)} className="rounded-lg bg-slate-800 px-3 py-2 active:opacity-80">
              <Text className="font-semibold text-white">−</Text>
            </Pressable>
            <Text className="min-w-[52px] text-center font-mono text-white">{planeM.toFixed(1)} m</Text>
            <Pressable onPress={() => bumpPlane(0.1)} className="rounded-lg bg-slate-800 px-3 py-2 active:opacity-80">
              <Text className="font-semibold text-white">+</Text>
            </Pressable>
          </View>
        </View>
        <Text className="mt-3 text-center text-2xl font-bold text-white tabular-nums">
          {(distanceM * 100).toFixed(1)} cm
          <Text className="text-base font-normal text-slate-400"> （{distanceM.toFixed(3)} m）</Text>
        </Text>
        <Pressable
          onPress={() => {
            setP0(null);
            setP1(null);
          }}
          className="mt-3 self-center rounded-lg border border-slate-600 px-4 py-2 active:bg-slate-800"
        >
          <Text className="text-sm text-slate-300">清除标点</Text>
        </Pressable>
      </View>
    </View>
  );
}

export default function ArMeasureScreen() {
  const [mode, setMode] = useState<Mode>("measure");
  const [accel, setAccel] = useState({ x: 0, y: 0, z: 0 });
  const [accelAvail, setAccelAvail] = useState(Platform.OS !== "web");

  useEffect(() => {
    if (mode !== "level" || Platform.OS === "web") return;
    let sub: { remove: () => void } | undefined;
    try {
      Accelerometer.setUpdateInterval(80);
      sub = Accelerometer.addListener((m) => {
        setAccel({ x: m.x, y: m.y, z: m.z });
      });
      setAccelAvail(true);
    } catch {
      setAccelAvail(false);
    }
    return () => sub?.remove();
  }, [mode]);

  return (
    <SafeAreaView className="flex-1 bg-surface-app" edges={["bottom"]}>
      <ToolScreenHeader title="AR 测量" />

      <View className="mx-4 mt-2 flex-row rounded-xl border border-slate-700 bg-slate-900 p-1">
        {(
          [
            { key: "measure" as const, label: "测距" },
            { key: "level" as const, label: "水平仪" },
          ] as const
        ).map((t) => (
          <Pressable
            key={t.key}
            onPress={() => setMode(t.key)}
            className={`flex-1 rounded-lg py-2.5 ${mode === t.key ? "bg-slate-700" : ""}`}
          >
            <Text className={`text-center text-sm font-semibold ${mode === t.key ? "text-white" : "text-slate-500"}`}>
              {t.label}
            </Text>
          </Pressable>
        ))}
      </View>

      {mode === "measure" ? (
        <MeasureBody />
      ) : Platform.OS === "web" && !accelAvail ? (
        <View className="flex-1 justify-center px-6">
          <Text className="text-center text-sm text-slate-400">当前环境不支持设备加速度计，水平仪不可用。</Text>
        </View>
      ) : (
        <LevelGauge x={accel.x} y={accel.y} z={accel.z} />
      )}
    </SafeAreaView>
  );
}
