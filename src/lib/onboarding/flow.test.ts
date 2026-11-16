import { describe, expect, it } from "vitest";
import { buildSteps, emptyData, profileSections, type GoalKey } from "./flow";

describe("short onboarding", () => {
  it("takes redness users from goals through symptoms straight to the photo", () => {
    expect(buildSteps({ ...emptyData(), goals: ["redness"] })).toEqual([
      "goals", "r_symptoms", "baseline", "signup", "building", "gate", "profile",
    ]);
  });

  it("keeps every combination to at most three questions before the photo", () => {
    const goals: GoalKey[] = ["redness", "dryness", "lines", "botox", "overall"];
    for (let mask = 1; mask < 32; mask++) {
      const steps = buildSteps({ ...emptyData(), goals: goals.filter((_, index) => mask & (1 << index)) });
      expect(steps.indexOf("baseline")).toBeLessThanOrEqual(3);
      expect(steps.slice(steps.indexOf("baseline"))).toEqual(["baseline", "signup", "building", "gate", "profile"]);
    }
  });

  it("retains Botox timing without requiring treatment areas", () => {
    expect(buildSteps({ ...emptyData(), goals: ["botox"] }).slice(0, 3)).toEqual(["goals", "b_when", "baseline"]);
  });

  it("preserves previous answers in saved starting profiles", () => {
    expect(profileSections({ ...emptyData(), goals: ["redness"], diagnosed: "No", symptoms: ["Flushing that comes and goes"] })).toContainEqual({
      label: "You're tracking", items: ["Flushing that comes and goes"],
    });
  });
});