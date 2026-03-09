CREATE TABLE `wishlist` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`title` text NOT NULL,
	`description` text,
	`owner` text NOT NULL,
	`created_at` integer DEFAULT (strftime('%s','now')) NOT NULL
);
