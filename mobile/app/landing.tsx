import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useEffect, useRef, useState } from "react";
import { Animated, Modal, Pressable, ScrollView, Text, View } from "react-native";
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";

import { LogoMark } from "@/components/brand/LogoMark";
import { LANG_OPTIONS, useLang } from "@/lib/i18n";

// ─── Feature Card (Apple-like: breathing room, hairline border) ───────────────

type Feature = {
  icon: string;
  color: string;
  bg: string;
  title: string;
  desc: string;
};

function FeatureCard({ icon, color, bg, title, desc }: Feature) {
  return (
    <View className="min-w-0 flex-1 rounded-[22px] border border-slate-200/90 bg-white p-5 shadow-card">
      <View className={`mb-4 h-11 w-11 items-center justify-center rounded-[14px] ${bg}`}>
        <Ionicons name={icon as "language-outline"} size={22} color={color} />
      </View>
      <Text className="mb-1.5 text-[15px] font-semibold tracking-tight text-ink">{title}</Text>
      <Text className="text-[13px] leading-[20px] text-ink-secondary">{desc}</Text>
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
        className="flex-row items-center gap-1.5 rounded-full border border-slate-200 bg-white px-3.5 py-2 shadow-sm active:opacity-70"
      >
        <Text className="text-base">{current.flag}</Text>
        <Text className="text-[13px] font-medium text-ink">{current.label}</Text>
        <Ionicons name="chevron-down" size={14} color="#8E8E93" />
      </Pressable>

      <Modal transparent animationType="fade" visible={open} onRequestClose={() => setOpen(false)}>
        <Pressable className="flex-1 justify-end bg-black/40" onPress={() => setOpen(false)}>
          <View className="rounded-t-[28px] border-t border-slate-200 bg-white px-6 pb-10 pt-6 shadow-elevated">
            <Text className="mb-5 text-[17px] font-semibold text-ink">{t.langLabel}</Text>
            {LANG_OPTIONS.map((opt) => (
              <Pressable
                key={opt.code}
                onPress={() => {
                  setLang(opt.code);
                  setOpen(false);
                }}
                className={`mb-2 flex-row items-center gap-3 rounded-2xl px-4 py-3.5 active:opacity-80 ${
                  lang === opt.code
                    ? "border border-primary-500/35 bg-primary-500/10"
                    : "border border-slate-100 bg-slate-50"
                }`}
              >
                <Text className="text-2xl">{opt.flag}</Text>
                <Text className="flex-1 text-[16px] font-medium text-ink">{opt.label}</Text>
                {lang === opt.code && <Ionicons name="checkmark-circle" size={22} color="#007AFF" />}
              </Pressable>
            ))}
          </View>
        </Pressable>
      </Modal>
    </>
  );
}

// ─── Landing ──────────────────────────────────────────────────────────────────

