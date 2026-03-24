/**
 * 出站/入库统一：尽量规范为 E.164，美国 10 位默认补 +1。
 * 与 Telnyx `telnyxSendSms` 内 `normalizeToE164US` 行为一致。
 */
export function normalizeSmsPhone(p: string): string {
  const raw = (p ?? "").trim();
  if (!raw) return "";
  const d = raw.replace(/\D/g, "");
  if (d.length === 10) return `+1${d}`;
  if (d.length === 11 && d.startsWith("1")) return `+${d}`;
  if (raw.startsWith("+")) return raw;
  if (d.length > 0) return `+${d}`;
  return raw;
}
