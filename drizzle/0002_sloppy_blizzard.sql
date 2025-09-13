CREATE INDEX `books_updated_at_idx` ON `books` (`updated_at`);--> statement-breakpoint
CREATE INDEX `books_title_author_idx` ON `books` (`title`,`author`);--> statement-breakpoint
CREATE INDEX `books_created_at_title_idx` ON `books` (`created_at`,`title`);--> statement-breakpoint
CREATE INDEX `books_rated_idx` ON `books` (`narrator_rating`) WHERE narrator_rating IS NOT NULL;