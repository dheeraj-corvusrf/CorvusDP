import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/lib/auth";
import { getActiveDesignRequest } from "@/lib/design-requests";
import { scopeLabel } from "@/lib/design";
import { currencyRange, weeksLabel } from "@/lib/format";
import { Section, Stat, Loading } from "@/components/dp-ui";

export const Route = createFileRoute("/dashboard/_layout/design")({
  head: () => ({ meta: [{ title: "Design — CorvusDP" }] }),
  component: DesignDashboard,
});

function DesignDashboard() {
  const { user } = useAuth();
  const q = useQuery({
    queryKey: ["design-request", user?.id],
    queryFn: () => getActiveDesignRequest(user!.id),
    enabled: !!user?.id,
  });

  if (q.isLoading) return <Loading />;

  const dr = q.data;
  if (!dr || !dr.brief) {
    return (
      <div className="card-elev p-8 text-center">
        <h2 className="font-serif text-lg font-semibold">No design brief yet</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Generate one and save it to track it here.
        </p>
        <Link to="/design/analyze" className="btn-accent mt-4 inline-flex">
          Start a Design Brief
        </Link>
      </div>
    );
  }

  const b = dr.brief;

  return (
    <div className="grid gap-5">
      <Section
        title={dr.address ?? dr.city ?? "Design project"}
        subtitle={`${scopeLabel((dr.scope ?? undefined) as never)} · ${dr.sector ?? "commercial"} · ${dr.building_area ?? "?"} sf`}
      >
        <div className="grid gap-3 sm:grid-cols-3">
          <Stat label="Design fee range" value={currencyRange(b.budgetLow, b.budgetHigh)} />
          <Stat label="Timeline" value={weeksLabel(b.totalWeeksMin, b.totalWeeksMax)} />
          <Stat label="Stage" value={dr.stage} />
        </div>
      </Section>

      <Section title="Phase breakdown & tracking">
        <ol className="grid gap-2">
          {b.timeline.map((t, i) => (
            <li key={i} className="rounded-lg border border-border p-3 text-sm">
              <div className="flex items-center justify-between">
                <span className="font-medium">{t.phase}</span>
                <span className="text-muted-foreground">{weeksLabel(t.weeksMin, t.weeksMax)}</span>
              </div>
              <p className="text-xs text-muted-foreground">{t.note}</p>
            </li>
          ))}
        </ol>
      </Section>

      <Section title="Full space planning">
        <div className="grid gap-2 sm:grid-cols-2">
          {b.spacePlan.map((z) => (
            <div key={z.zone} className="rounded-lg border border-border p-3 text-sm">
              <div className="font-medium">{z.zone}</div>
              <p className="text-xs text-muted-foreground">{z.note}</p>
            </div>
          ))}
        </div>
      </Section>

      <Section title="Recommendations & next steps">
        <ul className="grid gap-1 text-sm text-muted-foreground">
          {b.recommendations.map((r) => (
            <li key={r}>• {r}</li>
          ))}
        </ul>
      </Section>
    </div>
  );
}
