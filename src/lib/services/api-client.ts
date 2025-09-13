/**
 * Frontend API Client Service
 * Provides a centralized interface for all backend API operations
 */

import type { Book, BookTag, CreateBookInput, UpdateBookInput } from '$lib/types/book.js';

// API Response Types
export interface ApiResponse<T = any> {
    success: boolean;
    data?: T;
    error?: string;
    message?: string;
    details?: any;
    timestamp: string;
    requestId?: string;
}

export interface ApiError {
    success: false;
    error: string;
    message: string;
    details?: any;
    timestamp: string;
    requestId?: string;
}

export interface ApiSuccess<T> {
    success: true;
    data: T;
    message?: string;
    timestamp: string;
    requestId?: string;
}

// Extended Book type with server fields
export interface ApiBook extends Omit<Book, 'dateAdded'> {
    dateAdded: Date;
    dateUpdated: Date;
    createdAt: Date;
    updatedAt: Date;
}

// Tag with usage count from API
export interface ApiTag extends BookTag {
    createdAt: Date;
    usageCount: number;
}

// Request/Response types for API operations
export interface CreateBookRequest extends CreateBookInput { }
export interface UpdateBookRequest extends Partial<UpdateBookInput> { }

export interface CreateTagRequest {
    id?: string;
    name: string;
    color: string;
}

// API Client Configuration
export interface ApiClientConfig {
    baseUrl?: string;
    timeout?: number;
    retryAttempts?: number;
    retryDelay?: number;
    enableLogging?: boolean;
    enableCaching?: boolean;
    cacheMaxAge?: number;
}

// Network Error Types
export class ApiClientError extends Error {
    public readonly code: string;
    public readonly statusCode?: number;
    public readonly details?: any;
    public readonly requestId?: string;

    constructor(
        code: string,
        message: string,
        statusCode?: number,
        details?: any,
        requestId?: string
    ) {
        super(message);
        this.name = 'ApiClientError';
        this.code = code;
        this.statusCode = statusCode;
        this.details = details;
        this.requestId = requestId;
    }
}

// Simple in-memory cache for API responses
interface CacheEntry<T> {
    data: T;
    timestamp: number;
    maxAge: number;
}

class ApiCache {
    private cache = new Map<string, CacheEntry<any>>();

    set<T>(key: string, data: T, maxAge: number): void {
        this.cache.set(key, {
            data,
            timestamp: Date.now(),
            maxAge
        });
    }

    get<T>(key: string): T | null {
        const entry = this.cache.get(key);
        if (!entry) return null;

        const isExpired = Date.now() - entry.timestamp > entry.maxAge;
        if (isExpired) {
            this.cache.delete(key);
            return null;
        }

        return entry.data;
    }

    clear(): void {
        this.cache.clear();
    }

    delete(key: string): void {
        this.cache.delete(key);
    }
}

/**
 * Frontend API Client for audiobook wishlist operations
 */
export class ApiClient {
    private config: Required<ApiClientConfig>;
    private requestId: number = 0;
    private cache: ApiCache;

    constructor(config: ApiClientConfig = {}) {
        this.config = {
            baseUrl: config.baseUrl || '/api',
            timeout: config.timeout || 10000,
            retryAttempts: config.retryAttempts || 3,
            retryDelay: config.retryDelay || 1000,
            enableLogging: config.enableLogging ?? true,
            enableCaching: config.enableCaching ?? true,
            cacheMaxAge: config.cacheMaxAge || 60000 // 1 minute default
        };
        this.cache = new ApiCache();
    }

    /**
     * Generate a unique request ID for logging
     */
    private generateRequestId(): string {
        return `req_${Date.now()}_${++this.requestId}`;
    }

    /**
     * Log API requests and responses
     */
    private log(level: 'info' | 'warn' | 'error', message: string, data?: any): void {
        if (!this.config.enableLogging) return;

        const logData = {
            timestamp: new Date().toISOString(),
            message,
            ...data
        };

        console[level](`[ApiClient] ${message}`, logData);
    }

