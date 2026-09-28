CREATE TYPE "public"."user_role" AS ENUM('user', 'admin');--> statement-breakpoint
CREATE TYPE "public"."user_status" AS ENUM('active', 'inactive');--> statement-breakpoint
CREATE TABLE "audit_logs" (
	"id" serial PRIMARY KEY NOT NULL,
	"adminId" integer NOT NULL,
	"action" varchar(255) NOT NULL,
	"targetUserId" integer,
	"ipAddress" varchar(64),
	"createdAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "sales" (
	"id" serial PRIMARY KEY NOT NULL,
	"saleDate" date NOT NULL,
	"agentId" integer NOT NULL,
	"customerName" varchar(180) NOT NULL,
	"landingPageInitialOrder" numeric(12, 2) DEFAULT '0.00' NOT NULL,
	"resellerDistributorPackage" numeric(12, 2) DEFAULT '0.00' NOT NULL,
	"messaging" numeric(12, 2) DEFAULT '0.00' NOT NULL,
	"categoryId" integer,
	"warmLeadsOutboundCalls" numeric(12, 2) DEFAULT '0.00' NOT NULL,
	"advancedPayment" numeric(12, 2) DEFAULT '0.00' NOT NULL,
	"hotleadsUpsellCalls" numeric(12, 2) DEFAULT '0.00' NOT NULL,
	"totalPosSales" numeric(12, 2) DEFAULT '0.00' NOT NULL,
	"createdAt" timestamp DEFAULT now() NOT NULL,
	"updatedAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "sales_categories" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" varchar(120) NOT NULL,
	"isActive" integer DEFAULT 1 NOT NULL,
	"createdAt" timestamp DEFAULT now() NOT NULL,
	"updatedAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "users" (
	"id" serial PRIMARY KEY NOT NULL,
	"openId" varchar(128) NOT NULL,
	"name" text,
	"email" varchar(320),
	"loginMethod" varchar(64),
	"username" varchar(80),
	"passwordHash" varchar(255),
	"role" "user_role" DEFAULT 'user' NOT NULL,
	"status" "user_status" DEFAULT 'active' NOT NULL,
	"contactNumber" varchar(40),
	"dateStarted" date,
	"notes" text,
	"createdBy" integer,
	"createdAt" timestamp DEFAULT now() NOT NULL,
	"updatedAt" timestamp DEFAULT now() NOT NULL,
	"lastSignedIn" timestamp DEFAULT now() NOT NULL,
	"sessionVersion" integer DEFAULT 0 NOT NULL,
	CONSTRAINT "users_openId_unique" UNIQUE("openId"),
	CONSTRAINT "users_username_unique" UNIQUE("username")
);
--> statement-breakpoint
CREATE INDEX "audit_target_idx" ON "audit_logs" USING btree ("targetUserId","createdAt");--> statement-breakpoint
CREATE INDEX "audit_admin_idx" ON "audit_logs" USING btree ("adminId","createdAt");--> statement-breakpoint
CREATE INDEX "sales_agent_date_idx" ON "sales" USING btree ("agentId","saleDate");--> statement-breakpoint
CREATE INDEX "sales_date_idx" ON "sales" USING btree ("saleDate");