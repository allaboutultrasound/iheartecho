ALTER TABLE `users` ADD `magicLinkToken` varchar(128);--> statement-breakpoint
ALTER TABLE `users` ADD `magicLinkExpiry` timestamp;