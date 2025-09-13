/**
 * Tests for Book Store - Real-time State Synchronization
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { get } from 'svelte/store';
import { bookStore, bookActions, allBooks, nextBooks, isLoading, storeError, updatingBooks } from '../book-store';
import type { Book, BookTag } from '$lib/types/book';

// Mock the API client
vi.mock('$lib/services/api-client', () => ({
    apiClient: {
        getBooks: vi.fn(),
        createBook: vi.fn(),
        updateBook: vi.fn(),
        deleteBook: vi.fn(),
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
        title: 'Test Book 1',
        author: 'Test Author 1',
        audibleUrl: 'https://example.com/1',
        narratorRating: 4,
        performanceRating: 5,
        description: 'Test description 1',
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
        title: 'Test Book 2',
        author: 'Test Author 2',
        audibleUrl: 'https://example.com/2',
        narratorRating: 3,
        performanceRating: 4,
        description: 'Test description 2',
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
    }
];

describe('Book Store', () => {
    beforeEach(() => {
        // Reset store to initial state
        bookStore.set({
            books: [],
            loading: false,
            error: null,
            lastUpdated: null,
            updatingBooks: new Set()
        });

        // Clear all mocks
        vi.clearAllMocks();
    });

    afterEach(() => {
        vi.clearAllMocks();
    });

    describe('Store Initialization', () => {
        it('should have correct initial state', () => {
            const state = get(bookStore);
            expect(state.books).toEqual([]);
            expect(state.loading).toBe(false);
            expect(state.error).toBe(null);
            expect(state.lastUpdated).toBe(null);
            expect(state.updatingBooks.size).toBe(0);
        });

        it('should initialize with preloaded data', () => {
            bookActions.initializeWithData(mockBooks);

            const state = get(bookStore);
            expect(state.books).toEqual(mockBooks);
            expect(state.loading).toBe(false);
            expect(state.error).toBe(null);
            expect(state.lastUpdated).toBeInstanceOf(Date);
        });
    });

    describe('Derived Stores', () => {
        beforeEach(() => {
            bookActions.initializeWithData(mockBooks);
        });

        it('should provide all books through allBooks store', () => {
            const books = get(allBooks);
            expect(books).toEqual(mockBooks);
        });

        it('should filter next books correctly', () => {
            const next = get(nextBooks);
            expect(next).toHaveLength(1);
            expect(next[0].id).toBe('2');
            expect(next[0].tags.some(tag => tag.name === 'next')).toBe(true);
        });

        it('should provide loading state', () => {
            expect(get(isLoading)).toBe(false);

            bookStore.update(state => ({ ...state, loading: true }));
            expect(get(isLoading)).toBe(true);
        });

        it('should provide error state', () => {
            expect(get(storeError)).toBe(null);

            bookStore.update(state => ({ ...state, error: 'Test error' }));
            expect(get(storeError)).toBe('Test error');
        });

        it('should provide updating books set', () => {
            expect(get(updatingBooks).size).toBe(0);

            bookStore.update(state => ({
                ...state,
                updatingBooks: new Set(['1', '2'])
            }));

            const updating = get(updatingBooks);
            expect(updating.has('1')).toBe(true);
            expect(updating.has('2')).toBe(true);
        });
    });

    describe('Load Books', () => {
        it('should load books successfully', async () => {
            const { apiClient } = await import('$lib/services/api-client');
            vi.mocked(apiClient.getBooks).mockResolvedValue(mockBooks);

            await bookActions.loadBooks();

            const state = get(bookStore);
            expect(state.books).toEqual(mockBooks);
            expect(state.loading).toBe(false);
            expect(state.error).toBe(null);
            expect(state.lastUpdated).toBeInstanceOf(Date);
        });

        it('should handle loading errors', async () => {
            const { apiClient } = await import('$lib/services/api-client');
            const error = new Error('Network error');
            vi.mocked(apiClient.getBooks).mockRejectedValue(error);

            await bookActions.loadBooks();

            const state = get(bookStore);
            expect(state.books).toEqual([]);
            expect(state.loading).toBe(false);
            expect(state.error).toBe('Network error');
        });

        it('should prevent multiple simultaneous loads', async () => {
            const { apiClient } = await import('$lib/services/api-client');
            vi.mocked(apiClient.getBooks).mockImplementation(() =>
                new Promise(resolve => setTimeout(() => resolve(mockBooks), 100))
            );

            // Start two loads simultaneously
            const promise1 = bookActions.loadBooks();
            const promise2 = bookActions.loadBooks();

            await Promise.all([promise1, promise2]);

            // API should only be called once
            expect(apiClient.getBooks).toHaveBeenCalledTimes(1);
        });

        it('should skip loading if data is recent and not forcing refresh', async () => {
            const { apiClient } = await import('$lib/services/api-client');

            // Initialize with recent data
            bookStore.update(state => ({
                ...state,
                books: mockBooks,
                lastUpdated: new Date() // Very recent
            }));

            await bookActions.loadBooks(false);

            // Should not call API
            expect(apiClient.getBooks).not.toHaveBeenCalled();
        });

        it('should force refresh when requested', async () => {
            const { apiClient } = await import('$lib/services/api-client');
            vi.mocked(apiClient.getBooks).mockResolvedValue(mockBooks);

            // Initialize with recent data
            bookStore.update(state => ({
                ...state,
                books: mockBooks,
                lastUpdated: new Date()
            }));

            await bookActions.loadBooks(true);

            // Should call API even with recent data
            expect(apiClient.getBooks).toHaveBeenCalledTimes(1);
        });
    });

    describe('Add Book', () => {
        it('should add book with optimistic updates', async () => {
            const { apiClient } = await import('$lib/services/api-client');
            const newBookInput = {
                title: 'New Book',
                author: 'New Author',
                audibleUrl: 'https://example.com/new',
                tags: []
            };
            const apiResponse = { ...mockBooks[0], id: '3', ...newBookInput };
            vi.mocked(apiClient.createBook).mockResolvedValue(apiResponse);

            const result = await bookActions.addBook(newBookInput);

            expect(result).toEqual(apiResponse);

            const state = get(bookStore);
            expect(state.books).toContainEqual(apiResponse);
        });

        it('should handle add book errors with rollback', async () => {
            const { apiClient } = await import('$lib/services/api-client');
            const newBookInput = {
                title: 'New Book',
                author: 'New Author',
                audibleUrl: 'https://example.com/new',
                tags: []
            };
            const error = new Error('Create failed');
            vi.mocked(apiClient.createBook).mockRejectedValue(error);

            const result = await bookActions.addBook(newBookInput);

            expect(result).toBe(null);

            const state = get(bookStore);
            expect(state.books).toEqual([]); // Should be rolled back
        });
    });

    describe('Update Book', () => {
        beforeEach(() => {
            bookActions.initializeWithData(mockBooks);
        });

        it('should update book with optimistic updates', async () => {
            const { apiClient } = await import('$lib/services/api-client');
            const updates = { title: 'Updated Title' };
            const updatedBook = { ...mockBooks[0], ...updates };
            vi.mocked(apiClient.updateBook).mockResolvedValue(updatedBook);

            const result = await bookActions.updateBook('1', updates);

            expect(result).toEqual(updatedBook);

            const state = get(bookStore);
            const book = state.books.find(b => b.id === '1');
            expect(book?.title).toBe('Updated Title');
        });

        it('should handle update errors with rollback', async () => {
            const { apiClient } = await import('$lib/services/api-client');
            const updates = { title: 'Updated Title' };
            const error = new Error('Update failed');
            vi.mocked(apiClient.updateBook).mockRejectedValue(error);

            const result = await bookActions.updateBook('1', updates);

            expect(result).toBe(null);

            const state = get(bookStore);
            const book = state.books.find(b => b.id === '1');
            expect(book?.title).toBe('Test Book 1'); // Should be rolled back
        });

        it('should track updating state during update', async () => {
            const { apiClient } = await import('$lib/services/api-client');
            const updates = { title: 'Updated Title' };

            // Mock a delayed response
            vi.mocked(apiClient.updateBook).mockImplementation(() =>
                new Promise(resolve =>
                    setTimeout(() => resolve({ ...mockBooks[0], ...updates }), 50)
                )
            );

            const updatePromise = bookActions.updateBook('1', updates);

            // Check updating state is set
            const updatingState = get(updatingBooks);
            expect(updatingState.has('1')).toBe(true);

            await updatePromise;

            // Check updating state is cleared
            const finalUpdatingState = get(updatingBooks);
            expect(finalUpdatingState.has('1')).toBe(false);
        });
    });

    describe('Toggle Next Tag', () => {
        beforeEach(() => {
            bookActions.initializeWithData(mockBooks);
        });

        it('should add next tag when not present', async () => {
            const { apiClient } = await import('$lib/services/api-client');
            const bookWithNextTag = {
                ...mockBooks[0],
                tags: [
                    ...mockBooks[0].tags,
                    { id: 'next-tag', name: 'next' as const, color: 'badge-primary' }
                ]
            };
            vi.mocked(apiClient.updateBook).mockResolvedValue(bookWithNextTag);

            const result = await bookActions.toggleNextTag('1');

            expect(result).toBe(true);

            const nextBooksAfter = get(nextBooks);
            expect(nextBooksAfter).toHaveLength(2); // Original book 2 + book 1
            expect(nextBooksAfter.some(book => book.id === '1')).toBe(true);
        });

        it('should remove next tag when present', async () => {
            const { apiClient } = await import('$lib/services/api-client');
            const bookWithoutNextTag = {
                ...mockBooks[1],
                tags: mockBooks[1].tags.filter(tag => tag.name !== 'next')
            };
            vi.mocked(apiClient.updateBook).mockResolvedValue(bookWithoutNextTag);

            const result = await bookActions.toggleNextTag('2');

            expect(result).toBe(true);

            const nextBooksAfter = get(nextBooks);
            expect(nextBooksAfter).toHaveLength(0); // No next books
        });

        it('should handle toggle errors', async () => {
            const { apiClient } = await import('$lib/services/api-client');
            const error = new Error('Toggle failed');
            vi.mocked(apiClient.updateBook).mockRejectedValue(error);

            const result = await bookActions.toggleNextTag('1');

            expect(result).toBe(false);

            // State should be rolled back
            const nextBooksAfter = get(nextBooks);
            expect(nextBooksAfter).toHaveLength(1); // Only original book 2
        });
    });

    describe('Delete Book', () => {
        beforeEach(() => {
            bookActions.initializeWithData(mockBooks);
        });

        it('should delete book with optimistic updates', async () => {
            const { apiClient } = await import('$lib/services/api-client');
            vi.mocked(apiClient.deleteBook).mockResolvedValue({ id: '1' });

            const result = await bookActions.deleteBook('1');

            expect(result).toBe(true);

            const state = get(bookStore);
            expect(state.books).toHaveLength(1);
            expect(state.books.find(b => b.id === '1')).toBeUndefined();
        });

        it('should handle delete errors with rollback', async () => {
            const { apiClient } = await import('$lib/services/api-client');
            const error = new Error('Delete failed');
            vi.mocked(apiClient.deleteBook).mockRejectedValue(error);

            const result = await bookActions.deleteBook('1');

            expect(result).toBe(false);

            const state = get(bookStore);
            expect(state.books).toHaveLength(2); // Should be rolled back
            expect(state.books.find(b => b.id === '1')).toBeDefined();
        });
    });

    describe('Error Handling', () => {
        it('should clear error state', () => {
            bookStore.update(state => ({ ...state, error: 'Test error' }));

            bookActions.clearError();

            const state = get(bookStore);
            expect(state.error).toBe(null);
        });
    });

    describe('State Consistency', () => {
        it('should maintain consistent state across multiple operations', async () => {
            const { apiClient } = await import('$lib/services/api-client');

            // Mock API responses
            vi.mocked(apiClient.createBook).mockResolvedValue({
                ...mockBooks[0],
                id: '3',
                title: 'New Book'
            });
            vi.mocked(apiClient.updateBook).mockResolvedValue({
                ...mockBooks[0],
                title: 'Updated Book'
            });
            vi.mocked(apiClient.deleteBook).mockResolvedValue({ id: '1' });

            // Initialize with data
            bookActions.initializeWithData(mockBooks);
            expect(get(allBooks)).toHaveLength(2);
            expect(get(nextBooks)).toHaveLength(1);

            // Add a book
            await bookActions.addBook({
                title: 'New Book',
                author: 'New Author',
                audibleUrl: 'https://example.com/new',
                tags: []
            });
            expect(get(allBooks)).toHaveLength(3);

            // Update a book
            await bookActions.updateBook('1', { title: 'Updated Book' });
            const updatedBook = get(allBooks).find(b => b.id === '1');
            expect(updatedBook?.title).toBe('Updated Book');

            // Delete a book
            await bookActions.deleteBook('1');
            expect(get(allBooks)).toHaveLength(2);
            expect(get(allBooks).find(b => b.id === '1')).toBeUndefined();

            // Verify next books are still consistent
            expect(get(nextBooks)).toHaveLength(1);
        });
    });
});