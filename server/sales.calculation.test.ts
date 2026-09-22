import { describe, expect, it } from "vitest";
import { calculateTotalPosSales } from "./routers";

describe("calculateTotalPosSales", () => {
  it("adds the five sale fields and excludes advanced payment", () => {
    const total = calculateTotalPosSales({
      landingPageInitialOrder: "499.00",
      resellerDistributorPackage: "0.00",
      messaging: "0.00",
      warmLeadsOutboundCalls: "849.00",
      hotleadsUpsellCalls: "1299.00",
    });

    expect(total).toBe(2647);
  });

  it("supports decimal values and zero amounts", () => {
    const total = calculateTotalPosSales({
      landingPageInitialOrder: 10.25,
      resellerDistributorPackage: 4.5,
      messaging: 0,
      warmLeadsOutboundCalls: 0.25,
      hotleadsUpsellCalls: 1,
    });

    expect(total).toBeCloseTo(16, 5);
  });
});
