import { supabase } from "./supabase";
import type { DpIntakeState } from "./dp-intake";
import { runPermittingAnalysis, type PermittingAnalysis } from "./analysis";
import { buildPermitChecklist } from "./checklist";

export type ProjectRow = {
  id: string;
  user_id: string | null;
  track: string;
  name: string | null;
  address: string | null;
  city: string | null;
  county: string | null;
  state: string | null;
  jurisdiction: string | null;
  zoning: string | null;
  zoning_category: string | null;
  intent: string | null;
  sector: string | null;
  lot_size: string | null;
  building_area: string | null;
  floors: string | null;
  existing_use: string | null;
  proposed_use: string | null;
  feasibility_status: string | null;
  complexity_level: string | null;
  stage: string;
  analysis: PermittingAnalysis | null;
  created_at: string;
  updated_at: string;
};

export type PermitRow = {
  id: string;
  project_id: string;
  permit_key: string;
  name: string;
  category: string;
  status: string;
  agency: string | null;
  submitted_at: string | null;
  approved_at: string | null;
  approval_doc_url: string | null;
  permit_number: string | null;
  expiry_date: string | null;
  review_round: number;
  sort: number;
};

export type ChecklistRow = {
  id: string;
  project_id: string;
  permit_key: string | null;
  label: string;
  grp: string;
  required: boolean;
  done: boolean;
};

export type NotificationRow = {
  id: string;
  project_id: string;
  kind: string;
  title: string;
  body: string | null;
  read: boolean;
  created_at: string;
};

export type ProjectBundle = {
  project: ProjectRow;
  permits: PermitRow[];
  checklist: ChecklistRow[];
  notifications: NotificationRow[];
};

// Persist a completed anonymous analysis as the signed-in user's project,
// seeding permit rows + checklist items + a welcome notification.
export async function saveProjectFromIntake(
  userId: string,
  intake: DpIntakeState,
  analysis: PermittingAnalysis,
): Promise<string> {
  const { property, project } = intake;

  const { data: proj, error } = await supabase
    .from("projects")
    .insert({
      user_id: userId,
      session_id: intake.sessionId,
      track: "permitting",
      name: property.address || `${property.city ?? "New"} project`,
      address: property.address ?? null,
      city: property.city ?? null,
      county: property.county ?? null,
      state: property.state ?? "TX",
      jurisdiction: analysis.jurisdiction.authority,
      jurisdiction_level: analysis.jurisdiction.level,
      zoning: analysis.zoning.code || null,
      zoning_category: analysis.zoning.category,
      intent: project.intent ?? null,
      sector: project.sector ?? null,
      lot_size: project.lotSize ?? property.approxSiteArea ?? null,
      building_area: project.buildingArea ?? null,
      floors: project.floors ?? null,
      existing_use: project.existingUse ?? null,
      proposed_use: project.proposedUse ?? null,
      feasibility_status: analysis.feasibility.status,
      complexity_level: analysis.complexity.level,
      stage: "permitting",
      analysis,
    })
    .select("id")
    .single();
  if (error) throw error;
  const projectId = (proj as { id: string }).id;

  const permitRows = analysis.permits.map((p, i) => ({
    project_id: projectId,
    permit_key: p.id,
    name: p.name,
    category: p.category,
    agency: analysis.agencies.find((a) => a.permitId === p.id)?.agency ?? null,
    sort: i,
  }));
  if (permitRows.length) {
    const { error: pe } = await supabase.from("project_permits").insert(permitRows);
    if (pe) throw pe;
  }

  const checklistRows = analysis.permits.flatMap((p) =>
    buildPermitChecklist(p, analysis.jurisdiction).map((c) => ({
      project_id: projectId,
      permit_key: p.id,
      label: c.label,
      grp: c.group,
      required: c.required,
    })),
  );
  if (checklistRows.length) {
    await supabase.from("project_checklist_items").insert(checklistRows);
  }

  await supabase.from("project_notifications").insert({
    project_id: projectId,
    kind: "welcome",
    title: "Project saved",
    body: `Your permitting analysis for ${property.address ?? property.city ?? "your site"} is ready. ${analysis.permits.length} permits identified.`,
  });

  return projectId;
}

export async function getActiveProject(userId: string): Promise<ProjectRow | null> {
  const { data, error } = await supabase
    .from("projects")
    .select("*")
    .eq("user_id", userId)
    .order("updated_at", { ascending: false })
    .limit(1)
    .maybeSingle();
  if (error) throw error;
  return (data as ProjectRow) ?? null;
}

export async function listProjects(userId: string): Promise<ProjectRow[]> {
  const { data, error } = await supabase
    .from("projects")
    .select("*")
    .eq("user_id", userId)
    .order("updated_at", { ascending: false });
  if (error) throw error;
  return (data as ProjectRow[]) ?? [];
}

export async function getProjectBundle(projectId: string): Promise<ProjectBundle> {
  const [projectRes, permitsRes, checklistRes, notifsRes] = await Promise.all([
    supabase.from("projects").select("*").eq("id", projectId).single(),
    supabase.from("project_permits").select("*").eq("project_id", projectId).order("sort"),
    supabase.from("project_checklist_items").select("*").eq("project_id", projectId),
    supabase
      .from("project_notifications")
      .select("*")
      .eq("project_id", projectId)
      .order("created_at", { ascending: false }),
  ]);
  if (projectRes.error) throw projectRes.error;
  return {
    project: projectRes.data as ProjectRow,
    permits: (permitsRes.data as PermitRow[]) ?? [],
    checklist: (checklistRes.data as ChecklistRow[]) ?? [],
    notifications: (notifsRes.data as NotificationRow[]) ?? [],
  };
}

const PERMIT_FLOW = [
  "identified",
  "preparing",
  "submitted",
  "under_review",
  "comments",
  "resubmitted",
  "approved",
] as const;

export function nextPermitStatus(status: string): string {
  const i = PERMIT_FLOW.indexOf(status as (typeof PERMIT_FLOW)[number]);
  return i < 0 || i === PERMIT_FLOW.length - 1 ? status : PERMIT_FLOW[i + 1];
}

export async function updatePermit(
  permitId: string,
  patch: Partial<
    Pick<
      PermitRow,
      "status" | "submitted_at" | "approved_at" | "permit_number" | "expiry_date" | "review_round"
    >
  >,
): Promise<void> {
  const { error } = await supabase.from("project_permits").update(patch).eq("id", permitId);
  if (error) throw error;
}

export async function setChecklistDone(itemId: string, done: boolean): Promise<void> {
  const { error } = await supabase
    .from("project_checklist_items")
    .update({ done })
    .eq("id", itemId);
  if (error) throw error;
}

export async function markNotificationRead(id: string): Promise<void> {
  await supabase.from("project_notifications").update({ read: true }).eq("id", id);
}
