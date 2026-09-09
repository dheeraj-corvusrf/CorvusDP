import { createFileRoute, Link } from "@tanstack/react-router";
import { FileCheck2, DraftingCompass, HardHat, Banknote, ArrowRight, Sparkles } from "lucide-react";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "CorvusDP — AI-assisted permitting & design" },
      {
        name: "description",
        content:
          "Start a permitting analysis or a design brief for your development project. AI-assisted, jurisdiction-aware, across US states.",
      },
    ],
  }),
  component: Landing,
});

const DOORS = [
  {
    key: "permitting",
    to: "/permitting",
    icon: FileCheck2,
    title: "Permitting & Entitlement",
    blurb:
      "Identify every permit, the reviewing agencies, the dependency sequence, fees, and a timeline — from one address.",
    cta: "Start Permitting Analysis",
    live: true,
  },
  {
    key: "design",
    to: "/design",
    icon: DraftingCompass,
    title: "Design",
    blurb:
      "Turn a program into an AI-generated design brief: scope, space plan, timeline, and a budget range.",
    cta: "Start a Design Brief",
    live: true,
  },
  {
    key: "construction",
    to: "/construction",
    icon: HardHat,
    title: "Construction",
    blurb: "Scope, readiness, budget and schedule intake for the build phase.",
    cta: "Tell us about the build",
    live: true,
  },
  {
    key: "finance",
    to: "/finance",
    icon: Banknote,
    title: "Financing",
    blurb: "Development and construction finance — coming soon.",
    cta: "Preview",
    live: false,
  },
] as const;

function Landing() {
  return (
    <div>
      <section className="brand-gradient-soft">
        <div className="container-page py-16 sm:py-20">
          <span className="badge-soft">
            <Sparkles className="h-3.5 w-3.5" /> One of the five CorvusRE doors
          </span>
          <h1 className="mt-4 max-w-3xl font-serif text-4xl font-semibold tracking-tight sm:text-5xl">
            Permitting and design for real estate development, done with AI.
          </h1>
          <p className="mt-4 max-w-2xl text-lg text-muted-foreground">
            Every jurisdiction has its own requirements, timelines, and reviewers. CorvusDP turns an
            address and a project scope into a clear permitting roadmap and a design brief —
            following local best practice, whatever the project size.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Link to="/permitting" className="btn-accent">
              Start Permitting Analysis <ArrowRight className="h-4 w-4" />
            </Link>
            <Link to="/design" className="btn-outline">
              Start a Design Brief
            </Link>
          </div>
        </div>
      </section>

      <section className="container-page py-12">
        <h2 className="font-serif text-2xl font-semibold">Choose where to start</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          You can run the analysis without an account — sign up to save it and unlock the full
          report.
        </p>
        <div className="mt-6 grid gap-4 sm:grid-cols-2">
          {DOORS.map((d) => {
            const Icon = d.icon;
            return (
              <Link
                key={d.key}
                to={d.to}
                className="card-elev group flex flex-col gap-3 p-6 transition-transform hover:-translate-y-0.5"
              >
                <div className="flex items-center gap-3">
                  <span className="inline-flex h-10 w-10 items-center justify-center rounded-lg bg-accent/12 text-accent">
                    <Icon className="h-5 w-5" />
                  </span>
                  <h3 className="font-serif text-lg font-semibold">{d.title}</h3>
                  {!d.live && <span className="badge-soft-warning">Soon</span>}
                </div>
                <p className="text-sm text-muted-foreground">{d.blurb}</p>
                <span className="mt-auto inline-flex items-center gap-1 text-sm font-semibold text-accent">
                  {d.cta}{" "}
                  <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
                </span>
              </Link>
            );
          })}
        </div>
      </section>

      <section className="container-page pb-16">
        <div className="card-elev grid gap-6 p-6 sm:grid-cols-4">
          {[
            ["Input", "Address or manual site details, and your project intent."],
            ["Analysis", "Zoning, jurisdiction, feasibility, and constraints."],
            ["Permits", "Every permit, agency, checklist, sequence, and fee."],
            ["Submission → Approval", "Track review cycles, comments, approvals, and expiry."],
          ].map(([step, text], i) => (
            <div key={step}>
              <div className="text-xs font-semibold uppercase tracking-wide text-accent">
                Step {i + 1}
              </div>
              <div className="mt-1 font-semibold">{step}</div>
              <p className="mt-1 text-sm text-muted-foreground">{text}</p>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
