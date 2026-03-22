import { useAuth, useUser } from "@clerk/clerk-expo";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { invokeEdgeWithClerk } from "@/lib/api/edge-functions";

export type Conversation = {
  id: string;
  user_id: string;
  virtual_number_id: string | null;
  contact_phone: string;
  contact_name: string | null;
  contact_language: string;
  last_message_at: string | null;
  created_at: string;
};

async function fetchConversations(getToken: () => Promise<string | null>): Promise<Conversation[]> {
  const token = await getToken();
  if (!token) throw new Error("Not authenticated");
  return invokeEdgeWithClerk<Conversation[]>("get-conversations", token, { method: "GET" });
}

async function createConversation(
  getToken: () => Promise<string | null>,
  _userId: string,
  params: { contact_phone: string; contact_name?: string; virtual_number_id?: string },
): Promise<Conversation> {
  const token = await getToken();
  if (!token) throw new Error("Not authenticated");
  const data = await invokeEdgeWithClerk<Conversation>("create-conversation", token, { method: "POST", body: params });
  if (!data) throw new Error("未返回对话数据");
  return data;
}

export function useConversations() {
  const qc = useQueryClient();
  const { getToken: _getToken, isLoaded, isSignedIn, sessionId } = useAuth();
  const getToken = () => _getToken();
  const { user } = useUser();
  const query = useQuery({
    queryKey: ["conversations"],
    queryFn: () => fetchConversations(getToken),
    // 等 Clerk session 就绪再请求，避免 Web 上 isSignedIn 为真但 getToken 尚未可用
    enabled: isLoaded && !!isSignedIn && !!sessionId,
  });
  const createMutation = useMutation({
    mutationFn: (params: { contact_phone: string; contact_name?: string; virtual_number_id?: string }) =>
      createConversation(getToken, user!.id, params),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["conversations"] }),
  });
  return {
    conversations: query.data ?? [],
    isLoading: query.isLoading,
    error: query.error,
    refetch: query.refetch,
    createConversation: createMutation.mutateAsync,
    createLoading: createMutation.isPending,
  };
}
