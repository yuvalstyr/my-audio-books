import { sqliteTable, text, real, integer, primaryKey, index } from 'drizzle-orm/sqlite-core';
import { relations, sql } from 'drizzle-orm';

export const books = sqliteTable('books', {
    id: text('id').primaryKey(),
    title: text('title').notNull(),
    author: text('author').notNull(),
    audibleUrl: text('audible_url'),
    narratorRating: real('narrator_rating'),
    performanceRating: real('performance_rating'),
    description: text('description'),
    coverImageUrl: text('cover_image_url'),
    queuePosition: integer('queue_position'),
    dateAdded: text('date_added').notNull(),
    dateUpdated: text('date_updated').notNull(),
    createdAt: text('created_at').notNull(),
    updatedAt: text('updated_at').notNull(),
}, (table) => ({
    // Performance indexes for common queries
    titleIdx: index('books_title_idx').on(table.title),
    authorIdx: index('books_author_idx').on(table.author),
    dateAddedIdx: index('books_date_added_idx').on(table.dateAdded),
    queuePositionIdx: index('books_queue_position_idx').on(table.queuePosition),
    createdAtIdx: index('books_created_at_idx').on(table.createdAt),
    updatedAtIdx: index('books_updated_at_idx').on(table.updatedAt),
    // Composite indexes for common query patterns
    titleAuthorIdx: index('books_title_author_idx').on(table.title, table.author),
    createdAtTitleIdx: index('books_created_at_title_idx').on(table.createdAt, table.title),
    // Partial indexes for performance
    ratedBooksIdx: index('books_rated_idx').on(table.narratorRating).where(sql`narrator_rating IS NOT NULL`),
}));

export const tags = sqliteTable('tags', {
    id: text('id').primaryKey(),
    name: text('name').notNull().unique(),
    color: text('color').notNull(),
    createdAt: text('created_at').notNull(),
}, (table) => ({
    // Performance index for tag lookups
    createdAtIdx: index('tags_created_at_idx').on(table.createdAt),
}));

export const bookTags = sqliteTable('book_tags', {
    bookId: text('book_id').references(() => books.id, { onDelete: 'cascade' }),
    tagId: text('tag_id').references(() => tags.id, { onDelete: 'cascade' }),
}, (table) => ({
    pk: primaryKey({ columns: [table.bookId, table.tagId] }),
    // Performance indexes for relationship queries
    bookIdIdx: index('book_tags_book_id_idx').on(table.bookId),
    tagIdIdx: index('book_tags_tag_id_idx').on(table.tagId),
}));

// Relations
export const booksRelations = relations(books, ({ many }) => ({
    bookTags: many(bookTags),
}));

export const tagsRelations = relations(tags, ({ many }) => ({
    bookTags: many(bookTags),
}));

export const bookTagsRelations = relations(bookTags, ({ one }) => ({
    book: one(books, { fields: [bookTags.bookId], references: [books.id] }),
    tag: one(tags, { fields: [bookTags.tagId], references: [tags.id] }),
}));