/**
 * Unit tests for API Client Service
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import {
    ApiClient,
    ApiClientError,
    isNetworkError,
    isValidationError,
    isNotFoundError,
    isServerError,
    getErrorMessage
} from '../api-client.js';
import type { CreateBookRequest, UpdateBookRequest, CreateTagRequest } from '../api-client.js';

// Mock fetch globally
const mockFetch = vi.fn();
global.fetch = mockFetch;

describe('ApiClient', () => {
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

    describe('Book Operations', () => {
        describe('getBooks', () => {
            it('should fetch all books successfully', async () => {
                const mockBooks = [
                    {
                        id: 'book1',
                        title: 'Test Book',
                        author: 'Test Author',
                        tags: [],
                        dateAdded: new Date(),
                        dateUpdated: new Date(),
                        createdAt: new Date(),
                        updatedAt: new Date()
                    }
                ];

                mockFetch.mockResolvedValueOnce({
                    ok: true,
                    status: 200,
                    json: async () => ({
                        success: true,
                        data: mockBooks,
                        timestamp: new Date().toISOString()
                    })
                });

                const result = await apiClient.getBooks();
                expect(result).toEqual(mockBooks);
                expect(mockFetch).toHaveBeenCalledWith('/api/books', {
                    headers: { 'Content-Type': 'application/json' },
                    signal: expect.any(AbortSignal)
                });
            });

            it('should handle API errors', async () => {
                mockFetch.mockResolvedValueOnce({
                    ok: false,
                    status: 500,
                    json: async () => ({
                        success: false,
                        error: 'DATABASE_ERROR',
                        message: 'Database connection failed',
                        timestamp: new Date().toISOString()
                    })
                });

                await expect(apiClient.getBooks()).rejects.toThrow(ApiClientError);
            });
        });

        describe('getBook', () => {
            it('should fetch a specific book by ID', async () => {
                const mockBook = {
                    id: 'book1',
                    title: 'Test Book',
                    author: 'Test Author',
                    tags: [],
                    dateAdded: new Date(),
                    dateUpdated: new Date(),
                    createdAt: new Date(),
                    updatedAt: new Date()
                };

                mockFetch.mockResolvedValueOnce({
                    ok: true,
                    status: 200,
                    json: async () => ({
                        success: true,
                        data: mockBook,
                        timestamp: new Date().toISOString()
                    })
                });

                const result = await apiClient.getBook('book1');
                expect(result).toEqual(mockBook);
                expect(mockFetch).toHaveBeenCalledWith('/api/books/book1', {
                    headers: { 'Content-Type': 'application/json' },
                    signal: expect.any(AbortSignal)
                });
            });

            it('should handle book not found', async () => {
                mockFetch.mockResolvedValueOnce({
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
        });

        describe('createBook', () => {
            it('should create a new book successfully', async () => {
                const createRequest: CreateBookRequest = {
                    title: 'New Book',
                    author: 'New Author',
                    tags: []
                };

                const mockCreatedBook = {
                    id: 'book1',
                    ...createRequest,
                    dateAdded: new Date(),
                    dateUpdated: new Date(),
                    createdAt: new Date(),
                    updatedAt: new Date()
                };

                mockFetch.mockResolvedValueOnce({
                    ok: true,
                    status: 201,
                    json: async () => ({
                        success: true,
                        data: mockCreatedBook,
                        timestamp: new Date().toISOString()
                    })
                });

                const result = await apiClient.createBook(createRequest);
                expect(result).toEqual(mockCreatedBook);
                expect(mockFetch).toHaveBeenCalledWith('/api/books', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(createRequest),
                    signal: expect.any(AbortSignal)
                });
            });

            it('should handle validation errors', async () => {
                const invalidRequest = { title: '' }; // Invalid book data

                mockFetch.mockResolvedValueOnce({
                    ok: false,
                    status: 400,
                    json: async () => ({
                        success: false,
                        error: 'VALIDATION_ERROR',
                        message: 'Invalid book data provided',
                        timestamp: new Date().toISOString()
                    })
                });

                await expect(apiClient.createBook(invalidRequest as CreateBookRequest))
                    .rejects.toThrow(ApiClientError);
            });
        });

        describe('updateBook', () => {
            it('should update a book successfully', async () => {
                const updateRequest: UpdateBookRequest = {
                    title: 'Updated Title'
                };

                const mockUpdatedBook = {
                    id: 'book1',
                    title: 'Updated Title',
                    author: 'Test Author',
                    tags: [],
                    dateAdded: new Date(),
                    dateUpdated: new Date(),
                    createdAt: new Date(),
                    updatedAt: new Date()
                };

                mockFetch.mockResolvedValueOnce({
                    ok: true,
                    status: 200,
                    json: async () => ({
                        success: true,
                        data: mockUpdatedBook,
                        timestamp: new Date().toISOString()
                    })
                });

                const result = await apiClient.updateBook('book1', updateRequest);
                expect(result).toEqual(mockUpdatedBook);
                expect(mockFetch).toHaveBeenCalledWith('/api/books/book1', {
                    method: 'PUT',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(updateRequest),
                    signal: expect.any(AbortSignal)
                });
            });
        });

        describe('deleteBook', () => {
            it('should delete a book successfully', async () => {
                mockFetch.mockResolvedValueOnce({
                    ok: true,
                    status: 200,
                    json: async () => ({
                        success: true,
                        data: { id: 'book1' },
                        timestamp: new Date().toISOString()
                    })
                });

                const result = await apiClient.deleteBook('book1');
                expect(result).toEqual({ id: 'book1' });
                expect(mockFetch).toHaveBeenCalledWith('/api/books/book1', {
                    method: 'DELETE',
                    headers: { 'Content-Type': 'application/json' },
                    signal: expect.any(AbortSignal)
                });
            });
        });
    });

    describe('Tag Operations', () => {
        describe('getTags', () => {
            it('should fetch all tags successfully', async () => {
                const mockTags = [
                    {
                        id: 'tag1',
                        name: 'Fiction',
                        color: '#blue',
                        createdAt: new Date(),
                        usageCount: 5
                    }
                ];

                mockFetch.mockResolvedValueOnce({
                    ok: true,
                    status: 200,
                    json: async () => ({
                        success: true,
                        data: mockTags,
                        timestamp: new Date().toISOString()
                    })
                });

                const result = await apiClient.getTags();
                expect(result).toEqual(mockTags);
                expect(mockFetch).toHaveBeenCalledWith('/api/tags', {
                    headers: { 'Content-Type': 'application/json' },
                    signal: expect.any(AbortSignal)
                });
            });
        });

        describe('createTag', () => {
            it('should create a new tag successfully', async () => {
                const createRequest: CreateTagRequest = {
                    name: 'New Tag',
                    color: '#red'
                };

                const mockCreatedTag = {
                    id: 'tag1',
                    ...createRequest,
                    createdAt: new Date(),
                    usageCount: 0
                };

                mockFetch.mockResolvedValueOnce({
                    ok: true,
                    status: 201,
                    json: async () => ({
                        success: true,
                        data: mockCreatedTag,
                        timestamp: new Date().toISOString()
                    })
                });

                const result = await apiClient.createTag(createRequest);
                expect(result).toEqual(mockCreatedTag);
                expect(mockFetch).toHaveBeenCalledWith('/api/tags', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(createRequest),
                    signal: expect.any(AbortSignal)
                });
            });
        });
    });

    describe('Error Handling', () => {
        it('should retry on network failures', async () => {
            // First call fails, second succeeds
            mockFetch
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
            expect(mockFetch).toHaveBeenCalledTimes(2);
        });

        it('should not retry on client errors (4xx)', async () => {
            mockFetch.mockResolvedValueOnce({
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
            expect(mockFetch).toHaveBeenCalledTimes(1); // No retry
        });

        it('should handle timeout errors', async () => {
            const slowApiClient = new ApiClient({ timeout: 100, enableLogging: false });

            mockFetch.mockImplementationOnce(() =>
                new Promise(resolve => setTimeout(resolve, 200))
            );

            await expect(slowApiClient.getBooks()).rejects.toThrow(ApiClientError);
        });
    });

    describe('Health Check', () => {
        it('should check API health', async () => {
            const mockHealth = {
                status: 'healthy',
                timestamp: new Date().toISOString()
            };

            mockFetch.mockResolvedValueOnce({
                ok: true,
                status: 200,
                json: async () => ({
                    success: true,
                    data: mockHealth,
                    timestamp: new Date().toISOString()
                })
            });

            const result = await apiClient.healthCheck();
            expect(result).toEqual(mockHealth);
        });
    });
});

describe('Error Utility Functions', () => {
    describe('isNetworkError', () => {
        it('should identify network errors', () => {
            const networkError = new ApiClientError('NETWORK_ERROR', 'Network failed');
            const otherError = new ApiClientError('VALIDATION_ERROR', 'Invalid data');

            expect(isNetworkError(networkError)).toBe(true);
            expect(isNetworkError(otherError)).toBe(false);
            expect(isNetworkError(new Error('Regular error'))).toBe(false);
        });
    });

    describe('isValidationError', () => {
        it('should identify validation errors', () => {
            const validationError = new ApiClientError('VALIDATION_ERROR', 'Invalid data');
            const otherError = new ApiClientError('NETWORK_ERROR', 'Network failed');

            expect(isValidationError(validationError)).toBe(true);
            expect(isValidationError(otherError)).toBe(false);
        });
    });

    describe('isNotFoundError', () => {
        it('should identify not found errors', () => {
            const bookNotFound = new ApiClientError('BOOK_NOT_FOUND', 'Book not found');
            const tagNotFound = new ApiClientError('TAG_NOT_FOUND', 'Tag not found');
            const otherError = new ApiClientError('VALIDATION_ERROR', 'Invalid data');

            expect(isNotFoundError(bookNotFound)).toBe(true);
            expect(isNotFoundError(tagNotFound)).toBe(true);
            expect(isNotFoundError(otherError)).toBe(false);
        });
    });

    describe('isServerError', () => {
        it('should identify server errors', () => {
            const serverError = new ApiClientError('DATABASE_ERROR', 'DB failed', 500);
            const clientError = new ApiClientError('VALIDATION_ERROR', 'Invalid', 400);

            expect(isServerError(serverError)).toBe(true);
            expect(isServerError(clientError)).toBe(false);
        });
    });

    describe('getErrorMessage', () => {
        it('should return user-friendly error messages', () => {
            const networkError = new ApiClientError('NETWORK_ERROR', 'Network failed');
            const validationError = new ApiClientError('VALIDATION_ERROR', 'Invalid data');
            const bookNotFound = new ApiClientError('BOOK_NOT_FOUND', 'Book not found');
            const regularError = new Error('Regular error');

            expect(getErrorMessage(networkError)).toBe('Unable to connect to the server. Please check your internet connection.');
            expect(getErrorMessage(validationError)).toBe('The provided data is invalid. Please check your input.');
            expect(getErrorMessage(bookNotFound)).toBe('The requested book was not found.');
            expect(getErrorMessage(regularError)).toBe('Regular error');
            expect(getErrorMessage('string error')).toBe('An unknown error occurred.');
        });
    });
});