import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useEffect, useRef, useState } from "react";
import {
  Animated,
  Modal,
  Pressable,
  ScrollView,
  Text,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { LANG_OPTIONS, useLang } from "@/lib/i18n";

// ─── Feature Card ─────────────────────────────────────────────────────────────

type Feature = {
  icon: string;
  color: string;
  bg: string;
  title: string;
  desc: string;
};

function FeatureCard({ icon, color, bg, title, desc }: Feature) {
  return (
    <View className="flex-1 min-w-0 rounded-xl border border-slate-700/60 bg-surface-card p-4">
      <View
        className={`w-10 h-10 rounded-xl ${bg} items-center justify-center mb-3`}
      >
        <Ionicons name={icon as any} size={20} color={color} />
      </View>
      <Text className="text-white font-semibold text-sm mb-1">{title}</Text>
      <Text className="text-slate-400 text-xs leading-relaxed">{desc}</Text>
    </View>
  );
}

// ─── Stat Chip ────────────────────────────────────────────────────────────────

function StatChip({ value, label }: { value: string; label: string }) {
  return (
    <View className="items-center px-4">
      <Text className="text-2xl font-bold text-white">{value}</Text>
      <Text className="text-xs text-slate-400 mt-0.5">{label}</Text>
    </View>
  );
}

// ─── Language Picker ──────────────────────────────────────────────────────────

function LangPicker() {
  const { lang, setLang, t } = useLang();
  const [open, setOpen] = useState(false);
  const current = LANG_OPTIONS.find((o) => o.code === lang) ?? LANG_OPTIONS[0];

  return (
    <>
      <Pressable
        onPress={() => setOpen(true)}
        className="flex-row items-center gap-1.5 bg-surface-elevated px-3 py-1.5 rounded-full active:opacity-70"
      >
        <Text className="text-base">{current.flag}</Text>
        <Text className="text-white text-sm font-medium">{current.label}</Text>
        <Ionicons name="chevron-down" size={13} color="#94A3B8" />
      </Pressable>

      <Modal
        transparent
        animationType="fade"
        visible={open}
        onRequestClose={() => setOpen(false)}
      >
        <Pressable
          className="flex-1 justify-end bg-black/60"
          onPress={() => setOpen(false)}
        >
          <View className="rounded-t-3xl bg-surface-card px-6 pt-5 pb-8">
            <Text className="text-white text-lg font-bold mb-4">{t.langLabel}</Text>
            {LANG_OPTIONS.map((opt) => (
              <Pressable
                key={opt.code}
                onPress={() => { setLang(opt.code); setOpen(false); }}
                className={`flex-row items-center gap-3 rounded-xl px-4 py-3.5 mb-2 active:opacity-70 ${
                  lang === opt.code
                    ? "bg-primary-500/20 border border-primary-500/50"
                    : "bg-surface-elevated"
                }`}
              >
                <Text className="text-2xl">{opt.flag}</Text>
                <Text className="text-white font-medium flex-1">{opt.label}</Text>
                {lang === opt.code && (
                  <Ionicons name="checkmark-circle" size={20} color="#2563EB" />
                )}
              </Pressable>
            ))}
          </View>
        </Pressable>
      </Modal>
    </>
  );
}

// ─── Landing Page ─────────────────────────────────────────────────────────────

const STAT_LABELS = {
  zh: ["包工头", "材料节省", "支持语言"],
  en: ["Contractors", "Saved", "Languages"],
  es: ["Contratistas", "Ahorrado", "Idiomas"],
} as const;

export default function LandingScreen() {
  const router = useRouter();
  const { t, loadLang, lang } = useLang();
  const statLabels = STAT_LABELS[lang] ?? STAT_LABELS.zh;

  // Entrance animation
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(24)).current;

  useEffect(() => {
    loadLang().then(() => {
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 500,
          useNativeDriver: true,
        }),
        Animated.timing(slideAnim, {
          toValue: 0,
          duration: 500,
          useNativeDriver: true,
        }),
      ]).start();
    });
  }, []);

  const features: Feature[] = [
    {
      icon: "language-outline",
      color: "#2563EB",
      bg: "bg-primary-500/15",
      title: t.feature1Title,
      desc: t.feature1Desc,
    },
    {
      icon: "document-text-outline",
      color: "#F97316",
      bg: "bg-accent-500/15",
      title: t.feature2Title,
      desc: t.feature2Desc,
    },
    {
      icon: "pricetag-outline",
      color: "#22C55E",
      bg: "bg-success-500/15",
      title: t.feature3Title,
      desc: t.feature3Desc,
    },
    {
      icon: "briefcase-outline",
      color: "#8B5CF6",
      bg: "bg-purple-500/15",
      title: t.feature4Title,
      desc: t.feature4Desc,
    },
  ];

  return (
    <SafeAreaView className="flex-1 bg-surface-app" edges={["top"]}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 16 }}
      >
        {/* ── 顶部栏：Logo + 语言切换 ── */}
        <View className="flex-row items-center justify-between px-5 pt-4 pb-2">
          <View className="flex-row items-center gap-2">
            <View className="w-8 h-8 rounded-lg bg-primary-600 items-center justify-center">
              <Ionicons name="construct" size={16} color="white" />
            </View>
            <Text className="text-white font-bold text-lg tracking-tight">
              Contractor GO
            </Text>
          </View>
          <LangPicker />
        </View>

        <Animated.View
          style={{ opacity: fadeAnim, transform: [{ translateY: slideAnim }] }}
        >
          {/* ── Hero 区域 ── */}
          <View className="px-5 pt-6 pb-8">
            {/* 渐变背景卡片 */}
            <View
              className="rounded-2xl overflow-hidden p-6 mb-6"
              style={{
                background: "linear-gradient(135deg, #1E3A8A 0%, #1D4ED8 50%, #2563EB 100%)",
                backgroundColor: "#1E3A8A",
              }}
            >
              {/* 装饰圆圈 */}
              <View
                className="absolute -top-8 -right-8 w-32 h-32 rounded-full bg-white/5"
              />
              <View
                className="absolute -bottom-4 -left-4 w-20 h-20 rounded-full bg-white/5"
              />

              {/* 工人图标 */}
              <View className="w-16 h-16 rounded-2xl bg-white/15 items-center justify-center mb-4">
                <Ionicons name="hard-hat-outline" size={32} color="white" />
              </View>

              <Text className="text-3xl font-bold text-white leading-tight">
                {t.tagline}
              </Text>
              <Text className="text-primary-200 text-sm mt-2.5 leading-relaxed">
                {t.subtitle}
              </Text>

              {/* 评分 */}
              <View className="flex-row items-center gap-1 mt-4">
                {[1, 2, 3, 4, 5].map((i) => (
                  <Ionicons key={i} name="star" size={14} color="#FCD34D" />
                ))}
                <Text className="text-primary-200 text-xs ml-1">4.9 · App Store</Text>
              </View>
            </View>

            {/* 数据统计 */}
            <View className="rounded-xl border border-slate-700/60 bg-surface-card py-4 mb-6">
              <View className="flex-row items-center justify-around">
                <StatChip value="5,000+" label={statLabels[0]} />
                <View className="w-px h-8 bg-slate-700" />
                <StatChip value="$2M+" label={statLabels[1]} />
                <View className="w-px h-8 bg-slate-700" />
                <StatChip value="3" label={statLabels[2]} />
              </View>
            </View>

            {/* 功能卡片网格 */}
            <View className="gap-3 mb-6">
              <View className="flex-row gap-3">
                <FeatureCard {...features[0]} />
                <FeatureCard {...features[1]} />
              </View>
              <View className="flex-row gap-3">
                <FeatureCard {...features[2]} />
                <FeatureCard {...features[3]} />
              </View>
            </View>

            {/* 社会认同 */}
            <View className="rounded-xl border border-primary-500/30 bg-primary-500/10 p-4 mb-4">
              <View className="flex-row items-start gap-3">
                <View className="w-10 h-10 rounded-full bg-primary-700 items-center justify-center flex-shrink-0">
                  <Text className="text-white font-bold">张</Text>
                </View>
                <View className="flex-1">
                  <Text className="text-white font-semibold text-sm">老张 · SF 包工头</Text>
                  <Text className="text-slate-300 text-sm mt-1 leading-relaxed">
                    "用了Contractor GO之后，和客户沟通方便多了，报价也专业了，接单量增加了30%"
                  </Text>
                  <View className="flex-row items-center gap-0.5 mt-1.5">
                    {[1,2,3,4,5].map(i => (
                      <Ionicons key={i} name="star" size={11} color="#FCD34D" />
                    ))}
                  </View>
                </View>
              </View>
            </View>

            {/* ── CTA 按钮 ── */}
            <Pressable
              onPress={() => router.push("/(auth)/login")}
              className="min-h-touch-xl items-center justify-center rounded-xl bg-primary-600 active:bg-primary-700 mb-3"
              style={{
                shadowColor: "#2563EB",
                shadowOffset: { width: 0, height: 4 },
                shadowOpacity: 0.4,
                shadowRadius: 12,
              }}
            >
              <Text className="text-white font-bold text-base">{t.startBtn}</Text>
            </Pressable>
            <Pressable
              onPress={() => router.push("/(auth)/login")}
              className="min-h-touch items-center justify-center rounded-xl border border-slate-700 active:bg-surface-elevated"
            >
              <Text className="text-slate-300 text-sm">{t.loginBtn}</Text>
            </Pressable>
          </View>
        </Animated.View>
      </ScrollView>
    </SafeAreaView>
  );
}
