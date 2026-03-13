ALTER TABLE `emailCampaigns` MODIFY COLUMN `status` enum('draft','scheduled','sending','sent','failed') NOT NULL DEFAULT 'draft';--> statement-breakpoint
ALTER TABLE `emailCampaigns` ADD `scheduledAt` timestamp;--> statement-breakpoint
ALTER TABLE `users` ADD `unsubscribedAt` timestamp;--> statement-breakpoint
ALTER TABLE `users` ADD `unsubscribeToken` varchar(64);