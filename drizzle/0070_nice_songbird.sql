ALTER TABLE `diySubscriptions` MODIFY COLUMN `plan` enum('starter','professional','advanced','partner','consulting_client') NOT NULL;--> statement-breakpoint
ALTER TABLE `diyOrganizations` ADD `facilityType` varchar(100);--> statement-breakpoint
ALTER TABLE `diyOrganizations` ADD `city` varchar(100);--> statement-breakpoint
ALTER TABLE `diyOrganizations` ADD `state` varchar(100);--> statement-breakpoint
ALTER TABLE `diyOrganizations` ADD `zip` varchar(20);--> statement-breakpoint
ALTER TABLE `diyOrganizations` ADD `country` varchar(100);--> statement-breakpoint
ALTER TABLE `diyOrganizations` ADD `contactName` varchar(200);--> statement-breakpoint
ALTER TABLE `diyOrganizations` ADD `contactEmail` varchar(320);--> statement-breakpoint
ALTER TABLE `diyOrganizations` ADD `notes` text;--> statement-breakpoint
ALTER TABLE `diyOrganizations` ADD `isShellOrg` boolean DEFAULT false;