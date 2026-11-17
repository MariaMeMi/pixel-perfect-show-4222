import { describe, expect, it } from "vitest";
import { sanitizeSkinContext, skinContextPrompt } from "./skin-context";

describe("Rosie skin-check context", () => {
  it("drops paid-only parts when the result is locked", () => {
    const c = sanitizeSkinContext({ date: "2026-11-15", score: 42, irritation: 30, summary: "Mild redness", observations: ["cheeks"], tips: ["SPF"], contributors: ["heat"], locked: true })!;
    expect(c.tips).toEqual([]);
    expect(c.contributors).toEqual([]);
    expect(skinContextPrompt(c)).toContain("locked behind Rosea.AI Pro");
  });
  it("ignores an empty or malformed check", () => {
    expect(sanitizeSkinContext({ score: 10 })).toBeUndefined();
    expect(sanitizeSkinContext("x")).toBeUndefined();
  });
  it("includes the score in the prompt", () => {
    expect(skinContextPrompt(sanitizeSkinContext({ date: "2026-11-15", score: 42, irritation: 3, summary: "s" })!)).toContain("42/100");
  });
});
