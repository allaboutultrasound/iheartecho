CREATE TABLE `scanCoachMedia` (
	`id` int AUTO_INCREMENT NOT NULL,
	`viewId` varchar(64) NOT NULL,
	`mediaType` enum('image','clip') NOT NULL DEFAULT 'image',
	`url` text NOT NULL,
	`fileKey` text NOT NULL,
	`caption` varchar(255),
	`sortOrder` int NOT NULL DEFAULT 0,
	`uploadedBy` int NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `scanCoachMedia_id` PRIMARY KEY(`id`)
);
