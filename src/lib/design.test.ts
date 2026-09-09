import { describe, it, expect } from "vitest";
import { generateDesignBrief, scopeLabel } from "./design";
import { parseArea } from "./format";

describe("parseArea", () => {
  it("parses square feet and acres", () => {
    expect(parseArea("25,000 sf")).toBe(25000);
    expect(parseArea("2 acres")).toBe(87120);
    expect(parseArea("1.5 ac")).toBe(65340);
    expect(parseArea("")).toBeNull();
    expect(parseArea(12000)).toBe(12000);
  });
});

describe("generateDesignBrief", () => {
  it("includes civil + survey for ground-up, drops them for interior fit-out", () => {
    const groundUp = generateDesignBrief({
      scope: "new_construction",
      sector: "commercial",
      buildingArea: "20000",
    });
    const fitOut = generateDesignBrief({
      scope: "interior_fit_out",
      sector: "commercial",
      buildingArea: "6000",
    });
    expect(groundUp.inclusions.some((i) => /civil/i.test(i.title))).toBe(true);
    expect(fitOut.inclusions.some((i) => /civil/i.test(i.title))).toBe(false);
  });

  it("scales the budget with area", () => {
    const small = generateDesignBrief({ scope: "new_construction", buildingArea: "5000" });
    const big = generateDesignBrief({ scope: "new_construction", buildingArea: "50000" });
    expect(big.budgetHigh).toBeGreaterThan(small.budgetHigh);
  });

  it("derives a space plan from a rooms list", () => {
    const brief = generateDesignBrief({
      scope: "new_construction",
      rooms: "Lobby, Kitchen, Dining, Restrooms",
    });
    expect(brief.spacePlan.map((z) => z.zone)).toContain("Kitchen");
  });

  it("adds weeks for multi-story", () => {
    const one = generateDesignBrief({
      scope: "new_construction",
      buildingArea: "20000",
      floors: "1",
    });
    const four = generateDesignBrief({
      scope: "new_construction",
      buildingArea: "20000",
      floors: "4",
    });
    expect(four.totalWeeksMax).toBeGreaterThan(one.totalWeeksMax);
  });
});

describe("scopeLabel", () => {
  it("humanizes the scope enum", () => {
    expect(scopeLabel("interior_fit_out")).toBe("Interior Fit-Out");
    expect(scopeLabel(undefined)).toBe("Project");
  });
});
