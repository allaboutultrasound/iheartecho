ALTER TABLE `imageQualityReviews` ADD `teeMeasurementsComplete` varchar(50);--> statement-breakpoint
ALTER TABLE `imageQualityReviews` ADD `teeMeasurementsAccurate` varchar(50);--> statement-breakpoint
ALTER TABLE `imageQualityReviews` ADD `teeVentricularFunction` varchar(50);--> statement-breakpoint
ALTER TABLE `imageQualityReviews` ADD `teeDopplerSettings` varchar(50);--> statement-breakpoint
ALTER TABLE `imageQualityReviews` ADD `teeDopplerSampleVolumes` varchar(50);--> statement-breakpoint
ALTER TABLE `imageQualityReviews` ADD `teeAorticValve` varchar(50);--> statement-breakpoint
ALTER TABLE `imageQualityReviews` ADD `teeMitralValve` varchar(50);--> statement-breakpoint
ALTER TABLE `imageQualityReviews` ADD `teeTricuspidValve` varchar(50);--> statement-breakpoint
ALTER TABLE `imageQualityReviews` ADD `teePulmonicValve` varchar(50);--> statement-breakpoint
ALTER TABLE `imageQualityReviews` ADD `teeImageOptSummary` varchar(50);--> statement-breakpoint
ALTER TABLE `imageQualityReviews` ADD `teeMeasurementSummary` varchar(50);--> statement-breakpoint
ALTER TABLE `imageQualityReviews` ADD `teeDopplerSummary` varchar(50);--> statement-breakpoint
ALTER TABLE `imageQualityReviews` ADD `performingSonographerId` varchar(50);--> statement-breakpoint
ALTER TABLE `imageQualityReviews` ADD `performingSonographerText` varchar(200);--> statement-breakpoint
ALTER TABLE `imageQualityReviews` ADD `interpretingPhysicianId` varchar(50);--> statement-breakpoint
ALTER TABLE `imageQualityReviews` ADD `interpretingPhysicianText` varchar(200);