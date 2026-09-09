import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowRight, Compass, Ruler, Building2, Wallet } from "lucide-react";

export const Route = createFileRoute("/design/")({
  head: () => ({
    meta: [
      { title: "Design — CorvusDP" },
      {
        name: "description",
        content:
          "Turn a program into an AI-generated design brief: scope & deliverables, space plan, phased timeline, and a budget range.",
      },
    ],
  }),
  component: DesignOverview,
});

function DesignOverview() {
  return (
    <div className="container-page py-12">
      <span className="badge-soft">Design</span>
      <h1 className="mt-3 font-serif text-3xl font-semibold sm:text-4xl">
        A design brief in minutes, not weeks.
      </h1>
      <p className="mt-3 max-w-2xl text-muted-foreground">
        Give CorvusDP the property and your program. Get back what's included in the design, a
        room-level space plan, a phased timeline (concept → development → permit set), and a budget
        range — with the cost drivers explained.
      </p>

      <div className="mt-8 grid gap-4 sm:grid-cols-4">
        {[
          [Compass, "Scope & deliverables", "Survey, site, civil, architectural, structural, MEP."],
          [Ruler, "Space plan", "Room-level breakdown and functional zoning."],
          [Building2, "Timeline", "Concept, design development, final permit drawings."],
          [Wallet, "Budget range", "Design fees + rough build cost, with drivers."],
        ].map(([Icon, title, text]) => {
          const I = Icon as typeof Compass;
          return (
            <div key={title as string} className="card-elev p-4">
              <I className="h-5 w-5 text-accent" />
              <div className="mt-2 font-semibold">{title as string}</div>
              <p className="mt-1 text-xs text-muted-foreground">{text as string}</p>
            </div>
          );
        })}
      </div>

      <div className="mt-8 flex flex-wrap gap-3">
        <Link to="/design/analyze" className="btn-accent">
          Start a Design Brief <ArrowRight className="h-4 w-4" />
        </Link>
        <Link to="/permitting" className="btn-outline">
          Permitting instead
        </Link>
      </div>
    </div>
  );
}
