import { useEffect } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { supabase } from "@/lib/supabase";

export type Message = {
  id: string;
  conversation_id: string;
  direction: "inbound" | "outbound";
  message_type: string;
  original_content: string | null;
  translated_content: string | null;
  status: string;
  created_at: string;
};

async function fetchMessages(conversationId: string): Promise<Message[]> {
  const { data, error } = await supabase
    .from("messages")
    .select("id, conversation_id, direction, message_type, original_content, translated_content, status, created_at")
    .eq("conversation_id", conversationId)
    .order("created_at", { ascending: true });

  if (error) throw error;
  return data ?? [];
}

async function sendMessage(conversationId: string, content: string): Promise<Message> {
  const { data: { session } } = await supabase.auth.getSession();
  if (!session?.access_token) throw new Error("Not authenticated");
  const { data, error } = await supabase.functions.invoke<{ data: Message; error: string | null }>("send-message", {
    method: "POST",
    headers: { Authorization: `Bearer ${session.access_token}` },
    body: { conversation_id: conversationId, content, content_type: "text" },
  });
  if (error) throw error;
  if (data?.error) throw new Error(data.error as string);
  if (!data?.data) throw new Error("No data");
  return data.data;
}

export function useMessages(conversationId: string | null) {
  const qc = useQueryClient();
  const query = useQuery({
    queryKey: ["messages", conversationId],
    queryFn: () => fetchMessages(conversationId!),
    enabled: !!conversationId,
  });
  const sendMutation = useMutation({
    mutationFn: ({ convId, content }: { convId: string; content: string }) => sendMessage(convId, content),
    onSuccess: (_, { convId }) => {
      qc.invalidateQueries({ queryKey: ["messages", convId] });
      qc.invalidateQueries({ queryKey: ["conversations"] });
    },
  });

  useEffect(() => {
    if (!conversationId) return;
    const channel = supabase
      .channel(`messages:${conversationId}`)
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "messages", filter: `conversation_id=eq.${conversationId}` },
        () => qc.invalidateQueries({ queryKey: ["messages", conversationId] }),
      )
      .subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
  }, [conversationId, qc]);

  return {
    messages: query.data ?? [],
    isLoading: query.isLoading,
    error: query.error,
    refetch: query.refetch,
    sendMessage: sendMutation.mutateAsync,
    sendLoading: sendMutation.isPending,
  };
}
