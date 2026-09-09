import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/lib/auth";
import {
  getActiveDesignRequest,
  approveDesignBrief,
  requestDesignConsultation,
} from "@/lib/design-requests";
import { scopeLabel } from "@/lib/design";
import { currency, currencyRange, weeksLabel, dateShort } from "@/lib/format";
import { Section, Stat, Loading, Pill } from "@/components/dp-ui";

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
  const [busy, setBusy] = useState<"approve" | "consult" | null>(null);

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

  async function approve() {
    if (!dr) return;
    setBusy("approve");
    await approveDesignBrief(dr.id);
    await q.refetch();
    setBusy(null);
  }
  async function consult() {
    if (!dr) return;
    setBusy("consult");
    await requestDesignConsultation(dr.id);
    await q.refetch();
    setBusy(null);
  }

  return (
    <div className="grid gap-5">
      <Section
        title={dr.address ?? dr.city ?? "Design project"}
        subtitle={`${scopeLabel((dr.scope ?? undefined) as never)} · ${dr.sector ?? "commercial"} · ${dr.building_area ?? "?"} sf`}
        right={
          dr.approved_at ? (
            <Pill tone="green">Approved {dateShort(dr.approved_at)}</Pill>
          ) : undefined
        }
      >
        <div className="grid gap-3 sm:grid-cols-3">
          <Stat label="Design fee range" value={currencyRange(b.budgetLow, b.budgetHigh)} />
          <Stat label="Est. build cost" value={currencyRange(b.buildCostLow, b.buildCostHigh)} />
          <Stat label="Timeline" value={weeksLabel(b.totalWeeksMin, b.totalWeeksMax)} />
        </div>

        <div className="mt-4 flex flex-wrap gap-2">
          {!dr.approved_at && (
            <button
              className="btn-accent disabled:opacity-60"
              disabled={busy === "approve"}
              onClick={approve}
            >
              {busy === "approve" ? "Saving…" : "Approve & start detailed design"}
            </button>
          )}
          <button
            className="btn-outline disabled:opacity-60"
            disabled={busy === "consult" || !!dr.consultation_requested_at}
            onClick={consult}
          >
            {dr.consultation_requested_at
              ? `Consultation requested ${dateShort(dr.consultation_requested_at)}`
              : busy === "consult"
                ? "Requesting…"
                : "Schedule initial consultation call"}
          </button>
        </div>
      </Section>

      <Section title="Cost breakdown" subtitle="Design fee by discipline (PRD 1.2.10.A).">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border text-left text-xs uppercase text-muted-foreground">
                <th className="px-2 py-2 font-medium">Discipline</th>
                <th className="px-2 py-2 font-medium">Estimated fee</th>
              </tr>
            </thead>
            <tbody>
              {b.costBreakdown.map((c) => (
                <tr key={c.discipline} className="row-hover border-b border-border/60">
                  <td className="px-2 py-2">{c.discipline}</td>
                  <td className="px-2 py-2 tabular-nums">{currencyRange(c.low, c.high)}</td>
                </tr>
              ))}
              <tr className="font-semibold">
                <td className="px-2 py-2">Total design fee</td>
                <td className="px-2 py-2 tabular-nums">
                  {currencyRange(b.budgetLow, b.budgetHigh)}
                </td>
              </tr>
            </tbody>
          </table>
        </div>
        <ul className="mt-3 grid gap-1 text-sm text-muted-foreground">
          {b.costDrivers.map((c) => (
            <li key={c}>• {c}</li>
          ))}
        </ul>
        <p className="mt-2 text-xs text-muted-foreground">
          Approximate constructed cost ({currency(b.buildCostLow)}–{currency(b.buildCostHigh)}) is
          separate from the design fee.
        </p>
      </Section>

      <Section title="Suggested approach" subtitle="PRD 1.2.12.A.">
        <div className="grid gap-3 sm:grid-cols-3">
          {b.approaches.map((ap) => (
            <div key={ap.name} className="rounded-lg border border-border p-3 text-sm">
              <div className="font-medium">{ap.name}</div>
              <p className="mt-1 text-xs text-muted-foreground">{ap.summary}</p>
              <p className="mt-2 text-xs">
                <span className="text-muted-foreground">Best when: </span>
                {ap.bestWhen}
              </p>
            </div>
          ))}
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
