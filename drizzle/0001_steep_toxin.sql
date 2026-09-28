CREATE TABLE `sales` (
	`id` int AUTO_INCREMENT NOT NULL,
	`saleDate` date NOT NULL,
	`agentId` int NOT NULL,
	`customerName` varchar(180) NOT NULL,
	`landingPageInitialOrder` decimal(12,2) NOT NULL DEFAULT '0.00',
	`resellerDistributorPackage` decimal(12,2) NOT NULL DEFAULT '0.00',
	`messaging` decimal(12,2) NOT NULL DEFAULT '0.00',
	`categoryId` int NOT NULL,
	`warmLeadsOutboundCalls` decimal(12,2) NOT NULL DEFAULT '0.00',
	`advancedPayment` decimal(12,2) NOT NULL DEFAULT '0.00',
	`hotleadsUpsellCalls` decimal(12,2) NOT NULL DEFAULT '0.00',
	`totalPosSales` decimal(12,2) NOT NULL DEFAULT '0.00',
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `sales_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `sales_categories` (
	`id` int AUTO_INCREMENT NOT NULL,
	`name` varchar(120) NOT NULL,
	`isActive` int NOT NULL DEFAULT 1,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `sales_categories_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE INDEX `sales_agent_date_idx` ON `sales` (`agentId`,`saleDate`);--> statement-breakpoint
CREATE INDEX `sales_date_idx` ON `sales` (`saleDate`);