    /**
     * Make HTTP request with retry logic and error handling
     */
    private async makeRequest<T>(
        endpoint: string,
        options: RequestInit = {},
        requestId?: string
    ): Promise<T> {
        const reqId = requestId || this.generateRequestId();
        const url = `${this.config.baseUrl}${endpoint}`;

        const requestOptions: RequestInit = {
            ...options,
            headers: {
                'Content-Type': 'application/json',
                ...options.headers
            }
        };

        this.log('info', `Making ${options.method || 'GET'} request`, {
            requestId: reqId,
            url,
            method: options.method || 'GET'
        });

        let lastError: Error | null = null;

        for (let attempt = 1; attempt <= this.config.retryAttempts; attempt++) {
            try {
                const controller = new AbortController();
                const timeoutId = setTimeout(() => controller.abort(), this.config.timeout);

                const response = await fetch(url, {
                    ...requestOptions,
                    signal: controller.signal
                });

                clearTimeout(timeoutId);

                const responseData: ApiResponse<T> = await response.json();

                this.log('info', `Request completed`, {
                    requestId: reqId,
                    status: response.status,
                    success: responseData.success,
                    attempt
                });

                if (!response.ok) {
                    const error = responseData as ApiError;
                    throw new ApiClientError(
                        error.error || 'HTTP_ERROR',
                        error.message || `HTTP ${response.status}`,
                        response.status,
                        error.details,
                        error.requestId
                    );
                }

                if (!responseData.success) {
                    const error = responseData as ApiError;
                    throw new ApiClientError(
                        error.error,
                        error.message,
                        response.status,
                        error.details,
                        error.requestId
                    );
                }

                const successResponse = responseData as ApiSuccess<T>;
                return successResponse.data;

            } catch (error) {
                lastError = error as Error;

                if (error instanceof ApiClientError) {
                    // Don't retry client errors (4xx)
                    if (error.statusCode && error.statusCode >= 400 && error.statusCode < 500) {
                        throw error;
                    }
                }

                this.log('warn', `Request failed (attempt ${attempt}/${this.config.retryAttempts})`, {
                    requestId: reqId,
                    error: error instanceof Error ? error.message : String(error),
                    attempt
                });

                if (attempt < this.config.retryAttempts) {
                    await new Promise(resolve => setTimeout(resolve, this.config.retryDelay * attempt));
                }
            }
        }

        // All retries failed
        if (lastError instanceof ApiClientError) {
            throw lastError;
        }

        throw new ApiClientError(
            'NETWORK_ERROR',
            `Request failed after ${this.config.retryAttempts} attempts: ${lastError?.message}`,
            undefined,
            { originalError: lastError?.message },
            reqId
        );
    }

    // Book Operations

    /**
     * Get all books with caching
     */
    async getBooks(useCache = true): Promise<ApiBook[]> {
        const cacheKey = 'books:all';

        if (useCache && this.config.enableCaching) {
            const cached = this.cache.get<ApiBook[]>(cacheKey);
            if (cached) {
                this.log('info', 'Using cached books data', { cacheKey });
                return cached;
            }
        }

        const books = await this.makeRequest<ApiBook[]>('/books');

        if (this.config.enableCaching) {
            this.cache.set(cacheKey, books, this.config.cacheMaxAge);
        }

        return books;
    }

    /**
     * Get a specific book by ID
     */
    async getBook(id: string): Promise<ApiBook> {
        return this.makeRequest<ApiBook>(`/books/${encodeURIComponent(id)}`);
    }

    /**
     * Create a new book and invalidate cache
     */
    async createBook(book: CreateBookRequest): Promise<ApiBook> {
        const result = await this.makeRequest<ApiBook>('/books', {
            method: 'POST',
            body: JSON.stringify(book)
        });

        // Invalidate relevant caches
        this.cache.delete('books:all');
        this.cache.delete('tags:all');

        return result;
    }

