CREATE TABLE `accreditationFormSubmissions` (
	`id` int AUTO_INCREMENT NOT NULL,
	`templateId` int NOT NULL,
	`formType` varchar(100) NOT NULL,
	`submittedByUserId` int NOT NULL,
	`orgId` int,
	`reviewTargetType` varchar(100),
	`reviewTargetId` int,
	`responses` longtext NOT NULL,
	`qualityScore` int NOT NULL DEFAULT 0,
	`maxPossibleScore` int NOT NULL DEFAULT 0,
	`status` enum('draft','submitted','reviewed') NOT NULL DEFAULT 'submitted',
	`submittedAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `accreditationFormSubmissions_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `accreditationFormTemplateAssignments` (
	`id` int AUTO_INCREMENT NOT NULL,
	`formType` varchar(100) NOT NULL,
	`templateId` int NOT NULL,
	`orgId` int,
	`isActive` boolean NOT NULL DEFAULT true,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `accreditationFormTemplateAssignments_id` PRIMARY KEY(`id`)
);
