// Site constraints summary (PRD 1.1.11) + overall site data for design (PRD 1.1.12).
//
// Heuristic — CorvusDP has no live GIS/utility feed on the static build, so every
// value is flagged as an estimate to be confirmed by will-serve letters and a
// survey. Derived from the jurisdiction, zoning, and project inputs already
// gathered in the analysis pipeline.
import type { JurisdictionInfo } from "./jurisdiction";
import type { ZoningClassification } from "./zoning";
import type { ProjectIntent } from "./dp-intake";
import { parseArea } from "./format";

export type Availability = "likely_available" | "verify" | "likely_constrained";

export type UtilityLine = {
  name: string;
  status: Availability;
  note: string;
};

export type SiteConstraint = {
  title: string;
  severity: "info" | "watch" | "critical";
  detail: string;
};

export type SiteConstraints = {
  utilities: UtilityLine[];
  constraints: SiteConstraint[];
  criticalWarnings: string[];
  disclaimer: string;
};

export function deriveSiteConstraints(input: {
  jurisdiction: JurisdictionInfo;
  zoning: ZoningClassification;
  intent?: ProjectIntent;
  lotSize?: string | null;
  isEtj?: boolean;
}): SiteConstraints {
  const { jurisdiction, zoning } = input;
  const etj = input.isEtj || jurisdiction.level === "etj";
  const lotSqft = parseArea(input.lotSize ?? null);
  const large = (lotSqft ?? 0) >= 43560;
  const groundUp = input.intent === "new_construction" || input.intent === "site_development";

  const utilities: UtilityLine[] = [
    {
      name: "Water",
      status: etj ? "verify" : jurisdiction.matched ? "likely_available" : "verify",
      note: etj
        ? "ETJ site — service may come from a county MUD/SUD or require a service extension request."
        : "Confirm main size and pressure with a will-serve letter from the utility provider.",
    },
    {
      name: "Wastewater / Sewer",
      status: etj ? "likely_constrained" : jurisdiction.matched ? "verify" : "verify",
      note: etj
        ? "ETJ sites frequently lack gravity sewer — budget for a lift station, force main, or on-site septic (needs a soil/percolation test)."
        : "Verify a sewer main is within reach and has downstream capacity.",
    },
    {
      name: "Electric",
      status: "likely_available",
      note: "Coordinate transformer sizing and service point early with the electric provider.",
    },
    {
      name: "Storm drainage",
      status: large ? "verify" : "likely_available",
      note: large
        ? "Larger tract — detention/water-quality is almost certain; a drainage study will set pond sizing."
        : "On-site detention may still be triggered by added impervious cover.",
    },
    {
      name: "Gas / Telecom",
      status: "verify",
      note: "Confirm availability if the design depends on gas service or fiber.",
    },
  ];

  const constraints: SiteConstraint[] = [];
  const criticalWarnings: string[] = [];

  if (groundUp) {
    constraints.push({
      title: "Platting & dedications",
      severity: "watch",
      detail:
        "Undeveloped land generally needs a recorded plat with right-of-way, drainage, and utility easement dedications before a building permit.",
    });
  }
  constraints.push({
    title: "Building setbacks & lot coverage",
    severity: "info",
    detail: `Confirm ${zoning.label || "zoning"} front/side/rear setbacks, height limits, and maximum lot coverage — these shape the buildable envelope.`,
  });
  constraints.push({
    title: "Utility easements",
    severity: "watch",
    detail:
      "Existing utility/drainage easements can't be built over. A current title commitment and survey will locate them.",
  });
  if (large) {
    constraints.push({
      title: "Environmental / floodplain",
      severity: "watch",
      detail:
        "Order a FEMA floodplain determination and a tree survey; sites near creeks or in the Edwards Aquifer zone add water-quality review.",
    });
  }
  if (etj) {
    criticalWarnings.push(
      "Site appears to be in an ETJ — the county governs building permits while the city keeps platting authority. Confirm which office reviews what before spending on design.",
    );
  }
  if (utilities.find((u) => u.name.startsWith("Wastewater"))?.status === "likely_constrained") {
    criticalWarnings.push(
      "Wastewater service is uncertain at this location — resolve the sewer/septic path before committing to a building footprint.",
    );
  }

  return {
    utilities,
    constraints,
    criticalWarnings,
    disclaimer:
      "Estimated from jurisdiction, zoning, and project inputs — not a survey or a utility determination. Confirm with will-serve letters, a boundary/topographic survey, and a title commitment.",
  };
}

export function availabilityLabel(a: Availability): string {
  return a === "likely_available"
    ? "Likely available"
    : a === "likely_constrained"
      ? "Likely constrained"
      : "Verify";
}
