/**
 * Shared Book Store for Real-time State Synchronization
 * Provides centralized state management for books across home and wishlist pages
 */

import { writable, derived, get } from 'svelte/store';
import type { Book, BookTag } from '$lib/types/book';
import { apiClient, getErrorMessage } from '$lib/services/api-client';
import { ErrorLogger } from '$lib/services/error-logger';
import { NotificationService } from '$lib/services/notification-service';

// Store state interface
interface BookStoreState {
    books: Book[];
    loading: boolean;
    error: string | null;
    lastUpdated: Date | null;
    updatingBooks: Set<string>;
}

// Initial state
const initialState: BookStoreState = {
    books: [],
    loading: false,
    error: null,
    lastUpdated: null,
    updatingBooks: new Set()
};

// Create the main book store
const bookStore = writable<BookStoreState>(initialState);

// Derived stores for specific book collections
export const allBooks = derived(bookStore, $store => $store.books);
export const nextBooks = derived(bookStore, $store =>
    $store.books.filter(book => book.tags.some(tag => tag.name === 'next'))
);
export const isLoading = derived(bookStore, $store => $store.loading);
export const storeError = derived(bookStore, $store => $store.error);
export const updatingBooks = derived(bookStore, $store => $store.updatingBooks);

// Book store actions
export const bookActions = {
    /**
     * Load all books from API
     */
    async loadBooks(forceRefresh = false): Promise<void> {
        const currentState = get(bookStore);

        // Prevent multiple simultaneous loads
        if (currentState.loading) return;

        // Skip if we have recent data and not forcing refresh
        if (!forceRefresh && currentState.books.length > 0 && currentState.lastUpdated) {
            const timeSinceUpdate = Date.now() - currentState.lastUpdated.getTime();
            if (timeSinceUpdate < 30000) { // 30 seconds
                ErrorLogger.debug('Using cached book data', 'BookStore.loadBooks');
                return;
            }
        }

        bookStore.update(state => ({
            ...state,
            loading: true,
            error: null
        }));

        try {
            const books = await apiClient.getBooks();

            bookStore.update(state => ({
                ...state,
                books,
                loading: false,
                error: null,
                lastUpdated: new Date()
            }));

            ErrorLogger.debug(
                `Loaded ${books.length} books into store`,
                'BookStore.loadBooks'
            );

            if (forceRefresh) {
                NotificationService.info('Data Refreshed', `Loaded ${books.length} books`);
            }
        } catch (err) {
            const errorMessage = getErrorMessage(err);

            bookStore.update(state => ({
                ...state,
                loading: false,
                error: errorMessage
            }));

            ErrorLogger.error(
                `Failed to load books: ${errorMessage}`,
                err instanceof Error ? err : undefined,
                'BookStore.loadBooks'
            );

            NotificationService.error('Load Error', errorMessage);
        }
    },

    /**
     * Add a new book with optimistic updates
     */
    async addBook(bookInput: any): Promise<Book | null> {
        // Create optimistic book
        const tempId = `temp_${Date.now()}`;
        const optimisticBook: Book = {
            id: tempId,
            title: bookInput.title,
            author: bookInput.author,
            audibleUrl: bookInput.audibleUrl,
            narratorRating: bookInput.narratorRating,
            performanceRating: bookInput.performanceRating,
            description: bookInput.description,
            coverImageUrl: bookInput.coverImageUrl,
            queuePosition: bookInput.queuePosition,
            tags: bookInput.tags || [],
            dateAdded: new Date(),
        };

        // Add optimistic book immediately
        bookStore.update(state => ({
            ...state,
            books: [...state.books, optimisticBook]
        }));

        try {
            const apiBook = await apiClient.createBook(bookInput);

            // Replace optimistic book with real book
            bookStore.update(state => ({
                ...state,
                books: state.books.map(book =>
                    book.id === tempId ? apiBook : book
                )
            }));

            ErrorLogger.info(`Added book: ${apiBook.title}`, 'BookStore.addBook');
            NotificationService.operationFeedback('create', true, apiBook.title);

            return apiBook;
        } catch (err) {
            // Remove optimistic book on error
            bookStore.update(state => ({
                ...state,
                books: state.books.filter(book => book.id !== tempId)
            }));

            const errorMessage = getErrorMessage(err);
            ErrorLogger.error(
                `Failed to add book: ${errorMessage}`,
                err instanceof Error ? err : undefined,
                'BookStore.addBook'
            );
            NotificationService.operationFeedback('create', false, bookInput.title, errorMessage);

            return null;
        }
    },

    /**
     * Update a book with optimistic updates
     */
    async updateBook(bookId: string, updates: any): Promise<Book | null> {
        const currentState = get(bookStore);
        const originalBook = currentState.books.find(book => book.id === bookId);

        if (!originalBook) {
            ErrorLogger.error(`Book not found: ${bookId}`, undefined, 'BookStore.updateBook');
            return null;
        }

        // Track updating state
        bookStore.update(state => ({
            ...state,
            updatingBooks: new Set([...state.updatingBooks, bookId])
        }));

        // Apply optimistic update
        const optimisticBook = { ...originalBook, ...updates };
        bookStore.update(state => ({
            ...state,
            books: state.books.map(book =>
                book.id === bookId ? optimisticBook : book
            )
        }));

        try {
            const apiBook = await apiClient.updateBook(bookId, updates);

            // Replace optimistic book with API response
            bookStore.update(state => ({
                ...state,
                books: state.books.map(book =>
                    book.id === bookId ? apiBook : book
                ),
                updatingBooks: new Set([...state.updatingBooks].filter(id => id !== bookId))
            }));

            ErrorLogger.debug(`Updated book: ${apiBook.title}`, 'BookStore.updateBook');

            return apiBook;
        } catch (err) {
            // Rollback optimistic update
            bookStore.update(state => ({
                ...state,
                books: state.books.map(book =>
                    book.id === bookId ? originalBook : book
                ),
                updatingBooks: new Set([...state.updatingBooks].filter(id => id !== bookId))
            }));

            const errorMessage = getErrorMessage(err);
            ErrorLogger.error(
                `Failed to update book: ${errorMessage}`,
                err instanceof Error ? err : undefined,
                'BookStore.updateBook'
            );
            NotificationService.error('Update Failed', errorMessage);

            return null;
        }
    },

    /**
     * Toggle "next" tag on a book with optimistic updates
     */
    async toggleNextTag(bookId: string): Promise<boolean> {
        const currentState = get(bookStore);
        const book = currentState.books.find(b => b.id === bookId);

        if (!book) {
            ErrorLogger.error(`Book not found: ${bookId}`, undefined, 'BookStore.toggleNextTag');
            return false;
        }

        const hasNextTag = book.tags.some(tag => tag.name === 'next');
        let updatedTags: BookTag[];

        if (hasNextTag) {
            // Remove "next" tag
            updatedTags = book.tags.filter(tag => tag.name !== 'next');
        } else {
            // Add "next" tag
            updatedTags = [
                ...book.tags,
                {
                    id: `tag-next-${Date.now()}`,
                    name: 'next' as const,
                    color: 'badge-primary',
                }
            ];
        }

        const updatedBook = await this.updateBook(bookId, { tags: updatedTags });

        if (updatedBook) {
            const action = hasNextTag ? 'removed from' : 'added to';
            NotificationService.info(
                'Queue Updated',
                `${book.title} ${action} reading queue`
            );
            return true;
        }

        return false;
    },

    /**
     * Delete a book with optimistic updates
     */
    async deleteBook(bookId: string): Promise<boolean> {
        const currentState = get(bookStore);
        const book = currentState.books.find(b => b.id === bookId);

        if (!book) {
            ErrorLogger.error(`Book not found: ${bookId}`, undefined, 'BookStore.deleteBook');
            return false;
        }

        const bookTitle = book.title;
        const originalBooks = currentState.books;

        // Track deleting state
        bookStore.update(state => ({
            ...state,
            updatingBooks: new Set([...state.updatingBooks, bookId])
        }));

        // Optimistic removal
        bookStore.update(state => ({
            ...state,
            books: state.books.filter(b => b.id !== bookId)
        }));

        try {
            await apiClient.deleteBook(bookId);

            // Clear updating state
            bookStore.update(state => ({
                ...state,
                updatingBooks: new Set([...state.updatingBooks].filter(id => id !== bookId))
            }));

            ErrorLogger.info(`Deleted book: ${bookTitle}`, 'BookStore.deleteBook');
            NotificationService.operationFeedback('delete', true, bookTitle);

            return true;
        } catch (err) {
            // Rollback optimistic removal
            bookStore.update(state => ({
                ...state,
                books: originalBooks,
                updatingBooks: new Set([...state.updatingBooks].filter(id => id !== bookId))
            }));

            const errorMessage = getErrorMessage(err);
            ErrorLogger.error(
                `Failed to delete book: ${errorMessage}`,
                err instanceof Error ? err : undefined,
                'BookStore.deleteBook'
            );
            NotificationService.operationFeedback('delete', false, bookTitle, errorMessage);

            return false;
        }
    },

    /**
     * Clear error state
     */
    clearError(): void {
        bookStore.update(state => ({
            ...state,
            error: null
        }));
    },

    /**
     * Initialize store with preloaded data
     */
    initializeWithData(books: Book[]): void {
        bookStore.update(state => ({
            ...state,
            books,
            loading: false,
            error: null,
            lastUpdated: new Date()
        }));

        ErrorLogger.debug(
            `Initialized book store with ${books.length} books`,
            'BookStore.initializeWithData'
        );
    },

    /**
     * Get current store state
     */
    getState(): BookStoreState {
        return get(bookStore);
    }
};

// Export the store
export { bookStore };