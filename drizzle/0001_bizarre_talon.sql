CREATE INDEX `book_tags_book_id_idx` ON `book_tags` (`book_id`);--> statement-breakpoint
CREATE INDEX `book_tags_tag_id_idx` ON `book_tags` (`tag_id`);--> statement-breakpoint
CREATE INDEX `books_title_idx` ON `books` (`title`);--> statement-breakpoint
CREATE INDEX `books_author_idx` ON `books` (`author`);--> statement-breakpoint
CREATE INDEX `books_date_added_idx` ON `books` (`date_added`);--> statement-breakpoint
CREATE INDEX `books_queue_position_idx` ON `books` (`queue_position`);--> statement-breakpoint
CREATE INDEX `books_created_at_idx` ON `books` (`created_at`);--> statement-breakpoint
CREATE INDEX `tags_created_at_idx` ON `tags` (`created_at`);