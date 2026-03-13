ALTER TABLE `quickfireChallenges` MODIFY COLUMN `category` enum('ACS','Adult Echo','Pediatric Echo','Fetal Echo','General') NOT NULL DEFAULT 'Adult Echo';--> statement-breakpoint
ALTER TABLE `quickfireChallenges` MODIFY COLUMN `status` enum('draft','queued','scheduled','live','archived') NOT NULL DEFAULT 'draft';--> statement-breakpoint
ALTER TABLE `quickfireChallenges` ADD `queuePosition` int;