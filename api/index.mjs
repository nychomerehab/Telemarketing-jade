var __defProp = Object.defineProperty;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __esm = (fn, res) => function __init() {
  return fn && (res = (0, fn[__getOwnPropNames(fn)[0]])(fn = 0)), res;
};
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};

// drizzle/schema.ts
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
  varchar
} from "drizzle-orm/pg-core";
var userRole, userStatus, paymentStatus, paymentMethod, clientStatus, users, auditLogs, salesCategories, sales;
var init_schema = __esm({
  "drizzle/schema.ts"() {
    "use strict";
    userRole = pgEnum("user_role", ["user", "admin"]);
    userStatus = pgEnum("user_status", ["active", "inactive"]);
    paymentStatus = pgEnum("payment_status", ["no_payment", "initial_payment", "fully_paid"]);
    paymentMethod = pgEnum("payment_method", ["cash", "gcash", "bank_transfer", "card", "other"]);
    clientStatus = pgEnum("client_status", ["no_status", "shipped", "delivered", "returned"]);
    users = pgTable("users", {
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
      sessionVersion: integer("sessionVersion").default(0).notNull()
    });
    auditLogs = pgTable(
      "audit_logs",
      {
        id: serial("id").primaryKey(),
        adminId: integer("adminId").notNull(),
        action: varchar("action", { length: 255 }).notNull(),
        targetUserId: integer("targetUserId"),
        ipAddress: varchar("ipAddress", { length: 64 }),
        createdAt: timestamp("createdAt").defaultNow().notNull()
      },
      (table) => ({
        targetIdx: index("audit_target_idx").on(table.targetUserId, table.createdAt),
        adminIdx: index("audit_admin_idx").on(table.adminId, table.createdAt)
      })
    );
    salesCategories = pgTable("sales_categories", {
      id: serial("id").primaryKey(),
      name: varchar("name", { length: 120 }).notNull(),
      isActive: integer("isActive").default(1).notNull(),
      createdAt: timestamp("createdAt").defaultNow().notNull(),
      updatedAt: timestamp("updatedAt").defaultNow().notNull()
    });
    sales = pgTable(
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
        externalSales: decimal("externalSales", { precision: 12, scale: 2 }).default("0.00").notNull(),
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
        updatedAt: timestamp("updatedAt").defaultNow().notNull()
      },
      (table) => ({
        agentDateIdx: index("sales_agent_date_idx").on(table.agentId, table.saleDate),
        dateIdx: index("sales_date_idx").on(table.saleDate)
      })
    );
  }
});

// server/_core/env.ts
var ENV;
var init_env = __esm({
  "server/_core/env.ts"() {
    "use strict";
    ENV = {
      appId: process.env.VITE_APP_ID ?? "",
      cookieSecret: process.env.JWT_SECRET ?? "",
      databaseUrl: process.env.DATABASE_URL ?? "",
      oAuthServerUrl: process.env.OAUTH_SERVER_URL ?? "",
      ownerOpenId: process.env.OWNER_OPEN_ID ?? "",
      isProduction: process.env.NODE_ENV === "production",
      forgeApiUrl: process.env.BUILT_IN_FORGE_API_URL ?? "",
      forgeApiKey: process.env.BUILT_IN_FORGE_API_KEY ?? ""
    };
  }
});

// server/db.ts
var db_exports = {};
__export(db_exports, {
  getAgentUsers: () => getAgentUsers,
  getAuditLogs: () => getAuditLogs,
  getCategories: () => getCategories,
  getCategoryById: () => getCategoryById,
  getDb: () => getDb,
  getSalesBetween: () => getSalesBetween,
  getSalesForUser: () => getSalesForUser,
  getUserAccounts: () => getUserAccounts,
  getUserById: () => getUserById,
  getUserByOpenId: () => getUserByOpenId,
  getUserByUsername: () => getUserByUsername,
  insertAuditLog: () => insertAuditLog,
  insertSale: () => insertSale,
  softDeleteSale: () => softDeleteSale,
  updateSalesStatus: () => updateSalesStatus,
  upsertUser: () => upsertUser
});
import { Pool } from "pg";
import { and, desc, eq, gte, inArray, isNull, like, lt, or } from "drizzle-orm";
import { drizzle } from "drizzle-orm/node-postgres";
async function getDb() {
  if (!_db && process.env.DATABASE_URL) {
    try {
      _pool = new Pool({
        connectionString: process.env.DATABASE_URL,
        ssl: process.env.DATABASE_URL.includes("supabase") ? { rejectUnauthorized: false } : void 0,
        max: 5
      });
      _db = drizzle(_pool);
    } catch (error) {
      console.warn("[Database] Failed to connect:", error);
      _db = null;
    }
  }
  return _db;
}
async function upsertUser(user) {
  if (!user.openId) throw new Error("User openId is required for upsert");
  const db = await getDb();
  if (!db) return;
  const values = { openId: user.openId };
  const updateSet = {};
  const textFields = ["name", "email", "loginMethod"];
  for (const field of textFields) {
    if (user[field] !== void 0) {
      values[field] = user[field] ?? null;
      updateSet[field] = user[field] ?? null;
    }
  }
  if (user.lastSignedIn !== void 0) {
    values.lastSignedIn = user.lastSignedIn;
    updateSet.lastSignedIn = user.lastSignedIn;
  }
  if (user.role !== void 0) {
    values.role = user.role;
    updateSet.role = user.role;
  } else if (user.openId === ENV.ownerOpenId) {
    values.role = "admin";
    updateSet.role = "admin";
  }
  values.lastSignedIn ??= /* @__PURE__ */ new Date();
  if (!Object.keys(updateSet).length) updateSet.lastSignedIn = /* @__PURE__ */ new Date();
  await db.insert(users).values(values).onConflictDoUpdate({ target: users.openId, set: updateSet });
}
async function getUserByOpenId(openId) {
  const db = await getDb();
  if (!db) return void 0;
  const result = await db.select().from(users).where(eq(users.openId, openId)).limit(1);
  return result[0];
}
async function getUserByUsername(username) {
  const db = await getDb();
  if (!db) return void 0;
  const result = await db.select().from(users).where(eq(users.username, username.toLowerCase())).limit(1);
  return result[0];
}
async function getAgentUsers(search, status) {
  const db = await getDb();
  if (!db) return [];
  const conditions = [eq(users.role, "user")];
  if (status) conditions.push(eq(users.status, status));
  if (search?.trim()) {
    const term = `%${search.trim()}%`;
    conditions.push(or(like(users.name, term), like(users.username, term)));
  }
  return db.select({
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
    lastSignedIn: users.lastSignedIn
  }).from(users).where(and(...conditions)).orderBy(desc(users.createdAt));
}
async function getUserAccounts(search, status) {
  const db = await getDb();
  if (!db) return [];
  const conditions = status ? [eq(users.status, status)] : [];
  if (search?.trim()) {
    const term = `%${search.trim()}%`;
    conditions.push(or(like(users.name, term), like(users.username, term)));
  }
  return db.select({ id: users.id, name: users.name, username: users.username, role: users.role, status: users.status, email: users.email, contactNumber: users.contactNumber, dateStarted: users.dateStarted, notes: users.notes, createdAt: users.createdAt, lastSignedIn: users.lastSignedIn }).from(users).where(conditions.length ? and(...conditions) : void 0).orderBy(desc(users.createdAt));
}
async function getUserById(id) {
  const db = await getDb();
  if (!db) return void 0;
  const result = await db.select().from(users).where(eq(users.id, id)).limit(1);
  return result[0];
}
async function insertAuditLog(input) {
  const db = await getDb();
  if (!db) return;
  await db.insert(auditLogs).values({ adminId: input.adminId, action: input.action, targetUserId: input.targetUserId, ipAddress: input.ipAddress ?? null });
}
async function getAuditLogs(limit = 100) {
  const db = await getDb();
  if (!db) return [];
  return db.select({ log: auditLogs, adminName: users.name }).from(auditLogs).leftJoin(users, eq(auditLogs.adminId, users.id)).orderBy(desc(auditLogs.createdAt)).limit(limit);
}
async function getCategories(includeInactive = false) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(salesCategories).where(includeInactive ? void 0 : eq(salesCategories.isActive, 1)).orderBy(salesCategories.name);
}
async function getCategoryById(id) {
  const db = await getDb();
  if (!db) return void 0;
  const result = await db.select().from(salesCategories).where(eq(salesCategories.id, id)).limit(1);
  return result[0];
}
async function insertSale(value) {
  const db = await getDb();
  if (!db) throw new Error("Database is not available");
  const result = await db.insert(sales).values(value).returning();
  return result[0];
}
async function getSalesForUser(agentId, limit = 100) {
  const db = await getDb();
  if (!db) return [];
  return db.select({ sale: sales, categoryName: salesCategories.name }).from(sales).leftJoin(salesCategories, eq(sales.categoryId, salesCategories.id)).where(and(eq(sales.agentId, agentId), isNull(sales.deletedAt))).orderBy(desc(sales.saleDate), desc(sales.createdAt)).limit(limit);
}
async function getSalesBetween(start, end, agentId) {
  const db = await getDb();
  if (!db) return [];
  const conditions = [gte(sales.saleDate, start), lt(sales.saleDate, end), isNull(sales.deletedAt)];
  if (agentId !== void 0) conditions.push(eq(sales.agentId, agentId));
  return db.select({ sale: sales, categoryName: salesCategories.name, agentName: users.name, agentEmail: users.email }).from(sales).leftJoin(salesCategories, eq(sales.categoryId, salesCategories.id)).leftJoin(users, eq(sales.agentId, users.id)).where(and(...conditions)).orderBy(desc(sales.saleDate), desc(sales.createdAt));
}
async function updateSalesStatus(ids, status, commissionAmount, agentId) {
  const db = await getDb();
  if (!db || ids.length === 0) return;
  const conditions = [inArray(sales.id, ids)];
  if (agentId !== void 0) conditions.push(eq(sales.agentId, agentId));
  await db.update(sales).set({ clientStatus: status, commissionAmount, updatedAt: /* @__PURE__ */ new Date() }).where(and(...conditions));
}
async function softDeleteSale(id, deletedBy, deleteReason) {
  const db = await getDb();
  if (!db) throw new Error("Database is not available");
  const result = await db.update(sales).set({ deletedAt: /* @__PURE__ */ new Date(), deletedBy, deleteReason, updatedAt: /* @__PURE__ */ new Date() }).where(and(eq(sales.id, id), isNull(sales.deletedAt))).returning({ id: sales.id });
  return result.length > 0;
}
var _db, _pool;
var init_db = __esm({
  "server/db.ts"() {
    "use strict";
    init_schema();
    init_env();
    _db = null;
    _pool = null;
  }
});

