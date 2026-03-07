CREATE TABLE `webhookEvents` (
	`id` int AUTO_INCREMENT NOT NULL,
	`source` varchar(64) NOT NULL DEFAULT 'thinkific',
	`resource` varchar(64) NOT NULL,
	`action` varchar(64) NOT NULL,
	`email` varchar(255),
	`productName` varchar(512),
	`httpStatus` int NOT NULL DEFAULT 200,
	`outcome` varchar(64) NOT NULL DEFAULT 'ignored',
	`message` text,
	`rawPayload` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `webhookEvents_id` PRIMARY KEY(`id`)
);
