import { useEffect } from "react";
import { useAuth } from "@clerk/clerk-expo";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { invokeEdgeWithClerkFromAuth } from "@/lib/api/edge-functions";

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

function optimisticOutbound(convId: string, content: string): Message {
  return {
    id: `optimistic-${Date.now()}`,
    conversation_id: convId,
    direction: "outbound",
    message_type: "text",
    original_content: content,
    translated_content: null,
    status: "sending",
    created_at: new Date().toISOString(),
  };
}

async function fetchMessages(getToken: () => Promise<string | null>, conversationId: string): Promise<Message[]> {
  return invokeEdgeWithClerkFromAuth<Message[]>(getToken, "get-messages", {
    method: "POST",
    body: { conversation_id: conversationId },
  });
}

async function sendMessage(getToken: () => Promise<string | null>, conversationId: string, content: string): Promise<Message> {
  const data = await invokeEdgeWithClerkFromAuth<Message>(getToken, "send-message", {
    method: "POST",
    body: { conversation_id: conversationId, content, content_type: "text" },
  });
  if (!data) throw new Error("未返回消息数据");
  return data;
}

export function useMessages(conversationId: string | null) {
  const qc = useQueryClient();
  const { getToken: _getToken, isLoaded, isSignedIn, sessionId } = useAuth();
  const getToken = () => _getToken();
  const query = useQuery({
    queryKey: ["messages", conversationId],
    queryFn: () => fetchMessages(getToken, conversationId!),
    enabled: isLoaded && !!isSignedIn && !!sessionId && !!conversationId,
  });
  const sendMutation = useMutation({
    mutationFn: ({ convId, content }: { convId: string; content: string }) => sendMessage(getToken, convId, content),
    onMutate: async ({ convId, content }) => {
      await qc.cancelQueries({ queryKey: ["messages", convId] });
      const previous = qc.getQueryData<Message[]>(["messages", convId]);
      const opt = optimisticOutbound(convId, content);
      qc.setQueryData<Message[]>(["messages", convId], [...(previous ?? []), opt]);
      return { previous, convId };
    },
    onError: (_err, { convId }, context) => {
      if (context?.previous !== undefined) {
        qc.setQueryData(["messages", convId], context.previous);
      }
    },
    onSuccess: (_, { convId }) => {
      qc.invalidateQueries({ queryKey: ["messages", convId] });
      qc.invalidateQueries({ queryKey: ["conversations"] });
    },
  });

  // 轮询：收对方短信与入站 Webhook 写入（无 Realtime 时依赖刷新）
  useEffect(() => {
    if (!conversationId) return;
    const interval = setInterval(() => qc.invalidateQueries({ queryKey: ["messages", conversationId] }), 4000);
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
