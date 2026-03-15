import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { Pressable, Text, View } from "react-native";

export default function ToolsScreen() {
  const router = useRouter();
  return (
    <View className="flex-1 bg-slate-950 px-6 py-12">
      <View className="mt-14 rounded-3xl border border-slate-800 bg-slate-900 p-6">
        <Text className="text-sm font-medium uppercase tracking-[2px] text-brand-100">Tools</Text>
        <Text className="mt-4 text-3xl font-bold text-white">工具中心</Text>
        <Text className="mt-3 text-base leading-6 text-slate-300">
          估价、材料搜索与 Permit 查询。
        </Text>
        <Pressable
          onPress={() => router.push("/voip")}
          className="mt-6 flex-row items-center gap-3 rounded-xl border border-slate-700 bg-slate-800 p-4"
        >
          <Ionicons name="call" size={24} color="#3B82F6" />
          <View className="flex-1">
            <Text className="text-white font-medium">虚拟号码</Text>
            <Text className="text-slate-400 text-sm">购买和管理 Voip.ms 号码</Text>
          </View>
          <Ionicons name="chevron-forward" size={20} color="#9CA3AF" />
        </Pressable>
        <Pressable
          onPress={() => router.push("/tools/material-price")}
          className="mt-3 flex-row items-center gap-3 rounded-xl border border-slate-700 bg-slate-800 p-4"
        >
          <Ionicons name="pricetag" size={24} color="#10B981" />
          <View className="flex-1">
            <Text className="text-white font-medium">材料价格</Text>
            <Text className="text-slate-400 text-sm">拍照识别材料，搜索 HomeDepot / Lowes 价格</Text>
          </View>
          <Ionicons name="chevron-forward" size={20} color="#9CA3AF" />
        </Pressable>
        <Pressable
          onPress={() => router.push("/tools/house-estimate")}
          className="mt-3 flex-row items-center gap-3 rounded-xl border border-slate-700 bg-slate-800 p-4"
        >
          <Ionicons name="home" size={24} color="#F59E0B" />
          <View className="flex-1">
            <Text className="text-white font-medium">房屋估价</Text>
            <Text className="text-slate-400 text-sm">上传装修照片，AI 分割材料并估算总价</Text>
          </View>
          <Ionicons name="chevron-forward" size={20} color="#9CA3AF" />
        </Pressable>
        <Pressable
          onPress={() => router.push("/tools/permit")}
          className="mt-3 flex-row items-center gap-3 rounded-xl border border-slate-700 bg-slate-800 p-4"
        >
          <Ionicons name="document-text" size={24} color="#8B5CF6" />
          <View className="flex-1">
            <Text className="text-white font-medium">Permit 查询</Text>
            <Text className="text-slate-400 text-sm">湾区城市许可证公开数据查询</Text>
          </View>
          <Ionicons name="chevron-forward" size={20} color="#9CA3AF" />
        </Pressable>
      </View>
    </View>
  );
}
