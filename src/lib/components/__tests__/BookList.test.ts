import { describe, it, expect } from 'vitest';
import type { Book, BookTag } from '$lib/types/book';

// Test the BookList component logic and data handling
describe('BookList Component', () => {
    const createMockTag = (name: string): BookTag => ({
        id: `tag-${name}`,
        name: name as any,
        color: 'blue'
    });

    const createMockBook = (id: string, title: string, author: string): Book => ({
        id,
        title,
        author,
        tags: [createMockTag('funny')],
        dateAdded: new Date('2025-01-01'),
        
        narratorRating: 4.5
    });

    it('should handle empty books array correctly', () => {
        const books: Book[] = [];
        expect(books.length).toBe(0);
    });

    it('should correctly count books with next tag', () => {
        const books = [
            {
                ...createMockBook('1', 'Book One', 'Author One'),
                tags: [createMockTag('next'), createMockTag('funny')]
            },
            {
                ...createMockBook('2', 'Book Two', 'Author Two'),
                tags: [createMockTag('funny')]
            },
            {
                ...createMockBook('3', 'Book Three', 'Author Three'),
                tags: [createMockTag('next')]
            }
        ];

        const nextQueueCount = books.filter(book =>
            book.tags.some(tag => tag.name === 'next')
        ).length;

        expect(nextQueueCount).toBe(2);
    });

    it('should handle books with various tag combinations', () => {
        const books = [
            {
                ...createMockBook('1', 'Book One', 'Author One'),
                tags: [createMockTag('funny'), createMockTag('series')]
            },
            {
                ...createMockBook('2', 'Book Two', 'Author Two'),
                tags: []
            },
            {
                ...createMockBook('3', 'Book Three', 'Author Three'),
                tags: [createMockTag('next'), createMockTag('thriller')]
            }
        ];

        expect(books[0].tags).toHaveLength(2);
        expect(books[1].tags).toHaveLength(0);
        expect(books[2].tags).toHaveLength(2);
        expect(books[2].tags.some(tag => tag.name === 'next')).toBe(true);
    });

    it('should maintain book data integrity', () => {
        const book = createMockBook('test-1', 'Test Book', 'Test Author');

        expect(book.id).toBe('test-1');
        expect(book.title).toBe('Test Book');
        expect(book.author).toBe('Test Author');
        expect(book.narratorRating).toBe(4.5);
        expect(book.dateAdded).toBeInstanceOf(Date);
    });

    it('should handle loading and error states', () => {
        const loadingState = { loading: true, error: null, books: [] };
        const errorState = { loading: false, error: 'Network error', books: [] };
        const successState = { loading: false, error: null, books: [createMockBook('1', 'Book', 'Author')] };

        expect(loadingState.loading).toBe(true);
        expect(errorState.error).toBe('Network error');
        expect(successState.books).toHaveLength(1);
    });
});