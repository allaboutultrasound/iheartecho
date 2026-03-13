ALTER TABLE `quickfireQuestions` ADD `category` enum('ACS','Adult Echo','Pediatric Echo','Fetal Echo','General') DEFAULT 'Adult Echo';--> statement-breakpoint
ALTER TABLE `scanCoachOverrides` ADD `echoLabel` varchar(128);--> statement-breakpoint
ALTER TABLE `scanCoachOverrides` ADD `probeLabel` varchar(128);--> statement-breakpoint
ALTER TABLE `scanCoachOverrides` ADD `anatomyLabel` varchar(128);--> statement-breakpoint
ALTER TABLE `scanCoachOverrides` ADD `transducerLabel` varchar(128);