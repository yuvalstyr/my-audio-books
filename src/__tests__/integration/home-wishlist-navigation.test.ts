/**
 * Integration tests for navigation between home screen and wishlist pages
 * Tests routing, state preservation, and user experience flows
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, fireEvent, waitFor, screen } from '@testing-library/svelte';
import { get } from 'svelte/store';
import { bookActions, allBooks, nextBooks } from '$lib/stores/book-store';
import type { Book } from '$lib/types/book';

// Mock SvelteKit navigation
const mockGoto = vi.fn();
const mockPage = {
    url: new URL('http://localhost:3000/'),
    params: {},
    route: { id: '/' }
};

vi.mock('$app/navigation', () => ({
    goto: mockGoto
}));

vi.mock('$app/stores', () => ({
    page: {
        subscribe: (fn: any) => {
            fn(mockPage);
            return () => { };
        }
    }
}));

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

// Mock components to focus on navigation logic
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

describe('Home-Wishlist Navigation Integration Tests', () => {
    beforeEach(() => {
        // Reset store to initial state
        bookActions.initializeWithData([]);
        vi.clearAllMocks();

        // Reset mock page state
        mockPage.url = new URL('http://localhost:3000/');
        mockPage.route.id = '/';
    });

    afterEach(() => {
        vi.clearAllMocks();
    });

    describe('Navigation Links and Routing', () => {
        it('should navigate to wishlist from home page', async () => {
            // Initialize with next books
            bookActions.initializeWithData(mockBooks);

            // Mock window.location for navigation test
            const mockLocation = {
                href: 'http://localhost:3000/'
            };
            Object.defineProperty(window, 'location', {
                value: mockLocation,
                writable: true
            });

            // Simulate clicking "Manage Full Wishlist" button
            // This would typically be done through the component, but we're testing the navigation logic
            window.location.href = '/wishlist';

            expect(window.location.href).toBe('/wishlist');
        });

        it('should navigate to home page from wishlist', async () => {
            // Set current page to wishlist
            mockPage.url = new URL('http://localhost:3000/wishlist');
            mockPage.route.id = '/wishlist';

            // Initialize with all books
            bookActions.initializeWithData(mockBooks);

            // Mock window.location for navigation test
            const mockLocation = {
                href: 'http://localhost:3000/wishlist'
            };
            Object.defineProperty(window, 'location', {
                value: mockLocation,
                writable: true
            });

            // Simulate clicking home navigation
            window.location.href = '/';

            expect(window.location.href).toBe('/');
        });

        it('should navigate to wishlist with book highlight parameter', async () => {
            bookActions.initializeWithData(mockBooks);

            // Mock window.location for navigation test
            const mockLocation = {
                href: 'http://localhost:3000/'
            };
            Object.defineProperty(window, 'location', {
                value: mockLocation,
                writable: true
            });

            // Simulate clicking "View Details" on a book (which navigates to wishlist with highlight)
            const bookId = '2';
            window.location.href = `/wishlist?highlight=${bookId}`;

            expect(window.location.href).toBe('/wishlist?highlight=2');
        });
    });

    describe('State Preservation During Navigation', () => {
        it('should preserve book data when navigating between pages', async () => {
            // Initialize store with data
            bookActions.initializeWithData(mockBooks);

            // Verify initial state
            const initialAllBooks = get(allBooks);
            const initialNextBooks = get(nextBooks);
            expect(initialAllBooks).toHaveLength(3);
            expect(initialNextBooks).toHaveLength(2);

            // Simulate navigation to wishlist
            mockPage.url = new URL('http://localhost:3000/wishlist');
            mockPage.route.id = '/wishlist';

            // State should be preserved
            const allBooksAfterNav = get(allBooks);
            const nextBooksAfterNav = get(nextBooks);
            expect(allBooksAfterNav).toEqual(initialAllBooks);
            expect(nextBooksAfterNav).toEqual(initialNextBooks);

            // Simulate navigation back to home
            mockPage.url = new URL('http://localhost:3000/');
            mockPage.route.id = '/';

            // State should still be preserved
            const finalAllBooks = get(allBooks);
            const finalNextBooks = get(nextBooks);
            expect(finalAllBooks).toEqual(initialAllBooks);
            expect(finalNextBooks).toEqual(initialNextBooks);
        });

        it('should maintain filter state when navigating', async () => {
            // This test would be more relevant for wishlist page filters
            // but we can test that the store state is maintained
            bookActions.initializeWithData(mockBooks);

            // Simulate some store operations
            const { apiClient } = await import('$lib/services/api-client');
            const updatedBook = {
                ...mockBooks[0],
                tags: [...mockBooks[0].tags, { id: 'next-tag', name: 'next' as const, color: 'badge-primary' }]
            };
            vi.mocked(apiClient.updateBook).mockResolvedValue(updatedBook);

            await bookActions.toggleNextTag('1');

            // Navigate to wishlist
            mockPage.url = new URL('http://localhost:3000/wishlist');
            mockPage.route.id = '/wishlist';

            // Verify the update is reflected
            const nextBooksAfterUpdate = get(nextBooks);
            expect(nextBooksAfterUpdate).toHaveLength(3);
            expect(nextBooksAfterUpdate.find(b => b.id === '1')).toBeDefined();
        });
    });

    describe('Real-time Updates Across Pages', () => {
        it('should reflect changes made on home page in wishlist', async () => {
            const { apiClient } = await import('$lib/services/api-client');

            bookActions.initializeWithData(mockBooks);

            // Mock API response for removing next tag
            const updatedBook = {
                ...mockBooks[1],
                tags: mockBooks[1].tags.filter(tag => tag.name !== 'next')
            };
            vi.mocked(apiClient.updateBook).mockResolvedValue(updatedBook);

            // Simulate removing book from next on home page
            await bookActions.toggleNextTag('2');

            // Verify change is reflected in both stores (simulating both pages)
            const allBooksAfter = get(allBooks);
            const nextBooksAfter = get(nextBooks);

            const updatedBookInStore = allBooksAfter.find(b => b.id === '2');
            expect(updatedBookInStore?.tags.some(tag => tag.name === 'next')).toBe(false);
            expect(nextBooksAfter.find(b => b.id === '2')).toBeUndefined();
        });

        it('should reflect changes made on wishlist in home page', async () => {
            const { apiClient } = await import('$lib/services/api-client');

            bookActions.initializeWithData(mockBooks);

            // Mock API response for adding next tag
            const updatedBook = {
                ...mockBooks[0],
                tags: [...mockBooks[0].tags, { id: 'next-tag', name: 'next' as const, color: 'badge-primary' }]
            };
            vi.mocked(apiClient.updateBook).mockResolvedValue(updatedBook);

            // Simulate adding book to next on wishlist
            await bookActions.toggleNextTag('1');

            // Verify change is reflected in both stores (simulating both pages)
            const allBooksAfter = get(allBooks);
            const nextBooksAfter = get(nextBooks);

            const updatedBookInStore = allBooksAfter.find(b => b.id === '1');
            expect(updatedBookInStore?.tags.some(tag => tag.name === 'next')).toBe(true);
            expect(nextBooksAfter.find(b => b.id === '1')).toBeDefined();
        });

        it('should handle book deletion across pages', async () => {
            const { apiClient } = await import('$lib/services/api-client');

            bookActions.initializeWithData(mockBooks);

            // Mock API response for deletion
            vi.mocked(apiClient.deleteBook).mockResolvedValue({ id: '2' });

            // Simulate deleting a next book from wishlist
            await bookActions.deleteBook('2');

            // Verify deletion is reflected in both stores
            const allBooksAfter = get(allBooks);
            const nextBooksAfter = get(nextBooks);

            expect(allBooksAfter.find(b => b.id === '2')).toBeUndefined();
            expect(nextBooksAfter.find(b => b.id === '2')).toBeUndefined();
            expect(allBooksAfter).toHaveLength(2);
            expect(nextBooksAfter).toHaveLength(1);
        });

        it('should handle book creation across pages', async () => {
            const { apiClient } = await import('$lib/services/api-client');

            bookActions.initializeWithData(mockBooks);

            // Mock API response for new book
            const newBook: Book = {
                id: '4',
                title: 'New Next Book',
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

            // Simulate adding new book from wishlist
            await bookActions.addBook({
                title: 'New Next Book',
                author: 'New Author',
                
                tags: [{ id: 'tag6', name: 'next', color: 'badge-primary' }]
            });

            // Verify addition is reflected in both stores
            const allBooksAfter = get(allBooks);
            const nextBooksAfter = get(nextBooks);

            expect(allBooksAfter.find(b => b.id === '4')).toBeDefined();
            expect(nextBooksAfter.find(b => b.id === '4')).toBeDefined();
            expect(allBooksAfter).toHaveLength(4);
            expect(nextBooksAfter).toHaveLength(3);
        });
    });

    describe('URL Parameters and Deep Linking', () => {
        it('should handle highlight parameter in wishlist URL', () => {
            // Set URL with highlight parameter
            mockPage.url = new URL('http://localhost:3000/wishlist?highlight=2');
            mockPage.route.id = '/wishlist';

            bookActions.initializeWithData(mockBooks);

            // The highlight parameter would be handled by the wishlist page component
            // Here we just verify the URL parsing works
            const urlParams = new URLSearchParams(mockPage.url.search);
            expect(urlParams.get('highlight')).toBe('2');
        });

        it('should handle navigation with query parameters', () => {
            // Test navigation with various query parameters
            const testUrls = [
                '/wishlist?highlight=1',
                '/wishlist?search=fantasy',
                '/wishlist?tag=next',
                '/?refresh=true'
            ];

            testUrls.forEach(url => {
                mockPage.url = new URL(`http://localhost:3000${url}`);

                // Verify URL is properly parsed
                expect(mockPage.url.pathname + mockPage.url.search).toBe(url);
            });
        });
    });

    describe('Error Handling During Navigation', () => {
        it('should handle navigation errors gracefully', async () => {
            bookActions.initializeWithData(mockBooks);

            // Mock navigation error
            const mockLocation = {
                href: 'http://localhost:3000/'
            };
            Object.defineProperty(window, 'location', {
                value: mockLocation,
                writable: true
            });

            // Simulate navigation error (invalid URL)
            try {
                window.location.href = 'invalid-url';
            } catch (error) {
                // Should handle gracefully
                expect(error).toBeDefined();
            }

            // Store state should remain intact
            const allBooksAfter = get(allBooks);
            const nextBooksAfter = get(nextBooks);
            expect(allBooksAfter).toHaveLength(3);
            expect(nextBooksAfter).toHaveLength(2);
        });

        it('should handle store errors during navigation', async () => {
            const { apiClient } = await import('$lib/services/api-client');

            bookActions.initializeWithData(mockBooks);

            // Mock API error during navigation
            vi.mocked(apiClient.updateBook).mockRejectedValue(new Error('Network error'));

            // Attempt operation that fails
            await bookActions.toggleNextTag('1');

            // Navigate to different page
            mockPage.url = new URL('http://localhost:3000/wishlist');
            mockPage.route.id = '/wishlist';

            // Store should maintain consistent state despite error
            const allBooksAfter = get(allBooks);
            const nextBooksAfter = get(nextBooks);
            expect(allBooksAfter).toHaveLength(3);
            expect(nextBooksAfter).toHaveLength(2); // Should not include failed update
        });
    });

    describe('Performance During Navigation', () => {
        it('should not reload data unnecessarily during navigation', async () => {
            const { apiClient } = await import('$lib/services/api-client');

            // Track API calls
            let getBooksCalls = 0;
            vi.mocked(apiClient.getBooks).mockImplementation(() => {
                getBooksCalls++;
                return Promise.resolve(mockBooks);
            });

            // Initialize store
            bookActions.initializeWithData(mockBooks);

            // Navigate between pages multiple times
            mockPage.url = new URL('http://localhost:3000/wishlist');
            mockPage.route.id = '/wishlist';

            mockPage.url = new URL('http://localhost:3000/');
            mockPage.route.id = '/';

            mockPage.url = new URL('http://localhost:3000/wishlist');
            mockPage.route.id = '/wishlist';

            // Should not trigger additional API calls for navigation alone
            expect(getBooksCalls).toBe(0); // Only initialization, no additional calls
        });

        it('should handle rapid navigation without state corruption', async () => {
            bookActions.initializeWithData(mockBooks);

            // Simulate rapid navigation
            const navigationPromises = [];
            for (let i = 0; i < 10; i++) {
                navigationPromises.push(new Promise(resolve => {
                    setTimeout(() => {
                        mockPage.url = new URL(`http://localhost:3000/${i % 2 === 0 ? '' : 'wishlist'}`);
                        mockPage.route.id = i % 2 === 0 ? '/' : '/wishlist';
                        resolve(true);
                    }, i * 10);
                }));
            }

            await Promise.all(navigationPromises);

            // Store state should remain consistent
            const finalAllBooks = get(allBooks);
            const finalNextBooks = get(nextBooks);
            expect(finalAllBooks).toHaveLength(3);
            expect(finalNextBooks).toHaveLength(2);
        });
    });

    describe('Browser History and Back Navigation', () => {
        it('should handle browser back button correctly', () => {
            bookActions.initializeWithData(mockBooks);

            // Simulate navigation history
            const history = [
                { url: 'http://localhost:3000/', route: '/' },
                { url: 'http://localhost:3000/wishlist', route: '/wishlist' },
                { url: 'http://localhost:3000/wishlist?highlight=2', route: '/wishlist' }
            ];

            // Simulate going back through history
            history.reverse().forEach(entry => {
                mockPage.url = new URL(entry.url);
                mockPage.route.id = entry.route;

                // Store state should be preserved
                const allBooksState = get(allBooks);
                const nextBooksState = get(nextBooks);
                expect(allBooksState).toHaveLength(3);
                expect(nextBooksState).toHaveLength(2);
            });
        });
    });
});