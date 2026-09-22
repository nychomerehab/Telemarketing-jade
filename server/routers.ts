import { z } from "zod";
import { COOKIE_NAME } from "@shared/const";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { adminProcedure, protectedProcedure, publicProcedure, router } from "./_core/trpc";
import { TRPCError } from "@trpc/server";
import {
  getCategories,
  getCategoryById,
  getDb,
  getSalesBetween,
  getSalesForUser,
  insertSale,
} from "./db";
import { sales, salesCategories } from "../drizzle/schema";
import { eq } from "drizzle-orm";

const moneyInput = z
  .union([z.string(), z.number()])
  .refine((value) => Number.isFinite(Number(String(value).replace(/,/g, ""))), "Enter a valid amount")
  .transform((value) => Number(String(value).replace(/,/g, "")).toFixed(2))
  .refine((value) => Number(value) >= 0, "Amounts cannot be negative");

const saleInput = z.object({
  saleDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Enter a valid date"),
  customerName: z.string().trim().min(1, "Customer name is required").max(180),
  landingPageInitialOrder: moneyInput,
  resellerDistributorPackage: moneyInput,
  messaging: moneyInput,
  categoryId: z.number().int().positive(),
  warmLeadsOutboundCalls: moneyInput,
  advancedPayment: moneyInput,
  hotleadsUpsellCalls: moneyInput,
});

function money(value: string | number | null | undefined) {
  return Number(value ?? 0);
}

export function calculateTotalPosSales(input: {
  landingPageInitialOrder: string | number;
  resellerDistributorPackage: string | number;
  messaging: string | number;
  warmLeadsOutboundCalls: string | number;
  hotleadsUpsellCalls: string | number;
}): number {
  return [
    input.landingPageInitialOrder,
    input.resellerDistributorPackage,
    input.messaging,
    input.warmLeadsOutboundCalls,
    input.hotleadsUpsellCalls,
  ].reduce<number>((sum, value) => sum + money(value), 0);
}

function dateKey(date = new Date()) {
  return new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Manila" }).format(date);
}

function monthStart(date = new Date()) {
  const key = dateKey(date);
  return `${key.slice(0, 7)}-01`;
}

function nextMonth(date = new Date()) {
  const key = dateKey(date);
  const [year, month] = key.split("-").map(Number);
  const next = month === 12 ? { year: year + 1, month: 1 } : { year, month: month + 1 };
  return `${next.year}-${String(next.month).padStart(2, "0")}-01`;
}

function summarize(rows: Array<{ sale: any }>) {
  return rows.reduce(
    (summary, { sale }) => {
      summary.totalPosSales += money(sale.totalPosSales);
      summary.orders += 1;
      summary.landingPage += money(sale.landingPageInitialOrder);
      summary.reseller += money(sale.resellerDistributorPackage);
      summary.messaging += money(sale.messaging);
      summary.warmLeads += money(sale.warmLeadsOutboundCalls);
      summary.hotleads += money(sale.hotleadsUpsellCalls);
      summary.advancedPayments += money(sale.advancedPayment);
      return summary;
    },
    {
      totalPosSales: 0,
      orders: 0,
      landingPage: 0,
      reseller: 0,
      messaging: 0,
      warmLeads: 0,
      hotleads: 0,
      advancedPayments: 0,
    },
  );
}

