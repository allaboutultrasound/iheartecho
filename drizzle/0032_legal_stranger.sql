CREATE TABLE `echoLibraryCaseAttempts` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`caseId` int NOT NULL,
	`answers` text,
	`score` int NOT NULL DEFAULT 0,
	`totalQuestions` int NOT NULL DEFAULT 0,
	`completedAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `echoLibraryCaseAttempts_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `echoLibraryCaseMedia` (
	`id` int AUTO_INCREMENT NOT NULL,
	`caseId` int NOT NULL,
	`type` enum('image','video') NOT NULL,
	`url` text NOT NULL,
	`fileKey` varchar(500) NOT NULL,
	`caption` varchar(300),
	`sortOrder` int NOT NULL DEFAULT 0,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `echoLibraryCaseMedia_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `echoLibraryCaseQuestions` (
	`id` int AUTO_INCREMENT NOT NULL,
	`caseId` int NOT NULL,
	`question` text NOT NULL,
	`options` text NOT NULL,
	`correctAnswer` int NOT NULL,
	`explanation` text,
	`sortOrder` int NOT NULL DEFAULT 0,
	CONSTRAINT `echoLibraryCaseQuestions_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `echoLibraryCases` (
	`id` int AUTO_INCREMENT NOT NULL,
	`title` varchar(300) NOT NULL,
	`summary` text NOT NULL,
	`clinicalHistory` text,
	`diagnosis` varchar(300),
	`teachingPoints` text,
	`modality` enum('TTE','TEE','Stress','Pediatric','Fetal','HOCM','POCUS','Other') NOT NULL,
	`difficulty` enum('beginner','intermediate','advanced') NOT NULL DEFAULT 'intermediate',
	`tags` text,
	`status` enum('pending','approved','rejected') NOT NULL DEFAULT 'pending',
	`isAdminSubmission` boolean NOT NULL DEFAULT false,
	`submittedByUserId` int NOT NULL,
	`submittedAt` timestamp NOT NULL DEFAULT (now()),
	`reviewedByUserId` int,
	`reviewedAt` timestamp,
	`rejectionReason` text,
	`hipaaAcknowledged` boolean NOT NULL DEFAULT false,
	`viewCount` int NOT NULL DEFAULT 0,
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `echoLibraryCases_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `quickfireAttempts` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`questionId` int NOT NULL,
	`setDate` varchar(10) NOT NULL,
	`selectedAnswer` int,
	`selfMarkedCorrect` boolean,
	`isCorrect` boolean,
	`timeMs` int,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `quickfireAttempts_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `quickfireDailySets` (
	`id` int AUTO_INCREMENT NOT NULL,
	`setDate` varchar(10) NOT NULL,
	`questionIds` text NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `quickfireDailySets_id` PRIMARY KEY(`id`),
	CONSTRAINT `quickfireDailySets_setDate_unique` UNIQUE(`setDate`)
);
--> statement-breakpoint
CREATE TABLE `quickfireQuestions` (
	`id` int AUTO_INCREMENT NOT NULL,
	`type` enum('scenario','image','quickReview') NOT NULL,
	`question` text NOT NULL,
	`options` text,
	`correctAnswer` int,
	`explanation` text,
	`reviewAnswer` text,
	`imageUrl` text,
	`difficulty` enum('beginner','intermediate','advanced') NOT NULL DEFAULT 'intermediate',
	`tags` text,
	`isActive` boolean NOT NULL DEFAULT true,
	`createdByUserId` int,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `quickfireQuestions_id` PRIMARY KEY(`id`)
);
