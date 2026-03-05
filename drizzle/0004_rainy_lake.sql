CREATE TABLE `labMembers` (
	`id` int AUTO_INCREMENT NOT NULL,
	`labId` int NOT NULL,
	`userId` int,
	`inviteEmail` varchar(320) NOT NULL,
	`displayName` varchar(100),
	`credentials` varchar(200),
	`role` enum('admin','reviewer','sonographer') NOT NULL DEFAULT 'sonographer',
	`specialty` varchar(100),
	`department` varchar(100),
	`inviteStatus` enum('pending','accepted','declined') NOT NULL DEFAULT 'pending',
	`inviteToken` varchar(64),
	`joinedAt` timestamp,
	`isActive` boolean NOT NULL DEFAULT true,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `labMembers_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `labPeerReviews` (
	`id` int AUTO_INCREMENT NOT NULL,
	`labId` int NOT NULL,
	`peerReviewId` int NOT NULL,
	`reviewerId` int NOT NULL,
	`revieweeId` int NOT NULL,
	`qualityScore` int,
	`qualityTier` enum('Excellent','Good','Adequate','Needs Improvement'),
	`iqScore` int,
	`raScore` int,
	`taScore` int,
	`reviewMonth` varchar(7),
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `labPeerReviews_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `labSubscriptions` (
	`id` int AUTO_INCREMENT NOT NULL,
	`adminUserId` int NOT NULL,
	`labName` varchar(200) NOT NULL,
	`labAddress` text,
	`labPhone` varchar(30),
	`plan` enum('basic','professional','enterprise') NOT NULL DEFAULT 'basic',
	`status` enum('active','trialing','past_due','canceled','paused') NOT NULL DEFAULT 'trialing',
	`seats` int NOT NULL DEFAULT 5,
	`stripeCustomerId` varchar(64),
	`stripeSubscriptionId` varchar(64),
	`billingCycleStart` timestamp,
	`billingCycleEnd` timestamp,
	`trialEndsAt` timestamp,
	`canceledAt` timestamp,
	`notes` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `labSubscriptions_id` PRIMARY KEY(`id`)
);
