/**
 * Integration tests for Wishlist page with API
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, fireEvent, waitFor, screen } from '@testing-library/svelte';
import WishlistPage from '../+page.svelte';
import type { Book } from '$lib/types/book';

// Mock the API client
const mockApiClient = {
    getBooks: vi.fn(),
    createBook: vi.fn(),
    updateBook: vi.fn(),
    deleteBook: vi.fn(),
    getTags: vi.fn(),
    healthCheck: vi.fn()
};

vi.mock('$lib/services/api-client', () => ({
    ApiClient: vi.fn(() => mockApiClient),
    ApiClientError: class extends Error {
        constructor(public code: string, message: string, public status?: number) {
            super(message);
        }
    },
    isNetworkError: vi.fn(),
    isValidationError: vi.fn(),
    isNotFoundError: vi.fn(),
    isServerError: vi.fn(),
    getErrorMessage: vi.fn((error) => error.message)
}));

// Mock other services
vi.mock('$lib/services/error-logger', () => ({
    ErrorLogger: {
        error: vi.fn(),
        warn: vi.fn(),
        info: vi.fn()
    }
}));

vi.mock('$lib/services/notification-service', () => ({
    NotificationService: {
        success: vi.fn(),
        error: vi.fn(),
        info: vi.fn()
    }
}));

describe('Wishlist Page Integration', () => {
    let component: any;

    const mockBooks: Book[] = [
        {
            id: 'book-1',
            title: 'Test Book 1',
            author: 'Test Author 1',
            tags: [
                { id: 'tag-1', name: 'funny', color: 'badge-warning' }
            ],
            dateAdded: new Date('2023-01-01'),
            narratorRating: 4.5,
            performanceRating: 4.0
        },
        {
            id: 'book-2',
            title: 'Test Book 2',
            author: 'Test Author 2',
            tags: [
                { id: 'tag-2', name: 'action', color: 'badge-error' }
            ],
            dateAdded: new Date('2023-01-02'),
            narratorRating: 3.5,
            performanceRating: 4.5
        }
    ];

    beforeEach(() => {
        vi.clearAllMocks();
        mockApiClient.getBooks.mockResolvedValue(mockBooks);
        mockApiClient.getTags.mockResolvedValue([]);
    });

    afterEach(() => {
        if (component) {
            component.$destroy();
        }
    });

    describe('Initial Load', () => {
        it('should load and display books from API', async () => {
            component = render(WishlistPage);

            await waitFor(() => {
                expect(mockApiClient.getBooks).toHaveBeenCalled();
            });

            await waitFor(() => {
                expect(screen.getByText('Test Book 1')).toBeInTheDocument();
                expect(screen.getByText('Test Book 2')).toBeInTheDocument();
                expect(screen.getByText('Test Author 1')).toBeInTheDocument();
                expect(screen.getByText('Test Author 2')).toBeInTheDocument();
            });
        });

        it('should show loading state while fetching books', async () => {
            // Make API call hang
            mockApiClient.getBooks.mockImplementation(() => new Promise(() => { }));

            component = render(WishlistPage);

            expect(screen.getByText(/loading/i)).toBeInTheDocument();
        });

        it('should handle API errors gracefully', async () => {
            mockApiClient.getBooks.mockRejectedValue(new Error('API Error'));

            component = render(WishlistPage);

            await waitFor(() => {
                expect(screen.getByText(/error loading books/i)).toBeInTheDocument();
            });
        });
    });

    describe('Book Creation', () => {
        it('should create a new book via API', async () => {
            const newBook: Book = {
                id: 'book-3',
                title: 'New Book',
                author: 'New Author',
                tags: [],
                dateAdded: new Date(),
                narratorRating: 5.0,
                performanceRating: 4.5
            };

            mockApiClient.createBook.mockResolvedValue(newBook);

            component = render(WishlistPage);

            await waitFor(() => {
                expect(screen.getByText('Test Book 1')).toBeInTheDocument();
            });

            // Open add book form
            const addButton = screen.getByRole('button', { name: /add book/i });
            await fireEvent.click(addButton);

            // Fill form and submit
            const titleInput = screen.getByLabelText(/title/i);
            const authorInput = screen.getByLabelText(/author/i);

            await fireEvent.input(titleInput, { target: { value: 'New Book' } });
            await fireEvent.input(authorInput, { target: { value: 'New Author' } });

            const submitButton = screen.getByRole('button', { name: /add book/i });
            await fireEvent.click(submitButton);

            await waitFor(() => {
                expect(mockApiClient.createBook).toHaveBeenCalledWith(
                    expect.objectContaining({
                        title: 'New Book',
                        author: 'New Author'
                    })
                );
            });

            // Should refresh the book list
            await waitFor(() => {
                expect(mockApiClient.getBooks).toHaveBeenCalledTimes(2);
            });
        });

        it('should handle creation errors', async () => {
            mockApiClient.createBook.mockRejectedValue(new Error('Creation failed'));

            component = render(WishlistPage);

            await waitFor(() => {
                expect(screen.getByText('Test Book 1')).toBeInTheDocument();
            });

            // Open add book form
            const addButton = screen.getByRole('button', { name: /add book/i });
            await fireEvent.click(addButton);

            // Fill form and submit
            const titleInput = screen.getByLabelText(/title/i);
            const authorInput = screen.getByLabelText(/author/i);

            await fireEvent.input(titleInput, { target: { value: 'New Book' } });
            await fireEvent.input(authorInput, { target: { value: 'New Author' } });

            const submitButton = screen.getByRole('button', { name: /add book/i });
            await fireEvent.click(submitButton);

            await waitFor(() => {
                expect(screen.getByText(/failed to add book/i)).toBeInTheDocument();
            });
        });
    });

    describe('Book Updates', () => {
        it('should update a book via API', async () => {
            const updatedBook: Book = {
                ...mockBooks[0],
                title: 'Updated Title'
            };

            mockApiClient.updateBook.mockResolvedValue(updatedBook);

            component = render(WishlistPage);

            await waitFor(() => {
                expect(screen.getByText('Test Book 1')).toBeInTheDocument();
            });

            // Click edit button for first book
            const editButtons = screen.getAllByLabelText(/edit/i);
            await fireEvent.click(editButtons[0]);

            // Update title
            const titleInput = screen.getByDisplayValue('Test Book 1');
            await fireEvent.input(titleInput, { target: { value: 'Updated Title' } });

            const updateButton = screen.getByRole('button', { name: /update book/i });
            await fireEvent.click(updateButton);

            await waitFor(() => {
                expect(mockApiClient.updateBook).toHaveBeenCalledWith(
                    'book-1',
                    expect.objectContaining({
                        title: 'Updated Title'
                    })
                );
            });

            // Should refresh the book list
            await waitFor(() => {
                expect(mockApiClient.getBooks).toHaveBeenCalledTimes(2);
            });
        });

        it('should handle update errors', async () => {
            mockApiClient.updateBook.mockRejectedValue(new Error('Update failed'));

            component = render(WishlistPage);

            await waitFor(() => {
                expect(screen.getByText('Test Book 1')).toBeInTheDocument();
            });

            // Click edit button for first book
            const editButtons = screen.getAllByLabelText(/edit/i);
            await fireEvent.click(editButtons[0]);

            // Update title
            const titleInput = screen.getByDisplayValue('Test Book 1');
            await fireEvent.input(titleInput, { target: { value: 'Updated Title' } });

            const updateButton = screen.getByRole('button', { name: /update book/i });
            await fireEvent.click(updateButton);

            await waitFor(() => {
                expect(screen.getByText(/failed to update book/i)).toBeInTheDocument();
            });
        });
    });

    describe('Book Deletion', () => {
        it('should delete a book via API', async () => {
            mockApiClient.deleteBook.mockResolvedValue({ id: 'book-1' });

            component = render(WishlistPage);

            await waitFor(() => {
                expect(screen.getByText('Test Book 1')).toBeInTheDocument();
            });

            // Click delete button for first book
            const deleteButtons = screen.getAllByLabelText(/delete/i);
            await fireEvent.click(deleteButtons[0]);

            // Confirm deletion
            const confirmButton = screen.getByRole('button', { name: /confirm/i });
            await fireEvent.click(confirmButton);

            await waitFor(() => {
                expect(mockApiClient.deleteBook).toHaveBeenCalledWith('book-1');
            });

            // Should refresh the book list
            await waitFor(() => {
                expect(mockApiClient.getBooks).toHaveBeenCalledTimes(2);
            });
        });

        it('should handle deletion errors', async () => {
            mockApiClient.deleteBook.mockRejectedValue(new Error('Deletion failed'));

            component = render(WishlistPage);

            await waitFor(() => {
                expect(screen.getByText('Test Book 1')).toBeInTheDocument();
            });

            // Click delete button for first book
            const deleteButtons = screen.getAllByLabelText(/delete/i);
            await fireEvent.click(deleteButtons[0]);

            // Confirm deletion
            const confirmButton = screen.getByRole('button', { name: /confirm/i });
            await fireEvent.click(confirmButton);

            await waitFor(() => {
                expect(screen.getByText(/failed to delete book/i)).toBeInTheDocument();
            });
        });
    });

    describe('Search and Filtering', () => {
        it('should filter books by search query', async () => {
            component = render(WishlistPage);

            await waitFor(() => {
                expect(screen.getByText('Test Book 1')).toBeInTheDocument();
                expect(screen.getByText('Test Book 2')).toBeInTheDocument();
            });

            // Search for "Book 1"
            const searchInput = screen.getByPlaceholderText(/search books/i);
            await fireEvent.input(searchInput, { target: { value: 'Book 1' } });

            await waitFor(() => {
                expect(screen.getByText('Test Book 1')).toBeInTheDocument();
                expect(screen.queryByText('Test Book 2')).not.toBeInTheDocument();
            });
        });

        it('should filter books by tags', async () => {
            component = render(WishlistPage);

            await waitFor(() => {
                expect(screen.getByText('Test Book 1')).toBeInTheDocument();
                expect(screen.getByText('Test Book 2')).toBeInTheDocument();
            });

            // Filter by "funny" tag
            const funnyTagFilter = screen.getByText('Funny');
            await fireEvent.click(funnyTagFilter);

            await waitFor(() => {
                expect(screen.getByText('Test Book 1')).toBeInTheDocument();
                expect(screen.queryByText('Test Book 2')).not.toBeInTheDocument();
            });
        });
    });

    describe('Error Recovery', () => {
        it('should retry failed operations', async () => {
            // First call fails, second succeeds
            mockApiClient.getBooks
                .mockRejectedValueOnce(new Error('Network error'))
                .mockResolvedValueOnce(mockBooks);

            component = render(WishlistPage);

            await waitFor(() => {
                expect(screen.getByText(/error loading books/i)).toBeInTheDocument();
            });

            // Click retry button
            const retryButton = screen.getByRole('button', { name: /retry/i });
            await fireEvent.click(retryButton);

            await waitFor(() => {
                expect(screen.getByText('Test Book 1')).toBeInTheDocument();
            });

            expect(mockApiClient.getBooks).toHaveBeenCalledTimes(2);
        });

        it('should handle network connectivity issues', async () => {
            mockApiClient.getBooks.mockRejectedValue(new Error('Network error'));

            component = render(WishlistPage);

            await waitFor(() => {
                expect(screen.getByText(/network error/i)).toBeInTheDocument();
                expect(screen.getByText(/check your connection/i)).toBeInTheDocument();
            });
        });
    });

    describe('Performance', () => {
        it('should handle large datasets efficiently', async () => {
            const largeBookSet = Array.from({ length: 1000 }, (_, i) => ({
                id: `book-${i}`,
                title: `Book ${i}`,
                author: `Author ${i}`,
                tags: [],
                dateAdded: new Date(),
                narratorRating: Math.random() * 5,
                performanceRating: Math.random() * 5
            }));

            mockApiClient.getBooks.mockResolvedValue(largeBookSet);

            const startTime = performance.now();
            component = render(WishlistPage);

            await waitFor(() => {
                expect(screen.getByText('Book 0')).toBeInTheDocument();
            });

            const endTime = performance.now();
            const renderTime = endTime - startTime;

            // Should render within reasonable time (adjust threshold as needed)
            expect(renderTime).toBeLessThan(2000); // 2 seconds
        });

        it('should debounce search input', async () => {
            component = render(WishlistPage);

            await waitFor(() => {
                expect(screen.getByText('Test Book 1')).toBeInTheDocument();
            });

            const searchInput = screen.getByPlaceholderText(/search books/i);

            // Type multiple characters quickly
            await fireEvent.input(searchInput, { target: { value: 'T' } });
            await fireEvent.input(searchInput, { target: { value: 'Te' } });
            await fireEvent.input(searchInput, { target: { value: 'Tes' } });
            await fireEvent.input(searchInput, { target: { value: 'Test' } });

            // Should only trigger search after debounce delay
            await waitFor(() => {
                expect(screen.getByText('Test Book 1')).toBeInTheDocument();
            }, { timeout: 1000 });
        });
    });
});