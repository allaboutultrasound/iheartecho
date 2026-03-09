CREATE TABLE `caseViewEvents` (
	`id` int AUTO_INCREMENT NOT NULL,
	`caseId` int NOT NULL,
	`viewedAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `caseViewEvents_id` PRIMARY KEY(`id`)
);
