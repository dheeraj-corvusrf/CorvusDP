import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/lib/auth";
import {
  checkIsAdmin,
  listLeads,
  listAllProjects,
  listAllDesignRequests,
  type LeadRow,
  type AdminProjectRow,
  type AdminDesignRow,
} from "@/lib/admin";
import { dateShort } from "@/lib/format";
import { Section, Pill, humanize } from "@/components/dp-ui";

export const Route = createFileRoute("/admin")({
  head: () => ({ meta: [{ title: "Admin — CorvusDP" }] }),
  component: Admin,
});

type Tab = "projects" | "design" | "leads";

function Admin() {
  const { user, loading } = useAuth();
  const nav = useNavigate();
  const [tab, setTab] = useState<Tab>("projects");
  const [authorized, setAuthorized] = useState<boolean | null>(null);

  useEffect(() => {
    if (loading) return;
    if (!user) {
      nav({ to: "/admin-login" });
      return;
    }
    checkIsAdmin(user.id).then((ok) => {
      setAuthorized(ok);
      if (!ok) nav({ to: "/admin-login" });
    });
  }, [user, loading, nav]);

  const projects = useQuery<AdminProjectRow[]>({
    queryKey: ["admin", "projects"],
    queryFn: listAllProjects,
    enabled: authorized === true,
  });
  const design = useQuery<AdminDesignRow[]>({
    queryKey: ["admin", "design"],
    queryFn: listAllDesignRequests,
    enabled: authorized === true,
  });
  const leads = useQuery<LeadRow[]>({
    queryKey: ["admin", "leads"],
    queryFn: listLeads,
    enabled: authorized === true,
  });

  if (authorized !== true) {
    return (
      <div className="container-page py-16 text-sm text-muted-foreground">Checking access…</div>
    );
  }

  return (
    <div className="container-page py-10">
      <span className="badge-soft">Admin</span>
      <h1 className="mt-3 font-serif text-2xl font-semibold">CorvusDP staff console</h1>

      <div className="mt-5 flex gap-1">
        {(["projects", "design", "leads"] as Tab[]).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`rounded-md px-3 py-2 text-sm font-medium capitalize ${
              tab === t
                ? "bg-nav-highlight text-nav-highlight-foreground"
                : "text-muted-foreground hover:bg-secondary"
            }`}
          >
            {t}
          </button>
        ))}
      </div>

      <div className="mt-5">
        {tab === "projects" && (
          <Section title={`Permitting projects (${projects.data?.length ?? 0})`}>
            <Table
              cols={["Project", "Jurisdiction", "Feasibility", "Complexity", "Stage", "Created"]}
              rows={(projects.data ?? []).map((p) => [
                p.name ?? p.address ?? "—",
                p.jurisdiction ?? "—",
                <Pill
                  key="f"
                  tone={
                    p.feasibility_status === "allowed"
                      ? "green"
                      : p.feasibility_status === "not_allowed"
                        ? "red"
                        : "amber"
                  }
                >
                  {humanize(p.feasibility_status)}
                </Pill>,
                humanize(p.complexity_level),
                humanize(p.stage),
                dateShort(p.created_at),
              ])}
              loading={projects.isLoading}
            />
          </Section>
        )}
        {tab === "design" && (
          <Section title={`Design requests (${design.data?.length ?? 0})`}>
            <Table
              cols={["Location", "Scope", "Sector", "Stage", "Created"]}
              rows={(design.data ?? []).map((d) => [
                d.address ?? d.city ?? "—",
                humanize(d.scope),
                humanize(d.sector),
                humanize(d.stage),
                dateShort(d.created_at),
              ])}
              loading={design.isLoading}
            />
          </Section>
        )}
        {tab === "leads" && (
          <Section
            title={`Leads (${leads.data?.length ?? 0})`}
            subtitle="Anonymous drop-offs from the analysis flow."
          >
            <Table
              cols={["Track", "Contact", "Property", "Intent", "Created"]}
              rows={(leads.data ?? []).map((l) => [
                humanize(l.track),
                l.email ?? l.name ?? "—",
                (l.property as { address?: string; city?: string } | null)?.address ??
                  (l.property as { city?: string } | null)?.city ??
                  "—",
                String(l.intent_score),
                dateShort(l.created_at),
              ])}
              loading={leads.isLoading}
            />
          </Section>
        )}
      </div>
    </div>
  );
}

function Table({
  cols,
  rows,
  loading,
}: {
  cols: string[];
  rows: React.ReactNode[][];
  loading?: boolean;
}) {
  if (loading) return <p className="text-sm text-muted-foreground">Loading…</p>;
  if (rows.length === 0) return <p className="text-sm text-muted-foreground">Nothing yet.</p>;
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-border text-left text-xs uppercase text-muted-foreground">
            {cols.map((c) => (
              <th key={c} className="px-2 py-2 font-medium">
                {c}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((r, i) => (
            <tr key={i} className="row-hover border-b border-border/60">
              {r.map((cell, j) => (
                <td key={j} className="px-2 py-2 align-top">
                  {cell}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
