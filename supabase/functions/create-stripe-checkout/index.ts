/**
 * 创建 Stripe Checkout（订阅模式），把 Clerk user id 写入 client_reference_id，
 * 支付成功后由 stripe-webhook 根据 Webhook 更新 users.subscription_tier。
 */
import Stripe from "npm:stripe@17.5.0";

import { jsonResponse, handleOptionsRequest } from "../_shared/response.ts";
import { getUserFromRequest } from "../_shared/get-user.ts";

function getEnv(name: string): string {
  const v = Deno.env.get(name);
  if (!v) throw new Error(`Missing env: ${name}`);
  return v;
}

Deno.serve(async (req) => {
  const opts = handleOptionsRequest(req);
  if (opts) return opts;

  if (req.method !== "POST") {
    return jsonResponse({ data: null, error: "method_not_allowed", message: "POST only" }, 405);
  }

  try {
    const user = await getUserFromRequest(req);
    if (!user) {
      return jsonResponse({ data: null, error: "unauthorized", message: "Invalid or missing token" }, 401);
    }

    const priceId = Deno.env.get("STRIPE_PRICE_ID_PRO")?.trim();
    if (!priceId) {
      return jsonResponse(
        { data: null, error: "server_misconfigured", message: "STRIPE_PRICE_ID_PRO is not set" },
        500,
      );
    }

    let body: { success_url?: string; cancel_url?: string } = {};
    try {
      const t = await req.text();
      if (t) body = JSON.parse(t) as typeof body;
    } catch {
      /* empty body ok */
    }

    const appUrl = Deno.env.get("PUBLIC_APP_URL")?.trim().replace(/\/$/, "") ?? "https://www.contractorgo.io";
    const successUrl = body.success_url ?? `${appUrl}/voip?checkout=success`;
    const cancelUrl = body.cancel_url ?? `${appUrl}/voip?checkout=cancel`;

    const stripe = new Stripe(getEnv("STRIPE_SECRET_KEY"), {
      httpClient: Stripe.createFetchHttpClient(),
    });

    const session = await stripe.checkout.sessions.create({
      mode: "subscription",
      client_reference_id: user.id,
      customer_email: user.email ?? undefined,
      line_items: [{ price: priceId, quantity: 1 }],
      success_url: successUrl.includes("?") ? `${successUrl}&session_id={CHECKOUT_SESSION_ID}` : `${successUrl}?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: cancelUrl,
      metadata: { clerk_user_id: user.id },
      subscription_data: {
        metadata: { clerk_user_id: user.id },
      },
    });

    if (!session.url) {
      return jsonResponse({ data: null, error: "stripe_error", message: "No checkout URL returned" }, 500);
    }

    return jsonResponse({
      data: { url: session.url, id: session.id },
      error: null,
      message: "ok",
    });
  } catch (e) {
    console.error("[create-stripe-checkout]", e);
    return jsonResponse(
      {
        data: null,
        error: "stripe_error",
        message: e instanceof Error ? e.message : "Checkout failed",
      },
      500,
    );
  }
});
