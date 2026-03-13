ALTER TABLE `scanCoachOverrides` ADD `probe` text;--> statement-breakpoint
ALTER TABLE `scanCoachOverrides` ADD `anatomy` text;--> statement-breakpoint
ALTER TABLE `scanCoachOverrides` ADD `additionalMedia` text;--> statement-breakpoint
ALTER TABLE `scanCoachOverrides` ADD `isCustomView` boolean DEFAULT false;--> statement-breakpoint
ALTER TABLE `scanCoachOverrides` ADD `sortOrder` int DEFAULT 0;