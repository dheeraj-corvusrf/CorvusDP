import { createFileRoute, Link } from "@tanstack/react-router";
import { useActiveProjectBundle } from "@/hooks/use-project";
import { markNotificationRead } from "@/lib/projects";
import { roadmapStatus } from "@/lib/roadmap";
import { currencyRange, weeksLabel, dateShort } from "@/lib/format";
import {
  Section,
  Stat,
  Pill,
  EmptyProject,
  Loading,
  humanize,
  feasibilityTone,
} from "@/components/dp-ui";

export const Route = createFileRoute("/dashboard/_layout/")({
  head: () => ({ meta: [{ title: "Dashboard — CorvusDP" }] }),
  component: DashboardHome,
});

function DashboardHome() {
  const { loading, hasProject, project, bundle, refetch } = useActiveProjectBundle();

  if (loading) return <Loading />;
  if (!hasProject || !project) return <EmptyProject />;

  const analysis = project.analysis;
  const approvedIds = (bundle?.permits ?? [])
    .filter((p) => p.status === "approved")
    .map((p) => p.permit_key);
  const status = analysis ? roadmapStatus(analysis.roadmap, approvedIds) : null;
  const unread = (bundle?.notifications ?? []).filter((n) => !n.read);

  return (
    <div className="grid gap-5">
      <Section
        title={project.name ?? project.address ?? "Your project"}
        subtitle={`${project.jurisdiction ?? "Jurisdiction pending"} · ${humanize(project.track)}`}
        right={
          <Pill tone={feasibilityTone(project.feasibility_status)}>
            {humanize(project.feasibility_status)}
          </Pill>
        }
      >
        <div className="grid gap-3 sm:grid-cols-4">
          <Stat label="Current stage" value={humanize(project.stage)} hint={status?.currentPhase} />
          <Stat label="Complexity" value={humanize(project.complexity_level)} />
          <Stat
            label="Timeline estimate"
            value={
              analysis
                ? weeksLabel(analysis.timeline.totalWeeksMin, analysis.timeline.totalWeeksMax)
                : "—"
            }
          />
          <Stat
            label="Estimated cost"
            value={analysis ? currencyRange(analysis.fees.totalLow, analysis.fees.totalHigh) : "—"}
          />
        </div>
        {status && (
          <div className="mt-4">
            <div className="flex items-center justify-between text-sm">
              <span className="font-medium">Roadmap progress</span>
              <span className="text-muted-foreground">
                {status.completedPhases}/{status.totalPhases} phases · {status.percentComplete}%
              </span>
            </div>
            <div className="mt-1 h-2 overflow-hidden rounded-full bg-secondary">
              <div
                className="h-full rounded-full bg-accent"
                style={{ width: `${status.percentComplete}%` }}
              />
            </div>
            <p className="mt-2 text-xs text-muted-foreground">Next: {status.nextStep}</p>
          </div>
        )}
        <div className="mt-4 flex flex-wrap gap-2">
          <Link to="/dashboard/permits" className="btn-accent">
            Continue project
          </Link>
          <Link to="/dashboard/roadmap" className="btn-outline">
            View roadmap
          </Link>
        </div>
      </Section>

      <Section
        title="Recent notifications"
        subtitle={unread.length ? `${unread.length} unread` : "All caught up"}
      >
        {(bundle?.notifications ?? []).length === 0 ? (
          <p className="text-sm text-muted-foreground">No notifications yet.</p>
        ) : (
          <ul className="grid gap-2">
            {(bundle?.notifications ?? []).slice(0, 8).map((n) => (
              <li
                key={n.id}
                className={`rounded-lg border p-3 text-sm ${n.read ? "border-border" : "border-accent/40 bg-accent/5"}`}
              >
                <div className="flex items-center justify-between gap-2">
                  <span className="font-medium">{n.title}</span>
                  <span className="text-xs text-muted-foreground">{dateShort(n.created_at)}</span>
                </div>
                {n.body && <p className="mt-1 text-muted-foreground">{n.body}</p>}
                {!n.read && (
                  <button
                    onClick={async () => {
                      await markNotificationRead(n.id);
                      refetch();
                    }}
                    className="mt-1 text-xs text-accent underline underline-offset-2"
                  >
                    Mark read
                  </button>
                )}
              </li>
            ))}
          </ul>
        )}
      </Section>
    </div>
  );
}
