import { supabase } from "./supabase";

// ---- City relationship tracker (PRD 1.1.22 / 2.1.38) --------------------
export type CityCommRow = {
  id: string;
  project_id: string;
  channel: string;
  department: string | null;
  summary: string;
  next_follow_up: string | null;
  proactive_push: boolean;
  occurred_at: string;
};

export async function listCityComms(projectId: string): Promise<CityCommRow[]> {
  const { data, error } = await supabase
    .from("city_communications")
    .select("*")
    .eq("project_id", projectId)
    .order("occurred_at", { ascending: false });
  if (error) throw error;
  return (data as CityCommRow[]) ?? [];
}

export async function addCityComm(input: {
  projectId: string;
  channel: string;
  department?: string;
  summary: string;
  nextFollowUp?: string | null;
  proactivePush?: boolean;
}): Promise<void> {
  const { error } = await supabase.from("city_communications").insert({
    project_id: input.projectId,
    channel: input.channel,
    department: input.department ?? null,
    summary: input.summary,
    next_follow_up: input.nextFollowUp ?? null,
    proactive_push: input.proactivePush ?? false,
  });
  if (error) throw error;
}

// ---- Review comments (PRD 1.1.25 / 1.1.26 / 2.1.42) --------------------
export type ReviewCommentRow = {
  id: string;
  project_id: string;
  permit_key: string | null;
  original: string;
  plain_language: string | null;
  why_it_matters: string | null;
  required_action: string | null;
  responsible: string | null;
  priority: string;
  status: string;
  created_at: string;
};

export async function listReviewComments(projectId: string): Promise<ReviewCommentRow[]> {
  const { data, error } = await supabase
    .from("review_comments")
    .select("*")
    .eq("project_id", projectId)
    .order("created_at", { ascending: false });
  if (error) throw error;
  return (data as ReviewCommentRow[]) ?? [];
}

export async function addReviewComment(input: {
  projectId: string;
  permitKey?: string;
  original: string;
  plainLanguage?: string;
  whyItMatters?: string;
  requiredAction?: string;
  responsible?: string;
  priority?: string;
}): Promise<void> {
  const { error } = await supabase.from("review_comments").insert({
    project_id: input.projectId,
    permit_key: input.permitKey ?? null,
    original: input.original,
    plain_language: input.plainLanguage ?? null,
    why_it_matters: input.whyItMatters ?? null,
    required_action: input.requiredAction ?? null,
    responsible: input.responsible ?? null,
    priority: input.priority ?? "medium",
  });
  if (error) throw error;
}

export async function setReviewCommentStatus(id: string, status: string): Promise<void> {
  const { error } = await supabase.from("review_comments").update({ status }).eq("id", id);
  if (error) throw error;
}

// ---- Documents (PRD 1.1.x / 2.1.9) -----------------------------------
export type DocRow = {
  id: string;
  project_id: string;
  name: string;
  category: string;
  storage_path: string | null;
  note: string | null;
  created_at: string;
};

export async function listDocuments(projectId: string): Promise<DocRow[]> {
  const { data, error } = await supabase
    .from("project_documents")
    .select("*")
    .eq("project_id", projectId)
    .order("created_at", { ascending: false });
  if (error) throw error;
  return (data as DocRow[]) ?? [];
}

export async function addDocument(input: {
  projectId: string;
  name: string;
  category: string;
  storagePath?: string;
  note?: string;
}): Promise<void> {
  const { error } = await supabase.from("project_documents").insert({
    project_id: input.projectId,
    name: input.name,
    category: input.category,
    storage_path: input.storagePath ?? null,
    note: input.note ?? null,
  });
  if (error) throw error;
}
