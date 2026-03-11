CREATE TABLE `accreditationFormOrgVisibilityRules` (
	`id` int AUTO_INCREMENT NOT NULL,
	`templateId` int NOT NULL,
	`ruleType` enum('item','section') NOT NULL,
	`targetId` int NOT NULL,
	`action` enum('show_only_for','hide_for') NOT NULL,
	`orgIds` text NOT NULL,
	`label` varchar(300),
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `accreditationFormOrgVisibilityRules_id` PRIMARY KEY(`id`)
);
