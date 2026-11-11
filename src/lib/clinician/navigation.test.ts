import { describe, expect, it } from "vitest";
import { dashboardDestination } from "./navigation";

describe("role-based dashboard navigation", () => {
  it("keeps regular customers on their skin dashboard", () => {
    expect(dashboardDestination(false, true)).toBe("/");
  });
  it("sends authorized clinicians to their clinician dashboard", () => {
    expect(dashboardDestination(true, true)).toBe("/clinician/dashboard");
  });
  it("keeps new customers in consumer onboarding", () => {
    expect(dashboardDestination(false, false)).toBe("/onboarding");
  });
  it("lets clinicians explicitly open their skin workspace without a redirect loop", () => {
    expect(dashboardDestination(true, true, true)).toBe("/");
  });
});