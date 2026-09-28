import {
  date,
  decimal,
  index,
  integer,
  pgEnum,
  pgTable,
  serial,
  text,
  timestamp,
  varchar,
} from "drizzle-orm/pg-core";

export const userRole = pgEnum("user_role", ["user", "admin"]);
export const userStatus = pgEnum("user_status", ["active", "inactive"]);
export const paymentStatus = pgEnum("payment_status", ["no_payment", "initial_payment", "fully_paid"]);
export const paymentMethod = pgEnum("payment_method", ["cash", "gcash", "bank_transfer", "card", "other"]);
export const clientStatus = pgEnum("client_status", ["no_status", "shipped", "delivered", "returned"]);

export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  openId: varchar("openId", { length: 128 }).notNull().unique(),
  name: text("name"),
  email: varchar("email", { length: 320 }),
  loginMethod: varchar("loginMethod", { length: 64 }),
  username: varchar("username", { length: 80 }).unique(),
  passwordHash: varchar("passwordHash", { length: 255 }),
  role: userRole("role").default("user").notNull(),
  status: userStatus("status").default("active").notNull(),
  contactNumber: varchar("contactNumber", { length: 40 }),
  dateStarted: date("dateStarted", { mode: "string" }),
  notes: text("notes"),
  createdBy: integer("createdBy"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().notNull(),
  lastSignedIn: timestamp("lastSignedIn").defaultNow().notNull(),
  sessionVersion: integer("sessionVersion").default(0).notNull(),
});

export const auditLogs = pgTable(
  "audit_logs",
  {
    id: serial("id").primaryKey(),
    adminId: integer("adminId").notNull(),
    action: varchar("action", { length: 255 }).notNull(),
    targetUserId: integer("targetUserId"),
    ipAddress: varchar("ipAddress", { length: 64 }),
    createdAt: timestamp("createdAt").defaultNow().notNull(),
  },
  (table) => ({
    targetIdx: index("audit_target_idx").on(table.targetUserId, table.createdAt),
    adminIdx: index("audit_admin_idx").on(table.adminId, table.createdAt),
  }),
);

export const salesCategories = pgTable("sales_categories", {
  id: serial("id").primaryKey(),
  name: varchar("name", { length: 120 }).notNull(),
  isActive: integer("isActive").default(1).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().notNull(),
});

export const sales = pgTable(
  "sales",
  {
    id: serial("id").primaryKey(),
    saleDate: date("saleDate", { mode: "string" }).notNull(),
    agentId: integer("agentId").notNull(),
    customerName: varchar("customerName", { length: 180 }).notNull(),
    landingPageInitialOrder: decimal("landingPageInitialOrder", { precision: 12, scale: 2 }).default("0.00").notNull(),
    resellerDistributorPackage: decimal("resellerDistributorPackage", { precision: 12, scale: 2 }).default("0.00").notNull(),
    messaging: decimal("messaging", { precision: 12, scale: 2 }).default("0.00").notNull(),
    categoryId: integer("categoryId"),
    warmLeadsOutboundCalls: decimal("warmLeadsOutboundCalls", { precision: 12, scale: 2 }).default("0.00").notNull(),
    advancedPayment: decimal("advancedPayment", { precision: 12, scale: 2 }).default("0.00").notNull(),
    hotleadsUpsellCalls: decimal("hotleadsUpsellCalls", { precision: 12, scale: 2 }).default("0.00").notNull(),
    totalPosSales: decimal("totalPosSales", { precision: 12, scale: 2 }).default("0.00").notNull(),
    paymentStatus: paymentStatus("paymentStatus").default("no_payment").notNull(),
    initialPaymentAmount: decimal("initialPaymentAmount", { precision: 12, scale: 2 }).default("0.00").notNull(),
    paymentDate: date("paymentDate", { mode: "string" }),
    paymentMethod: paymentMethod("paymentMethod"),
    clientStatus: clientStatus("clientStatus").default("no_status").notNull(),
    commissionAmount: decimal("commissionAmount", { precision: 12, scale: 2 }).default("0.00").notNull(),
    deletedAt: timestamp("deletedAt"),
    deletedBy: integer("deletedBy"),
    deleteReason: varchar("deleteReason", { length: 255 }),
    createdAt: timestamp("createdAt").defaultNow().notNull(),
    updatedAt: timestamp("updatedAt").defaultNow().notNull(),
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
