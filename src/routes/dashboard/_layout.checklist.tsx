import { createFileRoute } from "@tanstack/react-router";
import { useMemo } from "react";
import { useActiveProjectBundle } from "@/hooks/use-project";
import { setChecklistDone } from "@/lib/projects";
import { checklistCompletion } from "@/lib/checklist";
import { Section, EmptyProject, Loading } from "@/components/dp-ui";

export const Route = createFileRoute("/dashboard/_layout/checklist")({
  head: () => ({ meta: [{ title: "Checklist — CorvusDP" }] }),
  component: Checklist,
});

function Checklist() {
  const { loading, hasProject, project, bundle, refetch } = useActiveProjectBundle();

  const byPermit = useMemo(() => {
    const map: Record<string, typeof bundle.checklist> = {};
    for (const item of bundle?.checklist ?? []) {
      const key = item.permit_key ?? "general";
      (map[key] ??= []).push(item);
    }
    return map;
  }, [bundle]);

  if (loading) return <Loading />;
  if (!hasProject || !project) return <EmptyProject />;

  const permitName = (key: string) =>
    (bundle?.permits ?? []).find((p) => p.permit_key === key)?.name ?? key;

  const overall = checklistCompletion(bundle?.checklist ?? []);
  const preApp = project.analysis?.preApp ?? [];

  return (
    <div className="grid gap-5">
      <Section
        title="Pre-application checklist"
        subtitle="Complete before submitting anything (PRD 1.1.13)"
      >
        <ul className="grid gap-1.5 text-sm">
          {preApp.map((i, k) => (
            <li key={k} className="flex items-start gap-2">
              <span
                className={`mt-0.5 inline-block h-4 w-4 shrink-0 rounded border ${i.required ? "border-accent" : "border-border"}`}
              />
              <span>
                {i.label}
                {!i.required && (
                  <span className="ml-1 text-xs text-muted-foreground">(optional)</span>
                )}
              </span>
            </li>
          ))}
        </ul>
      </Section>

      <Section
        title="City-specific submission checklists"
        subtitle={`Overall completion: ${overall}% of required items`}
      >
        <div className="grid gap-4">
          {Object.entries(byPermit).map(([key, items]) => {
            const pct = checklistCompletion(items);
            return (
              <div key={key} className="rounded-lg border border-border p-4">
                <div className="flex items-center justify-between">
                  <div className="font-medium">{permitName(key)}</div>
                  <span className="text-xs text-muted-foreground">{pct}%</span>
                </div>
                <ul className="mt-2 grid gap-1.5 text-sm">
                  {items.map((item) => (
                    <li key={item.id} className="flex items-start gap-2">
                      <input
                        type="checkbox"
                        checked={item.done}
                        onChange={async (e) => {
                          await setChecklistDone(item.id, e.target.checked);
                          refetch();
                        }}
                        className="mt-0.5"
                      />
                      <span className={item.done ? "text-muted-foreground line-through" : ""}>
                        {item.label}
                        <span className="ml-2 rounded bg-secondary px-1.5 py-0.5 text-[10px] uppercase text-muted-foreground">
                          {item.grp}
                        </span>
                        {!item.required && (
                          <span className="ml-1 text-xs text-muted-foreground">(optional)</span>
                        )}
                      </span>
                    </li>
                  ))}
                </ul>
              </div>
            );
          })}
        </div>
      </Section>
    </div>
  );
}
