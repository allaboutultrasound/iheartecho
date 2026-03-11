ALTER TABLE `quickfireQuestions` MODIFY COLUMN `type` enum('scenario','image','quickReview','connect','identifier') NOT NULL;--> statement-breakpoint
ALTER TABLE `quickfireQuestions` ADD `pairs` text;--> statement-breakpoint
ALTER TABLE `quickfireQuestions` ADD `markers` text;