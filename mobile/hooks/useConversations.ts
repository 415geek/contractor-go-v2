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

async function fetchConversations(): Promise<Conversation[]> {
  const { data, error } = await supabase
    .from("conversations")
    .select("id, user_id, virtual_number_id, contact_phone, contact_name, contact_language, last_message_at, created_at")
    .order("last_message_at", { ascending: false, nullsFirst: false });

  if (error) throw error;
  return data ?? [];
}

async function createConversation(params: { contact_phone: string; contact_name?: string; virtual_number_id?: string }) {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated");
  const { data, error } = await supabase
    .from("conversations")
    .insert({
      user_id: user.id,
      contact_phone: params.contact_phone,
      contact_name: params.contact_name ?? params.contact_phone,
      contact_language: "en-US",
      virtual_number_id: params.virtual_number_id ?? null,
    })
    .select()
    .single();
  if (error) throw error;
  return data as Conversation;
}

export function useConversations() {
  const qc = useQueryClient();
  const query = useQuery({
    queryKey: ["conversations"],
    queryFn: fetchConversations,
  });
  const createMutation = useMutation({
    mutationFn: createConversation,
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
