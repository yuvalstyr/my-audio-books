/**
 * Tests for default sorting behavior
 * Verifies that books are sorted alphabetically by title by default
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { get } from 'svelte/store';
import { filterStore, filterActions, createFilteredBooks } from '../filter-store';
import type { Book } from '$lib/types/book';

describe('Default Sorting Behavior', () => {
    const mockBooks: Book[] = [
        {
            id: '1',
            title: 'Zebra Adventures',
            author: 'Z Author',
            tags: [],
            narratorRating: 4.5,
            dateAdded: new Date('2023-01-01'),
            dateUpdated: new Date('2023-01-01'),
            createdAt: new Date('2023-01-01'),
            updatedAt: new Date('2023-01-01')
        },
        {
            id: '2',
            title: 'Apple Stories',
            author: 'A Author',
            tags: [],
            narratorRating: 3.8,
            dateAdded: new Date('2023-02-01'),
            dateUpdated: new Date('2023-02-01'),
            createdAt: new Date('2023-02-01'),
            updatedAt: new Date('2023-02-01')
        },
        {
            id: '3',
            title: 'Banana Tales',
            author: 'B Author',
            tags: [],
            narratorRating: 4.2,
            dateAdded: new Date('2023-03-01'),
            dateUpdated: new Date('2023-03-01'),
            createdAt: new Date('2023-03-01'),
            updatedAt: new Date('2023-03-01')
        },
        {
            id: '4',
            title: 'Charlie Chronicles',
            author: 'C Author',
            tags: [],
            narratorRating: 5.0,
            dateAdded: new Date('2023-04-01'),
            dateUpdated: new Date('2023-04-01'),
            createdAt: new Date('2023-04-01'),
            updatedAt: new Date('2023-04-01')
        }
    ];

    beforeEach(() => {
        // Reset filter store before each test
        filterActions.clearFilters();
    });

    describe('Initial State', () => {
        it('should have title as default sortBy', () => {
            const state = get(filterStore);
            expect(state.sortBy).toBe('title');
        });

        it('should have ascending as default sortOrder', () => {
            const state = get(filterStore);
            expect(state.sortOrder).toBe('asc');
        });

        it('should have empty search query by default', () => {
            const state = get(filterStore);
            expect(state.searchQuery).toBe('');
        });

        it('should have empty selected tags by default', () => {
            const state = get(filterStore);
            expect(state.selectedTags).toEqual([]);
        });
    });

    describe('Default Alphabetical Sorting', () => {
        it('should sort books alphabetically by title in ascending order by default', () => {
            const filteredBooks = createFilteredBooks(mockBooks);
            const result = get(filteredBooks);

            expect(result).toHaveLength(4);
            expect(result[0].title).toBe('Apple Stories');
            expect(result[1].title).toBe('Banana Tales');
            expect(result[2].title).toBe('Charlie Chronicles');
            expect(result[3].title).toBe('Zebra Adventures');
        });

        it('should maintain alphabetical sorting when no filters are applied', () => {
            const filteredBooks = createFilteredBooks(mockBooks);

            // Verify initial state
            let result = get(filteredBooks);
            expect(result.map(b => b.title)).toEqual([
                'Apple Stories',
                'Banana Tales',
                'Charlie Chronicles',
                'Zebra Adventures'
            ]);

            // Clear filters (should maintain same order)
            filterActions.clearFilters();
            result = get(filteredBooks);
            expect(result.map(b => b.title)).toEqual([
                'Apple Stories',
                'Banana Tales',
                'Charlie Chronicles',
                'Zebra Adventures'
            ]);
        });

        it('should return to alphabetical sorting after clearing custom sort', () => {
            const filteredBooks = createFilteredBooks(mockBooks);

            // Change to rating sort
            filterActions.setSortBy('narratorRating');
            filterActions.setSortOrder('desc');

            let result = get(filteredBooks);
            expect(result[0].narratorRating).toBe(5.0); // Charlie Chronicles
            expect(result[1].narratorRating).toBe(4.5); // Zebra Adventures

            // Clear filters - should return to default alphabetical
            filterActions.clearFilters();
            result = get(filteredBooks);
            expect(result.map(b => b.title)).toEqual([
                'Apple Stories',
                'Banana Tales',
                'Charlie Chronicles',
                'Zebra Adventures'
            ]);
        });
    });

    describe('Case Insensitive Sorting', () => {
        it('should sort case-insensitively', () => {
            const booksWithMixedCase: Book[] = [
                {
                    id: '1',
                    title: 'zebra adventures',
                    author: 'Author',
                    tags: [],
                    dateAdded: new Date(),
                    dateUpdated: new Date(),
                    createdAt: new Date(),
                    updatedAt: new Date()
                },
                {
                    id: '2',
                    title: 'Apple Stories',
                    author: 'Author',
                    tags: [],
                    dateAdded: new Date(),
                    dateUpdated: new Date(),
                    createdAt: new Date(),
                    updatedAt: new Date()
                },
                {
                    id: '3',
                    title: 'BANANA TALES',
                    author: 'Author',
                    tags: [],
                    dateAdded: new Date(),
                    dateUpdated: new Date(),
                    createdAt: new Date(),
                    updatedAt: new Date()
                }
            ];

            const filteredBooks = createFilteredBooks(booksWithMixedCase);
            const result = get(filteredBooks);

            expect(result.map(b => b.title)).toEqual([
                'Apple Stories',
                'BANANA TALES',
                'zebra adventures'
            ]);
        });
    });

    describe('Special Characters and Numbers', () => {
        it('should handle titles with numbers correctly', () => {
            const booksWithNumbers: Book[] = [
                {
                    id: '1',
                    title: '2001: A Space Odyssey',
                    author: 'Arthur C. Clarke',
                    tags: [],
                    dateAdded: new Date(),
                    dateUpdated: new Date(),
                    createdAt: new Date(),
                    updatedAt: new Date()
                },
                {
                    id: '2',
                    title: 'A Game of Thrones',
                    author: 'George R.R. Martin',
                    tags: [],
                    dateAdded: new Date(),
                    dateUpdated: new Date(),
                    createdAt: new Date(),
                    updatedAt: new Date()
                },
                {
                    id: '3',
                    title: '1984',
                    author: 'George Orwell',
                    tags: [],
                    dateAdded: new Date(),
                    dateUpdated: new Date(),
                    createdAt: new Date(),
                    updatedAt: new Date()
                }
            ];

            const filteredBooks = createFilteredBooks(booksWithNumbers);
            const result = get(filteredBooks);

            expect(result.map(b => b.title)).toEqual([
                '1984',
                '2001: A Space Odyssey',
                'A Game of Thrones'
            ]);
        });

        it('should handle titles with special characters', () => {
            const booksWithSpecialChars: Book[] = [
                {
                    id: '1',
                    title: 'The Lord of the Rings: The Fellowship',
                    author: 'J.R.R. Tolkien',
                    tags: [],
                    dateAdded: new Date(),
                    dateUpdated: new Date(),
                    createdAt: new Date(),
                    updatedAt: new Date()
                },
                {
                    id: '2',
                    title: 'Harry Potter & the Philosopher\'s Stone',
                    author: 'J.K. Rowling',
                    tags: [],
                    dateAdded: new Date(),
                    dateUpdated: new Date(),
                    createdAt: new Date(),
                    updatedAt: new Date()
                },
                {
                    id: '3',
                    title: 'A Song of Ice & Fire',
                    author: 'George R.R. Martin',
                    tags: [],
                    dateAdded: new Date(),
                    dateUpdated: new Date(),
                    createdAt: new Date(),
                    updatedAt: new Date()
                }
            ];

            const filteredBooks = createFilteredBooks(booksWithSpecialChars);
            const result = get(filteredBooks);

            expect(result.map(b => b.title)).toEqual([
                'A Song of Ice & Fire',
                'Harry Potter & the Philosopher\'s Stone',
                'The Lord of the Rings: The Fellowship'
            ]);
        });
    });

    describe('Interaction with Other Filters', () => {
        it('should maintain alphabetical sorting when search is applied', () => {
            const filteredBooks = createFilteredBooks(mockBooks);

            // Apply search filter
            filterActions.setSearchQuery('a'); // Should match Apple, Banana, Charlie, Zebra (all contain 'a')

            const result = get(filteredBooks);
            expect(result).toHaveLength(4); // All books contain 'a'
            expect(result.map(b => b.title)).toEqual([
                'Apple Stories',
                'Banana Tales',
                'Charlie Chronicles',
                'Zebra Adventures'
            ]);
        });

        it('should maintain alphabetical sorting when tags are applied', () => {
            const booksWithTags: Book[] = mockBooks.map(book => ({
                ...book,
                tags: book.title.includes('Apple') || book.title.includes('Banana')
                    ? [{ id: 'tag1', name: 'fruit', color: 'red' }]
                    : []
            }));

            const filteredBooks = createFilteredBooks(booksWithTags);

            // Apply tag filter
            filterActions.toggleTag('fruit');

            const result = get(filteredBooks);
            expect(result).toHaveLength(2);
            expect(result.map(b => b.title)).toEqual([
                'Apple Stories',
                'Banana Tales'
            ]);
        });

        it('should override default sorting when user changes sort options', () => {
            const filteredBooks = createFilteredBooks(mockBooks);

            // Change to rating sort descending
            filterActions.setSortBy('narratorRating');
            filterActions.setSortOrder('desc');

            const result = get(filteredBooks);
            expect(result[0].narratorRating).toBe(5.0); // Charlie Chronicles
            expect(result[1].narratorRating).toBe(4.5); // Zebra Adventures
            expect(result[2].narratorRating).toBe(4.2); // Banana Tales
            expect(result[3].narratorRating).toBe(3.8); // Apple Stories
        });
    });

    describe('Performance with Large Datasets', () => {
        it('should handle large number of books efficiently', () => {
            // Create 1000 books with random titles
            const largeBookSet: Book[] = [];
            for (let i = 0; i < 1000; i++) {
                largeBookSet.push({
                    id: `book-${i}`,
                    title: `Book ${String.fromCharCode(65 + (i % 26))}${i}`, // A0, B1, C2, etc.
                    author: `Author ${i}`,
                    tags: [],
                    dateAdded: new Date(),
                    dateUpdated: new Date(),
                    createdAt: new Date(),
                    updatedAt: new Date()
                });
            }

            const startTime = performance.now();
            const filteredBooks = createFilteredBooks(largeBookSet);
            const result = get(filteredBooks);
            const endTime = performance.now();

            expect(result).toHaveLength(1000);
            expect(endTime - startTime).toBeLessThan(100); // Should complete in under 100ms

            // Verify first few are sorted correctly (alphabetical order)
            expect(result[0].title).toBe('Book A0');
            expect(result[1].title).toBe('Book A104'); // A104 comes before A26 alphabetically
            expect(result[2].title).toBe('Book A130');
        });
    });

    describe('Edge Cases', () => {
        it('should handle empty book list', () => {
            const filteredBooks = createFilteredBooks([]);
            const result = get(filteredBooks);

            expect(result).toHaveLength(0);
            expect(result).toEqual([]);
        });

        it('should handle single book', () => {
            const singleBook = [mockBooks[0]];
            const filteredBooks = createFilteredBooks(singleBook);
            const result = get(filteredBooks);

            expect(result).toHaveLength(1);
            expect(result[0].title).toBe('Zebra Adventures');
        });

        it('should handle books with identical titles', () => {
            const booksWithSameTitles: Book[] = [
                {
                    id: '1',
                    title: 'Same Title',
                    author: 'Author A',
                    tags: [],
                    dateAdded: new Date('2023-01-01'),
                    dateUpdated: new Date('2023-01-01'),
                    createdAt: new Date('2023-01-01'),
                    updatedAt: new Date('2023-01-01')
                },
                {
                    id: '2',
                    title: 'Same Title',
                    author: 'Author B',
                    tags: [],
                    dateAdded: new Date('2023-02-01'),
                    dateUpdated: new Date('2023-02-01'),
                    createdAt: new Date('2023-02-01'),
                    updatedAt: new Date('2023-02-01')
                }
            ];

            const filteredBooks = createFilteredBooks(booksWithSameTitles);
            const result = get(filteredBooks);

            expect(result).toHaveLength(2);
            expect(result[0].title).toBe('Same Title');
            expect(result[1].title).toBe('Same Title');
            // Order should be stable for identical titles
        });

        it('should handle books with empty or whitespace titles', () => {
            const booksWithEmptyTitles: Book[] = [
                {
                    id: '1',
                    title: '',
                    author: 'Author A',
                    tags: [],
                    dateAdded: new Date(),
                    dateUpdated: new Date(),
                    createdAt: new Date(),
                    updatedAt: new Date()
                },
                {
                    id: '2',
                    title: '   ',
                    author: 'Author B',
                    tags: [],
                    dateAdded: new Date(),
                    dateUpdated: new Date(),
                    createdAt: new Date(),
                    updatedAt: new Date()
                },
                {
                    id: '3',
                    title: 'Actual Title',
                    author: 'Author C',
                    tags: [],
                    dateAdded: new Date(),
                    dateUpdated: new Date(),
                    createdAt: new Date(),
                    updatedAt: new Date()
                }
            ];

            const filteredBooks = createFilteredBooks(booksWithEmptyTitles);
            const result = get(filteredBooks);

            expect(result).toHaveLength(3);
            // Empty and whitespace titles should sort before actual titles
            expect(result[2].title).toBe('Actual Title');
        });
    });
});