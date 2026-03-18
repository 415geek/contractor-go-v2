import { useAuth, useUser } from "@clerk/clerk-expo";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { createAuthenticatedClient } from "@/lib/supabase";

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

async function getProjects(getToken: () => Promise<string | null>, userId: string, status?: ProjectStatus): Promise<Project[]> {
  const token = await getToken();
  if (!token || !userId) throw new Error("Not authenticated");
  const client = createAuthenticatedClient(token);
  let q = client
    .from("projects")
    .select("*")
    .eq("user_id", userId)
    .order("start_date", { ascending: false, nullsFirst: false });
  if (status) q = q.eq("status", status);
  const { data, error } = await q;
  if (error) throw new Error(error.message);
  return (data ?? []) as Project[];
}

async function getProject(getToken: () => Promise<string | null>, userId: string, id: string): Promise<Project | null> {
  const token = await getToken();
  if (!token || !userId) throw new Error("Not authenticated");
  const client = createAuthenticatedClient(token);
  const { data, error } = await client
    .from("projects")
    .select("*")
    .eq("id", id)
    .eq("user_id", userId)
    .single();
  if (error) {
    if (error.code === "PGRST116") return null;
    throw new Error(error.message);
  }
  return data as Project;
}

async function createProject(getToken: () => Promise<string | null>, userId: string, row: ProjectInsert): Promise<Project> {
  const token = await getToken();
  if (!token || !userId) throw new Error("Not authenticated");
  const client = createAuthenticatedClient(token);
  const { data, error } = await client
    .from("projects")
    .insert({
      user_id: userId,
      name: row.name,
      address: row.address ?? null,
      client_name: row.client_name ?? null,
      client_phone: row.client_phone ?? null,
      client_email: row.client_email ?? null,
      total_cost: row.total_cost ?? 0,
      labor_cost: row.labor_cost ?? 0,
      material_cost: row.material_cost ?? 0,
      contract_type: row.contract_type ?? null,
      start_date: row.start_date ?? null,
      end_date: row.end_date ?? null,
      duration_days: row.duration_days ?? null,
      status: row.status ?? "planning",
      notes: row.notes ?? null,
    })
    .select()
    .single();
  if (error) throw new Error(error.message);
  return data as Project;
}

async function updateProject(getToken: () => Promise<string | null>, userId: string, id: string, row: Partial<ProjectInsert>): Promise<Project> {
  const token = await getToken();
  if (!token || !userId) throw new Error("Not authenticated");
  const client = createAuthenticatedClient(token);
  const { data, error } = await client
    .from("projects")
    .update({
      ...row,
      updated_at: new Date().toISOString(),
    })
    .eq("id", id)
    .eq("user_id", userId)
    .select()
    .single();
  if (error) throw new Error(error.message);
  return data as Project;
}

async function deleteProject(getToken: () => Promise<string | null>, userId: string, id: string): Promise<void> {
  const token = await getToken();
  if (!token || !userId) throw new Error("Not authenticated");
  const client = createAuthenticatedClient(token);
  const { error } = await client
    .from("projects")
    .delete()
    .eq("id", id)
    .eq("user_id", userId);
  if (error) throw new Error(error.message);
}

export function useProjects(status?: ProjectStatus) {
  const qc = useQueryClient();
  const { getToken: _getToken, isLoaded, isSignedIn } = useAuth();
  const getToken = () => _getToken({ template: 'supabase' });
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
  const getToken = () => _getToken({ template: 'supabase' });
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
