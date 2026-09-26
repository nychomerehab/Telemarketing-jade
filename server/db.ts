import { and, desc, eq, gte, inArray, like, lt, or } from "drizzle-orm";
import { drizzle } from "drizzle-orm/mysql2";
import {
  auditLogs,
  InsertSale,
  InsertUser,
  sales,
  salesCategories,
  users,
} from "../drizzle/schema";
import { ENV } from "./_core/env";

let _db: ReturnType<typeof drizzle> | null = null;

export async function getDb() {
  if (!_db && process.env.DATABASE_URL) {
    try { _db = drizzle(process.env.DATABASE_URL); }
    catch (error) { console.warn("[Database] Failed to connect:", error); _db = null; }
  }
  return _db;
}

export async function upsertUser(user: InsertUser): Promise<void> {
  if (!user.openId) throw new Error("User openId is required for upsert");
  const db = await getDb();
  if (!db) return;
  const values: InsertUser = { openId: user.openId };
  const updateSet: Record<string, unknown> = {};
  const textFields = ["name", "email", "loginMethod"] as const;
  for (const field of textFields) {
    if (user[field] !== undefined) { values[field] = user[field] ?? null; updateSet[field] = user[field] ?? null; }
  }
  if (user.lastSignedIn !== undefined) { values.lastSignedIn = user.lastSignedIn; updateSet.lastSignedIn = user.lastSignedIn; }
  if (user.role !== undefined) { values.role = user.role; updateSet.role = user.role; }
  else if (user.openId === ENV.ownerOpenId) { values.role = "admin"; updateSet.role = "admin"; }
  values.lastSignedIn ??= new Date();
  if (!Object.keys(updateSet).length) updateSet.lastSignedIn = new Date();
  await db.insert(users).values(values).onDuplicateKeyUpdate({ set: updateSet });
}

export async function getUserByOpenId(openId: string) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(users).where(eq(users.openId, openId)).limit(1);
  return result[0];
}

export async function getUserByUsername(username: string) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(users).where(eq(users.username, username.toLowerCase())).limit(1);
  return result[0];
}

export async function getAgentUsers(search?: string, status?: "active" | "inactive") {
  const db = await getDb();
  if (!db) return [];
  const conditions = [eq(users.role, "user")];
  if (status) conditions.push(eq(users.status, status));
  if (search?.trim()) {
    const term = `%${search.trim()}%`;
    conditions.push(or(like(users.name, term), like(users.username, term))!);
  }
  return db
    .select({
      id: users.id,
      name: users.name,
      username: users.username,
      role: users.role,
      status: users.status,
      email: users.email,
      contactNumber: users.contactNumber,
      dateStarted: users.dateStarted,
      notes: users.notes,
      createdAt: users.createdAt,
      lastSignedIn: users.lastSignedIn,
    })
    .from(users)
    .where(and(...conditions))
    .orderBy(desc(users.createdAt));
}

export async function getUserAccounts(search?: string, status?: "active" | "inactive") {
  const db = await getDb();
  if (!db) return [];
  const conditions = status ? [eq(users.status, status)] : [];
  if (search?.trim()) {
    const term = `%${search.trim()}%`;
    conditions.push(or(like(users.name, term), like(users.username, term))!);
  }
  return db
    .select({ id: users.id, name: users.name, username: users.username, role: users.role, status: users.status, email: users.email, contactNumber: users.contactNumber, dateStarted: users.dateStarted, notes: users.notes, createdAt: users.createdAt, lastSignedIn: users.lastSignedIn })
    .from(users)
    .where(conditions.length ? and(...conditions) : undefined)
    .orderBy(desc(users.createdAt));
}

export async function getUserById(id: number) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(users).where(eq(users.id, id)).limit(1);
  return result[0];
}

export async function insertAuditLog(input: { adminId: number; action: string; targetUserId?: number; ipAddress?: string | null }) {
  const db = await getDb();
  if (!db) return;
  await db.insert(auditLogs).values({ adminId: input.adminId, action: input.action, targetUserId: input.targetUserId, ipAddress: input.ipAddress ?? null });
}

export async function getAuditLogs(limit = 100) {
  const db = await getDb();
  if (!db) return [];
  return db.select({ log: auditLogs, adminName: users.name }).from(auditLogs).leftJoin(users, eq(auditLogs.adminId, users.id)).orderBy(desc(auditLogs.createdAt)).limit(limit);
}

export async function getCategories(includeInactive = false) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(salesCategories).where(includeInactive ? undefined : eq(salesCategories.isActive, 1)).orderBy(salesCategories.name);
}

export async function getCategoryById(id: number) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(salesCategories).where(eq(salesCategories.id, id)).limit(1);
  return result[0];
}

export async function insertSale(value: InsertSale) {
  const db = await getDb();
  if (!db) throw new Error("Database is not available");
  const result = await db.insert(sales).values(value);
  const id = Number(result[0].insertId);
  const created = await db.select().from(sales).where(eq(sales.id, id)).limit(1);
  return created[0];
}

export async function getSalesForUser(agentId: number, limit = 100) {
  const db = await getDb();
  if (!db) return [];
  return db.select({ sale: sales, categoryName: salesCategories.name }).from(sales).leftJoin(salesCategories, eq(sales.categoryId, salesCategories.id)).where(eq(sales.agentId, agentId)).orderBy(desc(sales.saleDate), desc(sales.createdAt)).limit(limit);
}

export async function getSalesBetween(start: string, end: string, agentId?: number) {
  const db = await getDb();
  if (!db) return [];
  const conditions = [gte(sales.saleDate, start), lt(sales.saleDate, end)];
  if (agentId !== undefined) conditions.push(eq(sales.agentId, agentId));
  return db.select({ sale: sales, categoryName: salesCategories.name, agentName: users.name, agentEmail: users.email }).from(sales).leftJoin(salesCategories, eq(sales.categoryId, salesCategories.id)).leftJoin(users, eq(sales.agentId, users.id)).where(and(...conditions)).orderBy(desc(sales.saleDate), desc(sales.createdAt));
}

export async function updateSalesStatus(ids: number[], status: "no_status" | "shipped" | "delivered" | "returned", commissionAmount: string, agentId?: number) {
  const db = await getDb();
  if (!db || ids.length === 0) return;
  const conditions = [inArray(sales.id, ids)];
  if (agentId !== undefined) conditions.push(eq(sales.agentId, agentId));
  await db.update(sales).set({ clientStatus: status, commissionAmount }).where(and(...conditions));
}

export type SaleWithCategory = Awaited<ReturnType<typeof getSalesForUser>>[number];
