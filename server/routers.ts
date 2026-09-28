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
  getUserAccounts,
  getUserById,
  getUserByUsername,
  insertAuditLog,
  insertSale,
  softDeleteSale,
  updateSalesStatus,
} from "./db";
import { auditLogs, sales, salesCategories, users } from "../drizzle/schema";
import { and, eq } from "drizzle-orm";

const moneyInput = z.union([z.string(), z.number()]).refine((value) => Number.isFinite(Number(String(value).replace(/,/g, ""))), "Enter a valid amount").transform((value) => Number(String(value).replace(/,/g, "")).toFixed(2)).refine((value) => Number(value) >= 0, "Amounts cannot be negative");
const usernameInput = z.string().trim().min(3).max(80).regex(/^[a-zA-Z0-9._-]+$/, "Username can only contain letters, numbers, dots, underscores, and hyphens").transform((value) => value.toLowerCase());
const strongPassword = z.string().min(8, "Password must be at least 8 characters").regex(/[A-Z]/, "Password must include an uppercase letter").regex(/[a-z]/, "Password must include a lowercase letter").regex(/[0-9]/, "Password must include a number").regex(/[^A-Za-z0-9]/, "Password must include a special character");
const passwordPair = z.object({ password: strongPassword, confirmPassword: z.string() }).refine((value) => value.password === value.confirmPassword, { message: "Passwords do not match", path: ["confirmPassword"] });
const saleInput = z.object({ saleDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/), customerName: z.string().trim().min(1).max(180), categoryId: z.number().int().positive(), landingPageInitialOrder: moneyInput, resellerDistributorPackage: moneyInput, messaging: moneyInput, warmLeadsOutboundCalls: moneyInput, advancedPayment: moneyInput, hotleadsUpsellCalls: moneyInput, paymentStatus: z.enum(["no_payment", "initial_payment", "fully_paid"]), initialPaymentAmount: moneyInput, paymentDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).nullable(), paymentMethod: z.enum(["cash", "gcash", "bank_transfer", "card", "other"]).nullable() }).superRefine((value, ctx) => { if (value.paymentStatus !== "no_payment" && (!value.paymentDate || !value.paymentMethod)) ctx.addIssue({ code: "custom", message: "Payment date and payment method are required when a payment is recorded." }); if (value.paymentStatus === "initial_payment" && Number(value.initialPaymentAmount) <= 0) ctx.addIssue({ code: "custom", message: "Enter the initial payment amount." }); if (value.paymentStatus === "fully_paid" && Number(value.initialPaymentAmount) <= 0) ctx.addIssue({ code: "custom", message: "Enter the paid amount." }); });
const clientStatusInput = z.enum(["no_status", "shipped", "delivered", "returned"]);
const dashboardDateInput = z.object({ date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/) }).optional();
const adminReportInput = z.object({ agentId: z.number().int().positive().optional(), categoryId: z.number().int().positive().optional(), date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(), customerName: z.string().trim().max(180).optional() }).optional();
const adminSaleUpdateInput = z.object({ id: z.number().int().positive(), saleDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/), agentId: z.number().int().positive(), customerName: z.string().trim().min(1).max(180), categoryId: z.number().int().positive(), landingPageInitialOrder: moneyInput, resellerDistributorPackage: moneyInput, messaging: moneyInput, warmLeadsOutboundCalls: moneyInput, advancedPayment: moneyInput, hotleadsUpsellCalls: moneyInput });
const agentFields = z.object({ fullName: z.string().trim().min(2).max(180), username: usernameInput, email: z.string().trim().email().max(320).optional().or(z.literal("")), contactNumber: z.string().trim().max(40).optional(), dateStarted: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional().or(z.literal("")), notes: z.string().max(2000).optional(), status: z.enum(["active", "inactive"]) });
export function passwordStrengthScore(value: string) { return [value.length >= 8, /[A-Z]/.test(value), /[a-z]/.test(value), /[0-9]/.test(value), /[^A-Za-z0-9]/.test(value)].filter(Boolean).length; }

