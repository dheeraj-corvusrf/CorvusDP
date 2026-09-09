import { createFileRoute, Link } from "@tanstack/react-router";
import { FileInput, ScanSearch, FileCheck2, Send, BadgeCheck, ArrowRight } from "lucide-react";

export const Route = createFileRoute("/permitting/")({
  head: () => ({
    meta: [
      { title: "Permitting & Entitlement — CorvusDP" },
      {
        name: "description",
        content:
          "What CorvusDP's permitting analysis produces: zoning & jurisdiction, feasibility, required permits, agencies, checklists, roadmap, fees, and timeline.",
      },
    ],
  }),
  component: PermittingOverview,
});

const STEPS = [
  { icon: FileInput, label: "Input", text: "Address or manual site details + project intent." },
  {
    icon: ScanSearch,
    label: "Analysis",
    text: "Zoning, jurisdiction, feasibility, and site constraints.",
  },
  {
    icon: FileCheck2,
    label: "Permits",
    text: "Every required permit, its agency, and a submission checklist.",
  },
  { icon: Send, label: "Submission", text: "Dependency-ordered roadmap, fees, and a timeline." },
  {
    icon: BadgeCheck,
    label: "Approval",
    text: "Track review cycles, comments, approvals, and expiry.",
  },
];

function PermittingOverview() {
  return (
    <div className="container-page py-12">
      <span className="badge-soft">Permitting &amp; Entitlement</span>
      <h1 className="mt-3 font-serif text-3xl font-semibold sm:text-4xl">
        From one address to a complete permitting roadmap.
      </h1>
      <p className="mt-3 max-w-2xl text-muted-foreground">
        Enter the property and your project scope. CorvusDP retrieves jurisdiction and zoning
        context, checks feasibility, then lays out every permit you'll need, who reviews it, what to
        submit, the order to submit in, the fees, and how long it should take.
      </p>

      <div className="mt-8 grid gap-3 sm:grid-cols-5">
        {STEPS.map((s) => {
          const Icon = s.icon;
          return (
            <div key={s.label} className="card-elev p-4">
              <Icon className="h-5 w-5 text-accent" />
              <div className="mt-2 font-semibold">{s.label}</div>
              <p className="mt-1 text-xs text-muted-foreground">{s.text}</p>
            </div>
          );
        })}
      </div>

      <div className="mt-8 card-elev brand-gradient-soft p-6">
        <h2 className="font-serif text-lg font-semibold">Where AI helps</h2>
        <ul className="mt-3 grid gap-2 text-sm text-muted-foreground sm:grid-cols-2">
          <li>• Maps your scope to the right permits across any US jurisdiction</li>
          <li>• Translates plan-review comments into plain language and assigns owners</li>
          <li>• Sequences permits by dependency so nothing stalls waiting on a prerequisite</li>
          <li>• Estimates fees and a realistic multi-cycle review timeline</li>
        </ul>
      </div>

      <div className="mt-8 flex flex-wrap gap-3">
        <Link to="/permitting/analyze" className="btn-accent">
          Start Permitting Analysis <ArrowRight className="h-4 w-4" />
        </Link>
        <Link to="/design" className="btn-outline">
          Need design first?
        </Link>
      </div>
      <p className="mt-3 text-xs text-muted-foreground">
        No account needed to run the analysis. Outputs are estimates — confirm with the authority
        having jurisdiction.
      </p>
    </div>
  );
}