export default function LandingScreen() {
  const router = useRouter();
  const { t, loadLang } = useLang();
  const insets = useSafeAreaInsets();

  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(20)).current;
  const scaleAnim = useRef(new Animated.Value(1)).current;

  const handlePressIn = () => {
    Animated.spring(scaleAnim, {
      toValue: 0.98,
      useNativeDriver: true,
      speed: 45,
      bounciness: 3,
    }).start();
  };

  const handlePressOut = () => {
    Animated.spring(scaleAnim, {
      toValue: 1,
      useNativeDriver: true,
      speed: 45,
      bounciness: 3,
    }).start();
  };

  useEffect(() => {
    let cancelled = false;
    loadLang().then(() => {
      if (cancelled) return;
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 480,
          useNativeDriver: true,
        }),
        Animated.timing(slideAnim, {
          toValue: 0,
          duration: 480,
          useNativeDriver: true,
        }),
      ]).start();
    });
    return () => {
      cancelled = true;
    };
  }, [fadeAnim, loadLang, slideAnim]);

  const features: Feature[] = [
    {
      icon: "language-outline",
      color: "#007AFF",
      bg: "bg-primary-500/12",
      title: t.feature1Title,
      desc: t.feature1Desc,
    },
    {
      icon: "document-text-outline",
      color: "#FF9500",
      bg: "bg-orange-500/12",
      title: t.feature2Title,
      desc: t.feature2Desc,
    },
    {
      icon: "pricetag-outline",
      color: "#34C759",
      bg: "bg-emerald-500/12",
      title: t.feature3Title,
      desc: t.feature3Desc,
    },
    {
      icon: "briefcase-outline",
      color: "#5856D6",
      bg: "bg-violet-500/12",
      title: t.feature4Title,
      desc: t.feature4Desc,
    },
  ];

  return (
    <SafeAreaView className="flex-1 bg-surface-app" edges={["top", "left", "right"]}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: Math.max(insets.bottom, 32) }}
        keyboardShouldPersistTaps="handled"
      >
        {/* Top bar */}
        <View className="flex-row items-center justify-between px-6 pb-1 pt-3">
          <View className="flex-row items-center gap-3">
            <LogoMark size={40} variant="onLight" />
            <Text className="text-[20px] font-semibold tracking-tight text-ink">Contractor GO</Text>
          </View>
          <LangPicker />
        </View>

        <Animated.View style={{ opacity: fadeAnim, transform: [{ translateY: slideAnim }] }}>
          <View className="px-6 pt-4">
            {/* Hero — Proma 风格：主色蓝 + 柔和装饰 */}
            <View className="relative mb-10 overflow-hidden rounded-[32px] bg-[#007AFF] px-7 pb-9 pt-10 shadow-button-lg">
              <View className="absolute -right-16 -top-16 h-48 w-48 rounded-full bg-white/15" />
              <View className="absolute -bottom-10 -left-10 h-36 w-36 rounded-full bg-[#5856D6]/35" />
              <View className="absolute bottom-8 right-6 h-24 w-24 rounded-full bg-white/10" />

              <View className="mb-6">
                <LogoMark size={88} variant="onDark" />
              </View>

              <Text className="text-[26px] font-semibold leading-[34px] tracking-tight text-white">
                {t.heroLine1}
              </Text>
              <Text className="mt-3 text-[17px] font-medium leading-[24px] tracking-tight text-white/95">
                {t.heroLine2}
              </Text>
              <Text className="mt-3 text-[17px] font-medium leading-[24px] tracking-tight text-white/95">
                {t.heroLine3}
              </Text>

              <View className="mt-7 flex-row flex-wrap items-center gap-2">
                <View className="rounded-full bg-black/10 px-3 py-1.5">
                  <Text className="text-[12px] font-medium tracking-wide text-white/95">{t.heroProof}</Text>
                </View>
              </View>
            </View>

            {/* Languages */}
            <View className="mb-10 rounded-[22px] border border-slate-200 bg-white px-6 py-5 shadow-card">
              <Text className="mb-1 text-center text-[11px] font-semibold uppercase tracking-[0.14em] text-ink-tertiary">
                {t.languagesLabel}
              </Text>
              <Text className="text-center text-[16px] font-medium tracking-tight text-ink">{t.languagesValue}</Text>
            </View>

            {/* Section: features */}
            <Text className="mb-4 px-1 text-[13px] font-semibold uppercase tracking-[0.12em] text-ink-tertiary">
              {t.sectionFeatures}
            </Text>
            <View className="mb-10 gap-3">
              <View className="flex-row gap-3">
                <FeatureCard {...features[0]} />
                <FeatureCard {...features[1]} />
              </View>
              <View className="flex-row gap-3">
                <FeatureCard {...features[2]} />
                <FeatureCard {...features[3]} />
              </View>
            </View>

            {/* Testimonial */}
            <Text className="mb-4 px-1 text-[13px] font-semibold uppercase tracking-[0.12em] text-ink-tertiary">
              {t.sectionStories}
            </Text>
            <View className="mb-8 rounded-[22px] border border-slate-200 bg-white p-6 shadow-card">
              <View className="flex-row items-start gap-4">
                <View className="h-11 w-11 items-center justify-center rounded-full bg-primary-500/12">
                  <Text className="text-[15px] font-semibold text-primary-600">{t.testimonialInitial}</Text>
                </View>
                <View className="min-w-0 flex-1">
                  <Text className="text-[15px] font-semibold text-ink">{t.testimonialName}</Text>
                  <Text className="mt-2 text-[15px] leading-[22px] text-ink-secondary">{t.testimonialQuote}</Text>
                  <View className="mt-3 flex-row gap-0.5">
                    {[1, 2, 3, 4, 5].map((i) => (
                      <Ionicons key={i} name="star" size={12} color="#FFCC00" />
                    ))}
                  </View>
                </View>
              </View>
            </View>

            {/* CTA */}
            <Pressable
              onPress={() => router.push("/(auth)/login")}
              onPressIn={handlePressIn}
              onPressOut={handlePressOut}
            >
              <Animated.View
                className="min-h-[52px] items-center justify-center rounded-full bg-primary-500 active:bg-primary-600"
                style={{
                  transform: [{ scale: scaleAnim }],
                  shadowColor: "#007AFF",
                  shadowOffset: { width: 0, height: 8 },
                  shadowOpacity: 0.3,
                  shadowRadius: 16,
                }}
              >
                <Text className="text-[17px] font-semibold text-white">{t.startBtn}</Text>
              </Animated.View>
            </Pressable>
            <Pressable
              onPress={() => router.push("/(auth)/login")}
              className="mt-4 min-h-[48px] items-center justify-center rounded-full border border-slate-300 bg-white active:bg-slate-50"
            >
              <Text className="text-[15px] text-primary-600">{t.loginBtn}</Text>
            </Pressable>
          </View>
        </Animated.View>
      </ScrollView>
    </SafeAreaView>
  );
}
