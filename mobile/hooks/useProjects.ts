import { useAuth, useUser } from "@clerk/clerk-expo";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { supabase } from "@/lib/supabase";

export type ProjectStatus = "planning" | "active" | "on_hold" | "completed" | "cancelled";

export type Project = {
  id: string;
  user_id: string;
  name: string;
  address: string | null;
  client_name: string | null;
  client_phone: string | null;
  client_email: string | null;
  total_cost: number;
  labor_cost: number;
  material_cost: number;
  contract_type: string | null;
  start_date: string | null;
  end_date: string | null;
  duration_days: number | null;
  status: ProjectStatus;
  ai_summary: Record<string, unknown>;
  construction_plan: Record<string, unknown>;
  material_list: unknown[];
  notes: string | null;
  created_at: string;
  updated_at: string;
};

export type ProjectInsert = {
  name: string;
  address?: string | null;
  client_name?: string | null;
  client_phone?: string | null;
  client_email?: string | null;
  total_cost?: number;
  labor_cost?: number;
  material_cost?: number;
  contract_type?: string | null;
  start_date?: string | null;
  end_date?: string | null;
  duration_days?: number | null;
  status?: ProjectStatus;
  notes?: string | null;
};

async function invokeProjects<T>(
  getToken: () => Promise<string | null>,
  body: Record<string, unknown>,
): Promise<T> {
  const token = await getToken();
  if (!token) throw new Error("Not authenticated");
  const { data, error } = await supabase.functions.invoke<{ data: T; error: string | null }>("projects", {
    method: "POST",
    headers: { Authorization: `Bearer ${token}` },
    body,
  });
  if (error) throw error;
  if (data?.error) throw new Error(data.error as string);
  return data?.data as T;
}

async function getProjects(getToken: () => Promise<string | null>, _userId: string, status?: ProjectStatus): Promise<Project[]> {
  const data = await invokeProjects<Project[]>(getToken, { action: "list", status });
  return data ?? [];
}

async function getProject(getToken: () => Promise<string | null>, _userId: string, id: string): Promise<Project | null> {
  const data = await invokeProjects<Project | null>(getToken, { action: "get", id });
  return data ?? null;
}

async function createProject(getToken: () => Promise<string | null>, _userId: string, row: ProjectInsert): Promise<Project> {
  const data = await invokeProjects<Project>(getToken, { action: "create", row });
  if (!data) throw new Error("No data returned");
  return data;
}

async function updateProject(getToken: () => Promise<string | null>, _userId: string, id: string, row: Partial<ProjectInsert>): Promise<Project> {
  const data = await invokeProjects<Project>(getToken, { action: "update", id, updates: row });
  if (!data) throw new Error("No data returned");
  return data;
}

async function deleteProject(getToken: () => Promise<string | null>, _userId: string, id: string): Promise<void> {
  await invokeProjects<null>(getToken, { action: "delete", id });
}

export function useProjects(status?: ProjectStatus) {
  const qc = useQueryClient();
  const { getToken: _getToken, isLoaded, isSignedIn } = useAuth();
  const getToken = () => _getToken();
  const { user } = useUser();
  const query = useQuery({
    queryKey: ["projects", status ?? "all"],
    queryFn: () => getProjects(getToken, user?.id ?? "", status),
    enabled: isLoaded && !!isSignedIn && !!user?.id,
  });
  const createMutation = useMutation({
    mutationFn: (row: ProjectInsert) => createProject(getToken, user!.id, row),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["projects"] });
    },
  });
  const updateMutation = useMutation({
    mutationFn: ({ id, ...rest }: { id: string } & Partial<ProjectInsert>) => updateProject(getToken, user!.id, id, rest),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["projects"] });
    },
  });
  const deleteMutation = useMutation({
    mutationFn: (id: string) => deleteProject(getToken, user!.id, id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["projects"] });
    },
  });
  return {
    projects: query.data ?? [],
    isLoading: query.isLoading,
    error: query.error,
    refetch: query.refetch,
    create: createMutation.mutateAsync,
    createLoading: createMutation.isPending,
    update: updateMutation.mutateAsync,
    updateLoading: updateMutation.isPending,
    remove: deleteMutation.mutateAsync,
    deleteLoading: deleteMutation.isPending,
  };
}

export function useProject(id: string | undefined) {
  const { getToken: _getToken, isLoaded, isSignedIn } = useAuth();
  const getToken = () => _getToken();
  const { user } = useUser();
  const query = useQuery({
    queryKey: ["project", id],
    queryFn: () => (id ? getProject(getToken, user?.id ?? "", id) : Promise.resolve(null)),
    enabled: isLoaded && !!isSignedIn && !!user?.id && !!id,
  });
  return {
    project: query.data ?? null,
    isLoading: query.isLoading,
    error: query.error,
    refetch: query.refetch,
  };
}
