import { describe, expect, it } from "vitest";
import { PRO_PRICES, priceInfo, perMonth } from "./pricing";

describe("Rosea.AI Pro price test", () => {
  it("lower group: $9.99/month", () => expect(PRO_PRICES.low.monthly.cents).toBe(999));
  it("lower group: $59.99/year", () => expect(PRO_PRICES.low.yearly.cents).toBe(5999));
  it("premium group: $19.99/month", () => expect(PRO_PRICES.premium.monthly.cents).toBe(1999));
  it("premium group: $99.99/year", () => expect(PRO_PRICES.premium.yearly.cents).toBe(9999));
  it("maps a price id back to its group", () => expect(priceInfo("pro_yearly_premium")?.group).toBe("premium"));
  it("rejects old Plus and $1.99 ids", () => {
    expect(priceInfo("rosea_plus_year")).toBeNull();
    expect(priceInfo("full_analysis")).toBeNull();
  });
  it("yearly per-month equivalent", () => expect(perMonth(9999)).toBe("$8.33"));
});
