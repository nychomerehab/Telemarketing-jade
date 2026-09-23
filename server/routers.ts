import bcrypt from "bcryptjs";
import { z } from "zod";
import { COOKIE_NAME, ONE_YEAR_MS } from "@shared/const";
import { getSessionCookieOptions } from "./_core/cookies";
import { sdk } from "./_core/sdk";
import { systemRouter } from "./_core/systemRouter";
import { adminProcedure, protectedProcedure, publicProcedure, router } from "./_core/trpc";
import { TRPCError } from "@trpc/server";
import {
  getAgentUsers,
  getCategories,
  getCategoryById,
  getDb,
  getSalesBetween,
  getSalesForUser,
  getUserById,
  getUserByUsername,
  insertAuditLog,
  insertSale,
} from "./db";
import { auditLogs, sales, salesCategories, users } from "../drizzle/schema";
import { and, eq } from "drizzle-orm";

const moneyInput = z.union([z.string(), z.number()]).refine((value) => Number.isFinite(Number(String(value).replace(/,/g, ""))), "Enter a valid amount").transform((value) => Number(String(value).replace(/,/g, "")).toFixed(2)).refine((value) => Number(value) >= 0, "Amounts cannot be negative");
const usernameInput = z.string().trim().min(3).max(80).regex(/^[a-zA-Z0-9._-]+$/, "Username can only contain letters, numbers, dots, underscores, and hyphens").transform((value) => value.toLowerCase());
const strongPassword = z.string().min(8, "Password must be at least 8 characters").regex(/[A-Z]/, "Password must include an uppercase letter").regex(/[a-z]/, "Password must include a lowercase letter").regex(/[0-9]/, "Password must include a number").regex(/[^A-Za-z0-9]/, "Password must include a special character");
const passwordPair = z.object({ password: strongPassword, confirmPassword: z.string() }).refine((value) => value.password === value.confirmPassword, { message: "Passwords do not match", path: ["confirmPassword"] });
const saleInput = z.object({ saleDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/), customerName: z.string().trim().min(1).max(180), landingPageInitialOrder: moneyInput, resellerDistributorPackage: moneyInput, messaging: moneyInput, warmLeadsOutboundCalls: moneyInput, advancedPayment: moneyInput, hotleadsUpsellCalls: moneyInput });
const agentFields = z.object({ fullName: z.string().trim().min(2).max(180), username: usernameInput, email: z.string().trim().email().max(320).optional().or(z.literal("")), contactNumber: z.string().trim().max(40).optional(), dateStarted: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional().or(z.literal("")), notes: z.string().max(2000).optional(), status: z.enum(["active", "inactive"]) });
export function passwordStrengthScore(value: string) { return [value.length >= 8, /[A-Z]/.test(value), /[a-z]/.test(value), /[0-9]/.test(value), /[^A-Za-z0-9]/.test(value)].filter(Boolean).length; }

