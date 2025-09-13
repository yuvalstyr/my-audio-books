import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { GET, POST } from '../+server.js';
import { GET as getById, PUT, DELETE } from '../[id]/+server.js';
import { db } from '$lib/server/db/connection.js';
import { books, bookTags, tags } from '$lib/server/db/schema.js';
import { generateId } from '$lib/utils/id.js';
import type { CreateBookInput } from '$lib/types/book.js';

// Mock request helper
function createMockRequest(body?: any) {
    return {
        json: async () => body
    } as Request;
}

// Mock params helper
function createMockParams(id: string) {
    return { id };
}

describe('Books API', () => {
    let testBookId: string;
    let testTagId: string;

    beforeEach(async () => {
        // Clean up test data
        await db.delete(bookTags);
        await db.delete(books);
        await db.delete(tags);

        // Create test data
        testBookId = generateId();
        testTagId = generateId();

        // Insert test tag
        await db.insert(tags).values({
            id: testTagId,
            name: 'funny',
            color: '#ff0000',
            createdAt: new Date().toISOString()
        });

        // Insert test book
        const now = new Date().toISOString();
        await db.insert(books).values({
            id: testBookId,
            title: 'Test Book',
            author: 'Test Author',
            audibleUrl: 'https://www.audible.com/pd/test-book/B123456789',
            narratorRating: 4.5,
            performanceRating: 4.0,
            description: 'A test book',
            coverImageUrl: 'https://example.com/cover.jpg',
            queuePosition: 1,
            dateAdded: now,
            dateUpdated: now,
            createdAt: now,
            updatedAt: now
        });

        // Insert book-tag relationship
        await db.insert(bookTags).values({
            bookId: testBookId,
            tagId: testTagId
        });
    });

    afterEach(async () => {
        // Clean up test data
        await db.delete(bookTags);
        await db.delete(books);
        await db.delete(tags);
    });

    describe('GET /api/books', () => {
        it('should return all books with tags', async () => {
            const response = await GET();
            const data = await response.json();

            expect(response.status).toBe(200);
            expect(data.success).toBe(true);
            expect(data.data).toHaveLength(1);
            expect(data.data[0]).toMatchObject({
                id: testBookId,
                title: 'Test Book',
                author: 'Test Author',
                audibleUrl: 'https://www.audible.com/pd/test-book/B123456789',
                narratorRating: 4.5,
                performanceRating: 4.0,
                description: 'A test book',
                coverImageUrl: 'https://example.com/cover.jpg',
                queuePosition: 1
            });
            expect(data.data[0].tags).toHaveLength(1);
            expect(data.data[0].tags[0]).toMatchObject({
                id: testTagId,
                name: 'funny',
                color: '#ff0000'
            });
        });

        it('should return empty array when no books exist', async () => {
            // Clean up test data
            await db.delete(bookTags);
            await db.delete(books);

            const response = await GET();
            const data = await response.json();

            expect(response.status).toBe(200);
            expect(data.success).toBe(true);
            expect(data.data).toHaveLength(0);
        });
    });

    describe('POST /api/books', () => {
        it('should create a new book with tags', async () => {
            const newBook: CreateBookInput = {
                title: 'New Test Book',
                author: 'New Test Author',
                audibleUrl: 'https://www.audible.com/pd/new-test-book/B987654321',
                narratorRating: 3.5,
                performanceRating: 4.5,
                description: 'A new test book',
                coverImageUrl: 'https://example.com/new-cover.jpg',
                queuePosition: 2,
                tags: [{
                    id: generateId(),
                    name: 'action',
                    color: '#00ff00'
                }]
            };

            const request = createMockRequest(newBook);
            const response = await POST({ request } as any);
            const data = await response.json();

            expect(response.status).toBe(201);
            expect(data.success).toBe(true);
            expect(data.data).toMatchObject({
                title: 'New Test Book',
                author: 'New Test Author',
                audibleUrl: 'https://www.audible.com/pd/new-test-book/B987654321',
                narratorRating: 3.5,
                performanceRating: 4.5,
                description: 'A new test book',
                coverImageUrl: 'https://example.com/new-cover.jpg',
                queuePosition: 2
            });
            expect(data.data.tags).toHaveLength(1);
            expect(data.data.tags[0].name).toBe('action');
        });

        it('should create a book without optional fields', async () => {
            const newBook: CreateBookInput = {
                title: 'Minimal Book',
                author: 'Minimal Author'
            };

            const request = createMockRequest(newBook);
            const response = await POST({ request } as any);
            const data = await response.json();

            expect(response.status).toBe(201);
            expect(data.success).toBe(true);
            expect(data.data).toMatchObject({
                title: 'Minimal Book',
                author: 'Minimal Author'
            });
            expect(data.data.tags).toHaveLength(0);
        });

        it('should return validation error for invalid input', async () => {
            const invalidBook = {
                title: '', // Empty title should fail validation
                author: 'Test Author'
            };

            const request = createMockRequest(invalidBook);
            const response = await POST({ request } as any);
            const data = await response.json();

            expect(response.status).toBe(400);
            expect(data.success).toBe(false);
            expect(data.error).toBe('VALIDATION_ERROR');
        });
    });

    describe('GET /api/books/[id]', () => {
        it('should return a specific book by ID', async () => {
            const params = createMockParams(testBookId);
            const response = await getById({ params } as any);
            const data = await response.json();

            expect(response.status).toBe(200);
            expect(data.success).toBe(true);
            expect(data.data).toMatchObject({
                id: testBookId,
                title: 'Test Book',
                author: 'Test Author'
            });
            expect(data.data.tags).toHaveLength(1);
        });

        it('should return 404 for non-existent book', async () => {
            const nonExistentId = generateId();
            const params = createMockParams(nonExistentId);
            const response = await getById({ params } as any);
            const data = await response.json();

            expect(response.status).toBe(404);
            expect(data.success).toBe(false);
            expect(data.error).toBe('BOOK_NOT_FOUND');
        });

        it('should return validation error for invalid ID format', async () => {
            const params = createMockParams('invalid-id');
            const response = await getById({ params } as any);
            const data = await response.json();

            expect(response.status).toBe(400);
            expect(data.success).toBe(false);
            expect(data.error).toBe('VALIDATION_ERROR');
        });
    });

    describe('PUT /api/books/[id]', () => {
        it('should update an existing book', async () => {
            const updateData = {
                title: 'Updated Test Book',
                narratorRating: 5.0
            };

            const params = createMockParams(testBookId);
            const request = createMockRequest(updateData);
            const response = await PUT({ params, request } as any);
            const data = await response.json();

            expect(response.status).toBe(200);
            expect(data.success).toBe(true);
            expect(data.data).toMatchObject({
                id: testBookId,
                title: 'Updated Test Book',
                author: 'Test Author', // Should remain unchanged
                narratorRating: 5.0
            });
        });

        it('should return 404 for non-existent book', async () => {
            const nonExistentId = generateId();
            const updateData = { title: 'Updated Title' };

            const params = createMockParams(nonExistentId);
            const request = createMockRequest(updateData);
            const response = await PUT({ params, request } as any);
            const data = await response.json();

            expect(response.status).toBe(404);
            expect(data.success).toBe(false);
            expect(data.error).toBe('BOOK_NOT_FOUND');
        });
    });

    describe('DELETE /api/books/[id]', () => {
        it('should delete an existing book', async () => {
            const params = createMockParams(testBookId);
            const response = await DELETE({ params } as any);
            const data = await response.json();

            expect(response.status).toBe(200);
            expect(data.success).toBe(true);
            expect(data.data.id).toBe(testBookId);

            // Verify book is actually deleted
            const getResponse = await getById({ params } as any);
            expect(getResponse.status).toBe(404);
        });

        it('should return 404 for non-existent book', async () => {
            const nonExistentId = generateId();
            const params = createMockParams(nonExistentId);
            const response = await DELETE({ params } as any);
            const data = await response.json();

            expect(response.status).toBe(404);
            expect(data.success).toBe(false);
            expect(data.error).toBe('BOOK_NOT_FOUND');
        });
    });
});