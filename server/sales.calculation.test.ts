import { describe, expect, it } from "vitest";
import { calculateAgentCommission, calculateTotalPosSales, matchesReportCategory, nextDayKey } from "./routers";

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

  it("uses the next calendar day as the exclusive end of Today", () => {
    expect(nextDayKey("2026-09-23")).toBe("2026-09-24");
    expect(nextDayKey("2026-12-31")).toBe("2027-01-01");
  });

  it("matches legacy uncategorized landing page sales from their recorded breakdown", () => {
    expect(matchesReportCategory({ sale: { categoryId: null, landingPageInitialOrder: "499.00", hotleadsUpsellCalls: "350.00" } }, 2, "LANDING PAGE")).toBe(true);
    expect(matchesReportCategory({ sale: { categoryId: null, landingPageInitialOrder: "499.00", hotleadsUpsellCalls: "350.00" } }, 4, "MESSAGING")).toBe(false);
  });

  it("uses the stored category ID when a sale has one", () => {
    expect(matchesReportCategory({ sale: { categoryId: 3, landingPageInitialOrder: "0.00" } }, 3, "LANDING PAGE WITH UPSELL")).toBe(true);
    expect(matchesReportCategory({ sale: { categoryId: 3, landingPageInitialOrder: "499.00" } }, 2, "LANDING PAGE")).toBe(false);
  });

  it("computes commission only when the client is delivered", () => {
    const sale = { landingPageInitialOrder: 1000, hotleadsUpsellCalls: 500, messaging: 200, warmLeadsOutboundCalls: 300 };
    expect(calculateAgentCommission(sale, "delivered")).toBeCloseTo(38, 5);
    expect(calculateAgentCommission(sale, "shipped")).toBe(0);
    expect(calculateAgentCommission(sale, "returned")).toBe(0);
    expect(calculateAgentCommission(sale, "no_status")).toBe(0);
  });
});
