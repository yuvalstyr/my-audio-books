import { db } from './connection.js';
import { books, tags, bookTags } from './schema.js';

/**
 * Database utility functions for common operations
 */

export async function healthCheck(): Promise<boolean> {
    try {
        // Simple query to check if database is accessible
        await db.select().from(books).limit(1);
        return true;
    } catch (error) {
        console.error('Database health check failed:', error);
        return false;
    }
}

export async function getTableCounts() {
    try {
        const [bookCount] = await db.select({ count: books.id }).from(books);
        const [tagCount] = await db.select({ count: tags.id }).from(tags);
        const [relationCount] = await db.select({ count: bookTags.bookId }).from(bookTags);

        return {
            books: bookCount?.count || 0,
            tags: tagCount?.count || 0,
            bookTags: relationCount?.count || 0
        };
    } catch (error) {
        console.error('Failed to get table counts:', error);
        return { books: 0, tags: 0, bookTags: 0 };
    }
}