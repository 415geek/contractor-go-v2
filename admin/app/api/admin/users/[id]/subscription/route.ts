import { createAdminClient } from "@/lib/supabase-admin";
import { NextRequest, NextResponse } from "next/server";

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const body = await request.json();
  const { subscription_tier, subscription_expires_at } = body as {
    subscription_tier?: string;
    subscription_expires_at?: string | null;
  };
  const supabase = createAdminClient();

  const updates: Record<string, unknown> = {};
  if (subscription_tier !== undefined) updates.subscription_tier = subscription_tier;
  if (subscription_expires_at !== undefined) updates.subscription_expires_at = subscription_expires_at;

  if (Object.keys(updates).length === 0) {
    return NextResponse.json({ error: "No updates" }, { status: 400 });
  }

  const { error } = await supabase.from("users").update(updates).eq("id", id);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  return NextResponse.json({ ok: true });
}
