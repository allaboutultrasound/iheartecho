CREATE TABLE `cmeEntries` (
	`id` int AUTO_INCREMENT NOT NULL,
	`labMemberId` int NOT NULL,
	`labId` int NOT NULL,
	`title` varchar(200) NOT NULL,
	`provider` varchar(200),
	`category` enum('echo_specific','cardiovascular','general_medical','technical','safety','leadership','other') NOT NULL DEFAULT 'echo_specific',
	`activityDate` varchar(20) NOT NULL,
	`creditHours` int NOT NULL DEFAULT 0,
	`certificationNumber` varchar(100),
	`notes` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `cmeEntries_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
ALTER TABLE `labMembers` MODIFY COLUMN `role` enum('medical_director','technical_director','medical_staff','technical_staff','admin') NOT NULL DEFAULT 'technical_staff';