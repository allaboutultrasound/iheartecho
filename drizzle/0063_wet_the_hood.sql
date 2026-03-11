ALTER TABLE `accreditationFormItems` MODIFY COLUMN `itemType` enum('text','textarea','email','richtext','radio','checkbox','select','scale','heading','info') NOT NULL;--> statement-breakpoint
ALTER TABLE `accreditationFormItems` ADD `richTextContent` longtext;--> statement-breakpoint
ALTER TABLE `accreditationFormItems` ADD `emailRoutingRules` text;--> statement-breakpoint
ALTER TABLE `accreditationFormItems` ADD `placeholder` varchar(300);--> statement-breakpoint
ALTER TABLE `accreditationFormItems` ADD `validationRegex` varchar(500);