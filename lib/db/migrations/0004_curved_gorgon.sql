PRAGMA foreign_keys=OFF;--> statement-breakpoint
CREATE TABLE `__new_highscore_items` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`category_id` integer NOT NULL,
	`title` text NOT NULL,
	`description` text,
	`location` text NOT NULL,
	`image_url` text,
	`created_at` integer DEFAULT (strftime('%s','now')) NOT NULL,
	FOREIGN KEY (`category_id`) REFERENCES `highscore_categories`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
INSERT INTO `__new_highscore_items`("id", "category_id", "title", "description", "location", "image_url", "created_at") SELECT "id", "category_id", "title", "description", "location", "image_url", "created_at" FROM `highscore_items`;--> statement-breakpoint
DROP TABLE `highscore_items`;--> statement-breakpoint
ALTER TABLE `__new_highscore_items` RENAME TO `highscore_items`;--> statement-breakpoint
PRAGMA foreign_keys=ON;