// server/_core/vercelApp.ts
import "dotenv/config";
import express from "express";
import { createExpressMiddleware } from "@trpc/server/adapters/express";

// shared/const.ts
var COOKIE_NAME = "app_session_id";
var ONE_YEAR_MS = 1e3 * 60 * 60 * 24 * 365;
var AXIOS_TIMEOUT_MS = 3e4;
var UNAUTHED_ERR_MSG = "Please login (10001)";
var NOT_ADMIN_ERR_MSG = "You do not have required permission (10002)";
var OAUTH_STATE_COOKIE = "__Host-oauth_state";
var decodeOAuthState = (state) => {
  let decoded;
  try {
    decoded = atob(state);
  } catch {
    return { redirectUri: "" };
  }
  try {
    const parsed = JSON.parse(decoded);
    if (parsed && typeof parsed.redirectUri === "string") return parsed;
  } catch {
  }
  return { redirectUri: decoded };
};

// server/_core/oauth.ts
init_db();
import { parse as parseCookieHeader2 } from "cookie";

// server/_core/cookies.ts
function isSecureRequest(req) {
  if (req.protocol === "https") return true;
  const forwardedProto = req.headers["x-forwarded-proto"];
  if (!forwardedProto) return false;
  const protoList = Array.isArray(forwardedProto) ? forwardedProto : forwardedProto.split(",");
  return protoList.some((proto) => proto.trim().toLowerCase() === "https");
}
function getSessionCookieOptions(req) {
  return {
    httpOnly: true,
    path: "/",
    sameSite: "none",
    secure: isSecureRequest(req)
  };
}

// shared/_core/errors.ts
var HttpError = class extends Error {
  constructor(statusCode, message) {
    super(message);
    this.statusCode = statusCode;
    this.name = "HttpError";
  }
};
var ForbiddenError = (msg) => new HttpError(403, msg);