function money(value: string | number | null | undefined) { return Number(value ?? 0); }
export function calculateTotalPosSales(input: { landingPageInitialOrder: string | number; resellerDistributorPackage: string | number; messaging: string | number; warmLeadsOutboundCalls: string | number; hotleadsUpsellCalls: string | number }): number { return [input.landingPageInitialOrder, input.resellerDistributorPackage, input.messaging, input.warmLeadsOutboundCalls, input.hotleadsUpsellCalls].reduce<number>((sum, value) => sum + money(value), 0); }
function dateKey(date = new Date()) { return new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Manila" }).format(date); }
export function nextDayKey(key: string) { const [year, month, day] = key.split("-").map(Number); return dateKey(new Date(Date.UTC(year, month - 1, day + 1, 12))); }
function monthStart(date = new Date()) { const key = dateKey(date); return `${key.slice(0, 7)}-01`; }
function nextMonth(date = new Date()) { const key = dateKey(date); const [year, month] = key.split("-").map(Number); const next = month === 12 ? { year: year + 1, month: 1 } : { year, month: month + 1 }; return `${next.year}-${String(next.month).padStart(2, "0")}-01`; }
function summarize(rows: Array<{ sale: any }>) { return rows.reduce((summary, { sale }) => { summary.totalPosSales += money(sale.totalPosSales); summary.orders += 1; summary.landingPage += money(sale.landingPageInitialOrder); summary.reseller += money(sale.resellerDistributorPackage); summary.messaging += money(sale.messaging); summary.warmLeads += money(sale.warmLeadsOutboundCalls); summary.hotleads += money(sale.hotleadsUpsellCalls); summary.advancedPayments += money(sale.advancedPayment); return summary; }, { totalPosSales: 0, orders: 0, landingPage: 0, reseller: 0, messaging: 0, warmLeads: 0, hotleads: 0, advancedPayments: 0 }); }
function clientIp(req: any) { const forwarded = req.headers?.["x-forwarded-for"]; return typeof forwarded === "string" ? forwarded.split(",")[0].trim() : req.ip ?? null; }

export const appRouter = router({
  system: systemRouter,
  auth: router({
    me: publicProcedure.query((opts) => opts.ctx.user),
    login: publicProcedure.input(z.object({ username: usernameInput, password: z.string().min(1) })).mutation(async ({ ctx, input }) => {
      const account = await getUserByUsername(input.username);
      if (!account?.passwordHash) throw new TRPCError({ code: "UNAUTHORIZED", message: "Invalid username or password." });
      if (account.status === "inactive") throw new TRPCError({ code: "FORBIDDEN", message: "This account is currently inactive. Please contact your administrator." });
      const matches = await bcrypt.compare(input.password, account.passwordHash);
      if (!matches) throw new TRPCError({ code: "UNAUTHORIZED", message: "Invalid username or password." });
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database is not available" });
      const nextLastLogin = new Date();
      await db.update(users).set({ lastSignedIn: nextLastLogin }).where(eq(users.id, account.id));
      const token = await sdk.createSessionToken(account.openId, { name: account.name || account.username || "", sessionVersion: account.sessionVersion });
      ctx.res.cookie(COOKIE_NAME, token, { ...getSessionCookieOptions(ctx.req), maxAge: ONE_YEAR_MS });
      return { success: true, user: { ...account, lastSignedIn: nextLastLogin } };
    }),
    logout: publicProcedure.mutation(({ ctx }) => { const cookieOptions = getSessionCookieOptions(ctx.req); ctx.res.clearCookie(COOKIE_NAME, { ...cookieOptions, maxAge: -1 }); return { success: true } as const; }),
  }),
  userManagement: router({
    list: adminProcedure.input(z.object({ search: z.string().optional(), status: z.enum(["all", "active", "inactive"]).default("all") }).optional()).query(({ input }) => getAgentUsers(input?.search, input?.status === "all" ? undefined : input?.status)),
    auditLogs: adminProcedure.query(() => import("./db").then(({ getAuditLogs }) => getAuditLogs(150))),
    create: adminProcedure.input(agentFields.and(passwordPair)).mutation(async ({ ctx, input }) => {
      const existing = await getUserByUsername(input.username);
      if (existing) throw new TRPCError({ code: "CONFLICT", message: "Username already exists. Please choose another username." });
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database is not available" });
      const passwordHash = await bcrypt.hash(input.password, 12);
      const openId = `local:${input.username}`;
      const result = await db.insert(users).values({ openId, username: input.username, name: input.fullName, passwordHash, role: "user", status: input.status, email: input.email || null, contactNumber: input.contactNumber || null, dateStarted: input.dateStarted || null, notes: input.notes || null, createdBy: ctx.user.id, loginMethod: "local" });
      const id = Number(result[0].insertId);
      await insertAuditLog({ adminId: ctx.user.id, targetUserId: id, ipAddress: clientIp(ctx.req), action: `Super Admin created agent account: ${input.fullName}` });
      return { success: true, id, fullName: input.fullName, username: input.username } as const;
    }),
    update: adminProcedure.input(z.object({ id: z.number().int().positive(), ...agentFields.shape })).mutation(async ({ ctx, input }) => {
      const target = await getUserById(input.id);
      if (!target || target.role !== "user") throw new TRPCError({ code: "NOT_FOUND", message: "Agent account not found" });
      const existingUsername = await getUserByUsername(input.username);
      if (existingUsername && existingUsername.id !== input.id) throw new TRPCError({ code: "CONFLICT", message: "Username already exists. Please choose another username." });
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database is not available" });
      await db.update(users).set({ name: input.fullName, username: input.username, email: input.email || null, contactNumber: input.contactNumber || null, dateStarted: input.dateStarted || null, notes: input.notes || null, status: input.status }).where(eq(users.id, input.id));
      await insertAuditLog({ adminId: ctx.user.id, targetUserId: input.id, ipAddress: clientIp(ctx.req), action: `Super Admin edited agent account: ${input.fullName}` });
      return { success: true } as const;
    }),
    changePassword: adminProcedure.input(z.object({ id: z.number().int().positive() }).and(passwordPair)).mutation(async ({ ctx, input }) => {
      const target = await getUserById(input.id);
      if (!target || target.role !== "user") throw new TRPCError({ code: "NOT_FOUND", message: "Agent account not found" });
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database is not available" });
      await db.update(users).set({ passwordHash: await bcrypt.hash(input.password, 12), sessionVersion: target.sessionVersion + 1 }).where(eq(users.id, input.id));
      await insertAuditLog({ adminId: ctx.user.id, targetUserId: input.id, ipAddress: clientIp(ctx.req), action: `Super Admin changed password for agent: ${target.name || target.username}` });
      return { success: true } as const;
    }),
    toggleStatus: adminProcedure.input(z.object({ id: z.number().int().positive(), status: z.enum(["active", "inactive"]) })).mutation(async ({ ctx, input }) => {
      const target = await getUserById(input.id);
      if (!target || target.role !== "user") throw new TRPCError({ code: "NOT_FOUND", message: "Agent account not found" });
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database is not available" });
      await db.update(users).set({ status: input.status, sessionVersion: target.sessionVersion + 1 }).where(eq(users.id, input.id));
      const verb = input.status === "active" ? "activated" : "deactivated";
      await insertAuditLog({ adminId: ctx.user.id, targetUserId: input.id, ipAddress: clientIp(ctx.req), action: `Super Admin ${verb} agent: ${target.name || target.username}` });
      return { success: true } as const;
    }),
  }),
  categories: router({
    list: protectedProcedure.query(({ ctx }) => getCategories(ctx.user.role === "admin")),
    create: adminProcedure.input(z.object({ name: z.string().trim().min(2).max(120) })).mutation(async ({ input }) => { const db = await getDb(); if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database is not available" }); const existing = await db.select().from(salesCategories).where(eq(salesCategories.name, input.name)).limit(1); if (existing.length) throw new TRPCError({ code: "CONFLICT", message: "That category already exists" }); await db.insert(salesCategories).values({ name: input.name, isActive: 1 }); return { success: true } as const; }),
    update: adminProcedure.input(z.object({ id: z.number().int().positive(), name: z.string().trim().min(2).max(120) })).mutation(async ({ input }) => { const db = await getDb(); if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database is not available" }); await db.update(salesCategories).set({ name: input.name }).where(eq(salesCategories.id, input.id)); return { success: true } as const; }),
    toggle: adminProcedure.input(z.object({ id: z.number().int().positive(), isActive: z.boolean() })).mutation(async ({ input }) => { const db = await getDb(); if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database is not available" }); await db.update(salesCategories).set({ isActive: input.isActive ? 1 : 0 }).where(eq(salesCategories.id, input.id)); return { success: true } as const; }),
  }),
  sales: router({
    create: protectedProcedure.input(saleInput).mutation(async ({ ctx, input }) => { const totalPosSales = calculateTotalPosSales(input); const created = await insertSale({ saleDate: input.saleDate, agentId: ctx.user.id, customerName: input.customerName, landingPageInitialOrder: input.landingPageInitialOrder, resellerDistributorPackage: input.resellerDistributorPackage, messaging: input.messaging, categoryId: null, warmLeadsOutboundCalls: input.warmLeadsOutboundCalls, advancedPayment: input.advancedPayment, hotleadsUpsellCalls: input.hotleadsUpsellCalls, totalPosSales: totalPosSales.toFixed(2) }); return { sale: created, totalPosSales: totalPosSales.toFixed(2) }; }),
    mine: protectedProcedure.input(z.object({ limit: z.number().int().min(1).max(200).default(100) }).optional()).query(({ ctx, input }) => getSalesForUser(ctx.user.id, input?.limit ?? 100)),
    dashboard: protectedProcedure.query(async ({ ctx }) => { const today = dateKey(); const tomorrow = nextDayKey(today); const month = monthStart(); const [todayRows, monthRows] = await Promise.all([getSalesBetween(today, tomorrow, ctx.user.id), getSalesBetween(month, nextMonth(), ctx.user.id)]); return { today: summarize(todayRows), month: summarize(monthRows) }; }),
  }),
  admin: router({
    overview: adminProcedure.query(async () => { const month = monthStart(); const today = dateKey(); const tomorrow = nextDayKey(today); const [monthRows, todayRows, recentRows] = await Promise.all([getSalesBetween(month, nextMonth()), getSalesBetween(today, tomorrow), getSalesBetween("2000-01-01", "2999-01-01")]); const byAgent = new Map<number, { name: string; email: string | null; total: number; orders: number }>(); for (const row of monthRows) { const id = row.sale.agentId; const current = byAgent.get(id) ?? { name: row.agentName || "Unassigned", email: row.agentEmail ?? null, total: 0, orders: 0 }; current.total += money(row.sale.totalPosSales); current.orders += 1; byAgent.set(id, current); } return { today: summarize(todayRows), month: summarize(monthRows), agents: Array.from(byAgent.values()).sort((a, b) => b.total - a.total), recentSales: recentRows.slice(0, 30) }; }),
  }),
});

export type AppRouter = typeof appRouter;