export const appRouter = router({
  system: systemRouter,
  auth: router({
    me: publicProcedure.query((opts) => opts.ctx.user),
    logout: publicProcedure.mutation(({ ctx }) => {
      const cookieOptions = getSessionCookieOptions(ctx.req);
      ctx.res.clearCookie(COOKIE_NAME, { ...cookieOptions, maxAge: -1 });
      return { success: true } as const;
    }),
  }),
  categories: router({
    list: protectedProcedure.query(({ ctx }) => getCategories(ctx.user.role === "admin")),
    create: adminProcedure
      .input(z.object({ name: z.string().trim().min(2).max(120) }))
      .mutation(async ({ input }) => {
        const db = await getDb();
        if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database is not available" });
        const existing = await db.select().from(salesCategories).where(eq(salesCategories.name, input.name)).limit(1);
        if (existing.length) throw new TRPCError({ code: "CONFLICT", message: "That category already exists" });
        await db.insert(salesCategories).values({ name: input.name, isActive: 1 });
        return { success: true } as const;
      }),
    update: adminProcedure
      .input(z.object({ id: z.number().int().positive(), name: z.string().trim().min(2).max(120) }))
      .mutation(async ({ input }) => {
        const db = await getDb();
        if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database is not available" });
        await db.update(salesCategories).set({ name: input.name }).where(eq(salesCategories.id, input.id));
        return { success: true } as const;
      }),
    toggle: adminProcedure
      .input(z.object({ id: z.number().int().positive(), isActive: z.boolean() }))
      .mutation(async ({ input }) => {
        const db = await getDb();
        if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database is not available" });
        await db.update(salesCategories).set({ isActive: input.isActive ? 1 : 0 }).where(eq(salesCategories.id, input.id));
        return { success: true } as const;
      }),
  }),
  sales: router({
    create: protectedProcedure.input(saleInput).mutation(async ({ ctx, input }) => {
      const category = await getCategoryById(input.categoryId);
      if (!category || category.isActive !== 1) {
        throw new TRPCError({ code: "BAD_REQUEST", message: "Choose an active sales category" });
      }
      const totalPosSales = calculateTotalPosSales(input);
      const created = await insertSale({
        saleDate: input.saleDate,
        agentId: ctx.user.id,
        customerName: input.customerName,
        landingPageInitialOrder: input.landingPageInitialOrder,
        resellerDistributorPackage: input.resellerDistributorPackage,
        messaging: input.messaging,
        categoryId: input.categoryId,
        warmLeadsOutboundCalls: input.warmLeadsOutboundCalls,
        advancedPayment: input.advancedPayment,
        hotleadsUpsellCalls: input.hotleadsUpsellCalls,
        totalPosSales: totalPosSales.toFixed(2),
      });
      return { sale: created, totalPosSales: totalPosSales.toFixed(2) };
    }),
    mine: protectedProcedure
      .input(z.object({ limit: z.number().int().min(1).max(200).default(100) }).optional())
      .query(({ ctx, input }) => getSalesForUser(ctx.user.id, input?.limit ?? 100)),
    dashboard: protectedProcedure.query(async ({ ctx }) => {
      const today = dateKey();
      const month = monthStart();
      const [todayRows, monthRows] = await Promise.all([
        getSalesBetween(today, `${today}~`, ctx.user.id),
        getSalesBetween(month, nextMonth(), ctx.user.id),
      ]);
      return { today: summarize(todayRows), month: summarize(monthRows) };
    }),
  }),
  admin: router({
    overview: adminProcedure.query(async () => {
      const month = monthStart();
      const today = dateKey();
      const [monthRows, todayRows, recentRows] = await Promise.all([
        getSalesBetween(month, nextMonth()),
        getSalesBetween(today, `${today}~`),
        getSalesBetween("2000-01-01", "2999-01-01"),
      ]);
      const byAgent = new Map<number, { name: string; email: string | null; total: number; orders: number }>();
      for (const row of monthRows) {
        const id = row.sale.agentId;
        const current = byAgent.get(id) ?? { name: row.agentName || "Unassigned", email: row.agentEmail ?? null, total: 0, orders: 0 };
        current.total += money(row.sale.totalPosSales);
        current.orders += 1;
        byAgent.set(id, current);
      }
      return {
        today: summarize(todayRows),
        month: summarize(monthRows),
        agents: Array.from(byAgent.values()).sort((a, b) => b.total - a.total),
        recentSales: recentRows.slice(0, 30),
      };
    }),
  }),
});

export type AppRouter = typeof appRouter;
