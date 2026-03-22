import { createRef, useMemo } from "react";
import { TextInput, View } from "react-native";

type OtpInputProps = {
  value: string;
  onChange: (value: string) => void;
  onComplete?: (value: string) => void;
  length?: number;
};

export function OtpInput({
  value,
  onChange,
  onComplete,
  length = 6,
}: OtpInputProps) {
  const refs = useMemo(
    () => Array.from({ length }, () => createRef<TextInput>()),
    [length],
  );
  const digits = Array.from({ length }, (_, index) => value[index] ?? "");

  const updateCode = (nextValue: string) => {
    const sanitized = nextValue.replace(/[^\d]/g, "").slice(0, length);
    onChange(sanitized);
    if (sanitized.length === length) onComplete?.(sanitized);
  };

  return (
    <View className="flex-row gap-2">
      {digits.map((digit, index) => (
        <TextInput
          key={index}
          ref={refs[index]}
          value={digit}
          onChangeText={(text) => {
            if (text.length > 1) {
              updateCode(text);
              refs[Math.min(length - 1, text.length - 1)].current?.focus();
              return;
            }
            const sanitizedText = text.replace(/[^\d]/g, "");
            const nextDigits = [...digits];
            nextDigits[index] = sanitizedText;
            const nextValue = nextDigits.join("").slice(0, length);
            updateCode(nextValue);
            if (sanitizedText && index < length - 1) {
              refs[index + 1].current?.focus();
            }
          }}
          onKeyPress={({ nativeEvent }) => {
            if (nativeEvent.key === "Backspace" && !digits[index] && index > 0) {
              refs[index - 1].current?.focus();
            }
          }}
          keyboardType="number-pad"
          maxLength={index === 0 ? length : 1}
          textAlign="center"
          placeholder="·"
          placeholderTextColor="#64748b"
          className="h-12 flex-1 rounded-auth-input border-2 border-surface-border bg-surface-card text-lg font-semibold text-ink"
          selectTextOnFocus
        />
      ))}
    </View>
  );
}
