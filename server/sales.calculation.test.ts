import { describe, expect, it } from "vitest";
import { calculateAgentCommission, calculateGrossSales, calculatePaidAmount, calculateTotalPosSales, normalizeSalesAmounts, matchesReportCategory, nextDayKey } from "./routers";

describe("External Sales category normalization", () => {
  it("moves POS breakdown amounts into External Sales for an External Sales category", () => {
    const normalized = normalizeSalesAmounts({ landingPageInitialOrder: 500, resellerDistributorPackage: 0, messaging: 0, warmLeadsOutboundCalls: 0, hotleadsUpsellCalls: 0, externalSales: 250 }, true);
    expect(normalized.totalPosSales).toBe("0.00");
    expect(normalized.externalSales).toBe("250.00");
    expect(normalized.landingPageInitialOrder).toBe("0.00");
    const explicit = normalizeSalesAmounts({ landingPageInitialOrder: 500, resellerDistributorPackage: 0, messaging: 0, warmLeadsOutboundCalls: 0, hotleadsUpsellCalls: 0, externalSales: 900 }, true);
    expect(explicit.externalSales).toBe("900.00");
    const paidFallback = normalizeSalesAmounts({ landingPageInitialOrder: 0, resellerDistributorPackage: 0, messaging: 0, warmLeadsOutboundCalls: 0, hotleadsUpsellCalls: 0, externalSales: 0, paymentStatus: "fully_paid", initialPaymentAmount: 1200 }, true);
    expect(paidFallback.externalSales).toBe("1200.00");
  });
});

describe("External Sales separation", () => {
  it("keeps External Sales out of POS totals while including it in gross sales", () => {
    expect(calculateTotalPosSales({ landingPageInitialOrder: 0, resellerDistributorPackage: 0, messaging: 0, warmLeadsOutboundCalls: 0, hotleadsUpsellCalls: 0, externalSales: 750 })).toBe(0);
    expect(calculateGrossSales({ landingPageInitialOrder: 0, resellerDistributorPackage: 0, messaging: 0, warmLeadsOutboundCalls: 0, hotleadsUpsellCalls: 0, externalSales: 750 })).toBe(750);
  });
});

describe("calculatePaidAmount", () => {
  it("uses Total POS Sales as the paid amount for fully-paid orders", () => {
    expect(calculatePaidAmount({ paymentStatus: "fully_paid", initialPaymentAmount: "0.00", totalPosSales: "1000.00" })).toBe(1000);
  });

  it("uses the recorded initial amount for advance payments", () => {
    expect(calculatePaidAmount({ paymentStatus: "initial_payment", initialPaymentAmount: "250.00", totalPosSales: "1000.00" })).toBe(250);
  });
});

describe("calculateTotalPosSales", () => {
  it("adds all sale fields and excludes advanced payment", () => {
    const total = calculateTotalPosSales({
      landingPageInitialOrder: "499.00",
      resellerDistributorPackage: "0.00",
      messaging: "0.00",
      warmLeadsOutboundCalls: "849.00",
      hotleadsUpsellCalls: "1299.00",
      externalSales: "100.00",
    });

    expect(total).toBe(2647);
  });

  it("supports decimal values, External Sales, and zero amounts", () => {
    const total = calculateTotalPosSales({
      landingPageInitialOrder: 10.25,
      resellerDistributorPackage: 4.5,
      messaging: 0,
      warmLeadsOutboundCalls: 0.25,
      hotleadsUpsellCalls: 1,
      externalSales: 2,
    });

    expect(total).toBeCloseTo(16, 5)
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