// server/_core/sdk.ts
init_db();
init_env();
import axios from "axios";
import { parse as parseCookieHeader } from "cookie";
import { SignJWT, jwtVerify } from "jose";
var isNonEmptyString = (value) => typeof value === "string" && value.length > 0;
var EXCHANGE_TOKEN_PATH = `/webdev.v1.WebDevAuthPublicService/ExchangeToken`;
var GET_USER_INFO_PATH = `/webdev.v1.WebDevAuthPublicService/GetUserInfo`;
var GET_USER_INFO_WITH_JWT_PATH = `/webdev.v1.WebDevAuthPublicService/GetUserInfoWithJwt`;
var OAuthService = class {
  constructor(client) {
    this.client = client;
    console.log("[OAuth] Initialized with baseURL:", ENV.oAuthServerUrl);
    if (!ENV.oAuthServerUrl) {
      console.error(
        "[OAuth] ERROR: OAUTH_SERVER_URL is not configured! Set OAUTH_SERVER_URL environment variable."
      );
    }
  }
  decodeState(state) {
    return decodeOAuthState(state).redirectUri;
  }
  async getTokenByCode(code, state) {
    const payload = {
      clientId: ENV.appId,
      grantType: "authorization_code",
      code,
      redirectUri: this.decodeState(state)
    };
    const { data } = await this.client.post(
      EXCHANGE_TOKEN_PATH,
      payload
    );
    return data;
  }
  async getUserInfoByToken(token) {
    const { data } = await this.client.post(
      GET_USER_INFO_PATH,
      {
        accessToken: token.accessToken
      }
    );
    return data;
  }
};
var createOAuthHttpClient = () => axios.create({
  baseURL: ENV.oAuthServerUrl,
  timeout: AXIOS_TIMEOUT_MS
});
var SDKServer = class {
  client;
  oauthService;
  constructor(client = createOAuthHttpClient()) {
    this.client = client;
    this.oauthService = new OAuthService(this.client);
  }
  deriveLoginMethod(platforms, fallback) {
    if (fallback && fallback.length > 0) return fallback;
    if (!Array.isArray(platforms) || platforms.length === 0) return null;
    const set = new Set(
      platforms.filter((p) => typeof p === "string")
    );
    if (set.has("REGISTERED_PLATFORM_EMAIL")) return "email";
    if (set.has("REGISTERED_PLATFORM_GOOGLE")) return "google";
    if (set.has("REGISTERED_PLATFORM_APPLE")) return "apple";
    if (set.has("REGISTERED_PLATFORM_MICROSOFT") || set.has("REGISTERED_PLATFORM_AZURE"))
      return "microsoft";
    if (set.has("REGISTERED_PLATFORM_GITHUB")) return "github";
    const first = Array.from(set)[0];
    return first ? first.toLowerCase() : null;
  }
  /**
   * Exchange OAuth authorization code for access token
   * @example
   * const tokenResponse = await sdk.exchangeCodeForToken(code, state);
   */
  async exchangeCodeForToken(code, state) {
    return this.oauthService.getTokenByCode(code, state);
  }
  /**
   * Get user information using access token
   * @example
   * const userInfo = await sdk.getUserInfo(tokenResponse.accessToken);
   */
  async getUserInfo(accessToken) {
    const data = await this.oauthService.getUserInfoByToken({
      accessToken
    });
    const loginMethod = this.deriveLoginMethod(
      data?.platforms,
      data?.platform ?? data.platform ?? null
    );
    return {
      ...data,
      platform: loginMethod,
      loginMethod
    };
  }
  parseCookies(cookieHeader) {
    if (!cookieHeader) {
      return /* @__PURE__ */ new Map();
    }
    const parsed = parseCookieHeader(cookieHeader);
    return new Map(Object.entries(parsed));
  }
  getSessionSecret() {
    const secret = ENV.cookieSecret;
    return new TextEncoder().encode(secret);
  }
  /**
   * Create a session token for a Manus user openId
   * @example
   * const sessionToken = await sdk.createSessionToken(userInfo.openId);
   */
  async createSessionToken(openId, options = {}) {
    return this.signSession(
      {
        openId,
        appId: ENV.appId,
        name: options.name || "",
        sessionVersion: options.sessionVersion
      },
      options
    );
  }
  async signSession(payload, options = {}) {
    const issuedAt = Date.now();
    const expiresInMs = options.expiresInMs ?? ONE_YEAR_MS;
    const expirationSeconds = Math.floor((issuedAt + expiresInMs) / 1e3);
    const secretKey = this.getSessionSecret();
    return new SignJWT({
      openId: payload.openId,
      appId: payload.appId,
      name: payload.name,
      sessionVersion: payload.sessionVersion
    }).setProtectedHeader({ alg: "HS256", typ: "JWT" }).setExpirationTime(expirationSeconds).sign(secretKey);
  }
  async verifySession(cookieValue) {
    if (!cookieValue) {
      console.warn("[Auth] Missing session cookie");
      return null;
    }
    try {
      const secretKey = this.getSessionSecret();
      const { payload } = await jwtVerify(cookieValue, secretKey, {
        algorithms: ["HS256"]
      });
      const { openId, appId, name, sessionVersion } = payload;
      if (!isNonEmptyString(openId) || !isNonEmptyString(appId) || !isNonEmptyString(name)) {
        console.warn("[Auth] Session payload missing required fields");
        return null;
      }
      return {
        openId,
        appId,
        name,
        sessionVersion: typeof sessionVersion === "number" ? sessionVersion : void 0
      };
    } catch (error) {
      console.warn("[Auth] Session verification failed", String(error));
      return null;
    }
  }
  async getUserInfoWithJwt(jwtToken) {
    const payload = {
      jwtToken,
      projectId: ENV.appId
    };
    const { data } = await this.client.post(
      GET_USER_INFO_WITH_JWT_PATH,
      payload
    );
    const loginMethod = this.deriveLoginMethod(
      data?.platforms,
      data?.platform ?? data.platform ?? null
    );
    return {
      ...data,
      platform: loginMethod,
      loginMethod
    };
  }
  async authenticateRequest(req) {
    const cookies = this.parseCookies(req.headers.cookie);
    let sessionToken = cookies.get(COOKIE_NAME);
    if (!sessionToken) {
      const authHeader = req.headers.authorization;
      if (typeof authHeader === "string" && authHeader.startsWith("Bearer ")) {
        sessionToken = authHeader.slice(7);
      }
    }
    const session = await this.verifySession(sessionToken);
    if (!session) {
      throw ForbiddenError("Invalid session cookie");
    }
    if (session.openId.startsWith(CRON_OPEN_ID_PREFIX)) {
      const userInfo = await this.getUserInfoWithJwt(sessionToken ?? "");
      const taskUid = userInfo.taskUid ?? null;
      if (!taskUid) {
        throw ForbiddenError("Cron session missing task_uid");
      }
      return buildCronUser(userInfo);
    }
    const sessionUserId = session.openId;
    const signedInAt = /* @__PURE__ */ new Date();
    let user = await getUserByOpenId(sessionUserId);
    if (!user) {
      try {
        const userInfo = await this.getUserInfoWithJwt(sessionToken ?? "");
        await upsertUser({
          openId: userInfo.openId,
          name: userInfo.name || null,
          email: userInfo.email ?? null,
          loginMethod: userInfo.loginMethod ?? userInfo.platform ?? null,
          lastSignedIn: signedInAt
        });
        user = await getUserByOpenId(userInfo.openId);
      } catch (error) {
        console.error("[Auth] Failed to sync user from OAuth:", error);
        throw ForbiddenError("Failed to sync user info");
      }
    }
    if (!user) {
      throw ForbiddenError("User not found");
    }
    if (user.status === "inactive") {
      throw ForbiddenError("This account is currently inactive. Please contact your administrator.");
    }
    if (user.openId.startsWith("local:") && session.sessionVersion !== user.sessionVersion) {
      throw ForbiddenError("Session expired. Please sign in again.");
    }
    await upsertUser({
      openId: user.openId,
      lastSignedIn: signedInAt
    });
    return user;
  }
};
var CRON_OPEN_ID_PREFIX = "cron_";
function buildCronUser(userInfo) {
  const now = /* @__PURE__ */ new Date();
  return {
    id: -1,
    openId: userInfo.openId,
    name: userInfo.name || "Manus Scheduled Task",
    email: null,
    loginMethod: null,
    role: "user",
    createdAt: now,
    updatedAt: now,
    lastSignedIn: now,
    taskUid: userInfo.taskUid ?? void 0,
    isCron: true
  };
}
var sdk = new SDKServer();

// server/_core/oauth.ts
function getQueryParam(req, key) {
  const value = req.query[key];
  return typeof value === "string" ? value : void 0;
}
function registerOAuthRoutes(app2) {
  app2.get("/api/oauth/callback", async (req, res) => {
    const code = getQueryParam(req, "code");
    const state = getQueryParam(req, "state");
    if (!code || !state) {
      res.status(400).json({ error: "code and state are required" });
      return;
    }
    const { nonce } = decodeOAuthState(state);
    const expectedNonce = parseCookieHeader2(req.headers.cookie ?? "")[OAUTH_STATE_COOKIE];
    if (!nonce || nonce !== expectedNonce) {
      res.status(403).json({ error: "invalid oauth state" });
      return;
    }
    res.clearCookie(OAUTH_STATE_COOKIE, { path: "/", secure: true, sameSite: "none" });
    try {
      const tokenResponse = await sdk.exchangeCodeForToken(code, state);
      const userInfo = await sdk.getUserInfo(tokenResponse.accessToken);
      if (!userInfo.openId) {
        res.status(400).json({ error: "openId missing from user info" });
        return;
      }
      await upsertUser({
        openId: userInfo.openId,
        name: userInfo.name || null,
        email: userInfo.email ?? null,
        loginMethod: userInfo.loginMethod ?? userInfo.platform ?? null,
        lastSignedIn: /* @__PURE__ */ new Date()
      });
      const sessionToken = await sdk.createSessionToken(userInfo.openId, {
        name: userInfo.name || "",
        expiresInMs: ONE_YEAR_MS
      });
      const cookieOptions = getSessionCookieOptions(req);
      res.cookie(COOKIE_NAME, sessionToken, { ...cookieOptions, maxAge: ONE_YEAR_MS });
      res.redirect(302, "/");
    } catch (error) {
      console.error("[OAuth] Callback failed", error);
      res.status(500).json({ error: "OAuth callback failed" });
    }
  });
}

