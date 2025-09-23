/**
 * Test suite for books API server-side filtering functionality
 * Tests the enhanced GET endpoint with tag filtering support
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { GET } from '../+server.js';

// Mock dependencies
vi.mock('$lib/server/db/connection.js', () => ({
    db: {
        select: vi.fn().mockReturnThis(),
        from: vi.fn().mockReturnThis(),
        leftJoin: vi.fn().mockReturnThis(),
        orderBy: vi.fn().mockReturnThis(),
    }
}));

vi.mock('$lib/server/utils/database.js', () => ({
    executeWithRetry: vi.fn()
}));

vi.mock('$lib/server/utils/logger.js', () => ({
    ServerLogger: {
        info: vi.fn(),
        error: vi.fn()
    },
    createRequestLogger: vi.fn(() => ({
        logRequest: vi.fn(() => vi.fn()),
        getRequestId: vi.fn(() => 'test-request-id')
    }))
}));

vi.mock('$lib/server/utils/errors.js', () => ({
    createSuccessResponse: vi.fn((data, message, requestId) => ({
        success: true,
        data,
        message,
        requestId
    })),
    createErrorResponse: vi.fn((code, message, details, requestId) => ({
        success: false,
        error: code,
        message,
        details,
        requestId
    })),
    classifyDatabaseError: vi.fn(() => 'DATABASE_ERROR'),
    getErrorStatus: vi.fn(() => 500),
    sanitizeErrorDetails: vi.fn((details) => details)
}));

import { executeWithRetry } from '$lib/server/utils/database.js';
import { ServerLogger } from '$lib/server/utils/logger.js';

describe('Books API Server-Side Filtering', () => {
    const mockRequest = new Request('http://localhost/api/books');

    beforeEach(() => {
        vi.clearAllMocks();
    });

    afterEach(() => {
        vi.restoreAllMocks();
    });

    it('should filter books by "next" tag when filter=next parameter is provided', async () => {
        const mockBooksData = [
            {
                id: 'book-1',
                title: 'Book 1',
                author: 'Author 1',
                
                narratorRating: null,
                performanceRating: null,
                description: null,
                coverImageUrl: null,
                queuePosition: null,
                dateAdded: '2024-01-01T00:00:00.000Z',
                dateUpdated: '2024-01-01T00:00:00.000Z',
                createdAt: '2024-01-01T00:00:00.000Z',
                updatedAt: '2024-01-01T00:00:00.000Z',
                tagId: 'tag-1',
                tagName: 'next',
                tagColor: 'badge-primary'
            },
            {
                id: 'book-2',
                title: 'Book 2',
                author: 'Author 2',
                
                narratorRating: null,
                performanceRating: null,
                description: null,
                coverImageUrl: null,
                queuePosition: null,
                dateAdded: '2024-01-02T00:00:00.000Z',
                dateUpdated: '2024-01-02T00:00:00.000Z',
                createdAt: '2024-01-02T00:00:00.000Z',
                updatedAt: '2024-01-02T00:00:00.000Z',
                tagId: 'tag-2',
                tagName: 'wishlist',
                tagColor: 'badge-secondary'
            },
            {
                id: 'book-3',
                title: 'Book 3',
                author: 'Author 3',
                
                narratorRating: null,
                performanceRating: null,
                description: null,
                coverImageUrl: null,
                queuePosition: null,
                dateAdded: '2024-01-03T00:00:00.000Z',
                dateUpdated: '2024-01-03T00:00:00.000Z',
                createdAt: '2024-01-03T00:00:00.000Z',
                updatedAt: '2024-01-03T00:00:00.000Z',
                tagId: 'tag-3',
                tagName: 'next',
                tagColor: 'badge-primary'
            }
        ];

        (executeWithRetry as any).mockResolvedValue(mockBooksData);

        const url = new URL('http://localhost/api/books?filter=next');
        const response = await GET({ request: mockRequest, url });
        const responseData = await response.json();

        expect(responseData.success).toBe(true);
        expect(responseData.data).toHaveLength(2);
        expect(responseData.data[0].title).toBe('Book 1');
        expect(responseData.data[1].title).toBe('Book 3');
        expect(responseData.message).toBe('Retrieved 2 books with tag "next"');

        // Verify logging
        expect(ServerLogger.info).toHaveBeenCalledWith(
            'Fetching books',
            'API_BOOKS_GET',
            'test-request-id',
            expect.objectContaining({
                filterTag: 'next',
                tagFilter: 'next'
            })
        );
    });

    it('should return all books when no filter is provided', async () => {
        const mockBooksData = [
            {
                id: 'book-1',
                title: 'Book 1',
                author: 'Author 1',
                
                narratorRating: null,
                performanceRating: null,
                description: null,
                coverImageUrl: null,
                queuePosition: null,
                dateAdded: '2024-01-01T00:00:00.000Z',
                dateUpdated: '2024-01-01T00:00:00.000Z',
                createdAt: '2024-01-01T00:00:00.000Z',
                updatedAt: '2024-01-01T00:00:00.000Z',
                tagId: 'tag-1',
                tagName: 'wishlist',
                tagColor: 'badge-secondary'
            }
        ];

        (executeWithRetry as any).mockResolvedValue(mockBooksData);

        const url = new URL('http://localhost/api/books');
        const response = await GET({ request: mockRequest, url });
        const responseData = await response.json();

        expect(responseData.success).toBe(true);
        expect(responseData.data).toHaveLength(1);
        expect(responseData.message).toBe('Retrieved 1 books');
    });

    it('should filter by custom tag when tag parameter is provided', async () => {
        const mockBooksData = [
            {
                id: 'book-1',
                title: 'Book 1',
                author: 'Author 1',
                
                narratorRating: null,
                performanceRating: null,
                description: null,
                coverImageUrl: null,
                queuePosition: null,
                dateAdded: '2024-01-01T00:00:00.000Z',
                dateUpdated: '2024-01-01T00:00:00.000Z',
                createdAt: '2024-01-01T00:00:00.000Z',
                updatedAt: '2024-01-01T00:00:00.000Z',
                tagId: 'tag-1',
                tagName: 'favorite',
                tagColor: 'badge-accent'
            }
        ];

        (executeWithRetry as any).mockResolvedValue(mockBooksData);

        const url = new URL('http://localhost/api/books?tag=favorite');
        const response = await GET({ request: mockRequest, url });
        const responseData = await response.json();

        expect(responseData.success).toBe(true);
        expect(responseData.data).toHaveLength(1);
        expect(responseData.data[0].title).toBe('Book 1');
        expect(responseData.message).toBe('Retrieved 1 books with tag "favorite"');
    });

    it('should return empty array when no books match the filter', async () => {
        const mockBooksData = [
            {
                id: 'book-1',
                title: 'Book 1',
                author: 'Author 1',
                
                narratorRating: null,
                performanceRating: null,
                description: null,
                coverImageUrl: null,
                queuePosition: null,
                dateAdded: '2024-01-01T00:00:00.000Z',
                dateUpdated: '2024-01-01T00:00:00.000Z',
                createdAt: '2024-01-01T00:00:00.000Z',
                updatedAt: '2024-01-01T00:00:00.000Z',
                tagId: 'tag-1',
                tagName: 'wishlist',
                tagColor: 'badge-secondary'
            }
        ];

        (executeWithRetry as any).mockResolvedValue(mockBooksData);

        const url = new URL('http://localhost/api/books?filter=next');
        const response = await GET({ request: mockRequest, url });
        const responseData = await response.json();

        expect(responseData.success).toBe(true);
        expect(responseData.data).toHaveLength(0);
        expect(responseData.message).toBe('Retrieved 0 books with tag "next"');
    });

    it('should handle books with multiple tags correctly', async () => {
        const mockBooksData = [
            // Book 1 with multiple tags including "next"
            {
                id: 'book-1',
                title: 'Book 1',
                author: 'Author 1',
                
                narratorRating: null,
                performanceRating: null,
                description: null,
                coverImageUrl: null,
                queuePosition: null,
                dateAdded: '2024-01-01T00:00:00.000Z',
                dateUpdated: '2024-01-01T00:00:00.000Z',
                createdAt: '2024-01-01T00:00:00.000Z',
                updatedAt: '2024-01-01T00:00:00.000Z',
                tagId: 'tag-1',
                tagName: 'next',
                tagColor: 'badge-primary'
            },
            {
                id: 'book-1', // Same book, different tag
                title: 'Book 1',
                author: 'Author 1',
                
                narratorRating: null,
                performanceRating: null,
                description: null,
                coverImageUrl: null,
                queuePosition: null,
                dateAdded: '2024-01-01T00:00:00.000Z',
                dateUpdated: '2024-01-01T00:00:00.000Z',
                createdAt: '2024-01-01T00:00:00.000Z',
                updatedAt: '2024-01-01T00:00:00.000Z',
                tagId: 'tag-2',
                tagName: 'favorite',
                tagColor: 'badge-accent'
            }
        ];

        (executeWithRetry as any).mockResolvedValue(mockBooksData);

        const url = new URL('http://localhost/api/books?filter=next');
        const response = await GET({ request: mockRequest, url });
        const responseData = await response.json();

        expect(responseData.success).toBe(true);
        expect(responseData.data).toHaveLength(1);
        expect(responseData.data[0].tags).toHaveLength(2);
        expect(responseData.data[0].tags.some((tag: any) => tag.name === 'next')).toBe(true);
        expect(responseData.data[0].tags.some((tag: any) => tag.name === 'favorite')).toBe(true);
    });

    it('should log filter application correctly', async () => {
        const mockBooksData = [
            {
                id: 'book-1',
                title: 'Book 1',
                author: 'Author 1',
                
                narratorRating: null,
                performanceRating: null,
                description: null,
                coverImageUrl: null,
                queuePosition: null,
                dateAdded: '2024-01-01T00:00:00.000Z',
                dateUpdated: '2024-01-01T00:00:00.000Z',
                createdAt: '2024-01-01T00:00:00.000Z',
                updatedAt: '2024-01-01T00:00:00.000Z',
                tagId: 'tag-1',
                tagName: 'next',
                tagColor: 'badge-primary'
            },
            {
                id: 'book-2',
                title: 'Book 2',
                author: 'Author 2',
                
                narratorRating: null,
                performanceRating: null,
                description: null,
                coverImageUrl: null,
                queuePosition: null,
                dateAdded: '2024-01-02T00:00:00.000Z',
                dateUpdated: '2024-01-02T00:00:00.000Z',
                createdAt: '2024-01-02T00:00:00.000Z',
                updatedAt: '2024-01-02T00:00:00.000Z',
                tagId: 'tag-2',
                tagName: 'wishlist',
                tagColor: 'badge-secondary'
            }
        ];

        (executeWithRetry as any).mockResolvedValue(mockBooksData);

        const url = new URL('http://localhost/api/books?filter=next');
        await GET({ request: mockRequest, url });

        expect(ServerLogger.info).toHaveBeenCalledWith(
            'Applying tag filter: next',
            'API_BOOKS_GET',
            'test-request-id'
        );

        expect(ServerLogger.info).toHaveBeenCalledWith(
            'Tag filter applied: 2 -> 1 books',
            'API_BOOKS_GET',
            'test-request-id'
        );
    });
});