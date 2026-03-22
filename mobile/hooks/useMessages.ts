import { useEffect } from "react";
import { useAuth } from "@clerk/clerk-expo";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { invokeEdgeWithClerk } from "@/lib/api/edge-functions";

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

async function fetchMessages(getToken: () => Promise<string | null>, conversationId: string): Promise<Message[]> {
  const token = await getToken();
  if (!token) throw new Error("Not authenticated");
  return invokeEdgeWithClerk<Message[]>("get-messages", token, {
    method: "POST",
    body: { conversation_id: conversationId },
  });
}

async function sendMessage(getToken: () => Promise<string | null>, conversationId: string, content: string): Promise<Message> {
  const token = await getToken();
  if (!token) throw new Error("Not authenticated");
  const data = await invokeEdgeWithClerk<Message>("send-message", token, {
    method: "POST",
    body: { conversation_id: conversationId, content, content_type: "text" },
  });
  if (!data) throw new Error("未返回消息数据");
  return data;
}

export function useMessages(conversationId: string | null) {
  const qc = useQueryClient();
  const { getToken: _getToken, isLoaded, isSignedIn } = useAuth();
  const getToken = () => _getToken();
  const query = useQuery({
    queryKey: ["messages", conversationId],
    queryFn: () => fetchMessages(getToken, conversationId!),
    enabled: isLoaded && !!isSignedIn && !!conversationId,
  });
  const sendMutation = useMutation({
    mutationFn: ({ convId, content }: { convId: string; content: string }) => sendMessage(getToken, convId, content),
    onSuccess: (_, { convId }) => {
      qc.invalidateQueries({ queryKey: ["messages", convId] });
      qc.invalidateQueries({ queryKey: ["conversations"] });
    },
  });

  // 轮询刷新消息（Realtime 需 Clerk JWT，易触发 "No suitable key"，改用轮询）
  useEffect(() => {
    if (!conversationId) return;
    const interval = setInterval(() => qc.invalidateQueries({ queryKey: ["messages", conversationId] }), 10000);
    return () => clearInterval(interval);
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
