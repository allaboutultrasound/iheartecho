ALTER TABLE `users` ADD `pendingEmail` varchar(320);--> statement-breakpoint
ALTER TABLE `users` ADD `pendingEmailToken` varchar(128);--> statement-breakpoint
ALTER TABLE `users` ADD `pendingEmailExpiry` timestamp;