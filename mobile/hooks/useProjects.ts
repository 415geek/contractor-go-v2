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

async function getProjects(status?: ProjectStatus): Promise<Project[]> {
  const { data: { session } } = await supabase.auth.getSession();
  if (!session?.user?.id) throw new Error("Not authenticated");
  let q = supabase
    .from("projects")
    .select("*")
    .eq("user_id", session.user.id)
    .order("start_date", { ascending: false, nullsFirst: false });
  if (status) q = q.eq("status", status);
  const { data, error } = await q;
  if (error) throw error;
  return (data ?? []) as Project[];
}

async function getProject(id: string): Promise<Project | null> {
  const { data: { session } } = await supabase.auth.getSession();
  if (!session?.user?.id) throw new Error("Not authenticated");
  const { data, error } = await supabase
    .from("projects")
    .select("*")
    .eq("id", id)
    .eq("user_id", session.user.id)
    .single();
  if (error) {
    if (error.code === "PGRST116") return null;
    throw error;
  }
  return data as Project;
}

async function createProject(row: ProjectInsert): Promise<Project> {
  const { data: { session } } = await supabase.auth.getSession();
  if (!session?.user?.id) throw new Error("Not authenticated");
  const { data, error } = await supabase
    .from("projects")
    .insert({
      user_id: session.user.id,
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
  if (error) throw error;
  return data as Project;
}

async function updateProject(id: string, row: Partial<ProjectInsert>): Promise<Project> {
  const { data: { session } } = await supabase.auth.getSession();
  if (!session?.user?.id) throw new Error("Not authenticated");
  const { data, error } = await supabase
    .from("projects")
    .update({
      ...row,
      updated_at: new Date().toISOString(),
    })
    .eq("id", id)
    .eq("user_id", session.user.id)
    .select()
    .single();
  if (error) throw error;
  return data as Project;
}

async function deleteProject(id: string): Promise<void> {
  const { data: { session } } = await supabase.auth.getSession();
  if (!session?.user?.id) throw new Error("Not authenticated");
  const { error } = await supabase
    .from("projects")
    .delete()
    .eq("id", id)
    .eq("user_id", session.user.id);
  if (error) throw error;
}

export function useProjects(status?: ProjectStatus) {
  const qc = useQueryClient();
  const query = useQuery({
    queryKey: ["projects", status ?? "all"],
    queryFn: () => getProjects(status),
  });
  const createMutation = useMutation({
    mutationFn: createProject,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["projects"] });
    },
  });
  const updateMutation = useMutation({
    mutationFn: ({ id, ...rest }: { id: string } & Partial<ProjectInsert>) => updateProject(id, rest),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["projects"] });
    },
  });
  const deleteMutation = useMutation({
    mutationFn: deleteProject,
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
  const query = useQuery({
    queryKey: ["project", id],
    queryFn: () => (id ? getProject(id) : Promise.resolve(null)),
    enabled: !!id,
  });
  return {
    project: query.data ?? null,
    isLoading: query.isLoading,
    error: query.error,
    refetch: query.refetch,
  };
}
