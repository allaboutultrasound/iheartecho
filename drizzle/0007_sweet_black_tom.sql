ALTER TABLE `imageQualityReviews` ADD `labId` int;--> statement-breakpoint
ALTER TABLE `imageQualityReviews` ADD `revieweeLabMemberId` int;--> statement-breakpoint
ALTER TABLE `imageQualityReviews` ADD `revieweeUserId` int;--> statement-breakpoint
ALTER TABLE `imageQualityReviews` ADD `revieweeName` varchar(200);