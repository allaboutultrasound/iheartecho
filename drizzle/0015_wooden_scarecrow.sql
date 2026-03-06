CREATE TABLE `accreditationReadiness` (
	`id` int AUTO_INCREMENT NOT NULL,
	`labId` int NOT NULL,
	`userId` int NOT NULL,
	`checklistProgress` text NOT NULL,
	`itemNotes` text NOT NULL,
	`completionPct` int NOT NULL DEFAULT 0,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `accreditationReadiness_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `caseMixSubmissions` (
	`id` int AUTO_INCREMENT NOT NULL,
	`labId` int NOT NULL,
	`submittedByUserId` int NOT NULL,
	`modality` varchar(20) NOT NULL,
	`caseType` varchar(80) NOT NULL,
	`studyIdentifier` varchar(100) NOT NULL,
	`studyDate` varchar(20),
	`sonographerLabMemberId` int,
	`sonographerName` varchar(100),
	`physicianLabMemberId` int,
	`physicianName` varchar(100),
	`isTechDirectorCase` boolean NOT NULL DEFAULT false,
	`isMedDirectorCase` boolean NOT NULL DEFAULT false,
	`notes` text,
	`status` varchar(20) NOT NULL DEFAULT 'draft',
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `caseMixSubmissions_id` PRIMARY KEY(`id`)
);
