import { useAuth, useUser } from "@clerk/clerk-expo";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { createAuthenticatedClient } from "@/lib/supabase";

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
  const client = createAuthenticatedClient(token);
  const { data, error } = await client
    .from("conversations")
    .select("id, user_id, virtual_number_id, contact_phone, contact_name, contact_language, last_message_at, created_at")
    .order("last_message_at", { ascending: false, nullsFirst: false });
  if (error) throw new Error(error.message);
  return data ?? [];
}

async function createConversation(
  getToken: () => Promise<string | null>,
  userId: string,
  params: { contact_phone: string; contact_name?: string; virtual_number_id?: string },
): Promise<Conversation> {
  const token = await getToken();
  if (!token) throw new Error("Not authenticated");
  const client = createAuthenticatedClient(token);
  const { data, error } = await client
    .from("conversations")
    .insert({
      user_id: userId,
      contact_phone: params.contact_phone,
      contact_name: params.contact_name ?? params.contact_phone,
      contact_language: "en-US",
      virtual_number_id: params.virtual_number_id ?? null,
    })
    .select()
    .single();
  if (error) throw new Error(error.message);
  return data as Conversation;
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
