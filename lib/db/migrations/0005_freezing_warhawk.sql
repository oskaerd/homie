CREATE TABLE `recipes` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`title` text NOT NULL,
	`description` text,
	`ingredients` text DEFAULT '[]' NOT NULL,
	`portion_count` integer DEFAULT 2 NOT NULL,
	`image_url` text,
	`label` text DEFAULT 'other' NOT NULL,
	`calories` real,
	`protein` real,
	`fat` real,
	`sugar` real,
	`fiber` real,
	`created_at` integer DEFAULT (strftime('%s','now')) NOT NULL,
	`updated_at` integer DEFAULT (strftime('%s','now')) NOT NULL
);
