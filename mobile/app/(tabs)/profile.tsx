import { router } from "expo-router";
import { Pressable, Text, View } from "react-native";

import { useAuth } from "@/hooks/useAuth";

export default function ProfileScreen() {
  const user = useAuth((state) => state.user);
  const signOut = useAuth((state) => state.signOut);

  async function handleSignOut() {
    await signOut();
    router.replace("/(auth)/login");
  }

  return (
    <View className="flex-1 bg-slate-950 px-6 py-12">
      <View className="mt-14 rounded-3xl border border-slate-800 bg-slate-900 p-6">
        <Text className="text-sm font-medium uppercase tracking-[2px] text-brand-100">Profile</Text>
        <Text className="mt-4 text-3xl font-bold text-white">账户信息</Text>
        <Text className="mt-3 text-base leading-6 text-slate-300">
          当前登录手机号：{user?.phone ?? "未读取到手机号"}
        </Text>

        <Pressable
          className="mt-8 items-center rounded-2xl border border-slate-700 px-4 py-4"
          onPress={() => {
            void handleSignOut();
          }}
        >
          <Text className="text-base font-semibold text-white">退出登录</Text>
        </Pressable>
      </View>
    </View>
  );
}
