CREATE TABLE `accreditationReadinessNavigator` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`checklistProgress` text NOT NULL,
	`itemNotes` text NOT NULL,
	`completionPct` int NOT NULL DEFAULT 0,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `accreditationReadinessNavigator_id` PRIMARY KEY(`id`)
);
