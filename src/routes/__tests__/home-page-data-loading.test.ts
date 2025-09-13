/**
 * Test suite for home page data loading and filtering functionality
 * Tests the server-side filtering and error handling for the home screen
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { load } from '../+page.js';

// Mock fetch function
const mockFetch = vi.fn();

// Mock URL object
const mockUrl = {
    pathname: '/',
    searchParams: new URLSearchParams()
};

describe('Home Page Data Loading', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        // Reset console.log and console.error mocks
        vi.spyOn(console, 'log').mockImplementation(() => { });
        vi.spyOn(console, 'error').mockImplementation(() => { });
    });

    afterEach(() => {
        vi.restoreAllMocks();
    });

    it('should successfully load next books with server-side filtering', async () => {
        // Mock successful API response
        const mockBooks = [
            {
                id: 'book-1',
                title: 'Test Book 1',
                author: 'Test Author 1',
                tags: [{ id: 'tag-1', name: 'next', color: 'badge-primary' }]
            },
            {
                id: 'book-2',
                title: 'Test Book 2',
                author: 'Test Author 2',
                tags: [{ id: 'tag-2', name: 'next', color: 'badge-primary' }]
            }
        ];

        mockFetch.mockResolvedValueOnce({
            ok: true,
            json: async () => ({
                success: true,
                data: mockBooks,
                message: 'Retrieved 2 books with tag "next"'
            })
        });

        const result = await load({ fetch: mockFetch, url: mockUrl });

        expect(mockFetch).toHaveBeenCalledWith('/api/books?filter=next', {
            headers: {
                'Content-Type': 'application/json',
                'Accept': 'application/json'
            }
        });

        expect(result).toEqual({
            nextBooks: mockBooks,
            totalNextBooks: 2,
            loadTime: expect.any(Number),
            loadError: null,
            meta: {
                totalBooks: 2,
                filteredBooks: 2,
                loadTime: expect.any(Number),
                timestamp: expect.any(String),
                serverFiltered: true
            }
        });

        expect(result.loadTime).toBeGreaterThanOrEqual(0);
    });

    it('should handle empty next books list gracefully', async () => {
        mockFetch.mockResolvedValueOnce({
            ok: true,
            json: async () => ({
                success: true,
                data: [],
                message: 'Retrieved 0 books with tag "next"'
            })
        });

        const result = await load({ fetch: mockFetch, url: mockUrl });

        expect(result).toEqual({
            nextBooks: [],
            totalNextBooks: 0,
            loadTime: expect.any(Number),
            loadError: null,
            meta: {
                totalBooks: 0,
                filteredBooks: 0,
                loadTime: expect.any(Number),
                timestamp: expect.any(String),
                serverFiltered: true
            }
        });
    });

    it('should handle HTTP errors gracefully', async () => {
        mockFetch.mockResolvedValueOnce({
            ok: false,
            status: 500,
            statusText: 'Internal Server Error',
            json: async () => ({
                success: false,
                message: 'Database connection failed'
            })
        });

        const result = await load({ fetch: mockFetch, url: mockUrl });

        expect(result).toEqual({
            nextBooks: [],
            totalNextBooks: 0,
            loadTime: expect.any(Number),
            loadError: 'Database connection failed',
            meta: {
                totalBooks: 0,
                filteredBooks: 0,
                loadTime: expect.any(Number),
                timestamp: expect.any(String),
                errorOccurred: true
            }
        });

        expect(console.error).toHaveBeenCalledWith(
            '[SSR] Failed to load next books data:',
            expect.objectContaining({
                error: 'Database connection failed',
                loadTime: expect.any(Number),
                url: '/',
                timestamp: expect.any(String)
            })
        );
    });

    it('should handle network errors gracefully', async () => {
        mockFetch.mockRejectedValueOnce(new Error('Network error'));

        const result = await load({ fetch: mockFetch, url: mockUrl });

        expect(result).toEqual({
            nextBooks: [],
            totalNextBooks: 0,
            loadTime: expect.any(Number),
            loadError: 'Network error',
            meta: {
                totalBooks: 0,
                filteredBooks: 0,
                loadTime: expect.any(Number),
                timestamp: expect.any(String),
                errorOccurred: true
            }
        });
    });

    it('should handle malformed JSON responses', async () => {
        mockFetch.mockResolvedValueOnce({
            ok: false,
            status: 500,
            statusText: 'Internal Server Error',
            json: async () => {
                throw new Error('Invalid JSON');
            }
        });

        const result = await load({ fetch: mockFetch, url: mockUrl });

        expect(result.loadError).toBe('HTTP 500: Internal Server Error');
        expect(result.nextBooks).toEqual([]);
    });

    it('should handle API success=false responses', async () => {
        mockFetch.mockResolvedValueOnce({
            ok: true,
            json: async () => ({
                success: false,
                message: 'Invalid filter parameter'
            })
        });

        const result = await load({ fetch: mockFetch, url: mockUrl });

        expect(result.loadError).toBe('Invalid filter parameter');
        expect(result.nextBooks).toEqual([]);
    });

    it('should log performance metrics in SSR', async () => {
        // Mock window to be undefined to simulate SSR environment
        const originalWindow = global.window;
        // @ts-ignore
        delete global.window;

        mockFetch.mockResolvedValueOnce({
            ok: true,
            json: async () => ({
                success: true,
                data: [],
                message: 'Retrieved 0 books with tag "next"'
            })
        });

        await load({ fetch: mockFetch, url: mockUrl });

        expect(console.log).toHaveBeenCalledWith(
            expect.stringMatching(/\[SSR\] Loaded 0 next books in \d+ms/)
        );

        // Restore window
        global.window = originalWindow;
    });

    it('should include server filtering metadata', async () => {
        mockFetch.mockResolvedValueOnce({
            ok: true,
            json: async () => ({
                success: true,
                data: [],
                message: 'Retrieved 0 books with tag "next"'
            })
        });

        const result = await load({ fetch: mockFetch, url: mockUrl });

        expect(result.meta.serverFiltered).toBe(true);
        expect(result.meta.timestamp).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/);
    });
});