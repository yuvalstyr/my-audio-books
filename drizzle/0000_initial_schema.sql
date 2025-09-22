CREATE TABLE `book_tags` (
	`book_id` text,
	`tag_id` text,
	PRIMARY KEY(`book_id`, `tag_id`),
	FOREIGN KEY (`book_id`) REFERENCES `books`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`tag_id`) REFERENCES `tags`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `book_tags_book_id_idx` ON `book_tags` (`book_id`);--> statement-breakpoint
CREATE INDEX `book_tags_tag_id_idx` ON `book_tags` (`tag_id`);--> statement-breakpoint
CREATE TABLE `books` (
	`id` text PRIMARY KEY NOT NULL,
	`title` text NOT NULL,
	`author` text NOT NULL,
	`audible_url` text,
	`narrator_rating` real,
	`performance_rating` real,
	`description` text,
	`cover_image_url` text,
	`queue_position` integer,
	`date_added` text NOT NULL
);
--> statement-breakpoint
CREATE INDEX `books_title_idx` ON `books` (`title`);--> statement-breakpoint
CREATE INDEX `books_author_idx` ON `books` (`author`);--> statement-breakpoint
CREATE INDEX `books_date_added_idx` ON `books` (`date_added`);--> statement-breakpoint
CREATE INDEX `books_queue_position_idx` ON `books` (`queue_position`);--> statement-breakpoint
CREATE INDEX `books_title_author_idx` ON `books` (`title`,`author`);--> statement-breakpoint
CREATE INDEX `books_date_added_title_idx` ON `books` (`date_added`,`title`);--> statement-breakpoint
CREATE INDEX `books_rated_idx` ON `books` (`narrator_rating`) WHERE narrator_rating IS NOT NULL;--> statement-breakpoint
CREATE TABLE `tags` (
	`id` text PRIMARY KEY NOT NULL,
	`name` text NOT NULL,
	`color` text NOT NULL,
	`created_at` text NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `tags_name_unique` ON `tags` (`name`);--> statement-breakpoint
CREATE INDEX `tags_created_at_idx` ON `tags` (`created_at`);