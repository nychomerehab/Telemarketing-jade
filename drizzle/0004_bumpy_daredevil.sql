ALTER TABLE `sales` ADD `paymentStatus` enum('no_payment','initial_payment','fully_paid') DEFAULT 'no_payment' NOT NULL;--> statement-breakpoint
ALTER TABLE `sales` ADD `initialPaymentAmount` decimal(12,2) DEFAULT '0.00' NOT NULL;--> statement-breakpoint
ALTER TABLE `sales` ADD `paymentDate` date;--> statement-breakpoint
ALTER TABLE `sales` ADD `paymentMethod` enum('cash','gcash','bank_transfer','card','other');