// server/_core/storageProxy.ts
init_env();
function registerStorageProxy(app2) {
  app2.get("/manus-storage/*", async (req, res) => {
    const key = req.params[0];
    if (!key) {
      res.status(400).send("Missing storage key");
      return;
    }
    if (!ENV.forgeApiUrl || !ENV.forgeApiKey) {
      res.status(500).send("Storage proxy not configured");
      return;
    }
    try {
      const forgeUrl = new URL(
        "v1/storage/presign/get",
        ENV.forgeApiUrl.replace(/\/+$/, "") + "/"
      );
      forgeUrl.searchParams.set("path", key);
      const forgeResp = await fetch(forgeUrl, {
        headers: { Authorization: `Bearer ${ENV.forgeApiKey}` }
      });
      if (!forgeResp.ok) {
        const body = await forgeResp.text().catch(() => "");
        console.error(`[StorageProxy] forge error: ${forgeResp.status} ${body}`);
        res.status(502).send("Storage backend error");
        return;
      }
      const { url } = await forgeResp.json();
      if (!url) {
        res.status(502).send("Empty signed URL from backend");
        return;
      }
      res.set("Cache-Control", "no-store");
      res.redirect(307, url);
    } catch (err) {
      console.error("[StorageProxy] failed:", err);
      res.status(502).send("Storage proxy error");
    }
  });
}

// server/routers.ts
import bcrypt from "bcryptjs";
import { z as z2 } from "zod";

// server/_core/systemRouter.ts
import { z } from "zod";

// server/_core/notification.ts
init_env();
import { TRPCError } from "@trpc/server";
var TITLE_MAX_LENGTH = 1200;
var CONTENT_MAX_LENGTH = 2e4;
var trimValue = (value) => value.trim();
var isNonEmptyString2 = (value) => typeof value === "string" && value.trim().length > 0;
var buildEndpointUrl = (baseUrl) => {
  const normalizedBase = baseUrl.endsWith("/") ? baseUrl : `${baseUrl}/`;
  return new URL(
    "webdevtoken.v1.WebDevService/SendNotification",
    normalizedBase
  ).toString();
};
var validatePayload = (input) => {
  if (!isNonEmptyString2(input.title)) {
    throw new TRPCError({
      code: "BAD_REQUEST",
      message: "Notification title is required."
    });
  }
  if (!isNonEmptyString2(input.content)) {
    throw new TRPCError({
      code: "BAD_REQUEST",
      message: "Notification content is required."
    });
  }
  const title = trimValue(input.title);
  const content = trimValue(input.content);
  if (title.length > TITLE_MAX_LENGTH) {
    throw new TRPCError({
      code: "BAD_REQUEST",
      message: `Notification title must be at most ${TITLE_MAX_LENGTH} characters.`
    });
  }
  if (content.length > CONTENT_MAX_LENGTH) {
    throw new TRPCError({
      code: "BAD_REQUEST",
      message: `Notification content must be at most ${CONTENT_MAX_LENGTH} characters.`
    });
  }
  return { title, content };
};
async function notifyOwner(payload) {
  const { title, content } = validatePayload(payload);
  if (!ENV.forgeApiUrl) {
    throw new TRPCError({
      code: "INTERNAL_SERVER_ERROR",
      message: "Notification service URL is not configured."
    });
  }
  if (!ENV.forgeApiKey) {
    throw new TRPCError({
      code: "INTERNAL_SERVER_ERROR",
      message: "Notification service API key is not configured."
    });
  }
  const endpoint = buildEndpointUrl(ENV.forgeApiUrl);
  try {
    const response = await fetch(endpoint, {
      method: "POST",
      headers: {
        accept: "application/json",
        authorization: `Bearer ${ENV.forgeApiKey}`,
        "content-type": "application/json",
        "connect-protocol-version": "1"
      },
      body: JSON.stringify({ title, content })
    });
    if (!response.ok) {
      const detail = await response.text().catch(() => "");
      console.warn(
        `[Notification] Failed to notify owner (${response.status} ${response.statusText})${detail ? `: ${detail}` : ""}`
      );
      return false;
    }
    return true;
  } catch (error) {
    console.warn("[Notification] Error calling notification service:", error);
    return false;
  }
}

// server/_core/trpc.ts
import { initTRPC, TRPCError as TRPCError2 } from "@trpc/server";
import superjson from "superjson";
var t = initTRPC.context().create({
  transformer: superjson
});
var router = t.router;
var publicProcedure = t.procedure;
var requireUser = t.middleware(async (opts) => {
  const { ctx, next } = opts;
  if (!ctx.user) {
    throw new TRPCError2({ code: "UNAUTHORIZED", message: UNAUTHED_ERR_MSG });
  }
  return next({
    ctx: {
      ...ctx,
      user: ctx.user
    }
  });
});
var protectedProcedure = t.procedure.use(requireUser);
var adminProcedure = t.procedure.use(
  t.middleware(async (opts) => {
    const { ctx, next } = opts;
    if (!ctx.user || ctx.user.role !== "admin") {
      throw new TRPCError2({ code: "FORBIDDEN", message: NOT_ADMIN_ERR_MSG });
    }
    return next({
      ctx: {
        ...ctx,
        user: ctx.user
      }
    });
  })
);

// server/_core/systemRouter.ts
var systemRouter = router({
  health: publicProcedure.input(
    z.object({
      timestamp: z.number().min(0, "timestamp cannot be negative")
    })
  ).query(() => ({
    ok: true
  })),
  notifyOwner: adminProcedure.input(
    z.object({
      title: z.string().min(1, "title is required"),
      content: z.string().min(1, "content is required")
    })
  ).mutation(async ({ input }) => {
    const delivered = await notifyOwner(input);
    return {
      success: delivered
    };
  })
});

