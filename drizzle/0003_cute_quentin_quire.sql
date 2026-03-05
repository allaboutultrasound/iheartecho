CREATE TABLE `appropriateUseCases` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`studyDate` varchar(20),
	`modality` enum('TTE','TEE','Stress','Pediatric','Fetal','HOCM','POCUS') NOT NULL,
	`indication` text NOT NULL,
	`appropriatenessRating` enum('appropriate','may_be_appropriate','rarely_appropriate','unknown') NOT NULL DEFAULT 'unknown',
	`clinicalScenario` text,
	`outcome` text,
	`notes` text,
	`flagged` boolean NOT NULL DEFAULT false,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `appropriateUseCases_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `peerReviews` (
	`id` int AUTO_INCREMENT NOT NULL,
	`reviewerId` int NOT NULL,
	`patientId` varchar(64),
	`studyDate` varchar(20),
	`modality` enum('TTE','TEE','Stress','Pediatric','Fetal','HOCM','POCUS') NOT NULL,
	`sonographerInitials` varchar(20),
	`imageQuality` enum('excellent','good','adequate','poor'),
	`imageQualityNotes` text,
	`reportAccuracy` enum('accurate','minor_discrepancy','major_discrepancy'),
	`reportNotes` text,
	`technicalAdherence` enum('full','partial','non_adherent'),
	`technicalNotes` text,
	`overallScore` int,
	`feedback` text,
	`status` enum('draft','submitted','complete') NOT NULL DEFAULT 'draft',
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `peerReviews_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `policies` (
	`id` int AUTO_INCREMENT NOT NULL,
	`authorId` int NOT NULL,
	`title` varchar(300) NOT NULL,
	`category` enum('infection_control','equipment','patient_safety','protocol','staff_competency','quality_assurance','appropriate_use','report_turnaround','emergency','other') NOT NULL,
	`modality` enum('TTE','TEE','Stress','Pediatric','Fetal','HOCM','POCUS','All') NOT NULL DEFAULT 'All',
	`content` text NOT NULL,
	`version` varchar(20) NOT NULL DEFAULT '1.0',
	`effectiveDate` varchar(20),
	`reviewDate` varchar(20),
	`status` enum('draft','active','archived') NOT NULL DEFAULT 'draft',
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `policies_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `qaLogs` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`category` enum('equipment','protocol','image_quality','report_turnaround','staff_competency','infection_control','patient_safety','other') NOT NULL,
	`title` varchar(200) NOT NULL,
	`description` text,
	`finding` enum('pass','fail','needs_improvement','na') NOT NULL DEFAULT 'pass',
	`actionRequired` text,
	`actionTaken` text,
	`dueDate` varchar(20),
	`resolvedAt` timestamp,
	`attachmentUrl` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `qaLogs_id` PRIMARY KEY(`id`)
);
