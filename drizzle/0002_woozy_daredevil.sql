ALTER TABLE `users` ADD `coverUrl` text;--> statement-breakpoint
ALTER TABLE `users` ADD `specialty` varchar(100);--> statement-breakpoint
ALTER TABLE `users` ADD `yearsExperience` int;--> statement-breakpoint
ALTER TABLE `users` ADD `location` varchar(150);--> statement-breakpoint
ALTER TABLE `users` ADD `website` varchar(255);--> statement-breakpoint
ALTER TABLE `users` ADD `isPublicProfile` boolean DEFAULT true NOT NULL;--> statement-breakpoint
ALTER TABLE `users` ADD `followersCount` int DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE `users` ADD `followingCount` int DEFAULT 0 NOT NULL;