/**
 * Stripe **Publishable** key（可出现在前端；切勿使用 Secret key `sk_`）。
 *
 * 配置方式（二选一或都配，构建时会打进 bundle）：
 * - 本地：在 `mobile/.env` 中设置（复制 `mobile/.env.example`）
 * - 生产：在 Vercel 项目 → Settings → Environment Variables 添加同名变量后 **Redeploy**
 *
 * 当前订阅 Checkout 由 Edge `create-stripe-checkout` 返回 URL，不强制使用本 key；
 * 若以后集成 `@stripe/stripe-js` / Payment Element，从 `getStripePublishableKey()` 读取即可。
 */
export function getStripePublishableKey(): string | null {
  const k = process.env.EXPO_PUBLIC_STRIPE_PUBLISHABLE_KEY?.trim();
  if (!k) return null;
  if (!k.startsWith("pk_")) {
    console.warn("[stripe-config] EXPO_PUBLIC_STRIPE_PUBLISHABLE_KEY 应以 pk_ 开头");
    return null;
  }
  return k;
}

export function requireStripePublishableKey(): string {
  const k = getStripePublishableKey();
  if (!k) {
    throw new Error(
      "缺少 EXPO_PUBLIC_STRIPE_PUBLISHABLE_KEY。请在 mobile/.env 或 Vercel 环境变量中配置（以 pk_ 开头）。",
    );
  }
  return k;
}
