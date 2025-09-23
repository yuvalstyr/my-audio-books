/**
 * End-to-end tests for complete user workflows
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, fireEvent, waitFor, screen } from '@testing-library/svelte';
import WishlistPage from '../../routes/wishlist/+page.svelte';
import type { Book } from '$lib/types/book';

// Mock the entire API client module
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
    isNetworkError: vi.fn((error) => error.code === 'NETWORK_ERROR'),
    isValidationError: vi.fn((error) => error.code === 'VALIDATION_ERROR'),
    isNotFoundError: vi.fn((error) => error.code?.includes('NOT_FOUND')),
    isServerError: vi.fn((error) => error.status >= 500),
    getErrorMessage: vi.fn((error) => {
        if (error.code === 'NETWORK_ERROR') return 'Unable to connect to the server. Please check your internet connection.';
        if (error.code === 'VALIDATION_ERROR') return 'The provided data is invalid. Please check your input.';
        if (error.code === 'BOOK_NOT_FOUND') return 'The requested book was not found.';
        return error.message || 'An unknown error occurred.';
    })
}));

// Mock other dependencies
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

vi.mock('$lib/utils/validation', () => ({
    isValidCreateBookInput: vi.fn(() => true),
    isValidAudibleUrl: vi.fn(() => true)
}));

vi.mock('$lib/utils/id', () => ({
    generateId: vi.fn(() => 'test-id-123'),
    generateTagId: vi.fn(() => 'tag-123')
}));

describe('End-to-End User Workflows', () => {
    let component: any;

    const mockBooks: Book[] = [
        {
            id: 'book-1',
            title: 'The Hobbit',
            author: 'J.R.R. Tolkien',
            
            tags: [
                { id: 'tag-1', name: 'fantasy', color: 'badge-primary' },
                { id: 'tag-2', name: 'series', color: 'badge-info' }
            ],
            dateAdded: new Date('2023-01-01'),
            narratorRating: 4.8,
            performanceRating: 4.5,
            description: 'A classic fantasy adventure',
            coverImageUrl: 'https://example.com/hobbit.jpg'
        },
        {
            id: 'book-2',
            title: 'Dune',
            author: 'Frank Herbert',
            tags: [
                { id: 'tag-3', name: 'sci-fi', color: 'badge-secondary' }
            ],
            dateAdded: new Date('2023-01-02'),
            narratorRating: 4.2,
            performanceRating: 4.7
        }
    ];

    beforeEach(() => {
        vi.clearAllMocks();
        mockApiClient.getBooks.mockResolvedValue(mockBooks);
        mockApiClient.getTags.mockResolvedValue([]);
        mockApiClient.healthCheck.mockResolvedValue({ status: 'healthy' });
    });

    afterEach(() => {
        if (component) {
            component.$destroy();
        }
    });

    describe('Complete Book Management Workflow', () => {
        it('should allow user to add, edit, and delete a book', async () => {
            // Setup API responses
            const newBook: Book = {
                id: 'book-3',
                title: 'Project Hail Mary',
                author: 'Andy Weir',
                tags: [
                    { id: 'tag-4', name: 'sci-fi', color: 'badge-secondary' },
                    { id: 'tag-5', name: 'funny', color: 'badge-warning' }
                ],
                dateAdded: new Date(),
                narratorRating: 5.0,
                performanceRating: 4.8,
                description: 'Amazing sci-fi with humor'
            };

            const updatedBook: Book = {
                ...newBook,
                title: 'Project Hail Mary (Updated)',
                description: 'Updated description'
            };

            mockApiClient.createBook.mockResolvedValue(newBook);
            mockApiClient.updateBook.mockResolvedValue(updatedBook);
            mockApiClient.deleteBook.mockResolvedValue({ id: newBook.id });

            // Render the page
            component = render(WishlistPage);

            // Wait for initial load
            await waitFor(() => {
                expect(screen.getByText('The Hobbit')).toBeInTheDocument();
                expect(screen.getByText('Dune')).toBeInTheDocument();
            });

            // Step 1: Add a new book
            const addButton = screen.getByRole('button', { name: /add book/i });
            await fireEvent.click(addButton);

            // Fill in the form
            await fireEvent.input(screen.getByLabelText(/title/i), {
                target: { value: 'Project Hail Mary' }
            });
            await fireEvent.input(screen.getByLabelText(/author/i), {
                target: { value: 'Andy Weir' }
            });
            await fireEvent.input(screen.getByLabelText(/narrator rating/i), {
                target: { value: '5.0' }
            });
            await fireEvent.input(screen.getByLabelText(/story rating/i), {
                target: { value: '4.8' }
            });
            await fireEvent.input(screen.getByLabelText(/description/i), {
                target: { value: 'Amazing sci-fi with humor' }
            });

            // Select tags
            await fireEvent.click(screen.getByText('Funny'));

            // Submit the form
            const submitButton = screen.getByRole('button', { name: /add book/i });
            await fireEvent.click(submitButton);

            // Verify API call
            await waitFor(() => {
                expect(mockApiClient.createBook).toHaveBeenCalledWith(
                    expect.objectContaining({
                        title: 'Project Hail Mary',
                        author: 'Andy Weir',
                        narratorRating: 5.0,
                        performanceRating: 4.8,
                        description: 'Amazing sci-fi with humor'
                    })
                );
            });

            // Mock updated book list
            mockApiClient.getBooks.mockResolvedValue([...mockBooks, newBook]);

            // Step 2: Edit the book
            await waitFor(() => {
                expect(screen.getByText('Project Hail Mary')).toBeInTheDocument();
            });

            const editButtons = screen.getAllByLabelText(/edit/i);
            const newBookEditButton = editButtons.find(button =>
                button.closest('[data-testid="book-item"]')?.textContent?.includes('Project Hail Mary')
            );

            if (newBookEditButton) {
                await fireEvent.click(newBookEditButton);
            }

            // Update the title and description
            const titleInput = screen.getByDisplayValue('Project Hail Mary');
            await fireEvent.input(titleInput, {
                target: { value: 'Project Hail Mary (Updated)' }
            });

            const descriptionInput = screen.getByDisplayValue('Amazing sci-fi with humor');
            await fireEvent.input(descriptionInput, {
                target: { value: 'Updated description' }
            });

            // Submit the update
            const updateButton = screen.getByRole('button', { name: /update book/i });
            await fireEvent.click(updateButton);

            // Verify update API call
            await waitFor(() => {
                expect(mockApiClient.updateBook).toHaveBeenCalledWith(
                    newBook.id,
                    expect.objectContaining({
                        title: 'Project Hail Mary (Updated)',
                        description: 'Updated description'
                    })
                );
            });

            // Mock updated book list
            mockApiClient.getBooks.mockResolvedValue([...mockBooks, updatedBook]);

            // Step 3: Delete the book
            await waitFor(() => {
                expect(screen.getByText('Project Hail Mary (Updated)')).toBeInTheDocument();
            });

            const deleteButtons = screen.getAllByLabelText(/delete/i);
            const newBookDeleteButton = deleteButtons.find(button =>
                button.closest('[data-testid="book-item"]')?.textContent?.includes('Project Hail Mary (Updated)')
            );

            if (newBookDeleteButton) {
                await fireEvent.click(newBookDeleteButton);
            }

            // Confirm deletion
            const confirmButton = screen.getByRole('button', { name: /confirm/i });
            await fireEvent.click(confirmButton);

            // Verify delete API call
            await waitFor(() => {
                expect(mockApiClient.deleteBook).toHaveBeenCalledWith(newBook.id);
            });

            // Mock final book list
            mockApiClient.getBooks.mockResolvedValue(mockBooks);

            // Verify book is removed
            await waitFor(() => {
                expect(screen.queryByText('Project Hail Mary (Updated)')).not.toBeInTheDocument();
            });
        });
    });

    describe('Search and Filter Workflow', () => {
        it('should allow user to search and filter books effectively', async () => {
            component = render(WishlistPage);

            // Wait for initial load
            await waitFor(() => {
                expect(screen.getByText('The Hobbit')).toBeInTheDocument();
                expect(screen.getByText('Dune')).toBeInTheDocument();
            });

            // Step 1: Search by title
            const searchInput = screen.getByPlaceholderText(/search books/i);
            await fireEvent.input(searchInput, { target: { value: 'Hobbit' } });

            await waitFor(() => {
                expect(screen.getByText('The Hobbit')).toBeInTheDocument();
                expect(screen.queryByText('Dune')).not.toBeInTheDocument();
            });

            // Step 2: Clear search and filter by tag
            await fireEvent.input(searchInput, { target: { value: '' } });

            await waitFor(() => {
                expect(screen.getByText('The Hobbit')).toBeInTheDocument();
                expect(screen.getByText('Dune')).toBeInTheDocument();
            });

            // Filter by fantasy tag
            const fantasyTag = screen.getByText('Fantasy');
            await fireEvent.click(fantasyTag);

            await waitFor(() => {
                expect(screen.getByText('The Hobbit')).toBeInTheDocument();
                expect(screen.queryByText('Dune')).not.toBeInTheDocument();
            });

            // Step 3: Sort by rating
            const sortSelect = screen.getByLabelText(/sort by/i);
            await fireEvent.change(sortSelect, { target: { value: 'narratorRating' } });

            // Books should be reordered (highest rating first)
            const bookElements = screen.getAllByTestId('book-item');
            expect(bookElements[0]).toHaveTextContent('The Hobbit'); // 4.8 rating
        });
    });

    describe('Error Recovery Workflow', () => {
        it('should handle and recover from various error scenarios', async () => {
            // Start with a network error
            const { ApiClientError } = await import('$lib/services/api-client');
            mockApiClient.getBooks.mockRejectedValue(
                new ApiClientError('NETWORK_ERROR', 'Network connection failed')
            );

            component = render(WishlistPage);

            // Should show network error
            await waitFor(() => {
                expect(screen.getByText(/unable to connect to the server/i)).toBeInTheDocument();
            });

            // Step 1: Retry after network error
            mockApiClient.getBooks.mockResolvedValue(mockBooks);

            const retryButton = screen.getByRole('button', { name: /retry/i });
            await fireEvent.click(retryButton);

            await waitFor(() => {
                expect(screen.getByText('The Hobbit')).toBeInTheDocument();
            });

            // Step 2: Handle validation error during book creation
            mockApiClient.createBook.mockRejectedValue(
                new ApiClientError('VALIDATION_ERROR', 'Invalid book data')
            );

            const addButton = screen.getByRole('button', { name: /add book/i });
            await fireEvent.click(addButton);

            await fireEvent.input(screen.getByLabelText(/title/i), {
                target: { value: 'Test Book' }
            });
            await fireEvent.input(screen.getByLabelText(/author/i), {
                target: { value: 'Test Author' }
            });

            const submitButton = screen.getByRole('button', { name: /add book/i });
            await fireEvent.click(submitButton);

            await waitFor(() => {
                expect(screen.getByText(/the provided data is invalid/i)).toBeInTheDocument();
            });

            // Step 3: Recover from validation error
            mockApiClient.createBook.mockResolvedValue({
                id: 'book-3',
                title: 'Test Book',
                author: 'Test Author',
                tags: [],
                dateAdded: new Date(),
                narratorRating: 4.0,
                performanceRating: 4.0
            });

            // Fix the data and retry
            await fireEvent.input(screen.getByLabelText(/title/i), {
                target: { value: 'Valid Test Book' }
            });

            await fireEvent.click(submitButton);

            await waitFor(() => {
                expect(mockApiClient.createBook).toHaveBeenCalledWith(
                    expect.objectContaining({
                        title: 'Valid Test Book',
                        author: 'Test Author'
                    })
                );
            });
        });
    });

    describe('Offline/Online Workflow', () => {
        it('should handle offline scenarios gracefully', async () => {
            component = render(WishlistPage);

            // Initial load succeeds
            await waitFor(() => {
                expect(screen.getByText('The Hobbit')).toBeInTheDocument();
            });

            // Simulate going offline
            const { ApiClientError } = await import('$lib/services/api-client');
            mockApiClient.createBook.mockRejectedValue(
                new ApiClientError('NETWORK_ERROR', 'Network unavailable')
            );

            // Try to add a book while offline
            const addButton = screen.getByRole('button', { name: /add book/i });
            await fireEvent.click(addButton);

            await fireEvent.input(screen.getByLabelText(/title/i), {
                target: { value: 'Offline Book' }
            });
            await fireEvent.input(screen.getByLabelText(/author/i), {
                target: { value: 'Offline Author' }
            });

            const submitButton = screen.getByRole('button', { name: /add book/i });
            await fireEvent.click(submitButton);

            // Should show offline error
            await waitFor(() => {
                expect(screen.getByText(/unable to connect to the server/i)).toBeInTheDocument();
            });

            // Simulate coming back online
            mockApiClient.createBook.mockResolvedValue({
                id: 'book-3',
                title: 'Offline Book',
                author: 'Offline Author',
                tags: [],
                dateAdded: new Date(),
                narratorRating: 4.0,
                performanceRating: 4.0
            });

            // Retry the operation
            await fireEvent.click(submitButton);

            await waitFor(() => {
                expect(mockApiClient.createBook).toHaveBeenCalledWith(
                    expect.objectContaining({
                        title: 'Offline Book',
                        author: 'Offline Author'
                    })
                );
            });
        });
    });

    describe('Performance and Responsiveness', () => {
        it('should handle rapid user interactions gracefully', async () => {
            component = render(WishlistPage);

            await waitFor(() => {
                expect(screen.getByText('The Hobbit')).toBeInTheDocument();
            });

            // Rapid search inputs (should be debounced)
            const searchInput = screen.getByPlaceholderText(/search books/i);

            await fireEvent.input(searchInput, { target: { value: 'H' } });
            await fireEvent.input(searchInput, { target: { value: 'Ho' } });
            await fireEvent.input(searchInput, { target: { value: 'Hob' } });
            await fireEvent.input(searchInput, { target: { value: 'Hobb' } });
            await fireEvent.input(searchInput, { target: { value: 'Hobbit' } });

            // Should only filter once after debounce
            await waitFor(() => {
                expect(screen.getByText('The Hobbit')).toBeInTheDocument();
                expect(screen.queryByText('Dune')).not.toBeInTheDocument();
            }, { timeout: 1000 });

            // Rapid tag selections
            const fantasyTag = screen.getByText('Fantasy');
            const seriesTag = screen.getByText('Series');

            await fireEvent.click(fantasyTag);
            await fireEvent.click(seriesTag);
            await fireEvent.click(fantasyTag); // Deselect
            await fireEvent.click(seriesTag); // Deselect

            // Should handle all interactions without errors
            expect(screen.getByText('The Hobbit')).toBeInTheDocument();
        });
    });
});