CREATE TABLE `audit_logs` (
	`id` int AUTO_INCREMENT NOT NULL,
	`adminId` int NOT NULL,
	`action` varchar(255) NOT NULL,
	`targetUserId` int,
	`ipAddress` varchar(64),
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `audit_logs_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
ALTER TABLE `users` MODIFY COLUMN `openId` varchar(128) NOT NULL;--> statement-breakpoint
ALTER TABLE `users` ADD `username` varchar(80);--> statement-breakpoint
ALTER TABLE `users` ADD `passwordHash` varchar(255);--> statement-breakpoint
ALTER TABLE `users` ADD `status` enum('active','inactive') DEFAULT 'active' NOT NULL;--> statement-breakpoint
ALTER TABLE `users` ADD `contactNumber` varchar(40);--> statement-breakpoint
ALTER TABLE `users` ADD `dateStarted` date;--> statement-breakpoint
ALTER TABLE `users` ADD `notes` text;--> statement-breakpoint
ALTER TABLE `users` ADD `createdBy` int;--> statement-breakpoint
ALTER TABLE `users` ADD `sessionVersion` int DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE `users` ADD CONSTRAINT `users_username_unique` UNIQUE(`username`);--> statement-breakpoint
CREATE INDEX `audit_target_idx` ON `audit_logs` (`targetUserId`,`createdAt`);--> statement-breakpoint
CREATE INDEX `audit_admin_idx` ON `audit_logs` (`adminId`,`createdAt`);