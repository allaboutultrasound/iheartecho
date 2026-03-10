CREATE TABLE `meetingAttendees` (
	`id` int AUTO_INCREMENT NOT NULL,
	`meetingId` int NOT NULL,
	`userId` int,
	`name` varchar(255) NOT NULL,
	`email` varchar(320) NOT NULL,
	`role` varchar(128),
	`rsvpStatus` enum('pending','accepted','declined') NOT NULL DEFAULT 'pending',
	`attendanceStatus` enum('unknown','present','absent','excused') NOT NULL DEFAULT 'unknown',
	`inviteSentAt` timestamp,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `meetingAttendees_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `meetingMinutesDrafts` (
	`id` int AUTO_INCREMENT NOT NULL,
	`meetingId` int NOT NULL,
	`generatedByUserId` int NOT NULL,
	`minutesHtml` text NOT NULL,
	`promptUsed` text,
	`isAiGenerated` boolean NOT NULL DEFAULT true,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `meetingMinutesDrafts_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `meetingRecordings` (
	`id` int AUTO_INCREMENT NOT NULL,
	`meetingId` int NOT NULL,
	`uploadedByUserId` int NOT NULL,
	`fileKey` varchar(512) NOT NULL,
	`fileUrl` text NOT NULL,
	`fileName` varchar(255) NOT NULL,
	`mimeType` varchar(128) NOT NULL,
	`fileSizeBytes` bigint,
	`durationSeconds` int,
	`transcriptionStatus` enum('pending','processing','completed','failed') NOT NULL DEFAULT 'pending',
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `meetingRecordings_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `meetingTranscripts` (
	`id` int AUTO_INCREMENT NOT NULL,
	`meetingId` int NOT NULL,
	`recordingId` int NOT NULL,
	`fullText` text NOT NULL,
	`language` varchar(16),
	`durationSeconds` int,
	`segmentsJson` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `meetingTranscripts_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `qualityMeetings` (
	`id` int AUTO_INCREMENT NOT NULL,
	`orgId` int NOT NULL,
	`createdByUserId` int NOT NULL,
	`title` varchar(255) NOT NULL,
	`meetingType` enum('quality_assurance','peer_review','accreditation','staff_education','policy_review','other') NOT NULL DEFAULT 'quality_assurance',
	`scheduledAt` timestamp NOT NULL,
	`durationMinutes` int DEFAULT 60,
	`location` varchar(255),
	`agenda` text,
	`status` enum('scheduled','in_progress','completed','cancelled') NOT NULL DEFAULT 'scheduled',
	`minutesHtml` text,
	`minutesFinalized` boolean NOT NULL DEFAULT false,
	`minutesFinalizedAt` timestamp,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `qualityMeetings_id` PRIMARY KEY(`id`)
);
