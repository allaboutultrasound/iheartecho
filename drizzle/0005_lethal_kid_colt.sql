CREATE TABLE `echoCases` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`title` varchar(200) NOT NULL,
	`patientAge` int,
	`patientSex` enum('M','F','Other'),
	`clinicalHistory` text,
	`indication` varchar(200),
	`diagnosis` varchar(200),
	`notes` text,
	`isPublic` boolean NOT NULL DEFAULT false,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `echoCases_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `strainSnapshots` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`caseId` int,
	`caseTitle` varchar(200),
	`segmentValues` text NOT NULL,
	`wallMotionScores` text,
	`lvGls` text,
	`rvStrain` text,
	`laStrain` text,
	`wmsi` text,
	`vendor` varchar(100),
	`frameRate` int,
	`notes` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `strainSnapshots_id` PRIMARY KEY(`id`)
);
