CREATE TABLE `flashcardGuestDailyUsage` (
	`id` int AUTO_INCREMENT NOT NULL,
	`ipHash` varchar(64) NOT NULL,
	`dateStr` varchar(10) NOT NULL,
	`viewCount` int NOT NULL DEFAULT 0,
	`updatedAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `flashcardGuestDailyUsage_id` PRIMARY KEY(`id`),
	CONSTRAINT `uniqIpDate` UNIQUE(`ipHash`,`dateStr`)
);
