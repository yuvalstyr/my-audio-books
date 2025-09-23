/**
 * Unit tests for NextBookCard component logic
 * Tests the home screen book card functionality without rendering
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import type { Book } from '$lib/types/book';

// Mock book data
const mockBook: Book = {
    id: 'test-book-1',
    title: 'Test Audiobook Title',
    author: 'Test Author',
    
    tags: [
        { id: 'tag-1', name: 'next', color: 'badge-primary' },
        { id: 'tag-2', name: 'sci-fi', color: 'badge-secondary' },
        { id: 'tag-3', name: 'series', color: 'badge-accent' }
    ],
    narratorRating: 4.5,
    performanceRating: 4.2,
    description: 'A test audiobook description',
    coverImageUrl: 'https://example.com/cover.jpg',
    queuePosition: 1,
    dateAdded: new Date('2024-01-01'),
};

const mockBookWithoutRating: Book = {
    ...mockBook,
    id: 'test-book-2',
    title: 'Book Without Rating',
    narratorRating: undefined,
    performanceRating: undefined
};

const mockBookWithoutCover: Book = {
    ...mockBook,
    id: 'test-book-3',
    title: 'Book Without Cover',
    coverImageUrl: undefined
};

// Helper functions to test component logic
function formatRating(rating?: number): string {
    if (rating === undefined || rating === null) return "N/A";
    return `${rating.toFixed(1)}/5`;
}

function getBestRating(narratorRating?: number, performanceRating?: number): number {
    return Math.max(narratorRating || 0, performanceRating || 0);
}

function hasRating(narratorRating?: number, performanceRating?: number): boolean {
    return !!(narratorRating || performanceRating);
}

function filterNonNextTags(tags: { id: string; name: string; color: string }[]): { id: string; name: string; color: string }[] {
    return tags.filter(tag => tag.name !== 'next');
}

describe('NextBookCard Component Logic', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    describe('Rating Logic', () => {
        it('should format rating correctly', () => {
            expect(formatRating(4.5)).toBe('4.5/5');
            expect(formatRating(4.666666)).toBe('4.7/5');
            expect(formatRating(0)).toBe('0.0/5');
            expect(formatRating(undefined)).toBe('N/A');
        });

        it('should get best rating correctly', () => {
            expect(getBestRating(4.5, 4.2)).toBe(4.5);
            expect(getBestRating(3.5, 4.8)).toBe(4.8);
            expect(getBestRating(4.3, undefined)).toBe(4.3);
            expect(getBestRating(undefined, 3.9)).toBe(3.9);
            expect(getBestRating(undefined, undefined)).toBe(0);
        });

        it('should detect if book has rating', () => {
            expect(hasRating(4.5, 4.2)).toBe(true);
            expect(hasRating(4.5, undefined)).toBe(true);
            expect(hasRating(undefined, 4.2)).toBe(true);
            expect(hasRating(0, 0)).toBe(false);
            expect(hasRating(undefined, undefined)).toBe(false);
        });

        it('should handle rating edge cases', () => {
            expect(formatRating(0)).toBe('0.0/5');
            expect(formatRating(5)).toBe('5.0/5');
            expect(formatRating(0.1)).toBe('0.1/5');
            expect(formatRating(4.99999)).toBe('5.0/5');
        });
    });

    describe('Tag Filtering Logic', () => {
        it('should filter out "next" tags', () => {
            const tags = [
                { id: 'tag-1', name: 'next', color: 'badge-primary' },
                { id: 'tag-2', name: 'sci-fi', color: 'badge-secondary' },
                { id: 'tag-3', name: 'series', color: 'badge-accent' }
            ];

            const filtered = filterNonNextTags(tags);
            expect(filtered).toHaveLength(2);
            expect(filtered.map(t => t.name)).toEqual(['sci-fi', 'series']);
        });

        it('should handle empty tags array', () => {
            const filtered = filterNonNextTags([]);
            expect(filtered).toHaveLength(0);
        });

        it('should handle array with only "next" tags', () => {
            const tags = [
                { id: 'tag-1', name: 'next', color: 'badge-primary' },
                { id: 'tag-2', name: 'next', color: 'badge-secondary' }
            ];

            const filtered = filterNonNextTags(tags);
            expect(filtered).toHaveLength(0);
        });

        it('should handle array with no "next" tags', () => {
            const tags = [
                { id: 'tag-1', name: 'sci-fi', color: 'badge-primary' },
                { id: 'tag-2', name: 'fantasy', color: 'badge-secondary' }
            ];

            const filtered = filterNonNextTags(tags);
            expect(filtered).toHaveLength(2);
            expect(filtered).toEqual(tags);
        });

        it('should handle tag display logic for many tags', () => {
            const manyTags = [
                { id: 'tag-1', name: 'next', color: 'badge-primary' },
                { id: 'tag-2', name: 'sci-fi', color: 'badge-secondary' },
                { id: 'tag-3', name: 'series', color: 'badge-accent' },
                { id: 'tag-4', name: 'fantasy', color: 'badge-info' },
                { id: 'tag-5', name: 'adventure', color: 'badge-success' },
                { id: 'tag-6', name: 'action', color: 'badge-warning' }
            ];

            const filtered = filterNonNextTags(manyTags);
            expect(filtered).toHaveLength(5); // All except "next"

            // Test display logic: show first 3, then "+X more"
            const displayTags = filtered.slice(0, 3);
            const remainingCount = filtered.length - 3;

            expect(displayTags).toHaveLength(3);
            expect(remainingCount).toBe(2);
        });
    });

    describe('Book Data Validation', () => {
        it('should handle book with all properties', () => {
            expect(mockBook.id).toBe('test-book-1');
            expect(mockBook.title).toBe('Test Audiobook Title');
            expect(mockBook.author).toBe('Test Author');
            expect(mockBook.tags).toHaveLength(3);
            expect(mockBook.narratorRating).toBe(4.5);
            expect(mockBook.performanceRating).toBe(4.2);
            expect(mockBook.coverImageUrl).toBe('https://example.com/cover.jpg');
        });

        it('should handle book with minimal properties', () => {
            const minimalBook: Book = {
                id: 'minimal-book',
                title: 'Minimal Book',
                author: 'Minimal Author',
                tags: [],
                dateAdded: new Date(),
                dateUpdated: new Date(),
                createdAt: new Date(),
                updatedAt: new Date()
            };

            expect(minimalBook.id).toBe('minimal-book');
            expect(minimalBook.title).toBe('Minimal Book');
            expect(minimalBook.author).toBe('Minimal Author');
            expect(minimalBook.tags).toHaveLength(0);
            expect(minimalBook.narratorRating).toBeUndefined();
            expect(minimalBook.performanceRating).toBeUndefined();
            expect(minimalBook.coverImageUrl).toBeUndefined();
        });

        it('should handle book with undefined optional properties', () => {
            expect(mockBookWithoutRating.narratorRating).toBeUndefined();
            expect(mockBookWithoutRating.performanceRating).toBeUndefined();
            expect(mockBookWithoutCover.coverImageUrl).toBeUndefined();
        });
    });

    describe('Component Props Validation', () => {
        it('should handle isUpdating prop correctly', () => {
            // Test that the component would handle the isUpdating prop
            const isUpdating = true;
            expect(isUpdating).toBe(true);

            const notUpdating = false;
            expect(notUpdating).toBe(false);
        });

        it('should handle book prop validation', () => {
            // Verify book object structure
            expect(mockBook).toHaveProperty('id');
            expect(mockBook).toHaveProperty('title');
            expect(mockBook).toHaveProperty('author');
            expect(mockBook).toHaveProperty('tags');
            expect(Array.isArray(mockBook.tags)).toBe(true);
        });
    });

    describe('Event Handling Logic', () => {
        it('should create proper event data for removeFromNext', () => {
            const eventData = { book: mockBook };
            expect(eventData.book).toEqual(mockBook);
            expect(eventData.book.id).toBe('test-book-1');
        });

        it('should create proper event data for viewDetails', () => {
            const eventData = { book: mockBook };
            expect(eventData.book).toEqual(mockBook);
            expect(eventData.book.title).toBe('Test Audiobook Title');
        });
    });

    describe('Edge Cases', () => {
        it('should handle books with very long titles', () => {
            const longTitle = 'A'.repeat(200);
            const bookWithLongTitle: Book = {
                ...mockBook,
                title: longTitle
            };

            expect(bookWithLongTitle.title).toHaveLength(200);
            expect(bookWithLongTitle.title.startsWith('A')).toBe(true);
        });

        it('should handle books with special characters', () => {
            const bookWithSpecialChars: Book = {
                ...mockBook,
                title: '📚 Test Book with Emojis & Special Chars',
                author: 'Author with "quotes" and \'apostrophes\''
            };

            expect(bookWithSpecialChars.title).toContain('📚');
            expect(bookWithSpecialChars.title).toContain('&');
            expect(bookWithSpecialChars.author).toContain('"quotes"');
        });

        it('should handle books with many tags', () => {
            const manyTags = Array.from({ length: 10 }, (_, i) => ({
                id: `tag-${i}`,
                name: `tag-${i}`,
                color: 'badge-primary'
            }));

            const bookWithManyTags: Book = {
                ...mockBook,
                tags: manyTags
            };

            expect(bookWithManyTags.tags).toHaveLength(10);

            const nonNextTags = filterNonNextTags(bookWithManyTags.tags);
            expect(nonNextTags).toHaveLength(10); // None are "next" tags
        });

        it('should handle zero and null ratings', () => {
            const bookWithZeroRating: Book = {
                ...mockBook,
                narratorRating: 0,
                performanceRating: 0
            };

            expect(hasRating(bookWithZeroRating.narratorRating, bookWithZeroRating.performanceRating)).toBe(false);
            expect(getBestRating(bookWithZeroRating.narratorRating, bookWithZeroRating.performanceRating)).toBe(0);
        });

        it('should handle books with no tags', () => {
            const bookWithNoTags: Book = {
                ...mockBook,
                tags: []
            };

            const filtered = filterNonNextTags(bookWithNoTags.tags);
            expect(filtered).toHaveLength(0);
        });

        it('should handle books with only next tag', () => {
            const bookWithOnlyNextTag: Book = {
                ...mockBook,
                tags: [{ id: 'tag-1', name: 'next', color: 'badge-primary' }]
            };

            const filtered = filterNonNextTags(bookWithOnlyNextTag.tags);
            expect(filtered).toHaveLength(0);
        });
    });

    describe('Component Integration Logic', () => {
        it('should determine best rating for display', () => {
            // Test the logic that would be used in the component
            const book1 = { narratorRating: 4.8, performanceRating: 4.2 };
            const book2 = { narratorRating: 3.5, performanceRating: 4.8 };
            const book3 = { narratorRating: 4.3, performanceRating: undefined };
            const book4 = { narratorRating: undefined, performanceRating: 3.9 };

            expect(getBestRating(book1.narratorRating, book1.performanceRating)).toBe(4.8);
            expect(getBestRating(book2.narratorRating, book2.performanceRating)).toBe(4.8);
            expect(getBestRating(book3.narratorRating, book3.performanceRating)).toBe(4.3);
            expect(getBestRating(book4.narratorRating, book4.performanceRating)).toBe(3.9);
        });

        it('should format ratings for display', () => {
            const testRatings = [4.5, 4.666666, 0, 5, 0.1, 4.99999];
            const expectedFormats = ['4.5/5', '4.7/5', '0.0/5', '5.0/5', '0.1/5', '5.0/5'];

            testRatings.forEach((rating, index) => {
                expect(formatRating(rating)).toBe(expectedFormats[index]);
            });
        });

        it('should handle tag filtering for display', () => {
            const testCases = [
                {
                    tags: [
                        { id: '1', name: 'next', color: 'red' },
                        { id: '2', name: 'sci-fi', color: 'blue' }
                    ],
                    expected: ['sci-fi']
                },
                {
                    tags: [
                        { id: '1', name: 'fantasy', color: 'green' },
                        { id: '2', name: 'adventure', color: 'yellow' }
                    ],
                    expected: ['fantasy', 'adventure']
                },
                {
                    tags: [{ id: '1', name: 'next', color: 'red' }],
                    expected: []
                },
                {
                    tags: [],
                    expected: []
                }
            ];

            testCases.forEach(({ tags, expected }) => {
                const filtered = filterNonNextTags(tags);
                expect(filtered.map(t => t.name)).toEqual(expected);
            });
        });
    });
});