import { describe, expect, it } from "vitest";
import { plusOnSale } from "./plus-sale";

describe("old Rosea Plus $14.99 offer", () => {
  it("is not sold in English", () => expect(plusOnSale("en")).toBe(false));
  it("is not sold in German", () => expect(plusOnSale("de")).toBe(false));
  it("is not sold in Russian", () => expect(plusOnSale("ru")).toBe(false));
});
