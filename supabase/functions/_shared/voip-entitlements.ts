/** 免费档：购号后可发 50 条出站短信；通话 10 分钟由 metadata 与后续语音 Webhook 累计 */

export const FREE_TIER_SMS_OUTBOUND_LIMIT = 50;
export const FREE_TIER_VOICE_SECONDS_LIMIT = 10 * 60;

export type VoipEntitlement = "pro" | "free_limited";

export function isProSubscriber(
  tier: string | null | undefined,
  expiresAt: string | null | undefined,
): boolean {
  if (tier !== "pro") return false;
  if (!expiresAt) return true;
  return new Date(expiresAt).getTime() > Date.now();
}

export function entitlementForUser(isPro: boolean): VoipEntitlement {
  return isPro ? "pro" : "free_limited";
}
