/**
 * Simple Frontend API Client
 */

import type { Book, BookTag, CreateBookInput, UpdateBookInput } from '$lib/types/book.js';

// Simple API Response Types
export interface ApiResponse<T = any> {
    success: boolean;
    data?: T;
    error?: string;
    message?: string;
}

export class ApiClientError extends Error {
    public readonly statusCode?: number;

    constructor(message: string, statusCode?: number) {
        super(message);
        this.name = 'ApiClientError';
        this.statusCode = statusCode;
    }
}

/**
 * Simple Frontend API Client
 */
export class ApiClient {
    private baseUrl = '/api';

    /**
     * Simple HTTP request
     */
    private async request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
        const url = `${this.baseUrl}${endpoint}`;

        const requestOptions: RequestInit = {
            ...options,
            headers: {
                'Content-Type': 'application/json',
                ...options.headers
            }
        };

        const response = await fetch(url, requestOptions);
        const data: ApiResponse<T> = await response.json();

        if (!response.ok || !data.success) {
            throw new ApiClientError(
                data.error || data.message || 'Request failed',
                response.status
            );
        }

        return data.data!;
    }

    // Book Operations
    async getBooks(): Promise<Book[]> {
        return this.request<Book[]>('/books');
    }

    async getBook(id: string): Promise<Book> {
        return this.request<Book>(`/books/${id}`);
    }

    async createBook(book: CreateBookInput): Promise<Book> {
        return this.request<Book>('/books', {
            method: 'POST',
            body: JSON.stringify(book)
        });
    }

    async updateBook(id: string, updates: Partial<UpdateBookInput>): Promise<Book> {
        return this.request<Book>(`/books/${id}`, {
            method: 'PUT',
            body: JSON.stringify(updates)
        });
    }

    async deleteBook(id: string): Promise<{ id: string }> {
        return this.request<{ id: string }>(`/books/${id}`, {
            method: 'DELETE'
        });
    }

    // Tag Operations
    async getTags(): Promise<BookTag[]> {
        return this.request<BookTag[]>('/tags');
    }

    async createTag(tag: { name: string; color: string }): Promise<BookTag> {
        return this.request<BookTag>('/tags', {
            method: 'POST',
            body: JSON.stringify(tag)
        });
    }

    // Health Check
    async healthCheck(): Promise<{ status: string }> {
        return this.request<{ status: string }>('/ping');
    }
}

// Default API client instance
export const apiClient = new ApiClient();

// Simple error message helper
export function getErrorMessage(error: unknown): string {
    if (error instanceof ApiClientError) {
        return error.message;
    }
    if (error instanceof Error) {
        return error.message;
    }
    return 'An unknown error occurred.';
}