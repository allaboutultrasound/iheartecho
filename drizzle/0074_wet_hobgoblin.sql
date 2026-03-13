CREATE TABLE `emailCampaigns` (
	`id` int AUTO_INCREMENT NOT NULL,
	`sentByUserId` int NOT NULL,
	`subject` varchar(500) NOT NULL,
	`htmlBody` longtext NOT NULL,
	`previewText` varchar(300),
	`audienceFilter` text NOT NULL,
	`recipientCount` int NOT NULL DEFAULT 0,
	`status` enum('draft','sending','sent','failed') NOT NULL DEFAULT 'draft',
	`sentAt` timestamp,
	`errorMessage` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `emailCampaigns_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `emailTemplates` (
	`id` int AUTO_INCREMENT NOT NULL,
	`createdByUserId` int NOT NULL,
	`name` varchar(200) NOT NULL,
	`subject` varchar(500) NOT NULL,
	`htmlBody` longtext NOT NULL,
	`previewText` varchar(300),
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `emailTemplates_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
ALTER TABLE `users` ADD `interestPrefs` text;