function money(value: string | number | null | undefined) { return Number(value ?? 0); }
export function calculateTotalPosSales(input: { landingPageInitialOrder: string | number; resellerDistributorPackage: string | number; messaging: string | number; warmLeadsOutboundCalls: string | number; hotleadsUpsellCalls: string | number }): number { return [input.landingPageInitialOrder, input.resellerDistributorPackage, input.messaging, input.warmLeadsOutboundCalls, input.hotleadsUpsellCalls].reduce<number>((sum, value) => sum + money(value), 0); }
export function calculateAgentCommission(input: { landingPageInitialOrder: string | number; hotleadsUpsellCalls: string | number; messaging: string | number; warmLeadsOutboundCalls: string | number }, status: "no_status" | "shipped" | "delivered" | "returned"): number { if (status !== "delivered") return 0; return money(input.landingPageInitialOrder) * 0.005 + money(input.hotleadsUpsellCalls) * 0.03 + money(input.messaging) * 0.03 + money(input.warmLeadsOutboundCalls) * 0.04; }
function dateKey(date = new Date()) { return new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Manila" }).format(date); }
export function nextDayKey(key: string) { const [year, month, day] = key.split("-").map(Number); return dateKey(new Date(Date.UTC(year, month - 1, day + 1, 12))); }
function monthStart(date = new Date()) { return `${dateKey(date).slice(0, 7)}-01`; }
function monthStartFromKey(key: string) { return `${key.slice(0, 7)}-01`; }
function nextMonth(date = new Date()) { return nextMonthFromKey(dateKey(date)); }
function nextMonthFromKey(key: string) { const [year, month] = key.split("-").map(Number); const next = month === 12 ? { year: year + 1, month: 1 } : { year, month: month + 1 }; return `${next.year}-${String(next.month).padStart(2, "0")}-01`; }
function summarize(rows: Array<{ sale: any }>) { return rows.reduce((summary, { sale }) => { summary.totalPosSales += money(sale.totalPosSales); summary.orders += 1; summary.landingPage += money(sale.landingPageInitialOrder); summary.reseller += money(sale.resellerDistributorPackage); summary.messaging += money(sale.messaging); summary.warmLeads += money(sale.warmLeadsOutboundCalls); summary.hotleads += money(sale.hotleadsUpsellCalls); summary.advancedPayments += money(sale.advancedPayment); summary.initialPayments += money(sale.initialPaymentAmount); summary.outstandingBalance += Math.max(0, money(sale.totalPosSales) - money(sale.initialPaymentAmount)); summary.ordersWithInitialPayment += sale.paymentStatus !== "no_payment" ? 1 : 0; summary.commission += money(sale.commissionAmount); return summary; }, { totalPosSales: 0, orders: 0, landingPage: 0, reseller: 0, messaging: 0, warmLeads: 0, hotleads: 0, advancedPayments: 0, initialPayments: 0, outstandingBalance: 0, ordersWithInitialPayment: 0, commission: 0 }); }
export function matchesReportCategory(row: { sale: any }, categoryId: number, categoryName: string) {
  if (row.sale.categoryId !== null && row.sale.categoryId !== undefined) return Number(row.sale.categoryId) === categoryId;
  const name = categoryName.trim().toUpperCase();
  if (name === "LANDING PAGE") return money(row.sale.landingPageInitialOrder) > 0;
  if (name === "LANDING PAGE WITH UPSELL") return money(row.sale.hotleadsUpsellCalls) > 0;
  if (name === "MESSAGING") return money(row.sale.messaging) > 0;
  if (name === "WARM SALES") return money(row.sale.warmLeadsOutboundCalls) > 0 || money(row.sale.resellerDistributorPackage) > 0;
  return false;
}
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
    list: adminProcedure.input(z.object({ search: z.string().optional(), status: z.enum(["all", "active", "inactive"]).default("all"), role: z.enum(["agents", "all"]).default("agents") }).optional()).query(({ input }) => input?.role === "all" ? getUserAccounts(input?.search, input?.status === "all" ? undefined : input?.status) : getAgentUsers(input?.search, input?.status === "all" ? undefined : input?.status)),
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
    createAdmin: adminProcedure.input(agentFields.and(passwordPair)).mutation(async ({ ctx, input }) => {
      const existing = await getUserByUsername(input.username);
      if (existing) throw new TRPCError({ code: "CONFLICT", message: "Username already exists. Please choose another username." });
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database is not available" });
      const passwordHash = await bcrypt.hash(input.password, 12);
      const openId = `local:${input.username}`;
      const result = await db.insert(users).values({ openId, username: input.username, name: input.fullName, passwordHash, role: "admin", status: input.status, email: input.email || null, contactNumber: input.contactNumber || null, dateStarted: input.dateStarted || null, notes: input.notes || null, createdBy: ctx.user.id, loginMethod: "local" });
      const id = Number(result[0].insertId);
      await insertAuditLog({ adminId: ctx.user.id, targetUserId: id, ipAddress: clientIp(ctx.req), action: `Super Admin created department-head account: ${input.fullName}` });
      return { success: true, id, fullName: input.fullName, username: input.username } as const;
    }),
    update: adminProcedure.input(z.object({ id: z.number().int().positive(), ...agentFields.shape })).mutation(async ({ ctx, input }) => {
      const target = await getUserById(input.id);
      if (!target) throw new TRPCError({ code: "NOT_FOUND", message: "Account not found" });
      const existingUsername = await getUserByUsername(input.username);
      if (existingUsername && existingUsername.id !== input.id) throw new TRPCError({ code: "CONFLICT", message: "Username already exists. Please choose another username." });
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database is not available" });
      await db.update(users).set({ name: input.fullName, username: input.username, email: input.email || null, contactNumber: input.contactNumber || null, dateStarted: input.dateStarted || null, notes: input.notes || null, status: input.status }).where(eq(users.id, input.id));
      await insertAuditLog({ adminId: ctx.user.id, targetUserId: input.id, ipAddress: clientIp(ctx.req), action: `Super Admin edited account: ${input.fullName}` });
      return { success: true } as const;
    }),
    changePassword: adminProcedure.input(z.object({ id: z.number().int().positive() }).and(passwordPair)).mutation(async ({ ctx, input }) => {
      const target = await getUserById(input.id);
      if (!target) throw new TRPCError({ code: "NOT_FOUND", message: "Account not found" });
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database is not available" });
      await db.update(users).set({ passwordHash: await bcrypt.hash(input.password, 12), sessionVersion: target.sessionVersion + 1 }).where(eq(users.id, input.id));
      await insertAuditLog({ adminId: ctx.user.id, targetUserId: input.id, ipAddress: clientIp(ctx.req), action: `Super Admin changed password for account: ${target.name || target.username}` });
      return { success: true } as const;
    }),
    toggleStatus: adminProcedure.input(z.object({ id: z.number().int().positive(), status: z.enum(["active", "inactive"]) })).mutation(async ({ ctx, input }) => {
      const target = await getUserById(input.id);
      if (!target) throw new TRPCError({ code: "NOT_FOUND", message: "Account not found" });
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database is not available" });
      await db.update(users).set({ status: input.status, sessionVersion: target.sessionVersion + 1 }).where(eq(users.id, input.id));
      const verb = input.status === "active" ? "activated" : "deactivated";
      await insertAuditLog({ adminId: ctx.user.id, targetUserId: input.id, ipAddress: clientIp(ctx.req), action: `Super Admin ${verb} agent: ${target.name || target.username}` });
      return { success: true } as const;
    }),
  }),
  categories: router({
    list: publicProcedure.query(() => getCategories(false)),
    create: adminProcedure.input(z.object({ name: z.string().trim().min(2).max(120) })).mutation(async ({ input }) => { const db = await getDb(); if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database is not available" }); const existing = await db.select().from(salesCategories).where(eq(salesCategories.name, input.name)).limit(1); if (existing.length) throw new TRPCError({ code: "CONFLICT", message: "That category already exists" }); await db.insert(salesCategories).values({ name: input.name, isActive: 1 }); return { success: true } as const; }),
    update: adminProcedure.input(z.object({ id: z.number().int().positive(), name: z.string().trim().min(2).max(120) })).mutation(async ({ input }) => { const db = await getDb(); if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database is not available" }); await db.update(salesCategories).set({ name: input.name }).where(eq(salesCategories.id, input.id)); return { success: true } as const; }),
    toggle: adminProcedure.input(z.object({ id: z.number().int().positive(), isActive: z.boolean() })).mutation(async ({ input }) => { const db = await getDb(); if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database is not available" }); await db.update(salesCategories).set({ isActive: input.isActive ? 1 : 0 }).where(eq(salesCategories.id, input.id)); return { success: true } as const; }),
  }),
  sales: router({
    create: protectedProcedure.input(saleInput).mutation(async ({ ctx, input }) => { const category = await getCategoryById(input.categoryId); if (!category || category.isActive !== 1) throw new TRPCError({ code: "BAD_REQUEST", message: "Choose an active sales category" }); const totalPosSales = calculateTotalPosSales(input); const paymentAmount = input.paymentStatus === "fully_paid" ? totalPosSales : Number(input.initialPaymentAmount); if (paymentAmount > totalPosSales) throw new TRPCError({ code: "BAD_REQUEST", message: "Initial payment cannot be greater than Total POS Sales." }); const created = await insertSale({ saleDate: input.saleDate, agentId: ctx.user.id, customerName: input.customerName, landingPageInitialOrder: input.landingPageInitialOrder, resellerDistributorPackage: input.resellerDistributorPackage, messaging: input.messaging, categoryId: input.categoryId, warmLeadsOutboundCalls: input.warmLeadsOutboundCalls, advancedPayment: input.advancedPayment, hotleadsUpsellCalls: input.hotleadsUpsellCalls, totalPosSales: totalPosSales.toFixed(2), paymentStatus: input.paymentStatus, initialPaymentAmount: paymentAmount.toFixed(2), paymentDate: input.paymentStatus === "no_payment" ? null : input.paymentDate, paymentMethod: input.paymentStatus === "no_payment" ? null : input.paymentMethod, clientStatus: "no_status", commissionAmount: "0.00" }); return { sale: created, totalPosSales: totalPosSales.toFixed(2), remainingBalance: (totalPosSales - paymentAmount).toFixed(2) }; }),
    mine: protectedProcedure.input(z.object({ limit: z.number().int().min(1).max(200).default(100) }).optional()).query(({ ctx, input }) => getSalesForUser(ctx.user.id, input?.limit ?? 100)),
    updateStatus: adminProcedure.input(z.object({ id: z.number().int().positive(), status: clientStatusInput })).mutation(async ({ input }) => { const rows = await getSalesBetween("2000-01-01", "2999-01-01"); const row = rows.find((item) => item.sale.id === input.id); if (!row) throw new TRPCError({ code: "NOT_FOUND", message: "Sale not found" }); const commission = calculateAgentCommission(row.sale, input.status); await updateSalesStatus([input.id], input.status, commission.toFixed(2)); return { success: true, commission: commission.toFixed(2) } as const; }),
    batchUpdateStatus: adminProcedure.input(z.object({ ids: z.array(z.number().int().positive()).min(1).max(200), status: clientStatusInput })).mutation(async ({ input }) => { const rows = await getSalesBetween("2000-01-01", "2999-01-01"); const selected = rows.filter((item) => input.ids.includes(item.sale.id)); if (selected.length !== input.ids.length) throw new TRPCError({ code: "NOT_FOUND", message: "One or more sales were not found." }); for (const row of selected) await updateSalesStatus([row.sale.id], input.status, calculateAgentCommission(row.sale, input.status).toFixed(2)); return { success: true, updated: selected.length } as const; }),
    delete: protectedProcedure.input(z.object({ id: z.number().int().positive(), reason: z.string().trim().min(2).max(255) })).mutation(async ({ ctx, input }) => { const rows = await getSalesBetween("2000-01-01", "2999-01-01"); const row = rows.find((item) => item.sale.id === input.id); if (!row) throw new TRPCError({ code: "NOT_FOUND", message: "Sale not found" }); if (ctx.user.role !== "admin" && row.sale.agentId !== ctx.user.id) throw new TRPCError({ code: "FORBIDDEN", message: "You can only delete your own sales." }); await softDeleteSale(input.id, ctx.user.id, input.reason); if (ctx.user.role === "admin") await insertAuditLog({ adminId: ctx.user.id, action: `Sales Record Deleted: ${row.sale.customerName} | Agent: ${row.agentName || "Unassigned"} | Date: ${row.sale.saleDate} | Total: ${row.sale.totalPosSales} | Reason: ${input.reason}` }); return { success: true } as const; }),
    update: protectedProcedure.input(adminSaleUpdateInput).mutation(async ({ ctx, input }) => { const rows = await getSalesBetween("2000-01-01", "2999-01-01"); const row = rows.find((item) => item.sale.id === input.id); if (!row) throw new TRPCError({ code: "NOT_FOUND", message: "Sale not found" }); if (ctx.user.role !== "admin" && (row.sale.agentId !== ctx.user.id || input.agentId !== ctx.user.id)) throw new TRPCError({ code: "FORBIDDEN", message: "You can only edit your own sales." }); const category = await getCategoryById(input.categoryId); if (!category || category.isActive !== 1) throw new TRPCError({ code: "BAD_REQUEST", message: "Choose an active sales category" }); const totalPosSales = calculateTotalPosSales(input); const db = await getDb(); if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database is not available" }); await db.update(sales).set({ saleDate: input.saleDate, agentId: input.agentId, customerName: input.customerName, categoryId: input.categoryId, landingPageInitialOrder: input.landingPageInitialOrder, resellerDistributorPackage: input.resellerDistributorPackage, messaging: input.messaging, warmLeadsOutboundCalls: input.warmLeadsOutboundCalls, advancedPayment: input.advancedPayment, hotleadsUpsellCalls: input.hotleadsUpsellCalls, totalPosSales: totalPosSales.toFixed(2) }).where(eq(sales.id, input.id)); if (ctx.user.role === "admin") await insertAuditLog({ adminId: ctx.user.id, action: `Sales Record Edited: ${row.sale.customerName} -> ${input.customerName} | Total: ${row.sale.totalPosSales} -> ${totalPosSales.toFixed(2)} | Agent: ${row.agentName || "Unassigned"} -> ${input.agentId} | Date: ${row.sale.saleDate} -> ${input.saleDate}` }); return { success: true, totalPosSales: totalPosSales.toFixed(2) } as const; }),
    dashboard: protectedProcedure.input(dashboardDateInput).query(async ({ ctx, input }) => { const selectedDate = input?.date ?? dateKey(); const tomorrow = nextDayKey(selectedDate); const month = monthStartFromKey(selectedDate); const [todayRows, monthRows] = await Promise.all([getSalesBetween(selectedDate, tomorrow, ctx.user.id), getSalesBetween(month, nextMonthFromKey(selectedDate), ctx.user.id)]); return { selectedDate, today: summarize(todayRows), month: summarize(monthRows) }; }),
  }),
  admin: router({
    overview: adminProcedure.input(adminReportInput).query(async ({ input }) => { const selectedDate = input?.date ?? dateKey(); const month = monthStartFromKey(selectedDate); const tomorrow = nextDayKey(selectedDate); const [monthRows, todayRows, recentRows, agentUsers, categories] = await Promise.all([getSalesBetween(month, nextMonthFromKey(selectedDate)), getSalesBetween(selectedDate, tomorrow), getSalesBetween("2000-01-01", "2999-01-01"), getAgentUsers(), getCategories(true)]); const byAgent = new Map<number, { name: string; email: string | null; total: number; orders: number }>(); for (const row of monthRows) { const id = row.sale.agentId; const current = byAgent.get(id) ?? { name: row.agentName || "Unassigned", email: row.agentEmail ?? null, total: 0, orders: 0 }; current.total += money(row.sale.totalPosSales); current.orders += 1; byAgent.set(id, current); } const requestedNames = ["ARIAN", "KIM", "MHAYA", "MICHELLE"]; const agentPerformance = requestedNames.map((requestedName) => { const account = agentUsers.find((candidate) => `${candidate.name ?? ""} ${candidate.username ?? ""}`.toUpperCase().includes(requestedName)); const monthlyRows = account ? monthRows.filter((row) => row.sale.agentId === account.id) : []; const dailyRows = account ? todayRows.filter((row) => row.sale.agentId === account.id) : []; return { name: account?.name || requestedName, username: account?.username || requestedName.toLowerCase(), month: summarize(monthlyRows), today: summarize(dailyRows), status: account?.status ?? "inactive" }; }); const reportStart = input?.date ?? "2000-01-01"; const reportEnd = input?.date ? nextDayKey(input.date) : "2999-01-01"; const reportBaseRows = await getSalesBetween(reportStart, reportEnd, input?.agentId); const selectedCategory = input?.categoryId ? categories.find((category) => category.id === input.categoryId) : undefined; const categorizedRows = selectedCategory ? reportBaseRows.filter((row) => matchesReportCategory(row, selectedCategory.id, selectedCategory.name)).map((row) => ({ ...row, categoryName: row.categoryName ?? selectedCategory.name })) : reportBaseRows.map((row) => ({ ...row, categoryName: row.categoryName ?? "Uncategorized (legacy record)" })); const searchTerm = input?.customerName?.toLowerCase(); const reportRows = searchTerm ? categorizedRows.filter((row) => row.sale.customerName.toLowerCase().includes(searchTerm)) : categorizedRows; return { selectedDate, today: summarize(todayRows), month: summarize(monthRows), agents: Array.from(byAgent.values()).sort((a, b) => b.total - a.total), agentPerformance, recentSales: recentRows.slice(0, 30), report: { summary: summarize(reportRows), rows: reportRows.slice(0, 200) } }; }),

    drilldown: adminProcedure.input(z.object({ metric: z.enum(["totalPosSales", "orders", "landingPage", "reseller", "messaging", "warmLeads", "hotleads", "initialPayments", "outstandingBalance", "commission"]), period: z.enum(["today", "month"]), date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/) })).query(async ({ input }) => { const start = input.period === "today" ? input.date : monthStartFromKey(input.date); const end = input.period === "today" ? nextDayKey(input.date) : nextMonthFromKey(input.date); const allRows = await getSalesBetween(start, end); const rows = allRows.filter(({ sale }) => input.metric === "orders" || input.metric === "totalPosSales" ? true : input.metric === "landingPage" ? money(sale.landingPageInitialOrder) > 0 : input.metric === "reseller" ? money(sale.resellerDistributorPackage) > 0 : input.metric === "messaging" ? money(sale.messaging) > 0 : input.metric === "warmLeads" ? money(sale.warmLeadsOutboundCalls) > 0 : input.metric === "hotleads" ? money(sale.hotleadsUpsellCalls) > 0 : input.metric === "initialPayments" ? money(sale.initialPaymentAmount) > 0 : input.metric === "outstandingBalance" ? money(sale.totalPosSales) - money(sale.initialPaymentAmount) > 0 : sale.clientStatus === "delivered" && money(sale.commissionAmount) > 0); const total = rows.reduce((sum, { sale }) => sum + (input.metric === "commission" ? money(sale.commissionAmount) : input.metric === "initialPayments" ? money(sale.initialPaymentAmount) : input.metric === "outstandingBalance" ? Math.max(0, money(sale.totalPosSales) - money(sale.initialPaymentAmount)) : input.metric === "landingPage" ? money(sale.landingPageInitialOrder) : input.metric === "reseller" ? money(sale.resellerDistributorPackage) : input.metric === "messaging" ? money(sale.messaging) : input.metric === "warmLeads" ? money(sale.warmLeadsOutboundCalls) : input.metric === "hotleads" ? money(sale.hotleadsUpsellCalls) : money(sale.totalPosSales)), 0); return { metric: input.metric, period: input.period, total, orders: rows.length, agents: new Set(rows.map((row) => row.sale.agentId)).size, rows: rows.map((row) => ({ ...row, categoryName: row.categoryName || "Uncategorized (legacy record)" })) }; }),
  }),
});

export type AppRouter = typeof appRouter;