// server/routers.ts
init_db();
init_schema();
import { TRPCError as TRPCError3 } from "@trpc/server";
import { eq as eq2 } from "drizzle-orm";
var moneyInput = z2.union([z2.string(), z2.number()]).refine((value) => Number.isFinite(Number(String(value).replace(/,/g, ""))), "Enter a valid amount").transform((value) => Number(String(value).replace(/,/g, "")).toFixed(2)).refine((value) => Number(value) >= 0, "Amounts cannot be negative");
var usernameInput = z2.string().trim().min(3).max(80).regex(/^[a-zA-Z0-9._-]+$/, "Username can only contain letters, numbers, dots, underscores, and hyphens").transform((value) => value.toLowerCase());
var strongPassword = z2.string().min(8, "Password must be at least 8 characters").regex(/[A-Z]/, "Password must include an uppercase letter").regex(/[a-z]/, "Password must include a lowercase letter").regex(/[0-9]/, "Password must include a number").regex(/[^A-Za-z0-9]/, "Password must include a special character");
var passwordPair = z2.object({ password: strongPassword, confirmPassword: z2.string() }).refine((value) => value.password === value.confirmPassword, { message: "Passwords do not match", path: ["confirmPassword"] });
var saleInput = z2.object({ saleDate: z2.string().regex(/^\d{4}-\d{2}-\d{2}$/), customerName: z2.string().trim().min(1).max(180), categoryId: z2.number().int().positive(), landingPageInitialOrder: moneyInput, resellerDistributorPackage: moneyInput, messaging: moneyInput, warmLeadsOutboundCalls: moneyInput, advancedPayment: moneyInput, hotleadsUpsellCalls: moneyInput, externalSales: moneyInput.default("0.00"), paymentStatus: z2.enum(["no_payment", "initial_payment", "fully_paid"]), initialPaymentAmount: moneyInput, paymentDate: z2.string().regex(/^\d{4}-\d{2}-\d{2}$/).nullable(), paymentMethod: z2.enum(["cash", "gcash", "bank_transfer", "card", "other"]).nullable() }).superRefine((value, ctx) => {
  const total = calculateGrossSales(value);
  if (value.paymentStatus !== "no_payment" && (!value.paymentDate || !value.paymentMethod)) ctx.addIssue({ code: "custom", message: "Payment date and payment method are required when a payment is recorded." });
  if (value.paymentStatus === "initial_payment" && Number(value.initialPaymentAmount) <= 0) ctx.addIssue({ code: "custom", message: "Enter the initial payment amount." });
  if (total <= 0) ctx.addIssue({ code: "custom", message: "Enter at least one POS or External Sales amount." });
});
var clientStatusInput = z2.enum(["no_status", "shipped", "delivered", "returned"]);
var dashboardDateInput = z2.object({ date: z2.string().regex(/^\d{4}-\d{2}-\d{2}$/) }).optional();
var adminReportInput = z2.object({ agentId: z2.number().int().positive().optional(), categoryId: z2.number().int().positive().optional(), date: z2.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(), dateFrom: z2.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(), dateTo: z2.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(), customerName: z2.string().trim().max(180).optional() }).superRefine((value, ctx) => {
  if (value.dateFrom && value.dateTo && value.dateFrom > value.dateTo) ctx.addIssue({ code: "custom", message: "Date From cannot be later than Date To", path: ["dateTo"] });
}).optional();
var adminSaleUpdateInput = z2.object({ id: z2.number().int().positive(), saleDate: z2.string().regex(/^\d{4}-\d{2}-\d{2}$/), agentId: z2.number().int().positive(), customerName: z2.string().trim().min(1).max(180), categoryId: z2.number().int().positive(), landingPageInitialOrder: moneyInput, resellerDistributorPackage: moneyInput, messaging: moneyInput, warmLeadsOutboundCalls: moneyInput, advancedPayment: moneyInput, hotleadsUpsellCalls: moneyInput, externalSales: moneyInput });
var agentFields = z2.object({ fullName: z2.string().trim().min(2).max(180), username: usernameInput, email: z2.string().trim().email().max(320).optional().or(z2.literal("")), contactNumber: z2.string().trim().max(40).optional(), dateStarted: z2.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional().or(z2.literal("")), notes: z2.string().max(2e3).optional(), status: z2.enum(["active", "inactive"]) });
function money(value) {
  return Number(value ?? 0);
}
function isExternalSalesCategory(category) {
  return category.name.trim().toUpperCase() === "EXTERNAL SALES";
}
function normalizeSalesAmounts(input, externalCategory) {
  const enteredPosTotal = calculateTotalPosSales(input);
  const enteredExternal = money(input.externalSales);
  const fullyPaidAmount = input.paymentStatus === "fully_paid" ? money(input.initialPaymentAmount) : 0;
  const externalSales = externalCategory ? enteredExternal > 0 ? enteredExternal : fullyPaidAmount > 0 ? fullyPaidAmount : enteredPosTotal : enteredExternal;
  return { landingPageInitialOrder: externalCategory ? "0.00" : String(input.landingPageInitialOrder), resellerDistributorPackage: externalCategory ? "0.00" : String(input.resellerDistributorPackage), messaging: externalCategory ? "0.00" : String(input.messaging), warmLeadsOutboundCalls: externalCategory ? "0.00" : String(input.warmLeadsOutboundCalls), hotleadsUpsellCalls: externalCategory ? "0.00" : String(input.hotleadsUpsellCalls), externalSales: externalSales.toFixed(2), totalPosSales: externalCategory ? "0.00" : enteredPosTotal.toFixed(2) };
}
function calculatePaidAmount(input) {
  return input.paymentStatus === "fully_paid" ? money(input.totalPosSales) + money(input.externalSales) : money(input.initialPaymentAmount);
}
function calculateTotalPosSales(input) {
  return [input.landingPageInitialOrder, input.resellerDistributorPackage, input.messaging, input.warmLeadsOutboundCalls, input.hotleadsUpsellCalls].reduce((sum, value) => sum + money(value), 0);
}
function calculateGrossSales(input) {
  const posTotal = input.totalPosSales !== void 0 ? money(input.totalPosSales) : calculateTotalPosSales({ landingPageInitialOrder: input.landingPageInitialOrder ?? 0, resellerDistributorPackage: input.resellerDistributorPackage ?? 0, messaging: input.messaging ?? 0, warmLeadsOutboundCalls: input.warmLeadsOutboundCalls ?? 0, hotleadsUpsellCalls: input.hotleadsUpsellCalls ?? 0 });
  return posTotal + money(input.externalSales);
}
function calculateAgentCommission(input, status) {
  if (status !== "delivered") return 0;
  return money(input.landingPageInitialOrder) * 5e-3 + money(input.hotleadsUpsellCalls) * 0.03 + money(input.messaging) * 0.03 + money(input.warmLeadsOutboundCalls) * 0.04 + money(input.externalSales) * 0.03;
}
function dateKey(date2 = /* @__PURE__ */ new Date()) {
  return new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Manila" }).format(date2);
}
function nextDayKey(key) {
  const [year, month, day] = key.split("-").map(Number);
  return dateKey(new Date(Date.UTC(year, month - 1, day + 1, 12)));
}
function monthStartFromKey(key) {
  return `${key.slice(0, 7)}-01`;
}
function nextMonthFromKey(key) {
  const [year, month] = key.split("-").map(Number);
  const next = month === 12 ? { year: year + 1, month: 1 } : { year, month: month + 1 };
  return `${next.year}-${String(next.month).padStart(2, "0")}-01`;
}
function summarize(rows) {
  return rows.reduce((summary, { sale }) => {
    summary.totalPosSales += money(sale.totalPosSales);
    summary.orders += 1;
    summary.landingPage += money(sale.landingPageInitialOrder);
    summary.reseller += money(sale.resellerDistributorPackage);
    summary.messaging += money(sale.messaging);
    summary.warmLeads += money(sale.warmLeadsOutboundCalls);
    summary.hotleads += money(sale.hotleadsUpsellCalls);
    summary.externalSales += money(sale.externalSales);
    summary.advancedPayments += money(sale.advancedPayment);
    summary.initialPayments += calculatePaidAmount(sale);
    summary.outstandingBalance += Math.max(0, calculateGrossSales(sale) - calculatePaidAmount(sale));
    summary.ordersWithInitialPayment += sale.paymentStatus !== "no_payment" ? 1 : 0;
    summary.commission += money(sale.commissionAmount);
    return summary;
  }, { totalPosSales: 0, orders: 0, landingPage: 0, reseller: 0, messaging: 0, warmLeads: 0, hotleads: 0, externalSales: 0, advancedPayments: 0, initialPayments: 0, outstandingBalance: 0, ordersWithInitialPayment: 0, commission: 0 });
}
function matchesReportCategory(row, categoryId, categoryName) {
  if (row.sale.categoryId !== null && row.sale.categoryId !== void 0) return Number(row.sale.categoryId) === categoryId;
  const name = categoryName.trim().toUpperCase();
  if (name === "LANDING PAGE") return money(row.sale.landingPageInitialOrder) > 0;
  if (name === "LANDING PAGE WITH UPSELL") return money(row.sale.hotleadsUpsellCalls) > 0;
  if (name === "MESSAGING") return money(row.sale.messaging) > 0;
  if (name === "WARM SALES") return money(row.sale.warmLeadsOutboundCalls) > 0 || money(row.sale.resellerDistributorPackage) > 0;
  return false;
}
function clientIp(req) {
  const forwarded = req.headers?.["x-forwarded-for"];
  return typeof forwarded === "string" ? forwarded.split(",")[0].trim() : req.ip ?? null;
}
var appRouter = router({
  system: systemRouter,
  auth: router({
    me: publicProcedure.query((opts) => opts.ctx.user),
    login: publicProcedure.input(z2.object({ username: usernameInput, password: z2.string().min(1), role: z2.enum(["user", "admin"]).default("user") })).mutation(async ({ ctx, input }) => {
      const account = await getUserByUsername(input.username);
      if (!account?.passwordHash) throw new TRPCError3({ code: "UNAUTHORIZED", message: "Invalid username or password." });
      if (account.status === "inactive") throw new TRPCError3({ code: "FORBIDDEN", message: "This account is currently inactive. Please contact your administrator." });
      if (account.role !== input.role) throw new TRPCError3({ code: "UNAUTHORIZED", message: input.role === "admin" ? "Use a Super Admin account for this sign-in." : "Use a staff account for this sign-in." });
      const matches = await bcrypt.compare(input.password, account.passwordHash);
      if (!matches) throw new TRPCError3({ code: "UNAUTHORIZED", message: "Invalid username or password." });
      const db = await getDb();
      if (!db) throw new TRPCError3({ code: "INTERNAL_SERVER_ERROR", message: "Database is not available" });
      const nextLastLogin = /* @__PURE__ */ new Date();
      await db.update(users).set({ lastSignedIn: nextLastLogin }).where(eq2(users.id, account.id));
      const token = await sdk.createSessionToken(account.openId, { name: account.name || account.username || "", sessionVersion: account.sessionVersion });
      ctx.res.cookie(COOKIE_NAME, token, { ...getSessionCookieOptions(ctx.req), maxAge: ONE_YEAR_MS });
      return { success: true, user: { id: account.id, name: account.name, username: account.username, role: account.role, status: account.status, email: account.email, lastSignedIn: nextLastLogin } };
    }),
    logout: publicProcedure.mutation(({ ctx }) => {
      const cookieOptions = getSessionCookieOptions(ctx.req);
      ctx.res.clearCookie(COOKIE_NAME, { ...cookieOptions, maxAge: -1 });
      return { success: true };
    })
  }),
  userManagement: router({
    list: adminProcedure.input(z2.object({ search: z2.string().optional(), status: z2.enum(["all", "active", "inactive"]).default("all"), role: z2.enum(["agents", "all"]).default("agents") }).optional()).query(({ input }) => input?.role === "all" ? getUserAccounts(input?.search, input?.status === "all" ? void 0 : input?.status) : getAgentUsers(input?.search, input?.status === "all" ? void 0 : input?.status)),
    auditLogs: adminProcedure.query(() => Promise.resolve().then(() => (init_db(), db_exports)).then(({ getAuditLogs: getAuditLogs2 }) => getAuditLogs2(150))),
    create: adminProcedure.input(agentFields.and(passwordPair)).mutation(async ({ ctx, input }) => {
      const existing = await getUserByUsername(input.username);
      if (existing) throw new TRPCError3({ code: "CONFLICT", message: "Username already exists. Please choose another username." });
      const db = await getDb();
      if (!db) throw new TRPCError3({ code: "INTERNAL_SERVER_ERROR", message: "Database is not available" });
      const passwordHash = await bcrypt.hash(input.password, 12);
      const openId = `local:${input.username}`;
      const result = await db.insert(users).values({ openId, username: input.username, name: input.fullName, passwordHash, role: "user", status: input.status, email: input.email || null, contactNumber: input.contactNumber || null, dateStarted: input.dateStarted || null, notes: input.notes || null, createdBy: ctx.user.id, loginMethod: "local" }).returning({ id: users.id });
      const id = result[0]?.id;
      if (!id) throw new TRPCError3({ code: "INTERNAL_SERVER_ERROR", message: "Account creation did not return an id" });
      await insertAuditLog({ adminId: ctx.user.id, targetUserId: id, ipAddress: clientIp(ctx.req), action: `Super Admin created agent account: ${input.fullName}` });
      return { success: true, id, fullName: input.fullName, username: input.username };
    }),
    createAdmin: adminProcedure.input(agentFields.and(passwordPair)).mutation(async ({ ctx, input }) => {
      const existing = await getUserByUsername(input.username);
      if (existing) throw new TRPCError3({ code: "CONFLICT", message: "Username already exists. Please choose another username." });
      const db = await getDb();
      if (!db) throw new TRPCError3({ code: "INTERNAL_SERVER_ERROR", message: "Database is not available" });
      const passwordHash = await bcrypt.hash(input.password, 12);
      const openId = `local:${input.username}`;
      const result = await db.insert(users).values({ openId, username: input.username, name: input.fullName, passwordHash, role: "admin", status: input.status, email: input.email || null, contactNumber: input.contactNumber || null, dateStarted: input.dateStarted || null, notes: input.notes || null, createdBy: ctx.user.id, loginMethod: "local" }).returning({ id: users.id });
      const id = result[0]?.id;
      if (!id) throw new TRPCError3({ code: "INTERNAL_SERVER_ERROR", message: "Account creation did not return an id" });
      await insertAuditLog({ adminId: ctx.user.id, targetUserId: id, ipAddress: clientIp(ctx.req), action: `Super Admin created department-head account: ${input.fullName}` });
      return { success: true, id, fullName: input.fullName, username: input.username };
    }),
    update: adminProcedure.input(z2.object({ id: z2.number().int().positive(), ...agentFields.shape })).mutation(async ({ ctx, input }) => {
      const target = await getUserById(input.id);
      if (!target) throw new TRPCError3({ code: "NOT_FOUND", message: "Account not found" });
      const existingUsername = await getUserByUsername(input.username);
      if (existingUsername && existingUsername.id !== input.id) throw new TRPCError3({ code: "CONFLICT", message: "Username already exists. Please choose another username." });
      const db = await getDb();
      if (!db) throw new TRPCError3({ code: "INTERNAL_SERVER_ERROR", message: "Database is not available" });
      await db.update(users).set({ name: input.fullName, username: input.username, email: input.email || null, contactNumber: input.contactNumber || null, dateStarted: input.dateStarted || null, notes: input.notes || null, status: input.status }).where(eq2(users.id, input.id));
      await insertAuditLog({ adminId: ctx.user.id, targetUserId: input.id, ipAddress: clientIp(ctx.req), action: `Super Admin edited account: ${input.fullName}` });
      return { success: true };
    }),
    changePassword: adminProcedure.input(z2.object({ id: z2.number().int().positive() }).and(passwordPair)).mutation(async ({ ctx, input }) => {
      const target = await getUserById(input.id);
      if (!target) throw new TRPCError3({ code: "NOT_FOUND", message: "Account not found" });
      const db = await getDb();
      if (!db) throw new TRPCError3({ code: "INTERNAL_SERVER_ERROR", message: "Database is not available" });
      await db.update(users).set({ passwordHash: await bcrypt.hash(input.password, 12), sessionVersion: target.sessionVersion + 1 }).where(eq2(users.id, input.id));
      await insertAuditLog({ adminId: ctx.user.id, targetUserId: input.id, ipAddress: clientIp(ctx.req), action: `Super Admin changed password for account: ${target.name || target.username}` });
      return { success: true };
    }),
    toggleStatus: adminProcedure.input(z2.object({ id: z2.number().int().positive(), status: z2.enum(["active", "inactive"]) })).mutation(async ({ ctx, input }) => {
      const target = await getUserById(input.id);
      if (!target) throw new TRPCError3({ code: "NOT_FOUND", message: "Account not found" });
      const db = await getDb();
      if (!db) throw new TRPCError3({ code: "INTERNAL_SERVER_ERROR", message: "Database is not available" });
      await db.update(users).set({ status: input.status, sessionVersion: target.sessionVersion + 1 }).where(eq2(users.id, input.id));
      const verb = input.status === "active" ? "activated" : "deactivated";
      await insertAuditLog({ adminId: ctx.user.id, targetUserId: input.id, ipAddress: clientIp(ctx.req), action: `Super Admin ${verb} agent: ${target.name || target.username}` });
      return { success: true };
    })
  }),
  categories: router({
    list: publicProcedure.query(() => getCategories(false)),
    create: adminProcedure.input(z2.object({ name: z2.string().trim().min(2).max(120) })).mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError3({ code: "INTERNAL_SERVER_ERROR", message: "Database is not available" });
      const existing = await db.select().from(salesCategories).where(eq2(salesCategories.name, input.name)).limit(1);
      if (existing.length) throw new TRPCError3({ code: "CONFLICT", message: "That category already exists" });
      await db.insert(salesCategories).values({ name: input.name, isActive: 1 });
      return { success: true };
    }),
    update: adminProcedure.input(z2.object({ id: z2.number().int().positive(), name: z2.string().trim().min(2).max(120) })).mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError3({ code: "INTERNAL_SERVER_ERROR", message: "Database is not available" });
      await db.update(salesCategories).set({ name: input.name }).where(eq2(salesCategories.id, input.id));
      return { success: true };
    }),
    toggle: adminProcedure.input(z2.object({ id: z2.number().int().positive(), isActive: z2.boolean() })).mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError3({ code: "INTERNAL_SERVER_ERROR", message: "Database is not available" });
      await db.update(salesCategories).set({ isActive: input.isActive ? 1 : 0 }).where(eq2(salesCategories.id, input.id));
      return { success: true };
    })
  }),
  sales: router({
    create: protectedProcedure.input(saleInput).mutation(async ({ ctx, input }) => {
      const category = await getCategoryById(input.categoryId);
      if (!category || category.isActive !== 1) throw new TRPCError3({ code: "BAD_REQUEST", message: "Choose an active sales category" });
      const normalized = normalizeSalesAmounts(input, isExternalSalesCategory(category));
      const totalPosSales = Number(normalized.totalPosSales);
      const totalSales = totalPosSales + Number(normalized.externalSales);
      const paymentAmount = input.paymentStatus === "fully_paid" ? totalSales : Number(input.initialPaymentAmount);
      if (paymentAmount > totalSales) throw new TRPCError3({ code: "BAD_REQUEST", message: "Initial payment cannot be greater than Total POS Sales." });
      const created = await insertSale({ saleDate: input.saleDate, agentId: ctx.user.id, customerName: input.customerName, landingPageInitialOrder: normalized.landingPageInitialOrder, resellerDistributorPackage: normalized.resellerDistributorPackage, messaging: normalized.messaging, categoryId: input.categoryId, warmLeadsOutboundCalls: normalized.warmLeadsOutboundCalls, advancedPayment: input.advancedPayment, hotleadsUpsellCalls: normalized.hotleadsUpsellCalls, externalSales: normalized.externalSales, totalPosSales: normalized.totalPosSales, paymentStatus: input.paymentStatus, initialPaymentAmount: paymentAmount.toFixed(2), paymentDate: input.paymentStatus === "no_payment" ? null : input.paymentDate, paymentMethod: input.paymentStatus === "no_payment" ? null : input.paymentMethod, clientStatus: "no_status", commissionAmount: "0.00" });
      return { sale: created, totalPosSales: totalPosSales.toFixed(2), totalSales: totalSales.toFixed(2), remainingBalance: (totalSales - paymentAmount).toFixed(2) };
    }),
    mine: protectedProcedure.input(z2.object({ limit: z2.number().int().min(1).max(200).default(100) }).optional()).query(({ ctx, input }) => getSalesForUser(ctx.user.id, input?.limit ?? 100)),
    updateStatus: adminProcedure.input(z2.object({ id: z2.number().int().positive(), status: clientStatusInput })).mutation(async ({ input }) => {
      const rows = await getSalesBetween("2000-01-01", "2999-01-01");
      const row = rows.find((item) => item.sale.id === input.id);
      if (!row) throw new TRPCError3({ code: "NOT_FOUND", message: "Sale not found" });
      const commission = calculateAgentCommission(row.sale, input.status);
      await updateSalesStatus([input.id], input.status, commission.toFixed(2));
      return { success: true, commission: commission.toFixed(2) };
    }),
    batchUpdateStatus: adminProcedure.input(z2.object({ ids: z2.array(z2.number().int().positive()).min(1).max(200), status: clientStatusInput })).mutation(async ({ input }) => {
      const rows = await getSalesBetween("2000-01-01", "2999-01-01");
      const selected = rows.filter((item) => input.ids.includes(item.sale.id));
      if (selected.length !== input.ids.length) throw new TRPCError3({ code: "NOT_FOUND", message: "One or more sales were not found." });
      for (const row of selected) await updateSalesStatus([row.sale.id], input.status, calculateAgentCommission(row.sale, input.status).toFixed(2));
      return { success: true, updated: selected.length };
    }),
    delete: protectedProcedure.input(z2.object({ id: z2.number().int().positive(), reason: z2.string().trim().min(2).max(255) })).mutation(async ({ ctx, input }) => {
      const rows = await getSalesBetween("2000-01-01", "2999-01-01");
      const row = rows.find((item) => item.sale.id === input.id);
      if (!row) throw new TRPCError3({ code: "NOT_FOUND", message: "Sale not found" });
      if (ctx.user.role !== "admin" && row.sale.agentId !== ctx.user.id) throw new TRPCError3({ code: "FORBIDDEN", message: "You can only delete your own sales." });
      const deleted = await softDeleteSale(input.id, ctx.user.id, input.reason);
      if (!deleted) throw new TRPCError3({ code: "CONFLICT", message: "This sales record was already deleted or no longer exists." });
      if (ctx.user.role === "admin") await insertAuditLog({ adminId: ctx.user.id, action: `Sales Record Deleted: ${row.sale.customerName} | Agent: ${row.agentName || "Unassigned"} | Date: ${row.sale.saleDate} | Total: ${row.sale.totalPosSales} | Reason: ${input.reason}` });
      return { success: true };
    }),
    update: protectedProcedure.input(adminSaleUpdateInput).mutation(async ({ ctx, input }) => {
      const rows = await getSalesBetween("2000-01-01", "2999-01-01");
      const row = rows.find((item) => item.sale.id === input.id);
      if (!row) throw new TRPCError3({ code: "NOT_FOUND", message: "Sale not found" });
      if (ctx.user.role !== "admin" && (row.sale.agentId !== ctx.user.id || input.agentId !== ctx.user.id)) throw new TRPCError3({ code: "FORBIDDEN", message: "You can only edit your own sales." });
      const category = await getCategoryById(input.categoryId);
      if (!category || category.isActive !== 1) throw new TRPCError3({ code: "BAD_REQUEST", message: "Choose an active sales category" });
      const normalized = normalizeSalesAmounts(input, isExternalSalesCategory(category));
      const totalPosSales = Number(normalized.totalPosSales);
      const db = await getDb();
      if (!db) throw new TRPCError3({ code: "INTERNAL_SERVER_ERROR", message: "Database is not available" });
      await db.update(sales).set({ saleDate: input.saleDate, agentId: input.agentId, customerName: input.customerName, categoryId: input.categoryId, landingPageInitialOrder: normalized.landingPageInitialOrder, resellerDistributorPackage: normalized.resellerDistributorPackage, messaging: normalized.messaging, warmLeadsOutboundCalls: normalized.warmLeadsOutboundCalls, advancedPayment: input.advancedPayment, hotleadsUpsellCalls: normalized.hotleadsUpsellCalls, externalSales: normalized.externalSales, totalPosSales: normalized.totalPosSales }).where(eq2(sales.id, input.id));
      if (ctx.user.role === "admin") await insertAuditLog({ adminId: ctx.user.id, action: `Sales Record Edited: ${row.sale.customerName} -> ${input.customerName} | Total: ${row.sale.totalPosSales} -> ${totalPosSales.toFixed(2)} | Agent: ${row.agentName || "Unassigned"} -> ${input.agentId} | Date: ${row.sale.saleDate} -> ${input.saleDate}` });
      return { success: true, totalPosSales: totalPosSales.toFixed(2) };
    }),
    dashboard: protectedProcedure.input(dashboardDateInput).query(async ({ ctx, input }) => {
      const selectedDate = input?.date ?? dateKey();
      const tomorrow = nextDayKey(selectedDate);
      const month = monthStartFromKey(selectedDate);
      const [todayRows, monthRows] = await Promise.all([getSalesBetween(selectedDate, tomorrow, ctx.user.id), getSalesBetween(month, nextMonthFromKey(selectedDate), ctx.user.id)]);
      return { selectedDate, today: summarize(todayRows), month: summarize(monthRows) };
    })
  }),
  admin: router({
    overview: adminProcedure.input(adminReportInput).query(async ({ input }) => {
      const selectedDate = input?.date ?? dateKey();
      const month = monthStartFromKey(selectedDate);
      const tomorrow = nextDayKey(selectedDate);
      const [monthRows, todayRows, recentRows, agentUsers, categories] = await Promise.all([getSalesBetween(month, nextMonthFromKey(selectedDate)), getSalesBetween(selectedDate, tomorrow), getSalesBetween("2000-01-01", "2999-01-01"), getAgentUsers(), getCategories(true)]);
      const byAgent = /* @__PURE__ */ new Map();
      for (const row of monthRows) {
        const id = row.sale.agentId;
        const current = byAgent.get(id) ?? { name: row.agentName || "Unassigned", email: row.agentEmail ?? null, total: 0, orders: 0 };
        current.total += money(row.sale.totalPosSales);
        current.orders += 1;
        byAgent.set(id, current);
      }
      const requestedNames = ["ARIAN", "KIM", "MHAYA", "MICHELLE"];
      const agentPerformance = requestedNames.map((requestedName) => {
        const account = agentUsers.find((candidate) => `${candidate.name ?? ""} ${candidate.username ?? ""}`.toUpperCase().includes(requestedName));
        const monthlyRows = account ? monthRows.filter((row) => row.sale.agentId === account.id) : [];
        const dailyRows = account ? todayRows.filter((row) => row.sale.agentId === account.id) : [];
        return { name: account?.name || requestedName, username: account?.username || requestedName.toLowerCase(), month: summarize(monthlyRows), today: summarize(dailyRows), status: account?.status ?? "inactive" };
      });
      const reportStart = input?.dateFrom ?? input?.date ?? "2000-01-01";
      const reportEnd = input?.dateTo ? nextDayKey(input.dateTo) : input?.date ? nextDayKey(input.date) : "2999-01-01";
      const reportBaseRows = await getSalesBetween(reportStart, reportEnd, input?.agentId);
      const selectedCategory = input?.categoryId ? categories.find((category) => category.id === input.categoryId) : void 0;
      const categorizedRows = selectedCategory ? reportBaseRows.filter((row) => matchesReportCategory(row, selectedCategory.id, selectedCategory.name)).map((row) => ({ ...row, categoryName: row.categoryName ?? selectedCategory.name })) : reportBaseRows.map((row) => ({ ...row, categoryName: row.categoryName ?? "Uncategorized (legacy record)" }));
      const searchTerm = input?.customerName?.toLowerCase();
      const reportRows = searchTerm ? categorizedRows.filter((row) => row.sale.customerName.toLowerCase().includes(searchTerm)) : categorizedRows;
      return { selectedDate, today: summarize(todayRows), month: summarize(monthRows), agents: Array.from(byAgent.values()).sort((a, b) => b.total - a.total), agentPerformance, recentSales: recentRows.slice(0, 30), report: { summary: summarize(reportRows), rows: reportRows } };
    }),
    drilldown: adminProcedure.input(z2.object({ metric: z2.enum(["totalPosSales", "orders", "landingPage", "reseller", "messaging", "warmLeads", "hotleads", "initialPayments", "outstandingBalance", "commission"]), period: z2.enum(["today", "month"]), date: z2.string().regex(/^\d{4}-\d{2}-\d{2}$/) })).query(async ({ input }) => {
      const start = input.period === "today" ? input.date : monthStartFromKey(input.date);
      const end = input.period === "today" ? nextDayKey(input.date) : nextMonthFromKey(input.date);
      const allRows = await getSalesBetween(start, end);
      const rows = allRows.filter(({ sale }) => input.metric === "orders" || input.metric === "totalPosSales" ? true : input.metric === "landingPage" ? money(sale.landingPageInitialOrder) > 0 : input.metric === "reseller" ? money(sale.resellerDistributorPackage) > 0 : input.metric === "messaging" ? money(sale.messaging) > 0 : input.metric === "warmLeads" ? money(sale.warmLeadsOutboundCalls) > 0 : input.metric === "hotleads" ? money(sale.hotleadsUpsellCalls) > 0 : input.metric === "initialPayments" ? calculatePaidAmount(sale) > 0 : input.metric === "outstandingBalance" ? calculateGrossSales(sale) - calculatePaidAmount(sale) > 0 : sale.clientStatus === "delivered" && money(sale.commissionAmount) > 0);
      const total = rows.reduce((sum, { sale }) => sum + (input.metric === "commission" ? money(sale.commissionAmount) : input.metric === "initialPayments" ? calculatePaidAmount(sale) : input.metric === "outstandingBalance" ? Math.max(0, calculateGrossSales(sale) - calculatePaidAmount(sale)) : input.metric === "landingPage" ? money(sale.landingPageInitialOrder) : input.metric === "reseller" ? money(sale.resellerDistributorPackage) : input.metric === "messaging" ? money(sale.messaging) : input.metric === "warmLeads" ? money(sale.warmLeadsOutboundCalls) : input.metric === "hotleads" ? money(sale.hotleadsUpsellCalls) : money(sale.totalPosSales)), 0);
      return { metric: input.metric, period: input.period, total, orders: rows.length, agents: new Set(rows.map((row) => row.sale.agentId)).size, rows: rows.map((row) => ({ ...row, categoryName: row.categoryName || "Uncategorized (legacy record)" })) };
    })
  })
});

// server/_core/context.ts
async function createContext(opts) {
  let user = null;
  try {
    user = await sdk.authenticateRequest(opts.req);
  } catch (error) {
    user = null;
  }
  return {
    req: opts.req,
    res: opts.res,
    user
  };
}

// server/_core/vercelApp.ts
var app = express();
app.use(express.json({ limit: "50mb" }));
app.use(express.urlencoded({ limit: "50mb", extended: true }));
registerStorageProxy(app);
registerOAuthRoutes(app);
app.use(
  "/api/trpc",
  createExpressMiddleware({
    router: appRouter,
    createContext
  })
);
var vercelApp_default = app;
export {
  vercelApp_default as default
};
