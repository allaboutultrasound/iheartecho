ALTER TABLE `labSubscriptions` ADD `accreditationTypes` text;--> statement-breakpoint
ALTER TABLE `labSubscriptions` ADD `accreditationOnboardingComplete` boolean DEFAULT false NOT NULL;
