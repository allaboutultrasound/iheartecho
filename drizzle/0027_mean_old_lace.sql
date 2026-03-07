ALTER TABLE `users` ADD `isPending` boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE `users` ADD `pendingCreatedAt` timestamp;