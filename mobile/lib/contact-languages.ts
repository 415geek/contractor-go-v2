/** 对方「看到的语言」——与 translate / send-message 的 target_lang 一致 */
export const CONTACT_LANGUAGE_OPTIONS: { value: string; label: string }[] = [
  { value: "zh-CN", label: "简体中文" },
  { value: "zh-TW", label: "繁體中文" },
  { value: "en", label: "English" },
  { value: "en-US", label: "English (US)" },
  { value: "es", label: "Español" },
  { value: "es-MX", label: "Español (México)" },
];

export function contactLanguageLabel(value: string): string {
  return CONTACT_LANGUAGE_OPTIONS.find((o) => o.value === value)?.label ?? value;
}
