import { useMemo, useState } from "react";
import {
  Modal,
  Pressable,
  Text,
  TextInput,
  View,
  type NativeSyntheticEvent,
  type TextInputFocusEventData,
} from "react-native";

const COUNTRY_OPTIONS = [
  { code: "+1", label: "United States" },
  { code: "+86", label: "China" },
  { code: "+52", label: "Mexico" },
];

type PhoneInputProps = {
  countryCode: string;
  phoneNumber: string;
  onCountryCodeChange: (value: string) => void;
  onPhoneNumberChange: (value: string) => void;
};

export function PhoneInput({
  countryCode,
  phoneNumber,
  onCountryCodeChange,
  onPhoneNumberChange,
}: PhoneInputProps) {
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [isFocused, setIsFocused] = useState(false);

  const selectedCountry = useMemo(
    () => COUNTRY_OPTIONS.find((item) => item.code === countryCode) ?? COUNTRY_OPTIONS[0],
    [countryCode],
  );

  const onFocus = (e: NativeSyntheticEvent<TextInputFocusEventData>) => {
    setIsFocused(true);
  };
  const onBlur = () => setIsFocused(false);

  return (
    <View className="gap-2">
      <Text className="text-sm font-medium text-ink">手机号</Text>
      <View
        className={`flex-row items-center rounded-auth-input border bg-surface-card px-4 py-3 ${
          isFocused ? "border-primary-500" : "border-surface-border"
        }`}
      >
        <Pressable
          onPress={() => setIsModalVisible(true)}
          className="mr-3 min-h-[40px] min-w-[56px] items-center justify-center rounded-lg bg-surface-elevated px-3 py-2"
          accessibilityLabel="选择国家区号"
          accessibilityRole="button"
        >
          <Text className="font-semibold text-ink">{selectedCountry.code}</Text>
        </Pressable>
        <TextInput
          value={phoneNumber}
          onChangeText={(value) => onPhoneNumberChange(value.replace(/[^\d]/g, ""))}
          onFocus={onFocus}
          onBlur={onBlur}
          keyboardType="phone-pad"
          placeholder="请输入手机号"
          placeholderTextColor="#64748b"
          className="flex-1 text-base text-ink"
          maxLength={15}
        />
        {phoneNumber.length > 0 && (
          <Pressable
            onPress={() => onPhoneNumberChange("")}
            className="ml-2 rounded-lg p-2"
            accessibilityLabel="清空"
            hitSlop={8}
          >
            <Text className="text-sm font-medium text-primary-500">清空</Text>
          </Pressable>
        )}
      </View>

      <Modal
        animationType="slide"
        transparent
        visible={isModalVisible}
        onRequestClose={() => setIsModalVisible(false)}
      >
        <Pressable
          className="flex-1 justify-end bg-black/60"
          onPress={() => setIsModalVisible(false)}
        >
          <View className="rounded-t-3xl border-t border-surface-border bg-surface-card p-6 pb-8">
            <Text className="mb-4 text-lg font-semibold text-ink">选择区号</Text>
            {COUNTRY_OPTIONS.map((option) => (
              <Pressable
                key={option.code}
                onPress={() => {
                  onCountryCodeChange(option.code);
                  setIsModalVisible(false);
                }}
                className="mb-2 min-h-touch items-center justify-center rounded-xl bg-surface-elevated px-4 py-3 active:bg-surface-highlight"
              >
                <Text className="text-base font-medium text-ink">
                  {option.code} · {option.label}
                </Text>
              </Pressable>
            ))}
            <Pressable
              onPress={() => setIsModalVisible(false)}
              className="mt-4 min-h-touch items-center justify-center rounded-auth-button bg-primary-500 px-4 py-3"
            >
              <Text className="font-semibold text-white">完成</Text>
            </Pressable>
          </View>
        </Pressable>
      </Modal>
    </View>
  );
}
