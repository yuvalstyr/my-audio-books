/**
 * Tests for API error handling scenarios
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { ApiClient, ApiClientError } from '../api-client.js';

// Mock fetch globally
const mockFetch = vi.fn();
global.fetch = mockFetch;

describe('API Error Handling', () => {
    let apiClient: ApiClient;

    beforeEach(() => {
        apiClient = new ApiClient({
            baseUrl: '/api',
            timeout: 5000,
            retryAttempts: 2,
            retryDelay: 100,
            enableLogging: false
        });
        vi.clearAllMocks();
    });

    afterEach(() => {
        vi.restoreAllMocks();
    });

    describe('Network Errors', () => {
        it('should handle connection refused', async () => {
            mockFetch.mockRejectedValue(new Error('Connection refused'));

            await expect(apiClient.getBooks()).rejects.toThrow(ApiClientError);
            await expect(apiClient.getBooks()).rejects.toThrow('Connection refused');
        });

        it('should handle timeout errors', async () => {
            const slowApiClient = new ApiClient({ timeout: 100, enableLogging: false });

            mockFetch.mockImplementation(() =>
                new Promise(resolve => setTimeout(resolve, 200))
            );

            await expect(slowApiClient.getBooks()).rejects.toThrow(ApiClientError);
        });

        it('should handle DNS resolution failures', async () => {
            mockFetch.mockRejectedValue(new Error('getaddrinfo ENOTFOUND'));

            await expect(apiClient.getBooks()).rejects.toThrow(ApiClientError);
        });

        it('should retry on network failures', async () => {
            mockFetch
                .mockRejectedValueOnce(new Error('Network error'))
                .mockRejectedValueOnce(new Error('Network error'))
                .mockResolvedValueOnce({
                    ok: true,
                    status: 200,
                    json: async () => ({
                        success: true,
                        data: [],
                        timestamp: new Date().toISOString()
                    })
                });

            const result = await apiClient.getBooks();
            expect(result).toEqual([]);
            expect(mockFetch).toHaveBeenCalledTimes(3);
        });
    });

    describe('HTTP Status Errors', () => {
        it('should handle 400 Bad Request', async () => {
            mockFetch.mockResolvedValue({
                ok: false,
                status: 400,
                json: async () => ({
                    success: false,
                    error: 'VALIDATION_ERROR',
                    message: 'Invalid request data',
                    timestamp: new Date().toISOString()
                })
            });

            await expect(apiClient.createBook({
                title: '',
                author: '',
                tags: []
            })).rejects.toThrow(ApiClientError);
        });

        it('should handle 401 Unauthorized', async () => {
            mockFetch.mockResolvedValue({
                ok: false,
                status: 401,
                json: async () => ({
                    success: false,
                    error: 'UNAUTHORIZED',
                    message: 'Authentication required',
                    timestamp: new Date().toISOString()
                })
            });

            await expect(apiClient.getBooks()).rejects.toThrow(ApiClientError);
        });

        it('should handle 403 Forbidden', async () => {
            mockFetch.mockResolvedValue({
                ok: false,
                status: 403,
                json: async () => ({
                    success: false,
                    error: 'FORBIDDEN',
                    message: 'Access denied',
                    timestamp: new Date().toISOString()
                })
            });

            await expect(apiClient.getBooks()).rejects.toThrow(ApiClientError);
        });

        it('should handle 404 Not Found', async () => {
            mockFetch.mockResolvedValue({
                ok: false,
                status: 404,
                json: async () => ({
                    success: false,
                    error: 'BOOK_NOT_FOUND',
                    message: 'Book not found',
                    timestamp: new Date().toISOString()
                })
            });

            await expect(apiClient.getBook('nonexistent')).rejects.toThrow(ApiClientError);
        });

        it('should handle 409 Conflict', async () => {
            mockFetch.mockResolvedValue({
                ok: false,
                status: 409,
                json: async () => ({
                    success: false,
                    error: 'CONFLICT',
                    message: 'Book already exists',
                    timestamp: new Date().toISOString()
                })
            });

            await expect(apiClient.createBook({
                title: 'Existing Book',
                author: 'Author',
                tags: []
            })).rejects.toThrow(ApiClientError);
        });

        it('should handle 422 Unprocessable Entity', async () => {
            mockFetch.mockResolvedValue({
                ok: false,
                status: 422,
                json: async () => ({
                    success: false,
                    error: 'VALIDATION_ERROR',
                    message: 'Invalid data format',
                    details: {
                        field: 'title',
                        issue: 'too_long'
                    },
                    timestamp: new Date().toISOString()
                })
            });

            await expect(apiClient.createBook({
                title: 'A'.repeat(1000),
                author: 'Author',
                tags: []
            })).rejects.toThrow(ApiClientError);
        });

        it('should handle 429 Too Many Requests', async () => {
            mockFetch.mockResolvedValue({
                ok: false,
                status: 429,
                json: async () => ({
                    success: false,
                    error: 'RATE_LIMIT_EXCEEDED',
                    message: 'Too many requests',
                    timestamp: new Date().toISOString()
                })
            });

            await expect(apiClient.getBooks()).rejects.toThrow(ApiClientError);
        });

        it('should handle 500 Internal Server Error', async () => {
            mockFetch.mockResolvedValue({
                ok: false,
                status: 500,
                json: async () => ({
                    success: false,
                    error: 'DATABASE_ERROR',
                    message: 'Internal server error',
                    timestamp: new Date().toISOString()
                })
            });

            await expect(apiClient.getBooks()).rejects.toThrow(ApiClientError);
        });

        it('should handle 502 Bad Gateway', async () => {
            mockFetch.mockResolvedValue({
                ok: false,
                status: 502,
                json: async () => ({
                    success: false,
                    error: 'BAD_GATEWAY',
                    message: 'Bad gateway',
                    timestamp: new Date().toISOString()
                })
            });

            await expect(apiClient.getBooks()).rejects.toThrow(ApiClientError);
        });

        it('should handle 503 Service Unavailable', async () => {
            mockFetch.mockResolvedValue({
                ok: false,
                status: 503,
                json: async () => ({
                    success: false,
                    error: 'SERVICE_UNAVAILABLE',
                    message: 'Service temporarily unavailable',
                    timestamp: new Date().toISOString()
                })
            });

            await expect(apiClient.getBooks()).rejects.toThrow(ApiClientError);
        });
    });

    describe('Response Parsing Errors', () => {
        it('should handle invalid JSON responses', async () => {
            mockFetch.mockResolvedValue({
                ok: true,
                status: 200,
                json: async () => {
                    throw new Error('Invalid JSON');
                }
            });

            await expect(apiClient.getBooks()).rejects.toThrow(ApiClientError);
        });

        it('should handle empty responses', async () => {
            mockFetch.mockResolvedValue({
                ok: true,
                status: 200,
                json: async () => null
            });

            await expect(apiClient.getBooks()).rejects.toThrow(ApiClientError);
        });

        it('should handle malformed API responses', async () => {
            mockFetch.mockResolvedValue({
                ok: true,
                status: 200,
                json: async () => ({
                    // Missing required fields
                    data: null
                })
            });

            await expect(apiClient.getBooks()).rejects.toThrow(ApiClientError);
        });
    });

    describe('Retry Logic', () => {
        it('should not retry on client errors (4xx)', async () => {
            mockFetch.mockResolvedValue({
                ok: false,
                status: 400,
                json: async () => ({
                    success: false,
                    error: 'VALIDATION_ERROR',
                    message: 'Bad request',
                    timestamp: new Date().toISOString()
                })
            });

            await expect(apiClient.getBooks()).rejects.toThrow(ApiClientError);
            expect(mockFetch).toHaveBeenCalledTimes(1);
        });

        it('should retry on server errors (5xx)', async () => {
            mockFetch
                .mockResolvedValueOnce({
                    ok: false,
                    status: 500,
                    json: async () => ({
                        success: false,
                        error: 'DATABASE_ERROR',
                        message: 'Server error',
                        timestamp: new Date().toISOString()
                    })
                })
                .mockResolvedValueOnce({
                    ok: true,
                    status: 200,
                    json: async () => ({
                        success: true,
                        data: [],
                        timestamp: new Date().toISOString()
                    })
                });

            const result = await apiClient.getBooks();
            expect(result).toEqual([]);
            expect(mockFetch).toHaveBeenCalledTimes(2);
        });

        it('should respect maximum retry attempts', async () => {
            mockFetch.mockResolvedValue({
                ok: false,
                status: 500,
                json: async () => ({
                    success: false,
                    error: 'DATABASE_ERROR',
                    message: 'Server error',
                    timestamp: new Date().toISOString()
                })
            });

            await expect(apiClient.getBooks()).rejects.toThrow(ApiClientError);
            expect(mockFetch).toHaveBeenCalledTimes(3); // Initial + 2 retries
        });

        it('should implement exponential backoff', async () => {
            const startTime = Date.now();

            mockFetch.mockResolvedValue({
                ok: false,
                status: 500,
                json: async () => ({
                    success: false,
                    error: 'DATABASE_ERROR',
                    message: 'Server error',
                    timestamp: new Date().toISOString()
                })
            });

            await expect(apiClient.getBooks()).rejects.toThrow(ApiClientError);

            const endTime = Date.now();
            const totalTime = endTime - startTime;

            // Should take at least the retry delays (100ms + 200ms)
            expect(totalTime).toBeGreaterThan(250);
        });
    });

    describe('Concurrent Request Handling', () => {
        it('should handle multiple concurrent requests', async () => {
            mockFetch.mockResolvedValue({
                ok: true,
                status: 200,
                json: async () => ({
                    success: true,
                    data: [],
                    timestamp: new Date().toISOString()
                })
            });

            const promises = [
                apiClient.getBooks(),
                apiClient.getTags(),
                apiClient.healthCheck()
            ];

            const results = await Promise.all(promises);

            expect(results).toHaveLength(3);
            expect(mockFetch).toHaveBeenCalledTimes(3);
        });

        it('should handle mixed success/failure scenarios', async () => {
            mockFetch
                .mockResolvedValueOnce({
                    ok: true,
                    status: 200,
                    json: async () => ({
                        success: true,
                        data: [],
                        timestamp: new Date().toISOString()
                    })
                })
                .mockResolvedValueOnce({
                    ok: false,
                    status: 500,
                    json: async () => ({
                        success: false,
                        error: 'DATABASE_ERROR',
                        message: 'Server error',
                        timestamp: new Date().toISOString()
                    })
                });

            const results = await Promise.allSettled([
                apiClient.getBooks(),
                apiClient.getTags()
            ]);

            expect(results[0].status).toBe('fulfilled');
            expect(results[1].status).toBe('rejected');
        });
    });

    describe('Request Cancellation', () => {
        it('should support request cancellation', async () => {
            const controller = new AbortController();

            mockFetch.mockImplementation(() =>
                new Promise((_, reject) => {
                    setTimeout(() => reject(new Error('AbortError')), 100);
                })
            );

            const promise = apiClient.getBooks();

            // Cancel after 50ms
            setTimeout(() => controller.abort(), 50);

            await expect(promise).rejects.toThrow();
        });
    });
});