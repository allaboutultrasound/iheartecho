CREATE TABLE `quickfireChallenges` (
	`id` int AUTO_INCREMENT NOT NULL,
	`title` varchar(300) NOT NULL,
	`description` text,
	`questionIds` text NOT NULL,
	`priority` int NOT NULL DEFAULT 100,
	`category` varchar(64),
	`status` enum('draft','scheduled','live','archived') NOT NULL DEFAULT 'draft',
	`publishDate` varchar(10),
	`publishedAt` timestamp,
	`archivedAt` timestamp,
	`createdByUserId` int,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `quickfireChallenges_id` PRIMARY KEY(`id`)
);
