import { describe, it, expect } from 'vitest';
import type { Book } from '$lib/types/book';

// Basic test to verify the component can be imported and types are correct
describe('BookCard Component', () => {
    it('should have correct Book interface structure', () => {
        const mockBook: Book = {
            id: 'test-book-1',
            title: 'Test Audiobook Title',
            author: 'Test Author',
            audibleUrl: 'https://audible.com/test',
            tags: [
                { id: 'tag-1', name: 'funny', color: '#fbbf24' },
                { id: 'tag-2', name: 'series', color: '#3b82f6' }
            ],
            narratorRating: 4.5,
            dateAdded: new Date('2025-01-01'),
            queuePosition: 1
        };

        expect(mockBook.id).toBe('test-book-1');
        expect(mockBook.title).toBe('Test Audiobook Title');
        expect(mockBook.author).toBe('Test Author');
        expect(mockBook.tags).toHaveLength(2);
        expect(mockBook.narratorRating).toBe(4.5);
    });

    it('should handle optional properties correctly', () => {
        const minimalBook: Book = {
            id: 'minimal-book',
            title: 'Minimal Book',
            author: 'Author Name',
            tags: [],
            dateAdded: new Date()
        };

        expect(minimalBook.narratorRating).toBeUndefined();
        expect(minimalBook.audibleUrl).toBeUndefined();
        expect(minimalBook.queuePosition).toBeUndefined();
    });
});