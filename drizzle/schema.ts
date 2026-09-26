import {
  date,
  decimal,
  index,
  int,
  mysqlEnum,
  mysqlTable,
  text,
  timestamp,
  varchar,
} from "drizzle-orm/mysql-core";

export const users = mysqlTable("users", {
  id: int("id").autoincrement().primaryKey(),
  openId: varchar("openId", { length: 128 }).notNull().unique(),
  name: text("name"),
  email: varchar("email", { length: 320 }),
  loginMethod: varchar("loginMethod", { length: 64 }),
  username: varchar("username", { length: 80 }).unique(),
  passwordHash: varchar("passwordHash", { length: 255 }),
  role: mysqlEnum("role", ["user", "admin"]).default("user").notNull(),
  status: mysqlEnum("status", ["active", "inactive"]).default("active").notNull(),
  contactNumber: varchar("contactNumber", { length: 40 }),
  dateStarted: date("dateStarted", { mode: "string" }),
  notes: text("notes"),
  createdBy: int("createdBy"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  lastSignedIn: timestamp("lastSignedIn").defaultNow().notNull(),
  sessionVersion: int("sessionVersion").default(0).notNull(),
});

export const auditLogs = mysqlTable(
  "audit_logs",
  {
    id: int("id").autoincrement().primaryKey(),
    adminId: int("adminId").notNull(),
    action: varchar("action", { length: 255 }).notNull(),
    targetUserId: int("targetUserId"),
    ipAddress: varchar("ipAddress", { length: 64 }),
    createdAt: timestamp("createdAt").defaultNow().notNull(),
  },
  (table) => ({
    targetIdx: index("audit_target_idx").on(table.targetUserId, table.createdAt),
    adminIdx: index("audit_admin_idx").on(table.adminId, table.createdAt),
  }),
);

export const salesCategories = mysqlTable("sales_categories", {
  id: int("id").autoincrement().primaryKey(),
  name: varchar("name", { length: 120 }).notNull(),
  isActive: int("isActive").default(1).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export const sales = mysqlTable(
  "sales",
  {
    id: int("id").autoincrement().primaryKey(),
    saleDate: date("saleDate", { mode: "string" }).notNull(),
    agentId: int("agentId").notNull(),
    customerName: varchar("customerName", { length: 180 }).notNull(),
    landingPageInitialOrder: decimal("landingPageInitialOrder", { precision: 12, scale: 2 }).default("0.00").notNull(),
    resellerDistributorPackage: decimal("resellerDistributorPackage", { precision: 12, scale: 2 }).default("0.00").notNull(),
    messaging: decimal("messaging", { precision: 12, scale: 2 }).default("0.00").notNull(),
    categoryId: int("categoryId"),
    warmLeadsOutboundCalls: decimal("warmLeadsOutboundCalls", { precision: 12, scale: 2 }).default("0.00").notNull(),
    advancedPayment: decimal("advancedPayment", { precision: 12, scale: 2 }).default("0.00").notNull(),
    hotleadsUpsellCalls: decimal("hotleadsUpsellCalls", { precision: 12, scale: 2 }).default("0.00").notNull(),
    totalPosSales: decimal("totalPosSales", { precision: 12, scale: 2 }).default("0.00").notNull(),
    paymentStatus: mysqlEnum("paymentStatus", ["no_payment", "initial_payment", "fully_paid"]).default("no_payment").notNull(),
    initialPaymentAmount: decimal("initialPaymentAmount", { precision: 12, scale: 2 }).default("0.00").notNull(),
    paymentDate: date("paymentDate", { mode: "string" }),
    paymentMethod: mysqlEnum("paymentMethod", ["cash", "gcash", "bank_transfer", "card", "other"]),
    clientStatus: mysqlEnum("clientStatus", ["no_status", "shipped", "delivered", "returned"]).default("no_status").notNull(),
    commissionAmount: decimal("commissionAmount", { precision: 12, scale: 2 }).default("0.00").notNull(),
    createdAt: timestamp("createdAt").defaultNow().notNull(),
    updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  },
  (table) => ({
    agentDateIdx: index("sales_agent_date_idx").on(table.agentId, table.saleDate),
    dateIdx: index("sales_date_idx").on(table.saleDate),
  }),
);

export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;
export type SalesCategory = typeof salesCategories.$inferSelect;
export type Sale = typeof sales.$inferSelect;
export type InsertSale = typeof sales.$inferInsert;
export type AuditLog = typeof auditLogs.$inferSelect;
