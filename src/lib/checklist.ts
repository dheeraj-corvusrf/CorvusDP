// City-specific submission checklists + pre-application checklist
// (PRD 1.1.10 / 1.1.13 / 2.1.12 / 2.1.17).
import type { PermitItem } from "./permits";
import type { JurisdictionInfo } from "./jurisdiction";

export type ChecklistItem = {
  label: string;
  group: "Drawings" | "Forms" | "Studies" | "Supporting" | "Fees" | "Authorization";
  required: boolean;
};

const BASE_FORMS: ChecklistItem[] = [
  { label: "Completed permit application form", group: "Forms", required: true },
  {
    label: "Owner authorization / agent-of-record letter (notarized)",
    group: "Authorization",
    required: true,
  },
  { label: "Contractor / design professional registration", group: "Forms", required: true },
  { label: "Application & plan-review fees", group: "Fees", required: true },
];

const BY_PERMIT: Record<string, ChecklistItem[]> = {
  plat: [
    { label: "Preliminary / final plat drawing (sealed)", group: "Drawings", required: true },
    { label: "Boundary & topographic survey", group: "Drawings", required: true },
    { label: "Title commitment / ownership evidence", group: "Supporting", required: true },
    { label: "Tax certificate (no delinquent taxes)", group: "Supporting", required: true },
    { label: "Traffic impact analysis", group: "Studies", required: false },
  ],
  site: [
    { label: "Site plan (dimensioned, sealed)", group: "Drawings", required: true },
    { label: "Grading & drainage plan", group: "Drawings", required: true },
    { label: "Landscape & tree-preservation plan", group: "Drawings", required: false },
    { label: "Drainage / detention study", group: "Studies", required: true },
    { label: "Photometric / site lighting plan", group: "Drawings", required: false },
  ],
  civil: [
    { label: "Utility plan & profile sheets (sealed)", group: "Drawings", required: true },
    { label: "Water & wastewater capacity letter", group: "Supporting", required: true },
    { label: "Downstream drainage assessment", group: "Studies", required: false },
  ],
  grading: [
    { label: "Erosion control plan / SWPPP", group: "Drawings", required: true },
    { label: "Cut / fill earthwork quantities", group: "Studies", required: true },
    { label: "Geotechnical report", group: "Studies", required: false },
  ],
  building: [
    { label: "Architectural drawings (sealed)", group: "Drawings", required: true },
    { label: "Structural drawings & calculations (sealed)", group: "Drawings", required: true },
    { label: "MEP drawings (sealed)", group: "Drawings", required: true },
    { label: "Energy code compliance (ComCheck / REScheck)", group: "Supporting", required: true },
    { label: "Accessibility (TAS / ADA) review submittal", group: "Supporting", required: false },
  ],
  fire: [
    { label: "Fire lane & hydrant exhibit", group: "Drawings", required: true },
    {
      label: "Sprinkler / alarm design (deferred submittal OK)",
      group: "Drawings",
      required: false,
    },
  ],
  utility: [
    { label: "Will-serve / service availability letters", group: "Supporting", required: true },
    { label: "Impact / capital recovery fee worksheet", group: "Fees", required: true },
  ],
  env: [
    { label: "FEMA floodplain determination / LOMR", group: "Studies", required: false },
    { label: "Environmental / water quality assessment", group: "Studies", required: false },
    { label: "Tree survey", group: "Drawings", required: false },
  ],
};

export function buildPermitChecklist(permit: PermitItem, _jur: JurisdictionInfo): ChecklistItem[] {
  return [
    ...BASE_FORMS,
    ...(BY_PERMIT[permit.id] ?? [
      {
        label: "Drawings / exhibits per department intake list",
        group: "Drawings",
        required: true,
      },
    ]),
  ];
}

export function checklistCompletion(items: { required: boolean; done?: boolean }[]): number {
  const req = items.filter((i) => i.required);
  if (req.length === 0) return 0;
  return Math.round((req.filter((i) => i.done).length / req.length) * 100);
}

export type PreAppItem = { label: string; required: boolean };

export function preApplicationChecklist(
  jur: JurisdictionInfo,
  permits: PermitItem[],
): PreAppItem[] {
  const items: PreAppItem[] = [
    { label: `Request a pre-application meeting with ${jur.authority}`, required: true },
    { label: "Confirm zoning classification & overlay districts in writing", required: true },
    {
      label: "Obtain utility service availability letters (water / wastewater / power)",
      required: true,
    },
    { label: "Order boundary & topographic survey", required: true },
    { label: "Confirm required studies (drainage, traffic, environmental)", required: true },
    { label: "Assemble owner authorization & entity documents", required: true },
    { label: "Budget for application, impact, and review fees", required: true },
    { label: "Identify design team of record (Architect, Civil, Structural, MEP)", required: true },
  ];
  if (permits.some((p) => p.id === "plat")) {
    items.push({ label: "Confirm platting status & any required dedications", required: true });
  }
  if (permits.some((p) => p.id === "env")) {
    items.push({ label: "Order environmental / floodplain determination", required: false });
  }
  return items;
}
