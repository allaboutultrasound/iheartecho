ALTER TABLE `appropriateUseCases` MODIFY COLUMN `modality` enum('TTE','TEE','Stress','Pediatric','Fetal','HOCM','POCUS');--> statement-breakpoint
ALTER TABLE `appropriateUseCases` MODIFY COLUMN `indication` text;--> statement-breakpoint
ALTER TABLE `appropriateUseCases` ADD `dateReviewCompleted` varchar(20);--> statement-breakpoint
ALTER TABLE `appropriateUseCases` ADD `examIdentifier` varchar(100);--> statement-breakpoint
ALTER TABLE `appropriateUseCases` ADD `referringPhysician` varchar(200);--> statement-breakpoint
ALTER TABLE `appropriateUseCases` ADD `examTypes` text;--> statement-breakpoint
ALTER TABLE `appropriateUseCases` ADD `limitedOrComplete` varchar(50);--> statement-breakpoint
ALTER TABLE `appropriateUseCases` ADD `indicationAppropriateness` varchar(20);--> statement-breakpoint
ALTER TABLE `appropriateUseCases` ADD `reviewComments` text;