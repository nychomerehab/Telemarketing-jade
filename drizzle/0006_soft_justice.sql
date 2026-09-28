ALTER TABLE `sales` ADD `deletedAt` timestamp;--> statement-breakpoint
ALTER TABLE `sales` ADD `deletedBy` int;--> statement-breakpoint
ALTER TABLE `sales` ADD `deleteReason` varchar(255);