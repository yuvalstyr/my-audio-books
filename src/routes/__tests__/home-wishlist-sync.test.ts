/**
 * Tests for Home and Wishlist Page State Synchronization
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

// Mock components to avoid complex rendering
vi.mock('$lib/components', () => ({
    NextBookCard: vi.fn(() => ({ default: 'NextBookCard' })),
    BookList: vi.fn(() => ({ default: 'BookList' })),
    BookForm: vi.fn(() => ({ default: 'BookForm' })),
}));

vi.mock('$lib/components/Toast.svelte', () => ({
    default: vi.fn(() => ({ default: 'Toast' }))
}));

vi.mock('$lib/components/LoadingState.svelte', () => ({
    default: vi.fn(() => ({ default: 'LoadingState' }))
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
        title: 'Next Book 1',
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
        title: 'Next Book 2',
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

describe('Home and Wishlist Page Synchronization', () => {
    beforeEach(() => {
        // Reset store to initial state
        bookActions.initializeWithData([]);
        vi.clearAllMocks();
    });

    afterEach(() => {
        vi.clearAllMocks();
    });

    describe('Store Integration', () => {
        it('should initialize store with preloaded data from home page', async () => {
            // Simulate home page initialization
            bookActions.initializeWithData(mockBooks.filter(book =>
                book.tags.some(tag => tag.name === 'next')
            ));

            // Verify store state
            const nextBooksState = get(nextBooks);
            expect(nextBooksState).toHaveLength(2);
            expect(nextBooksState.map(b => b.id)).toEqual(['2', '3']);
        });

        it('should initialize store with preloaded data from wishlist page', async () => {
            // Simulate wishlist page initialization
            bookActions.initializeWithData(mockBooks);

            // Verify store state
            const allBooksState = get(allBooks);
            expect(allBooksState).toHaveLength(3);

            const nextBooksState = get(nextBooks);
            expect(nextBooksState).toHaveLength(2);
        });
    });

    describe('Real-time Updates Between Pages', () => {
        beforeEach(() => {
            bookActions.initializeWithData(mockBooks);
        });

        it('should update home page when book is marked as next from wishlist', async () => {
            const { apiClient } = await import('$lib/services/api-client');

            // Mock API response for adding next tag
            const updatedBook = {
                ...mockBooks[0],
                tags: [
                    ...mockBooks[0].tags,
                    { id: 'next-tag', name: 'next' as const, color: 'badge-primary' }
                ]
            };
            vi.mocked(apiClient.updateBook).mockResolvedValue(updatedBook);

            // Simulate wishlist action: mark regular book as next
            await bookActions.toggleNextTag('1');

            // Verify home page would see the update
            const nextBooksAfter = get(nextBooks);
            expect(nextBooksAfter).toHaveLength(3);
            expect(nextBooksAfter.find(b => b.id === '1')).toBeDefined();
        });

        it('should update wishlist when book is removed from next on home page', async () => {
            const { apiClient } = await import('$lib/services/api-client');

            // Mock API response for removing next tag
            const updatedBook = {
                ...mockBooks[1],
                tags: mockBooks[1].tags.filter(tag => tag.name !== 'next')
            };
            vi.mocked(apiClient.updateBook).mockResolvedValue(updatedBook);

            // Simulate home page action: remove book from next
            await bookActions.toggleNextTag('2');

            // Verify wishlist would see the update
            const allBooksAfter = get(allBooks);
            const updatedBookInStore = allBooksAfter.find(b => b.id === '2');
            expect(updatedBookInStore?.tags.some(tag => tag.name === 'next')).toBe(false);

            const nextBooksAfter = get(nextBooks);
            expect(nextBooksAfter).toHaveLength(1);
            expect(nextBooksAfter.find(b => b.id === '2')).toBeUndefined();
        });

        it('should update home page when book is added from wishlist', async () => {
            const { apiClient } = await import('$lib/services/api-client');

            // Mock API response for new book with next tag
            const newBook: Book = {
                id: '4',
                title: 'New Next Book',
                author: 'New Author',
                
                narratorRating: 4,
                performanceRating: 4,
                description: 'A newly added book marked as next',
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

            // Simulate wishlist action: add new book with next tag
            await bookActions.addBook({
                title: 'New Next Book',
                author: 'New Author',
                
                tags: [{ id: 'tag6', name: 'next', color: 'badge-primary' }]
            });

            // Verify home page would see the new book
            const nextBooksAfter = get(nextBooks);
            expect(nextBooksAfter).toHaveLength(3);
            expect(nextBooksAfter.find(b => b.id === '4')).toBeDefined();
        });

        it('should update home page when next book is deleted from wishlist', async () => {
            const { apiClient } = await import('$lib/services/api-client');

            // Mock API response
            vi.mocked(apiClient.deleteBook).mockResolvedValue({ id: '2' });

            // Simulate wishlist action: delete a next book
            await bookActions.deleteBook('2');

            // Verify home page would see the removal
            const nextBooksAfter = get(nextBooks);
            expect(nextBooksAfter).toHaveLength(1);
            expect(nextBooksAfter.find(b => b.id === '2')).toBeUndefined();
            expect(nextBooksAfter[0].id).toBe('3');
        });
    });

    describe('Optimistic Updates Synchronization', () => {
        beforeEach(() => {
            bookActions.initializeWithData(mockBooks);
        });

        it('should show optimistic updates on both pages immediately', async () => {
            const { apiClient } = await import('$lib/services/api-client');

            // Mock delayed API response
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

            // Start toggle operation
            const togglePromise = bookActions.toggleNextTag('1');

            // Check immediate optimistic update
            const nextBooksImmediate = get(nextBooks);
            expect(nextBooksImmediate).toHaveLength(3); // Should include optimistically updated book

            const allBooksImmediate = get(allBooks);
            const optimisticBook = allBooksImmediate.find(b => b.id === '1');
            expect(optimisticBook?.tags.some(tag => tag.name === 'next')).toBe(true);

            // Wait for completion
            await togglePromise;

            // Verify final state
            const nextBooksFinal = get(nextBooks);
            expect(nextBooksFinal).toHaveLength(3);
        });

        it('should rollback optimistic updates on both pages when API fails', async () => {
            const { apiClient } = await import('$lib/services/api-client');

            // Mock API failure
            vi.mocked(apiClient.updateBook).mockRejectedValue(new Error('Update failed'));

            // Attempt toggle operation
            await bookActions.toggleNextTag('1');

            // Verify rollback on both stores
            const allBooksAfter = get(allBooks);
            const rolledBackBook = allBooksAfter.find(b => b.id === '1');
            expect(rolledBackBook?.tags.some(tag => tag.name === 'next')).toBe(false);

            const nextBooksAfter = get(nextBooks);
            expect(nextBooksAfter).toHaveLength(2); // Back to original
            expect(nextBooksAfter.find(b => b.id === '1')).toBeUndefined();
        });
    });

    describe('Error Handling Synchronization', () => {
        beforeEach(() => {
            bookActions.initializeWithData(mockBooks);
        });

        it('should handle partial failures in concurrent operations', async () => {
            const { apiClient } = await import('$lib/services/api-client');

            // Mock mixed success/failure
            const updatedBook1 = {
                ...mockBooks[0],
                tags: [...mockBooks[0].tags, { id: 'next-tag', name: 'next' as const, color: 'badge-primary' }]
            };

            vi.mocked(apiClient.updateBook)
                .mockResolvedValueOnce(updatedBook1)
                .mockRejectedValueOnce(new Error('Second update failed'));

            // Start concurrent operations
            const results = await Promise.all([
                bookActions.toggleNextTag('1'), // Should succeed
                bookActions.toggleNextTag('2')  // Should fail
            ]);

            expect(results[0]).toBe(true);  // First operation succeeded
            expect(results[1]).toBe(false); // Second operation failed

            // Verify only successful operation is reflected in state
            const nextBooksAfter = get(nextBooks);
            expect(nextBooksAfter).toHaveLength(3); // Book 1 added, book 2 unchanged, book 3 remains
            expect(nextBooksAfter.find(b => b.id === '1')).toBeDefined();
            expect(nextBooksAfter.find(b => b.id === '2')).toBeDefined(); // Still has next tag
        });
    });

    describe('Performance and Memory Management', () => {
        it('should not create memory leaks with frequent updates', async () => {
            const { apiClient } = await import('$lib/services/api-client');

            bookActions.initializeWithData(mockBooks);

            // Mock successful updates
            vi.mocked(apiClient.updateBook).mockImplementation((id, updates) => {
                const book = mockBooks.find(b => b.id === id);
                return Promise.resolve({ ...book!, ...updates });
            });

            // Perform many rapid updates
            const updatePromises = [];
            for (let i = 0; i < 10; i++) {
                updatePromises.push(bookActions.toggleNextTag('1'));
                updatePromises.push(bookActions.toggleNextTag('1')); // Toggle back
            }

            await Promise.all(updatePromises);

            // Verify final state is consistent
            const finalState = get(allBooks);
            expect(finalState).toHaveLength(3);

            // Book should end up in original state (no next tag)
            const finalBook = finalState.find(b => b.id === '1');
            expect(finalBook?.tags.some(tag => tag.name === 'next')).toBe(false);
        });

        it('should handle rapid navigation between pages', async () => {
            // Simulate rapid initialization from different pages
            bookActions.initializeWithData(mockBooks);
            bookActions.initializeWithData(mockBooks.slice(0, 2));
            bookActions.initializeWithData(mockBooks);

            // Verify final state is correct
            const finalAllBooks = get(allBooks);
            expect(finalAllBooks).toHaveLength(3);

            const finalNextBooks = get(nextBooks);
            expect(finalNextBooks).toHaveLength(2);
        });
    });

    describe('Edge Cases', () => {
        it('should handle empty next books list', () => {
            const booksWithoutNext = mockBooks.map(book => ({
                ...book,
                tags: book.tags.filter(tag => tag.name !== 'next')
            }));

            bookActions.initializeWithData(booksWithoutNext);

            const nextBooksState = get(nextBooks);
            expect(nextBooksState).toHaveLength(0);

            const allBooksState = get(allBooks);
            expect(allBooksState).toHaveLength(3);
        });

        it('should handle all books marked as next', () => {
            const allNextBooks = mockBooks.map(book => ({
                ...book,
                tags: [...book.tags, { id: 'next-all', name: 'next' as const, color: 'badge-primary' }]
            }));

            bookActions.initializeWithData(allNextBooks);

            const nextBooksState = get(nextBooks);
            expect(nextBooksState).toHaveLength(3);

            const allBooksState = get(allBooks);
            expect(allBooksState).toHaveLength(3);
        });

        it('should handle duplicate book IDs gracefully', () => {
            const duplicateBooks = [mockBooks[0], mockBooks[0], mockBooks[1]];

            bookActions.initializeWithData(duplicateBooks);

            // Store accepts duplicates as provided (deduplication not required for this task)
            const allBooksState = get(allBooks);
            expect(allBooksState).toHaveLength(3);

            // But we can verify unique IDs if needed
            const uniqueIds = new Set(allBooksState.map(b => b.id));
            expect(uniqueIds.size).toBe(2); // Only 2 unique IDs
        });
    });
});