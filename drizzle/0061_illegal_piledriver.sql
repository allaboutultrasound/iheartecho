CREATE TABLE `accreditationFormBranchRules` (
	`id` int AUTO_INCREMENT NOT NULL,
	`templateId` int NOT NULL,
	`targetItemId` int NOT NULL,
	`conditionItemId` int NOT NULL,
	`conditionValue` varchar(500) NOT NULL,
	`action` enum('show','hide') NOT NULL DEFAULT 'show',
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `accreditationFormBranchRules_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `accreditationFormItems` (
	`id` int AUTO_INCREMENT NOT NULL,
	`sectionId` int NOT NULL,
	`templateId` int NOT NULL,
	`label` text NOT NULL,
	`helpText` text,
	`itemType` enum('text','textarea','radio','checkbox','select','scale','heading','info') NOT NULL,
	`isRequired` boolean NOT NULL DEFAULT false,
	`sortOrder` int NOT NULL DEFAULT 0,
	`scaleMin` int,
	`scaleMax` int,
	`scaleMinLabel` varchar(100),
	`scaleMaxLabel` varchar(100),
	`scoreWeight` int NOT NULL DEFAULT 1,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `accreditationFormItems_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `accreditationFormOptions` (
	`id` int AUTO_INCREMENT NOT NULL,
	`itemId` int NOT NULL,
	`label` varchar(500) NOT NULL,
	`value` varchar(200) NOT NULL,
	`sortOrder` int NOT NULL DEFAULT 0,
	`qualityScore` int NOT NULL DEFAULT 0,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `accreditationFormOptions_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `accreditationFormSections` (
	`id` int AUTO_INCREMENT NOT NULL,
	`templateId` int NOT NULL,
	`title` varchar(200) NOT NULL,
	`description` text,
	`sortOrder` int NOT NULL DEFAULT 0,
	`isCollapsible` boolean NOT NULL DEFAULT false,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `accreditationFormSections_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `accreditationFormTemplates` (
	`id` int AUTO_INCREMENT NOT NULL,
	`name` varchar(200) NOT NULL,
	`description` text,
	`formType` varchar(100) NOT NULL,
	`version` int NOT NULL DEFAULT 1,
	`isActive` boolean NOT NULL DEFAULT true,
	`createdByUserId` int,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `accreditationFormTemplates_id` PRIMARY KEY(`id`)
);
