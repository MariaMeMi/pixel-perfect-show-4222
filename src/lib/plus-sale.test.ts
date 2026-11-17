import { describe, expect, it } from "vitest";
import { plusOnSale } from "./plus-sale";

describe("Rosea Plus sale during Pro price test", () => {
  it("is hidden for English users", () => expect(plusOnSale("en")).toBe(false));
  it("stays on sale for German users", () => expect(plusOnSale("de")).toBe(true));
  it("stays on sale for Russian users", () => expect(plusOnSale("ru")).toBe(true));
});
