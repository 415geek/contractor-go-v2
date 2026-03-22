import { createAdminClient } from "./supabase.ts";

/** 统计某虚拟号下所有会话的出站短信条数 */
export async function countOutboundSmsForVirtualNumber(
  admin: ReturnType<typeof createAdminClient>,
  virtualNumberId: string,
): Promise<number> {
  const { data: convs } = await admin.from("conversations").select("id").eq("virtual_number_id", virtualNumberId);
  const ids = (convs ?? []).map((c) => (c as { id: string }).id);
  if (ids.length === 0) return 0;
  const { count, error } = await admin
    .from("messages")
    .select("*", { count: "exact", head: true })
    .eq("direction", "outbound")
    .in("conversation_id", ids);
  if (error) throw error;
  return count ?? 0;
}
