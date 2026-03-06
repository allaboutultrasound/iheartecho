CREATE TABLE `physicianNotifications` (
	`id` int AUTO_INCREMENT NOT NULL,
	`recipientUserId` int NOT NULL,
	`recipientLabMemberId` int,
	`reviewId` int NOT NULL,
	`type` varchar(50) NOT NULL DEFAULT 'peer_review_result',
	`title` varchar(255) NOT NULL,
	`message` text NOT NULL,
	`payload` text,
	`isRead` boolean NOT NULL DEFAULT false,
	`isDismissed` boolean NOT NULL DEFAULT false,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`readAt` timestamp,
	CONSTRAINT `physicianNotifications_id` PRIMARY KEY(`id`)
);