    /**
     * Update an existing book and invalidate cache
     */
    async updateBook(id: string, updates: UpdateBookRequest): Promise<ApiBook> {
        const result = await this.makeRequest<ApiBook>(`/books/${encodeURIComponent(id)}`, {
            method: 'PUT',
            body: JSON.stringify(updates)
        });

        // Invalidate relevant caches
        this.cache.delete('books:all');
        this.cache.delete(`book:${id}`);

        return result;
    }

    /**
     * Delete a book and invalidate cache
     */
    async deleteBook(id: string): Promise<{ id: string }> {
        const result = await this.makeRequest<{ id: string }>(`/books/${encodeURIComponent(id)}`, {
            method: 'DELETE'
        });

        // Invalidate relevant caches
        this.cache.delete('books:all');
        this.cache.delete(`book:${id}`);

        return result;
    }

    // Tag Operations

    /**
     * Get all tags with usage count and caching
     */
    async getTags(useCache = true): Promise<ApiTag[]> {
        const cacheKey = 'tags:all';

        if (useCache && this.config.enableCaching) {
            const cached = this.cache.get<ApiTag[]>(cacheKey);
            if (cached) {
                this.log('info', 'Using cached tags data', { cacheKey });
                return cached;
            }
        }

        const tags = await this.makeRequest<ApiTag[]>('/tags');

        if (this.config.enableCaching) {
            this.cache.set(cacheKey, tags, this.config.cacheMaxAge);
        }

        return tags;
    }

    /**
     * Create a new tag
     */
    async createTag(tag: CreateTagRequest): Promise<ApiTag> {
        return this.makeRequest<ApiTag>('/tags', {
            method: 'POST',
            body: JSON.stringify(tag)
        });
    }

    // Health Check

    /**
     * Check API health status
     */
    async healthCheck(): Promise<{ status: string; timestamp: string }> {
        return this.makeRequest<{ status: string; timestamp: string }>('/ping');
    }

    /**
     * Get performance metrics
     */
    async getPerformanceMetrics(): Promise<any> {
        return this.makeRequest<any>('/performance');
    }

    /**
     * Clear all cached data
     */
    clearCache(): void {
        this.cache.clear();
        this.log('info', 'API cache cleared');
    }

    /**
     * Get cache statistics
     */
    getCacheStats(): { size: number } {
        return {
            size: (this.cache as any).cache.size
        };
    }
}

// Default API client instance
export const apiClient = new ApiClient();

// Utility functions for error handling

/**
 * Check if an error is a network error
 */
export function isNetworkError(error: unknown): error is ApiClientError {
    return error instanceof ApiClientError && error.code === 'NETWORK_ERROR';
}

/**
 * Check if an error is a validation error
 */
export function isValidationError(error: unknown): error is ApiClientError {
    return error instanceof ApiClientError && error.code === 'VALIDATION_ERROR';
}

/**
 * Check if an error is a not found error
 */
export function isNotFoundError(error: unknown): error is ApiClientError {
    return error instanceof ApiClientError &&
        (error.code === 'BOOK_NOT_FOUND' || error.code === 'TAG_NOT_FOUND');
}

/**
 * Check if an error is a server error (5xx)
 */
export function isServerError(error: unknown): error is ApiClientError {
    return error instanceof ApiClientError &&
        error.statusCode !== undefined &&
        error.statusCode >= 500;
}

/**
 * Get user-friendly error message
 */
export function getErrorMessage(error: unknown): string {
    if (error instanceof ApiClientError) {
        switch (error.code) {
            case 'NETWORK_ERROR':
                return 'Unable to connect to the server. Please check your internet connection.';
            case 'VALIDATION_ERROR':
                return 'The provided data is invalid. Please check your input.';
            case 'BOOK_NOT_FOUND':
                return 'The requested book was not found.';
            case 'TAG_NOT_FOUND':
                return 'The requested tag was not found.';
            case 'CONFLICT':
                return 'A conflict occurred. This item may already exist.';
            case 'DATABASE_ERROR':
                return 'A database error occurred. Please try again later.';
            default:
                return error.message || 'An unexpected error occurred.';
        }
    }

    if (error instanceof Error) {
        return error.message;
    }

    return 'An unknown error occurred.';
}