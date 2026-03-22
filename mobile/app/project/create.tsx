import { Ionicons } from "@expo/vector-icons";
import { readAsStringAsync, EncodingType } from "expo-file-system/legacy";
import { useRouter } from "expo-router";
import { useState } from "react";
import {
  View,
  Text,
  ScrollView,
  TextInput,
  Pressable,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Alert,
} from "react-native";

import { useAuth } from "@clerk/clerk-expo";

import { useProjects } from "@/hooks/useProjects";
import { useVoiceRecording } from "@/hooks/useVoiceRecording";
import { parseProjectViaEdge } from "@/lib/api/parse-project";
import { supabase } from "@/lib/supabase";

type ParseResult = {
  project_name: string | null;
  address: string | null;
  project_type: string | null;
  total_cost: number | null;
  contract_type: string | null;
  start_date: string | null;
  duration_days: number | null;
  client_name: string | null;
  client_phone: string | null;
  materials_mentioned: string[];
  key_tasks: string[];
  notes: string | null;
};

type Mode = "manual" | "ai";

export default function CreateProjectScreen() {
  const router = useRouter();
  const { getToken: _getToken } = useAuth();
  const getToken = () => _getToken();
  const { create, createLoading } = useProjects();
  const [mode, setMode] = useState<Mode>("manual");
  const [name, setName] = useState("");
  const [address, setAddress] = useState("");
  const [clientName, setClientName] = useState("");
  const [clientPhone, setClientPhone] = useState("");
  const [totalCost, setTotalCost] = useState("");
  const [startDate, setStartDate] = useState("");
  const [durationDays, setDurationDays] = useState("");

  const [aiInput, setAiInput] = useState("");
  const [parseLoading, setParseLoading] = useState(false);
  const [parsed, setParsed] = useState<ParseResult | null>(null);
  /** Web 上 Alert 常不可见，用行内提示 */
  const [parseBanner, setParseBanner] = useState<{ kind: "error" | "info"; text: string } | null>(null);
  const { isRecording, duration, startRecording, stopRecording } = useVoiceRecording();

  const applyParsed = (p: ParseResult) => {
    setName(p.project_name ?? "");
    setAddress(p.address ?? "");
    setClientName(p.client_name ?? "");
    setClientPhone(p.client_phone ?? "");
    setTotalCost(p.total_cost != null ? String(p.total_cost) : "");
    setStartDate(p.start_date ?? "");
    setDurationDays(p.duration_days != null ? String(p.duration_days) : "");
  };

  const showParseError = (title: string, message: string) => {
    setParseBanner({ kind: "error", text: `${title}${message ? `：${message}` : ""}` });
    if (Platform.OS === "web" && typeof window !== "undefined") {
      window.alert(`${title}\n${message}`);
    } else {
      Alert.alert(title, message);
    }
  };

  const handleAiParse = async () => {
    const text = aiInput.trim();
    if (!text) return;
    setParseLoading(true);
    setParsed(null);
    setParseBanner(null);
    try {
      const token = await getToken();
      if (!token) throw new Error("未登录");
      const { parsed: result } = await parseProjectViaEdge(token, { input: text, input_type: "text" });
      if (!result) {
        throw new Error("服务未返回解析结果，请重试");
      }
      setParsed(result);
      applyParsed(result);
      setParseBanner({ kind: "info", text: "解析完成，请确认下方字段后保存。" });
    } catch (e) {
      const msg = e instanceof Error ? e.message : "请重试";
      showParseError("解析失败", msg);
    } finally {
      setParseLoading(false);
    }
  };

  const doVoiceParse = async (uri: string) => {
    setParseLoading(true);
    setParsed(null);
    setParseBanner(null);
    try {
      const base64 = await readAsStringAsync(uri, {
        encoding: EncodingType.Base64,
      });
      const token = await getToken();
      if (!token) throw new Error("未登录");
      const { parsed: result } = await parseProjectViaEdge(token, {
        input_type: "voice",
        audio_base64: base64,
        audio_mime: Platform.OS === "ios" ? "audio/m4a" : "audio/webm",
      });
      if (!result) {
        throw new Error("服务未返回解析结果，请重试");
      }
      setParsed(result);
      applyParsed(result);
      setParseBanner({ kind: "info", text: "语音解析完成，请确认下方字段后保存。" });
    } catch (e) {
      const msg = e instanceof Error ? e.message : "请重试";
      showParseError("语音解析失败", msg);
    } finally {
      setParseLoading(false);
    }
  };

  const handleSave = async () => {
    if (!name.trim()) return;
    const cost = parseFloat(totalCost) || 0;
    const days = durationDays ? parseInt(durationDays, 10) : undefined;
    const project = await create({
      name: name.trim(),
      address: address.trim() || undefined,
      client_name: clientName.trim() || undefined,
      client_phone: clientPhone.trim() || undefined,
      total_cost: cost,
      start_date: startDate.trim() || undefined,
      duration_days: days,
    });
    try {
      const token = await getToken();
      if (token) {
        await supabase.functions.invoke("generate-plan", {
          method: "POST",
          headers: { Authorization: `Bearer ${token}` },
          body: { project_id: project.id },
        });
      }
    } catch {
      // non-blocking
    }
    router.replace("/(tabs)/projects");
  };

  const showForm = mode === "manual" || (mode === "ai" && parsed);

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : undefined}
      className="flex-1 bg-slate-950"
    >
      <View className="border-b border-slate-800 px-4 pt-12 pb-4">
        <View className="flex-row items-center justify-between">
          <Pressable onPress={() => router.back()} className="p-1">
            <Ionicons name="arrow-back" size={24} color="#F8FAFC" />
          </Pressable>
          <Text className="text-lg font-semibold text-white">新建项目</Text>
          <View className="w-8" />
        </View>
        <View className="mt-4 flex-row rounded-lg bg-slate-800 p-1">
          <Pressable
            onPress={() => {
              setMode("manual");
              setParsed(null);
              setParseBanner(null);
            }}
            className={`flex-1 rounded-md py-2 ${mode === "manual" ? "bg-slate-700" : ""}`}
          >
            <Text className={`text-center text-sm font-medium ${mode === "manual" ? "text-white" : "text-slate-400"}`}>
              手动填写
            </Text>
          </Pressable>
          <Pressable
            onPress={() => {
              setMode("ai");
              setParseBanner(null);
            }}
            className={`flex-1 rounded-md py-2 ${mode === "ai" ? "bg-slate-700" : ""}`}
          >
            <Text className={`text-center text-sm font-medium ${mode === "ai" ? "text-white" : "text-slate-400"}`}>
              AI解析
            </Text>
          </Pressable>
        </View>
      </View>
      <ScrollView
        className="flex-1"
        contentContainerClassName="px-4 py-6 pb-8"
        keyboardShouldPersistTaps="handled"
      >
        {mode === "ai" && !parsed && (
          <View className="mb-6 gap-4">
            <View>
              <Text className="mb-1.5 text-sm font-medium text-slate-400">描述项目（文字或语音）</Text>
              <TextInput
                value={aiInput}
                onChangeText={setAiInput}
                placeholder="例：新增一个位于1117 Clement St的厕所翻新项目，总造价1万元，包工包料，3月15号开工，工期1个月"
                placeholderTextColor="#64748B"
                multiline
                numberOfLines={4}
                className="min-h-[120] rounded-xl border border-slate-700 bg-slate-800/80 px-4 py-3 text-white"
              />
            </View>
            {parseBanner != null && (
              <View
                className={`rounded-lg px-3 py-2 ${parseBanner.kind === "error" ? "bg-red-900/40" : "bg-blue-900/30"}`}
              >
                <Text
                  className={`text-sm ${parseBanner.kind === "error" ? "text-red-300" : "text-blue-200"}`}
                >
                  {parseBanner.text}
                </Text>
              </View>
            )}
            <View className="flex-row gap-3">
              <Pressable
                onPress={handleAiParse}
                disabled={!aiInput.trim() || parseLoading}
                className="flex-1 rounded-xl bg-blue-600 py-3 disabled:opacity-50"
              >
                {parseLoading ? (
                  <ActivityIndicator color="white" />
                ) : (
                  <Text className="text-center font-semibold text-white">AI 解析</Text>
                )}
              </Pressable>
              <Pressable
                onPress={isRecording ? async () => { const u = await stopRecording(); if (u) await doVoiceParse(u); } : startRecording}
                className="rounded-xl border border-slate-600 bg-slate-800 px-4 py-3"
              >
                <Ionicons
                  name={isRecording ? "stop-circle" : "mic"}
                  size={24}
                  color={isRecording ? "#EF4444" : "#94A3B8"}
                />
                {isRecording && (
                  <Text className="text-center text-xs text-slate-400">{duration}s</Text>
                )}
              </Pressable>
            </View>
          </View>
        )}

        {mode === "ai" && parsed && (
          <View className="mb-4 rounded-xl border border-green-800/50 bg-green-900/20 p-4">
            <Text className="mb-2 text-sm font-medium text-green-400">解析结果预览</Text>
            <Text className="text-slate-300">名称: {parsed.project_name ?? "-"}</Text>
            <Text className="text-slate-300">地址: {parsed.address ?? "-"}</Text>
            <Text className="text-slate-300">客户: {parsed.client_name ?? "-"}</Text>
            <Text className="text-slate-300">总价: {parsed.total_cost ?? "-"}</Text>
            <Text className="text-slate-300">开工: {parsed.start_date ?? "-"}</Text>
            <Text className="text-slate-300">工期: {parsed.duration_days ?? "-"} 天</Text>
            <Pressable
              onPress={() => {
                setParsed(null);
                setParseBanner(null);
              }}
              className="mt-2"
            >
              <Text className="text-sm text-blue-400">重新解析</Text>
            </Pressable>
          </View>
        )}

        {showForm && (
          <View className="gap-4">
            <View>
              <Text className="mb-1.5 text-sm font-medium text-slate-400">项目名称 *</Text>
              <TextInput
                value={name}
                onChangeText={setName}
                placeholder="请输入项目名称"
                placeholderTextColor="#64748B"
                className="rounded-xl border border-slate-700 bg-slate-800/80 px-4 py-3 text-white"
              />
            </View>
            <View>
              <Text className="mb-1.5 text-sm font-medium text-slate-400">地址</Text>
              <TextInput
                value={address}
                onChangeText={setAddress}
                placeholder="请输入地址"
                placeholderTextColor="#64748B"
                className="rounded-xl border border-slate-700 bg-slate-800/80 px-4 py-3 text-white"
              />
            </View>
            <View>
              <Text className="mb-1.5 text-sm font-medium text-slate-400">客户名</Text>
              <TextInput
                value={clientName}
                onChangeText={setClientName}
                placeholder="客户姓名"
                placeholderTextColor="#64748B"
                className="rounded-xl border border-slate-700 bg-slate-800/80 px-4 py-3 text-white"
              />
            </View>
            <View>
              <Text className="mb-1.5 text-sm font-medium text-slate-400">电话</Text>
              <TextInput
                value={clientPhone}
                onChangeText={setClientPhone}
                placeholder="客户电话"
                placeholderTextColor="#64748B"
                keyboardType="phone-pad"
                className="rounded-xl border border-slate-700 bg-slate-800/80 px-4 py-3 text-white"
              />
            </View>
            <View>
              <Text className="mb-1.5 text-sm font-medium text-slate-400">总价</Text>
              <TextInput
                value={totalCost}
                onChangeText={setTotalCost}
                placeholder="0"
                placeholderTextColor="#64748B"
                keyboardType="decimal-pad"
                className="rounded-xl border border-slate-700 bg-slate-800/80 px-4 py-3 text-white"
              />
            </View>
            <View>
              <Text className="mb-1.5 text-sm font-medium text-slate-400">开工日期</Text>
              <TextInput
                value={startDate}
                onChangeText={setStartDate}
                placeholder="YYYY-MM-DD"
                placeholderTextColor="#64748B"
                className="rounded-xl border border-slate-700 bg-slate-800/80 px-4 py-3 text-white"
              />
            </View>
            <View>
              <Text className="mb-1.5 text-sm font-medium text-slate-400">工期（天）</Text>
              <TextInput
                value={durationDays}
                onChangeText={setDurationDays}
                placeholder="天数"
                placeholderTextColor="#64748B"
                keyboardType="number-pad"
                className="rounded-xl border border-slate-700 bg-slate-800/80 px-4 py-3 text-white"
              />
            </View>
          </View>
        )}

        {showForm && (
          <Pressable
            onPress={handleSave}
            disabled={!name.trim() || createLoading}
            className="mt-8 rounded-xl bg-blue-600 py-3.5 active:bg-blue-700 disabled:opacity-50"
          >
            {createLoading ? (
              <ActivityIndicator color="white" />
            ) : (
              <Text className="text-center font-semibold text-white">
                {mode === "ai" && parsed ? "确认创建" : "保存"}
              </Text>
            )}
          </Pressable>
        )}
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
