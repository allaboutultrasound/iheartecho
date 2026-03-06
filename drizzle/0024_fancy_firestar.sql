CREATE TABLE `cmeCourseMeta` (
	`id` int AUTO_INCREMENT NOT NULL,
	`thinkificProductId` int NOT NULL,
	`creditHours` varchar(10),
	`creditType` enum('SDMS','AMA_PRA_1','ANCC','OTHER'),
	`specialty` varchar(100),
	`accreditationBody` varchar(100),
	`isVisible` boolean NOT NULL DEFAULT true,
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	`updatedByUserId` int,
	CONSTRAINT `cmeCourseMeta_id` PRIMARY KEY(`id`),
	CONSTRAINT `cmeCourseMeta_thinkificProductId_unique` UNIQUE(`thinkificProductId`)
);
--> statement-breakpoint
CREATE TABLE `cmeCoursesCache` (
	`id` int AUTO_INCREMENT NOT NULL,
	`thinkificProductId` int NOT NULL,
	`thinkificCourseId` int,
	`name` varchar(300) NOT NULL,
	`slug` varchar(200) NOT NULL,
	`description` text,
	`price` varchar(20),
	`cardImageUrl` text,
	`instructorNames` text,
	`hasCertificate` boolean NOT NULL DEFAULT false,
	`thinkificStatus` varchar(20),
	`syncedAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `cmeCoursesCache_id` PRIMARY KEY(`id`),
	CONSTRAINT `cmeCoursesCache_thinkificProductId_unique` UNIQUE(`thinkificProductId`)
);
--> statement-breakpoint
CREATE TABLE `cmeEnrollmentCache` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`thinkificUserId` int,
	`thinkificProductId` int NOT NULL,
	`thinkificCourseId` int,
	`courseName` varchar(300),
	`percentCompleted` varchar(10),
	`completed` boolean NOT NULL DEFAULT false,
	`completedAt` timestamp,
	`startedAt` timestamp,
	`expiryDate` timestamp,
	`expired` boolean NOT NULL DEFAULT false,
	`syncedAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `cmeEnrollmentCache_id` PRIMARY KEY(`id`)
);
