import { useState } from "react";
import { Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import * as Linking from "expo-linking";
import { View, Text, Pressable, Platform, ScrollView } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { iosComm } from "@/lib/ios-comm-theme";
import { alertCrossPlatform } from "@/lib/alert-cross-platform";

const ROWS: string[][] = [
  ["1", "2", "3"],
  ["4", "5", "6"],
  ["7", "8", "9"],
  ["*", "0", "#"],
];

function digitsToE164US(digits: string): string {
  const d = digits.replace(/\D/g, "");
  if (d.length === 0) return "";
  if (d.length === 10) return `+1${d}`;
  if (d.length === 11 && d.startsWith("1")) return `+${d}`;
  return d.startsWith("+") ? d : `+${d}`;
}

function haptic() {
  if (Platform.OS === "ios") {
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  }
}

type Props = {
  hasVirtualNumber: boolean;
  myDidLabel: string;
  onComposeSms: (e164: string) => void;
};

/**
 * 类 iOS「电话」拨号盘：大号号码显示、圆键、呼叫 / 发短信。
 */
export function PhoneDialPadTab({ hasVirtualNumber, myDidLabel, onComposeSms }: Props) {
  const insets = useSafeAreaInsets();
  const [raw, setRaw] = useState("");

  const append = (ch: string) => {
    haptic();
    setRaw((r) => r + ch);
  };

  const backspace = () => {
    haptic();
    setRaw((r) => r.slice(0, -1));
  };

  const e164 = digitsToE164US(raw);
  const canAct = e164.replace(/\D/g, "").length >= 10;

  const handleCall = async () => {
    if (!canAct) {
      alertCrossPlatform("请输入号码", "至少输入 10 位数字。");
      return;
    }
    const url = `tel:${e164.replace(/\s/g, "")}`;
    const ok = await Linking.canOpenURL(url);
    if (!ok) {
      alertCrossPlatform("无法拨号", "当前设备或浏览器不支持系统电话；请在手机上使用。");
      return;
    }
    await Linking.openURL(url);
  };

  const handleSms = () => {
    if (!hasVirtualNumber) {
      alertCrossPlatform("需要虚拟号码", "请先开通虚拟号码，再通过应用内短信发送。");
      return;
    }
    if (!canAct) {
      alertCrossPlatform("请输入号码", "至少输入 10 位数字。");
      return;
    }
    onComposeSms(e164);
  };

  return (
    <ScrollView
      style={{ flex: 1 }}
      contentContainerStyle={{
        paddingBottom: Math.max(insets.bottom, 24),
        paddingTop: 8,
      }}
      keyboardShouldPersistTaps="handled"
    >
      <View
        style={{
          marginHorizontal: iosComm.screenPaddingH,
          marginBottom: 20,
          paddingVertical: 14,
          paddingHorizontal: 16,
          borderRadius: 12,
          backgroundColor: iosComm.groupedSecondary,
        }}
      >
        <Text style={{ color: iosComm.secondaryLabel, fontSize: 12, marginBottom: 6 }}>本机（虚拟号）</Text>
        <Text style={{ color: iosComm.label, fontSize: 17, fontWeight: "600" }} numberOfLines={1}>
          {hasVirtualNumber ? myDidLabel : "未开通 — 短信与来电识别依赖此号码"}
        </Text>
      </View>

      <Text
        style={{
          color: iosComm.label,
          fontSize: 36,
          fontWeight: "300",
          letterSpacing: 2,
          textAlign: "center",
          marginBottom: 28,
          minHeight: 44,
        }}
        numberOfLines={1}
        adjustsFontSizeToFit
      >
        {raw || " "}
      </Text>

      {ROWS.map((row, ri) => (
        <View key={ri} style={{ flexDirection: "row", justifyContent: "center", gap: 18, marginBottom: 18 }}>
          {row.map((d) => (
            <Pressable
              key={d}
              onPress={() => append(d)}
              style={{
                width: 78,
                height: 78,
                borderRadius: 39,
                backgroundColor: iosComm.groupedSecondary,
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <Text style={{ color: iosComm.label, fontSize: 32, fontWeight: "300" }}>{d}</Text>
            </Pressable>
          ))}
        </View>
      ))}

      <View style={{ flexDirection: "row", justifyContent: "center", alignItems: "center", gap: 24, marginTop: 8 }}>
        <View style={{ width: 78 }} />
        <Pressable
          onPress={backspace}
          onLongPress={() => setRaw("")}
          style={{
            width: 78,
            height: 78,
            borderRadius: 39,
            backgroundColor: iosComm.groupedSecondary,
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <Ionicons name="backspace-outline" size={28} color={iosComm.label} />
        </Pressable>
        <View style={{ width: 78 }} />
      </View>

      <View
        style={{
          flexDirection: "row",
          gap: 12,
          marginHorizontal: iosComm.screenPaddingH,
          marginTop: 32,
        }}
      >
        <Pressable
          onPress={handleCall}
          disabled={!canAct}
          style={{
            flex: 1,
            height: 54,
            borderRadius: 12,
            backgroundColor: canAct ? iosComm.systemGreen : iosComm.inputFill,
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <Text style={{ color: "#fff", fontSize: 17, fontWeight: "600" }}>呼叫</Text>
        </Pressable>
        <Pressable
          onPress={handleSms}
          disabled={!canAct || !hasVirtualNumber}
          style={{
            flex: 1,
            height: 54,
            borderRadius: 12,
            backgroundColor: canAct && hasVirtualNumber ? iosComm.systemBlue : iosComm.inputFill,
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <Text style={{ color: "#fff", fontSize: 17, fontWeight: "600" }}>短信</Text>
        </Pressable>
      </View>

      <Text
        style={{
          color: iosComm.tertiaryLabel,
          fontSize: 12,
          textAlign: "center",
          marginTop: 16,
          paddingHorizontal: 32,
          lineHeight: 18,
        }}
      >
        「呼叫」使用系统电话；「短信」进入应用内会话（经虚拟号码发出）。长按删除键可清空号码。
      </Text>
    </ScrollView>
  );
}
