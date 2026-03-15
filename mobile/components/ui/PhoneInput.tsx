import { useMemo, useState } from "react";
import { Modal, Pressable, Text, TextInput, View } from "react-native";

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

  const selectedCountry = useMemo(
    () => COUNTRY_OPTIONS.find((item) => item.code === countryCode) ?? COUNTRY_OPTIONS[0],
    [countryCode],
  );

  return (
    <View className="gap-3">
      <Text className="text-sm text-gray-400">手机号 / Numero de telefono</Text>
      <View className="flex-row items-center rounded-xl border border-gray-700 bg-gray-800 px-4 py-3">
        <Pressable onPress={() => setIsModalVisible(true)} className="mr-3 rounded-lg bg-gray-700 px-3 py-2">
          <Text className="font-semibold text-white">{selectedCountry.code}</Text>
        </Pressable>
        <TextInput
          value={phoneNumber}
          onChangeText={(value) => onPhoneNumberChange(value.replace(/[^\d]/g, ""))}
          keyboardType="phone-pad"
          placeholder="5551234567"
          placeholderTextColor="#6B7280"
          className="flex-1 text-base text-white"
        />
        {phoneNumber.length > 0 ? (
          <Pressable onPress={() => onPhoneNumberChange("")} className="ml-3 rounded-lg bg-gray-700 px-3 py-2">
            <Text className="font-semibold text-gray-200">Clear</Text>
          </Pressable>
        ) : null}
      </View>

      <Modal animationType="slide" transparent visible={isModalVisible} onRequestClose={() => setIsModalVisible(false)}>
        <View className="flex-1 justify-end bg-black/60">
          <View className="rounded-t-3xl bg-gray-900 p-6">
            <Text className="mb-4 text-lg font-semibold text-white">选择区号 / Selecciona</Text>
            {COUNTRY_OPTIONS.map((option) => (
              <Pressable
                key={option.code}
                onPress={() => {
                  onCountryCodeChange(option.code);
                  setIsModalVisible(false);
                }}
                className="mb-3 rounded-xl border border-gray-700 bg-gray-800 px-4 py-4"
              >
                <Text className="text-base font-medium text-white">
                  {option.code} · {option.label}
                </Text>
              </Pressable>
            ))}
            <Pressable onPress={() => setIsModalVisible(false)} className="mt-2 rounded-xl bg-blue-500 px-4 py-4">
              <Text className="text-center font-semibold text-white">完成</Text>
            </Pressable>
          </View>
        </View>
      </Modal>
    </View>
  );
}
