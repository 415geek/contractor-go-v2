import { View, Text, Pressable, LayoutAnimation, Platform, UIManager } from "react-native";

import { iosComm } from "@/lib/ios-comm-theme";

export type CommHubTab = "phone" | "sms" | "contacts";

const TABS: { key: CommHubTab; label: string }[] = [
  { key: "phone", label: "电话" },
  { key: "sms", label: "短信" },
  { key: "contacts", label: "联系人" },
];

if (Platform.OS === "android" && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

type Props = {
  value: CommHubTab;
  onChange: (v: CommHubTab) => void;
};

/**
 * 类 iOS UISegmentedControl：深色底、选中块略亮、圆角胶囊容器。
 */
export function CommSegmentedControl({ value, onChange }: Props) {
  return (
    <View
      style={{
        flexDirection: "row",
        marginHorizontal: iosComm.screenPaddingH,
        marginBottom: 12,
        padding: 3,
        borderRadius: 10,
        backgroundColor: iosComm.groupedSecondary,
      }}
    >
      {TABS.map(({ key, label }) => {
        const selected = value === key;
        return (
          <Pressable
            key={key}
            onPress={() => {
              LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
              onChange(key);
            }}
            style={{
              flex: 1,
              paddingVertical: 8,
              borderRadius: 8,
              backgroundColor: selected ? "rgba(118, 118, 128, 0.35)" : "transparent",
            }}
          >
            <Text
              style={{
                textAlign: "center",
                fontSize: 13,
                fontWeight: selected ? "600" : "500",
                color: selected ? iosComm.label : iosComm.secondaryLabel,
              }}
              numberOfLines={1}
            >
              {label}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}
