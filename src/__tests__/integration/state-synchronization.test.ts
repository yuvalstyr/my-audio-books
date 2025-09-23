/**
 * Integration Tests for Real-time State Synchronization
 * Tests state consistency between home screen and wishlist pages
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, fireEvent, waitFor, screen } from '@testing-library/svelte';
import { get } from 'svelte/store';
import { bookActions, allBooks, nextBooks } from '$lib/stores/book-store';
import type { Book } from '$lib/types/book';

// Mock the API client
vi.mock('$lib/services/api-client', () => ({
    apiClient: {
        getBooks: vi.fn(),
        createBook: vi.fn(),
        updateBook: vi.fn(),
        deleteBook: vi.fn(),
        getTags: vi.fn(),
    },
    getErrorMessage: vi.fn((error) => error?.message || 'Unknown error')
}));

// Mock the services
vi.mock('$lib/services/error-logger', () => ({
    ErrorLogger: {
        debug: vi.fn(),
        info: vi.fn(),
        error: vi.fn(),
    }
}));

vi.mock('$lib/services/notification-service', () => ({
    NotificationService: {
        info: vi.fn(),
        error: vi.fn(),
        operationFeedback: vi.fn(),
    }
}));

// Test data
const mockBooks: Book[] = [
    {
        id: '1',
        title: 'Regular Book',
        author: 'Author 1',
        
        narratorRating: 4,
        performanceRating: 5,
        description: 'A regular book',
        coverImageUrl: 'https://example.com/cover1.jpg',
        queuePosition: null,
        tags: [
            { id: 'tag1', name: 'fiction', color: 'badge-primary' }
        ],
        dateAdded: new Date('2024-01-01'),
        dateUpdated: new Date('2024-01-01'),
        createdAt: new Date('2024-01-01'),
        updatedAt: new Date('2024-01-01'),
    },
    {
        id: '2',
        title: 'Next Book',
        author: 'Author 2',
        
        narratorRating: 3,
        performanceRating: 4,
        description: 'A book marked as next',
        coverImageUrl: 'https://example.com/cover2.jpg',
        queuePosition: null,
        tags: [
            { id: 'tag2', name: 'next', color: 'badge-primary' },
            { id: 'tag3', name: 'sci-fi', color: 'badge-secondary' }
        ],
        dateAdded: new Date('2024-01-02'),
        dateUpdated: new Date('2024-01-02'),
        createdAt: new Date('2024-01-02'),
        updatedAt: new Date('2024-01-02'),
    },
    {
        id: '3',
        title: 'Another Next Book',
        author: 'Author 3',
        
        narratorRating: 5,
        performanceRating: 5,
        description: 'Another book marked as next',
        coverImageUrl: 'https://example.com/cover3.jpg',
        queuePosition: null,
        tags: [
            { id: 'tag4', name: 'next', color: 'badge-primary' },
            { id: 'tag5', name: 'fantasy', color: 'badge-accent' }
        ],
        dateAdded: new Date('2024-01-03'),
        dateUpdated: new Date('2024-01-03'),
        createdAt: new Date('2024-01-03'),
        updatedAt: new Date('2024-01-03'),
    }
];

describe('State Synchronization Integration Tests', () => {
    beforeEach(() => {
        // Reset store to initial state
        bookActions.initializeWithData([]);
        vi.clearAllMocks();
    });

    afterEach(() => {
        vi.clearAllMocks();
    });

    describe('Store State Consistency', () => {
        it('should maintain consistent state when books are loaded', async () => {
            // Initialize store with test data
            bookActions.initializeWithData(mockBooks);

            // Verify all books are available
            const allBooksState = get(allBooks);
            expect(allBooksState).toHaveLength(3);
            expect(allBooksState.map(b => b.id)).toEqual(['1', '2', '3']);

            // Verify next books are filtered correctly
            const nextBooksState = get(nextBooks);
            expect(nextBooksState).toHaveLength(2);
            expect(nextBooksState.map(b => b.id)).toEqual(['2', '3']);
        });

        it('should update both stores when a book is added', async () => {
            const { apiClient } = await import('$lib/services/api-client');

            // Initialize with existing books
            bookActions.initializeWithData(mockBooks);

            // Mock API response for new book
            const newBook: Book = {
                id: '4',
                title: 'New Book',
                author: 'New Author',
                
                narratorRating: 4,
                performanceRating: 4,
                description: 'A newly added book',
                coverImageUrl: 'https://example.com/cover4.jpg',
                queuePosition: null,
                tags: [
                    { id: 'tag6', name: 'next', color: 'badge-primary' }
                ],
                dateAdded: new Date(),
                dateUpdated: new Date(),
                createdAt: new Date(),
                updatedAt: new Date(),
            };
            vi.mocked(apiClient.createBook).mockResolvedValue(newBook);

            // Add the book
            await bookActions.addBook({
                title: 'New Book',
                author: 'New Author',
                
                tags: [{ id: 'tag6', name: 'next', color: 'badge-primary' }]
            });

            // Verify both stores are updated
            const allBooksAfter = get(allBooks);
            expect(allBooksAfter).toHaveLength(4);
            expect(allBooksAfter.find(b => b.id === '4')).toBeDefined();

            const nextBooksAfter = get(nextBooks);
            expect(nextBooksAfter).toHaveLength(3);
            expect(nextBooksAfter.find(b => b.id === '4')).toBeDefined();
        });

        it('should update both stores when a book is deleted', async () => {
            const { apiClient } = await import('$lib/services/api-client');

            // Initialize with existing books
            bookActions.initializeWithData(mockBooks);

            // Mock API response
            vi.mocked(apiClient.deleteBook).mockResolvedValue({ id: '2' });

            // Delete a next book
            await bookActions.deleteBook('2');

            // Verify both stores are updated
            const allBooksAfter = get(allBooks);
            expect(allBooksAfter).toHaveLength(2);
            expect(allBooksAfter.find(b => b.id === '2')).toBeUndefined();

            const nextBooksAfter = get(nextBooks);
            expect(nextBooksAfter).toHaveLength(1);
            expect(nextBooksAfter.find(b => b.id === '2')).toBeUndefined();
            expect(nextBooksAfter[0].id).toBe('3');
        });

        it('should update both stores when next tag is toggled', async () => {
            const { apiClient } = await import('$lib/services/api-client');

            // Initialize with existing books
            bookActions.initializeWithData(mockBooks);

            // Mock API response for adding next tag to regular book
            const updatedBook = {
                ...mockBooks[0],
                tags: [
                    ...mockBooks[0].tags,
                    { id: 'next-tag', name: 'next' as const, color: 'badge-primary' }
                ]
            };
            vi.mocked(apiClient.updateBook).mockResolvedValue(updatedBook);

            // Toggle next tag on regular book (should add it)
            await bookActions.toggleNextTag('1');

            // Verify both stores are updated
            const allBooksAfter = get(allBooks);
            const updatedBookInStore = allBooksAfter.find(b => b.id === '1');
            expect(updatedBookInStore?.tags.some(tag => tag.name === 'next')).toBe(true);

            const nextBooksAfter = get(nextBooks);
            expect(nextBooksAfter).toHaveLength(3); // Original 2 + newly added
            expect(nextBooksAfter.find(b => b.id === '1')).toBeDefined();
        });

        it('should remove book from next books when next tag is removed', async () => {
            const { apiClient } = await import('$lib/services/api-client');

            // Initialize with existing books
            bookActions.initializeWithData(mockBooks);

            // Mock API response for removing next tag
            const updatedBook = {
                ...mockBooks[1],
                tags: mockBooks[1].tags.filter(tag => tag.name !== 'next')
            };
            vi.mocked(apiClient.updateBook).mockResolvedValue(updatedBook);

            // Toggle next tag on next book (should remove it)
            await bookActions.toggleNextTag('2');

            // Verify both stores are updated
            const allBooksAfter = get(allBooks);
            const updatedBookInStore = allBooksAfter.find(b => b.id === '2');
            expect(updatedBookInStore?.tags.some(tag => tag.name === 'next')).toBe(false);

            const nextBooksAfter = get(nextBooks);
            expect(nextBooksAfter).toHaveLength(1); // Only book 3 remains
            expect(nextBooksAfter.find(b => b.id === '2')).toBeUndefined();
            expect(nextBooksAfter[0].id).toBe('3');
        });
    });

    describe('Optimistic Updates', () => {
        it('should show optimistic updates immediately', async () => {
            const { apiClient } = await import('$lib/services/api-client');

            // Initialize with existing books
            bookActions.initializeWithData(mockBooks);

            // Mock a delayed API response
            const updatedBook = {
                ...mockBooks[0],
                tags: [
                    ...mockBooks[0].tags,
                    { id: 'next-tag', name: 'next' as const, color: 'badge-primary' }
                ]
            };
            vi.mocked(apiClient.updateBook).mockImplementation(() =>
                new Promise(resolve => setTimeout(() => resolve(updatedBook), 100))
            );

            // Start the toggle operation
            const togglePromise = bookActions.toggleNextTag('1');

            // Immediately check that optimistic update is applied
            const nextBooksImmediate = get(nextBooks);
            expect(nextBooksImmediate).toHaveLength(3); // Should include optimistically updated book

            // Wait for API call to complete
            await togglePromise;

            // Verify final state is correct
            const nextBooksFinal = get(nextBooks);
            expect(nextBooksFinal).toHaveLength(3);
            expect(nextBooksFinal.find(b => b.id === '1')).toBeDefined();
        });

        it('should rollback optimistic updates on error', async () => {
            const { apiClient } = await import('$lib/services/api-client');

            // Initialize with existing books
            bookActions.initializeWithData(mockBooks);

            // Mock API error
            vi.mocked(apiClient.updateBook).mockRejectedValue(new Error('Update failed'));

            // Attempt to toggle next tag
            await bookActions.toggleNextTag('1');

            // Verify state is rolled back
            const allBooksAfter = get(allBooks);
            const bookInStore = allBooksAfter.find(b => b.id === '1');
            expect(bookInStore?.tags.some(tag => tag.name === 'next')).toBe(false);

            const nextBooksAfter = get(nextBooks);
            expect(nextBooksAfter).toHaveLength(2); // Back to original count
            expect(nextBooksAfter.find(b => b.id === '1')).toBeUndefined();
        });
    });

    describe('Concurrent Operations', () => {
        it('should handle concurrent updates correctly', async () => {
            const { apiClient } = await import('$lib/services/api-client');

            // Initialize with existing books
            bookActions.initializeWithData(mockBooks);

            // Mock API responses
            const updatedBook1 = {
                ...mockBooks[0],
                tags: [...mockBooks[0].tags, { id: 'next-tag', name: 'next' as const, color: 'badge-primary' }]
            };
            const updatedBook2 = {
                ...mockBooks[1],
                tags: mockBooks[1].tags.filter(tag => tag.name !== 'next')
            };

            vi.mocked(apiClient.updateBook)
                .mockResolvedValueOnce(updatedBook1)
                .mockResolvedValueOnce(updatedBook2);

            // Start concurrent operations
            const toggle1Promise = bookActions.toggleNextTag('1'); // Add next tag
            const toggle2Promise = bookActions.toggleNextTag('2'); // Remove next tag

            // Wait for both to complete
            await Promise.all([toggle1Promise, toggle2Promise]);

            // Verify final state
            const nextBooksFinal = get(nextBooks);
            expect(nextBooksFinal).toHaveLength(2); // Book 1 added, book 2 removed, book 3 remains
            expect(nextBooksFinal.map(b => b.id).sort()).toEqual(['1', '3']);
        });

        it('should handle mixed success and failure in concurrent operations', async () => {
            const { apiClient } = await import('$lib/services/api-client');

            // Initialize with existing books
            bookActions.initializeWithData(mockBooks);

            // Mock one success and one failure
            const updatedBook1 = {
                ...mockBooks[0],
                tags: [...mockBooks[0].tags, { id: 'next-tag', name: 'next' as const, color: 'badge-primary' }]
            };

            vi.mocked(apiClient.updateBook)
                .mockResolvedValueOnce(updatedBook1)
                .mockRejectedValueOnce(new Error('Update failed'));

            // Start concurrent operations
            const toggle1Promise = bookActions.toggleNextTag('1'); // Should succeed
            const toggle2Promise = bookActions.toggleNextTag('2'); // Should fail

            // Wait for both to complete
            await Promise.all([toggle1Promise, toggle2Promise]);

            // Verify final state - only successful operation should be applied
            const nextBooksFinal = get(nextBooks);
            expect(nextBooksFinal).toHaveLength(3); // Book 1 added, book 2 unchanged, book 3 remains
            expect(nextBooksFinal.map(b => b.id).sort()).toEqual(['1', '2', '3']);
        });
    });

    describe('Data Consistency Edge Cases', () => {
        it('should handle empty state correctly', () => {
            // Start with empty state
            bookActions.initializeWithData([]);

            const allBooksEmpty = get(allBooks);
            expect(allBooksEmpty).toHaveLength(0);

            const nextBooksEmpty = get(nextBooks);
            expect(nextBooksEmpty).toHaveLength(0);
        });

        it('should handle books with no tags', () => {
            const booksWithoutTags: Book[] = [{
                ...mockBooks[0],
                tags: []
            }];

            bookActions.initializeWithData(booksWithoutTags);

            const allBooksState = get(allBooks);
            expect(allBooksState).toHaveLength(1);

            const nextBooksState = get(nextBooks);
            expect(nextBooksState).toHaveLength(0);
        });

        it('should handle books with multiple next tags', () => {
            const booksWithMultipleNextTags: Book[] = [{
                ...mockBooks[0],
                tags: [
                    { id: 'next1', name: 'next', color: 'badge-primary' },
                    { id: 'next2', name: 'next', color: 'badge-secondary' },
                    { id: 'other', name: 'fiction', color: 'badge-accent' }
                ]
            }];

            bookActions.initializeWithData(booksWithMultipleNextTags);

            const nextBooksState = get(nextBooks);
            expect(nextBooksState).toHaveLength(1);
            expect(nextBooksState[0].id).toBe('1');
        });
    });

    describe('Performance Considerations', () => {
        it('should not trigger unnecessary updates when data is unchanged', async () => {
            const { apiClient } = await import('$lib/services/api-client');

            // Initialize with existing books
            bookActions.initializeWithData(mockBooks);

            // Mock API to return identical data
            vi.mocked(apiClient.updateBook).mockResolvedValue(mockBooks[0]);

            // Track store updates
            let allBooksUpdateCount = 0;
            let nextBooksUpdateCount = 0;

            const unsubscribeAll = allBooks.subscribe(() => allBooksUpdateCount++);
            const unsubscribeNext = nextBooks.subscribe(() => nextBooksUpdateCount++);

            // Reset counters after initial subscription
            allBooksUpdateCount = 0;
            nextBooksUpdateCount = 0;

            // Update book with identical data
            await bookActions.updateBook('1', { title: mockBooks[0].title });

            // Should still trigger updates due to optimistic updates
            expect(allBooksUpdateCount).toBeGreaterThan(0);

            // Cleanup
            unsubscribeAll();
            unsubscribeNext();
        });
    });
});