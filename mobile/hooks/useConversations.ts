import { useAuth, useUser } from "@clerk/clerk-expo";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { supabase } from "@/lib/supabase";

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
  const { data, error } = await supabase.functions.invoke<{ data: Conversation[]; error: string | null }>("get-conversations", {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (error) throw error;
  if (data?.error) throw new Error(data.error as string);
  return data?.data ?? [];
}

async function createConversation(
  getToken: () => Promise<string | null>,
  _userId: string,
  params: { contact_phone: string; contact_name?: string; virtual_number_id?: string },
): Promise<Conversation> {
  const token = await getToken();
  if (!token) throw new Error("Not authenticated");
  const { data, error } = await supabase.functions.invoke<{ data: Conversation; error: string | null }>("create-conversation", {
    method: "POST",
    headers: { Authorization: `Bearer ${token}` },
    body: params,
  });
  if (error) throw error;
  if (data?.error) throw new Error(data.error as string);
  if (!data?.data) throw new Error("No data returned");
  return data.data;
}

export function useConversations() {
  const qc = useQueryClient();
  const { getToken: _getToken, isLoaded, isSignedIn } = useAuth();
  const getToken = () => _getToken();
  const { user } = useUser();
  const query = useQuery({
    queryKey: ["conversations"],
    queryFn: () => fetchConversations(getToken),
    enabled: isLoaded && !!isSignedIn,
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
