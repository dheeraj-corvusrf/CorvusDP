import { supabase } from "./supabase";
import type { NotificationRow } from "./projects";

// Alerts & Notifications (PRD 1.1.27). In-app only on the static build — no
// email/SMS transport — but every project status change writes one so the
// dashboard and the Notifications page stay current.

export async function addNotification(input: {
  projectId: string;
  kind: string;
  title: string;
  body?: string;
}): Promise<void> {
  try {
    await supabase.from("project_notifications").insert({
      project_id: input.projectId,
      kind: input.kind,
      title: input.title,
      body: input.body ?? null,
    });
  } catch (err) {
    console.error("notification insert failed (non-blocking)", err);
  }
}

export async function listNotifications(projectId: string): Promise<NotificationRow[]> {
  const { data, error } = await supabase
    .from("project_notifications")
    .select("*")
    .eq("project_id", projectId)
    .order("created_at", { ascending: false });
  if (error) throw error;
  return (data as NotificationRow[]) ?? [];
}

export async function markNotificationRead(id: string): Promise<void> {
  await supabase.from("project_notifications").update({ read: true }).eq("id", id);
}

export async function markAllNotificationsRead(projectId: string): Promise<void> {
  await supabase
    .from("project_notifications")
    .update({ read: true })
    .eq("project_id", projectId)
    .eq("read", false);
}

const PERMIT_STATUS_COPY: Record<string, string> = {
  preparing: "Preparation started",
  submitted: "Submitted for review",
  under_review: "Under review",
  comments: "Review comments received",
  resubmitted: "Resubmitted",
  approved: "Approved",
};

export function permitStatusNotification(permitName: string, newStatus: string) {
  const phrase = PERMIT_STATUS_COPY[newStatus] ?? newStatus.replace(/_/g, " ");
  return {
    kind: "permit_status",
    title: `${permitName}: ${phrase}`,
    body:
      newStatus === "approved"
        ? `${permitName} has been approved. Record the permit number and expiry on the Approvals tab.`
        : newStatus === "comments"
          ? `The city returned comments on ${permitName}. Log and assign them on the Reviews tab.`
          : `${permitName} moved to "${phrase}".`,
  };
}
