/**
 * Stripe Webhook：同步订阅状态到 public.users
 * 在 Stripe Dashboard → Developers → Webhooks 添加 Endpoint，选事件见 docs/STRIPE_SETUP.md
 */
import Stripe from "npm:stripe@17.5.0";

import { jsonResponse, handleOptionsRequest } from "../_shared/response.ts";
import { createAdminClient } from "../_shared/supabase.ts";

function getEnv(name: string): string {
  const v = Deno.env.get(name);
  if (!v) throw new Error(`Missing env: ${name}`);
  return v;
}

function tierFromSubscriptionStatus(status: Stripe.Subscription.Status): "pro" | "free" {
  if (status === "active" || status === "trialing" || status === "past_due") return "pro";
  return "free";
}

async function applyProFromSubscription(
  admin: ReturnType<typeof createAdminClient>,
  userId: string,
  params: {
    stripe_customer_id: string | null;
    stripe_subscription_id: string | null;
    current_period_end: number | null;
  },
) {
  const expires = params.current_period_end
    ? new Date(params.current_period_end * 1000).toISOString()
    : null;
  const { error } = await admin
    .from("users")
    .update({
      subscription_tier: "pro",
      subscription_expires_at: expires,
      stripe_customer_id: params.stripe_customer_id ?? undefined,
      stripe_subscription_id: params.stripe_subscription_id ?? undefined,
    })
    .eq("id", userId);
  if (error) throw error;
}

async function applyFree(
  admin: ReturnType<typeof createAdminClient>,
  userId: string,
) {
  const { error } = await admin
    .from("users")
    .update({
      subscription_tier: "free",
      subscription_expires_at: null,
      stripe_subscription_id: null,
    })
    .eq("id", userId);
  if (error) throw error;
}

Deno.serve(async (req) => {
  const opts = handleOptionsRequest(req);
  if (opts) return opts;

  if (req.method !== "POST") {
    return jsonResponse({ error: "method_not_allowed" }, 405);
  }

  const secret = getEnv("STRIPE_WEBHOOK_SECRET");
  const stripe = new Stripe(getEnv("STRIPE_SECRET_KEY"), {
    httpClient: Stripe.createFetchHttpClient(),
  });

  const sig = req.headers.get("stripe-signature") ?? req.headers.get("Stripe-Signature");
  if (!sig) {
    return jsonResponse({ error: "missing_signature" }, 400);
  }

  const rawBody = await req.text();

  let event: Stripe.Event;
  try {
    event = await stripe.webhooks.constructEventAsync(rawBody, sig, secret);
  } catch (e) {
    console.error("[stripe-webhook] signature:", e);
    return jsonResponse({ error: "invalid_signature" }, 400);
  }

  const admin = createAdminClient();

  try {
    switch (event.type) {
      case "checkout.session.completed": {
        const session = event.data.object as Stripe.Checkout.Session;
        if (session.mode !== "subscription") break;
        const userId = session.client_reference_id ?? session.metadata?.clerk_user_id;
        if (!userId || typeof userId !== "string") {
          console.warn("[stripe-webhook] checkout.session.completed missing client_reference_id / metadata.clerk_user_id");
          break;
        }
        const subId = typeof session.subscription === "string" ? session.subscription : session.subscription?.id;
        const custId = typeof session.customer === "string" ? session.customer : session.customer?.id;
        if (!subId) break;
        const sub = await stripe.subscriptions.retrieve(subId);
        await applyProFromSubscription(admin, userId, {
          stripe_customer_id: custId ?? null,
          stripe_subscription_id: sub.id,
          current_period_end: sub.current_period_end,
        });
        break;
      }
      case "customer.subscription.updated": {
        const sub = event.data.object as Stripe.Subscription;
        const custId = typeof sub.customer === "string" ? sub.customer : sub.customer?.id ?? null;

        let row: { id: string } | undefined;
        const bySub = await admin.from("users").select("id").eq("stripe_subscription_id", sub.id).maybeSingle();
        if (bySub.data) row = bySub.data as { id: string };
        else if (custId) {
          const byCust = await admin.from("users").select("id").eq("stripe_customer_id", custId).maybeSingle();
          if (byCust.data) row = byCust.data as { id: string };
        }
        if (!row) {
          console.warn("[stripe-webhook] subscription.updated unknown sub/customer", sub.id, custId);
          break;
        }
        const tier = tierFromSubscriptionStatus(sub.status);
        if (tier === "pro") {
          await applyProFromSubscription(admin, row.id, {
            stripe_customer_id: custId,
            stripe_subscription_id: sub.id,
            current_period_end: sub.current_period_end,
          });
        } else {
          await applyFree(admin, row.id);
        }
        break;
      }
      case "customer.subscription.deleted": {
        const sub = event.data.object as Stripe.Subscription;
        const { data: rows } = await admin
          .from("users")
          .select("id")
          .eq("stripe_subscription_id", sub.id)
          .limit(1);
        const row = rows?.[0] as { id: string } | undefined;
        if (row) await applyFree(admin, row.id);
        break;
      }
      default:
        break;
    }

    return jsonResponse({ received: true });
  } catch (e) {
    console.error("[stripe-webhook]", e);
    return jsonResponse(
      { error: e instanceof Error ? e.message : "handler_error" },
      500,
    );
  }
});
