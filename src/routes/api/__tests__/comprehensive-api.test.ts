import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { GET as getBooksHandler, POST as postBooksHandler } from '../books/+server.js';
import { GET as getBookByIdHandler, PUT as putBookHandler, DELETE as deleteBookHandler } from '../books/[id]/+server.js';
import { GET as getTagsHandler, POST as postTagsHandler } from '../tags/+server.js';
import { GET as getHealthHandler, POST as postHealthDetailedHandler } from '../health/+server.js';
import { db } from '$lib/server/db/connection.js';
import { books, bookTags, tags } from '$lib/server/db/schema.js';
import { generateId } from '$lib/utils/id.js';
import type { CreateBookInput } from '$lib/types/book.js';

// Mock request helper
function createMockRequest(body?: any, url: string = 'http://localhost:3000/api/test', method: string = 'GET') {
    return {
        json: async () => body,
        method,
        url,
        headers: new Map([
            ['user-agent', 'test-agent'],
            ['content-type', 'application/json']
        ])
    } as any;
}

// Mock params helper
function createMockParams(id: string) {
    return { id };
}

// Mock event helper
function createMockEvent(request: any, params?: any) {
    return { request, params } as any;
}

describe('Comprehensive API Tests', () => {
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
            name: 'test-tag',
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

    describe('Books API - Unit Tests', () => {
        describe('GET /api/books', () => {
            it('should return all books with tags', async () => {
                const request = createMockRequest(undefined, 'http://localhost:3000/api/books');
                const event = createMockEvent(request);

                const response = await getBooksHandler(event);
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
                    name: 'test-tag',
                    color: '#ff0000'
                });
            });

            it('should return empty array when no books exist', async () => {
                // Clean up test data
                await db.delete(bookTags);
                await db.delete(books);

                const request = createMockRequest(undefined, 'http://localhost:3000/api/books');
                const event = createMockEvent(request);

                const response = await getBooksHandler(event);
                const data = await response.json();

                expect(response.status).toBe(200);
                expect(data.success).toBe(true);
                expect(data.data).toHaveLength(0);
            });

            it('should handle database errors gracefully', async () => {
                // Mock database error
                const originalSelect = db.select;
                vi.spyOn(db, 'select').mockImplementation(() => {
                    throw new Error('Database connection failed');
                });

                const request = createMockRequest(undefined, 'http://localhost:3000/api/books');
                const event = createMockEvent(request);

                const response = await getBooksHandler(event);
                const data = await response.json();

                expect(response.status).toBe(500);
                expect(data.success).toBe(false);
                expect(data.error).toBe('DATABASE_ERROR');

                // Restore original method
                db.select = originalSelect;
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

                const request = createMockRequest(newBook, 'http://localhost:3000/api/books', 'POST');
                const event = createMockEvent(request);

                const response = await postBooksHandler(event);
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

                const request = createMockRequest(newBook, 'http://localhost:3000/api/books', 'POST');
                const event = createMockEvent(request);

                const response = await postBooksHandler(event);
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

                const request = createMockRequest(invalidBook, 'http://localhost:3000/api/books', 'POST');
                const event = createMockEvent(request);

                const response = await postBooksHandler(event);
                const data = await response.json();

                expect(response.status).toBe(400);
                expect(data.success).toBe(false);
                expect(data.error).toBe('VALIDATION_ERROR');
            });

            it('should handle database transaction errors', async () => {
                // Mock database error
                const originalInsert = db.insert;
                vi.spyOn(db, 'insert').mockImplementation(() => {
                    throw new Error('Transaction failed');
                });

                const newBook: CreateBookInput = {
                    title: 'Test Book',
                    author: 'Test Author'
                };

                const request = createMockRequest(newBook, 'http://localhost:3000/api/books', 'POST');
                const event = createMockEvent(request);

                const response = await postBooksHandler(event);
                const data = await response.json();

                expect(response.status).toBe(500);
                expect(data.success).toBe(false);
                expect(data.error).toBe('DATABASE_ERROR');

                // Restore original method
                db.insert = originalInsert;
            });
        });

        describe('GET /api/books/[id]', () => {
            it('should return a specific book by ID', async () => {
                const request = createMockRequest(undefined, `http://localhost:3000/api/books/${testBookId}`);
                const params = createMockParams(testBookId);
                const event = createMockEvent(request, params);

                const response = await getBookByIdHandler(event);
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
                const request = createMockRequest(undefined, `http://localhost:3000/api/books/${nonExistentId}`);
                const params = createMockParams(nonExistentId);
                const event = createMockEvent(request, params);

                const response = await getBookByIdHandler(event);
                const data = await response.json();

                expect(response.status).toBe(404);
                expect(data.success).toBe(false);
                expect(data.error).toBe('BOOK_NOT_FOUND');
            });

            it('should return validation error for invalid ID format', async () => {
                const request = createMockRequest(undefined, 'http://localhost:3000/api/books/invalid-id');
                const params = createMockParams('invalid-id');
                const event = createMockEvent(request, params);

                const response = await getBookByIdHandler(event);
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

                const request = createMockRequest(updateData, `http://localhost:3000/api/books/${testBookId}`, 'PUT');
                const params = createMockParams(testBookId);
                const event = createMockEvent(request, params);

                const response = await putBookHandler(event);
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

                const request = createMockRequest(updateData, `http://localhost:3000/api/books/${nonExistentId}`, 'PUT');
                const params = createMockParams(nonExistentId);
                const event = createMockEvent(request, params);

                const response = await putBookHandler(event);
                const data = await response.json();

                expect(response.status).toBe(404);
                expect(data.success).toBe(false);
                expect(data.error).toBe('BOOK_NOT_FOUND');
            });

            it('should validate input data', async () => {
                const invalidData = {
                    narratorRating: 'invalid' // Should be a number
                };

                const request = createMockRequest(invalidData, `http://localhost:3000/api/books/${testBookId}`, 'PUT');
                const params = createMockParams(testBookId);
                const event = createMockEvent(request, params);

                const response = await putBookHandler(event);
                const data = await response.json();

                expect(response.status).toBe(400);
                expect(data.success).toBe(false);
                expect(data.error).toBe('VALIDATION_ERROR');
            });
        });

        describe('DELETE /api/books/[id]', () => {
            it('should delete an existing book', async () => {
                const request = createMockRequest(undefined, `http://localhost:3000/api/books/${testBookId}`, 'DELETE');
                const params = createMockParams(testBookId);
                const event = createMockEvent(request, params);

                const response = await deleteBookHandler(event);
                const data = await response.json();

                expect(response.status).toBe(200);
                expect(data.success).toBe(true);
                expect(data.data.id).toBe(testBookId);

                // Verify book is actually deleted
                const getRequest = createMockRequest(undefined, `http://localhost:3000/api/books/${testBookId}`);
                const getParams = createMockParams(testBookId);
                const getEvent = createMockEvent(getRequest, getParams);
                const getResponse = await getBookByIdHandler(getEvent);
                expect(getResponse.status).toBe(404);
            });

            it('should return 404 for non-existent book', async () => {
                const nonExistentId = generateId();
                const request = createMockRequest(undefined, `http://localhost:3000/api/books/${nonExistentId}`, 'DELETE');
                const params = createMockParams(nonExistentId);
                const event = createMockEvent(request, params);

                const response = await deleteBookHandler(event);
                const data = await response.json();

                expect(response.status).toBe(404);
                expect(data.success).toBe(false);
                expect(data.error).toBe('BOOK_NOT_FOUND');
            });
        });
    });

    describe('Tags API - Unit Tests', () => {
        describe('GET /api/tags', () => {
            it('should return all tags with usage count', async () => {
                const request = createMockRequest(undefined, 'http://localhost:3000/api/tags');
                const event = createMockEvent(request);

                const response = await getTagsHandler(event);
                const data = await response.json();

                expect(response.status).toBe(200);
                expect(data.success).toBe(true);
                expect(data.data).toHaveLength(1);
                expect(data.data[0]).toMatchObject({
                    id: testTagId,
                    name: 'test-tag',
                    color: '#ff0000',
                    usageCount: 1
                });
            });

            it('should return empty array when no tags exist', async () => {
                // Clean up test data
                await db.delete(bookTags);
                await db.delete(books);
                await db.delete(tags);

                const request = createMockRequest(undefined, 'http://localhost:3000/api/tags');
                const event = createMockEvent(request);

                const response = await getTagsHandler(event);
                const data = await response.json();

                expect(response.status).toBe(200);
                expect(data.success).toBe(true);
                expect(data.data).toHaveLength(0);
            });
        });

        describe('POST /api/tags', () => {
            it('should create a new tag successfully', async () => {
                const newTag = {
                    name: 'new-tag',
                    color: '#0000ff'
                };

                const request = createMockRequest(newTag, 'http://localhost:3000/api/tags', 'POST');
                const event = createMockEvent(request);

                const response = await postTagsHandler(event);
                const data = await response.json();

                expect(response.status).toBe(201);
                expect(data.success).toBe(true);
                expect(data.data).toMatchObject({
                    name: 'new-tag',
                    color: '#0000ff',
                    usageCount: 0
                });
            });

            it('should reject duplicate tag names', async () => {
                const duplicateTag = {
                    name: 'test-tag', // Already exists
                    color: '#0000ff'
                };

                const request = createMockRequest(duplicateTag, 'http://localhost:3000/api/tags', 'POST');
                const event = createMockEvent(request);

                const response = await postTagsHandler(event);
                const data = await response.json();

                expect(response.status).toBe(409);
                expect(data.success).toBe(false);
                expect(data.error).toBe('CONFLICT');
            });

            it('should validate required fields', async () => {
                const invalidTag = {
                    name: '', // Empty name should fail
                    color: '#0000ff'
                };

                const request = createMockRequest(invalidTag, 'http://localhost:3000/api/tags', 'POST');
                const event = createMockEvent(request);

                const response = await postTagsHandler(event);
                const data = await response.json();

                expect(response.status).toBe(400);
                expect(data.success).toBe(false);
                expect(data.error).toBe('VALIDATION_ERROR');
            });
        });
    });

    describe('Health API - Unit Tests', () => {
        describe('GET /api/health', () => {
            it('should return basic health status', async () => {
                const request = createMockRequest(undefined, 'http://localhost:3000/api/health');
                const event = createMockEvent(request);

                const response = await getHealthHandler(event);
                const data = await response.json();

                expect(response.status).toBe(200);
                expect(data.success).toBe(true);
                expect(data.data).toHaveProperty('status');
                expect(data.data).toHaveProperty('timestamp');
                expect(data.data).toHaveProperty('checks');
                expect(data.data.checks).toHaveProperty('database');
                expect(data.data.checks).toHaveProperty('memory');
                expect(data.data.checks).toHaveProperty('system');
            });

            it('should include response time in health check', async () => {
                const request = createMockRequest(undefined, 'http://localhost:3000/api/health');
                const event = createMockEvent(request);

                const response = await getHealthHandler(event);
                const data = await response.json();

                expect(data.data).toHaveProperty('responseTime');
                expect(typeof data.data.responseTime).toBe('number');
                expect(data.data.responseTime).toBeGreaterThanOrEqual(0);
            });
        });

        describe('POST /api/health/detailed', () => {
            it('should return detailed health information', async () => {
                const request = createMockRequest({}, 'http://localhost:3000/api/health/detailed', 'POST');
                const event = createMockEvent(request);

                const response = await postHealthDetailedHandler(event);
                const data = await response.json();

                expect(response.status).toBe(200);
                expect(data.success).toBe(true);
                expect(data.data).toHaveProperty('status');
                expect(data.data).toHaveProperty('checks');
                expect(data.data.checks).toHaveProperty('database');
                expect(data.data.checks).toHaveProperty('memory');
                expect(data.data.checks).toHaveProperty('cpu');
                expect(data.data.checks).toHaveProperty('system');
                expect(data.data.checks).toHaveProperty('environment');
            });

            it('should include performance metrics', async () => {
                const request = createMockRequest({}, 'http://localhost:3000/api/health/detailed', 'POST');
                const event = createMockEvent(request);

                const response = await postHealthDetailedHandler(event);
                const data = await response.json();

                expect(data.data.checks.database).toHaveProperty('performanceMs');
                expect(data.data.checks.memory).toHaveProperty('heapUsedMB');
                expect(data.data.checks.memory).toHaveProperty('heapTotalMB');
            });
        });
    });
});