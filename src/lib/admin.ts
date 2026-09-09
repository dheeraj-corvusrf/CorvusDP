import { supabase } from "./supabase";

export async function checkIsAdmin(userId: string): Promise<boolean> {
  const { data, error } = await supabase
    .from("profiles")
    .select("is_admin")
    .eq("id", userId)
    .maybeSingle();
  if (error) return false;
  return (data as { is_admin?: boolean } | null)?.is_admin ?? false;
}

export type LeadRow = {
  id: string;
  session_id: string | null;
  track: string | null;
  email: string | null;
  name: string | null;
  company: string | null;
  property: Record<string, unknown> | null;
  project: Record<string, unknown> | null;
  design: Record<string, unknown> | null;
  intent_score: number;
  status: string;
  created_at: string;
};

export async function listLeads(): Promise<LeadRow[]> {
  const { data, error } = await supabase
    .from("leads")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(200);
  if (error) throw error;
  return (data as LeadRow[]) ?? [];
}

export type AdminProjectRow = {
  id: string;
  name: string | null;
  address: string | null;
  city: string | null;
  jurisdiction: string | null;
  feasibility_status: string | null;
  complexity_level: string | null;
  stage: string;
  track: string;
  created_at: string;
};

export async function listAllProjects(): Promise<AdminProjectRow[]> {
  const { data, error } = await supabase
    .from("projects")
    .select(
      "id, name, address, city, jurisdiction, feasibility_status, complexity_level, stage, track, created_at",
    )
    .order("created_at", { ascending: false })
    .limit(300);
  if (error) throw error;
  return (data as AdminProjectRow[]) ?? [];
}

export type AdminDesignRow = {
  id: string;
  address: string | null;
  city: string | null;
  scope: string | null;
  sector: string | null;
  stage: string;
  created_at: string;
};

export async function listAllDesignRequests(): Promise<AdminDesignRow[]> {
  const { data, error } = await supabase
    .from("design_requests")
    .select("id, address, city, scope, sector, stage, created_at")
    .order("created_at", { ascending: false })
    .limit(300);
  if (error) throw error;
  return (data as AdminDesignRow[]) ?? [];
}

export async function logAdminAction(input: {
  action: string;
  target?: string;
  detail?: string;
}): Promise<void> {
  try {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return;
    await supabase.from("admin_audit_log").insert({
      actor_id: user.id,
      actor_email: user.email ?? "",
      action: input.action,
      target: input.target ?? null,
      detail: input.detail ?? null,
    });
  } catch (err) {
    console.error("audit log failed", err);
  }
}
