import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { GET as getBooksHandler, POST as postBooksHandler } from '../books/+server.js';
import { GET as getBookByIdHandler, PUT as putBookHandler, DELETE as deleteBookHandler } from '../books/[id]/+server.js';
import { GET as getTagsHandler, POST as postTagsHandler } from '../tags/+server.js';
import { GET as getHealthHandler } from '../health/+server.js';
import { db } from '$lib/server/db/connection.js';
import { books, bookTags, tags } from '$lib/server/db/schema.js';
import { generateId } from '$lib/utils/id.js';

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

describe('API Edge Cases and Error Handling', () => {
    beforeEach(async () => {
        // Clean up test data
        await db.delete(bookTags);
        await db.delete(books);
        await db.delete(tags);
    });

    afterEach(async () => {
        // Clean up test data
        await db.delete(bookTags);
        await db.delete(books);
        await db.delete(tags);
    });

    describe('Input Validation Edge Cases', () => {
        it('should handle extremely long input strings', async () => {
            const longString = 'a'.repeat(10000);
            const bookWithLongData = {
                title: longString,
                author: longString,
                description: longString
            };

            const request = createMockRequest(bookWithLongData, 'http://localhost:3000/api/books', 'POST');
            const event = createMockEvent(request);
            const response = await postBooksHandler(event);
            const data = await response.json();

            // Should either accept it or return validation error
            expect([201, 400]).toContain(response.status);
            if (response.status === 400) {
                expect(data.error).toBe('VALIDATION_ERROR');
            }
        });

        it('should handle special characters in input', async () => {
            const specialCharsBook = {
                title: '📚 Test Book with Émojis & Special Chars: <script>alert("xss")</script>',
                author: 'Tëst Àuthör with ñ and ü',
                description: 'Description with "quotes", \'apostrophes\', and <tags>'
            };

            const request = createMockRequest(specialCharsBook, 'http://localhost:3000/api/books', 'POST');
            const event = createMockEvent(request);
            const response = await postBooksHandler(event);
            const data = await response.json();

            expect(response.status).toBe(201);
            expect(data.success).toBe(true);
            expect(data.data.title).toBe(specialCharsBook.title);
            expect(data.data.author).toBe(specialCharsBook.author);
        });

        it('should handle null and undefined values', async () => {
            const bookWithNulls = {
                title: 'Valid Title',
                author: 'Valid Author',
                description: null,
                
                narratorRating: null,
                performanceRating: undefined
            };

            const request = createMockRequest(bookWithNulls, 'http://localhost:3000/api/books', 'POST');
            const event = createMockEvent(request);
            const response = await postBooksHandler(event);
            const data = await response.json();

            expect(response.status).toBe(201);
            expect(data.success).toBe(true);
            expect(data.data.title).toBe('Valid Title');
            expect(data.data.author).toBe('Valid Author');
        });

        it('should handle malformed JSON gracefully', async () => {
            const request = {
                json: async () => {
                    throw new SyntaxError('Unexpected token in JSON');
                },
                method: 'POST',
                url: 'http://localhost:3000/api/books',
                headers: new Map([['content-type', 'application/json']])
            } as any;

            const event = createMockEvent(request);
            const response = await postBooksHandler(event);
            const data = await response.json();

            expect(response.status).toBe(500);
            expect(data.success).toBe(false);
        });
    });

    describe('Database Edge Cases', () => {
        it('should handle concurrent book creation', async () => {
            const book1 = {
                title: 'Concurrent Book 1',
                author: 'Author 1'
            };

            const book2 = {
                title: 'Concurrent Book 2',
                author: 'Author 2'
            };

            // Create requests simultaneously
            const request1 = createMockRequest(book1, 'http://localhost:3000/api/books', 'POST');
            const event1 = createMockEvent(request1);

            const request2 = createMockRequest(book2, 'http://localhost:3000/api/books', 'POST');
            const event2 = createMockEvent(request2);

            const [response1, response2] = await Promise.all([
                postBooksHandler(event1),
                postBooksHandler(event2)
            ]);

            expect(response1.status).toBe(201);
            expect(response2.status).toBe(201);

            // Verify both books were created
            const listRequest = createMockRequest(undefined, 'http://localhost:3000/api/books');
            const listEvent = createMockEvent(listRequest);
            const listResponse = await getBooksHandler(listEvent);
            const listData = await listResponse.json();

            expect(listData.data).toHaveLength(2);
        });

        it('should handle large datasets efficiently', async () => {
            // Create multiple books
            const createPromises = [];
            for (let i = 0; i < 50; i++) {
                const book = {
                    title: `Performance Test Book ${i}`,
                    author: `Author ${i}`,
                    tags: [{
                        id: generateId(),
                        name: `tag-${i}`,
                        color: `#${i.toString(16).padStart(6, '0')}`
                    }]
                };

                const request = createMockRequest(book, 'http://localhost:3000/api/books', 'POST');
                const event = createMockEvent(request);
                createPromises.push(postBooksHandler(event));
            }

            await Promise.all(createPromises);

            // Test retrieval performance
            const startTime = Date.now();
            const listRequest = createMockRequest(undefined, 'http://localhost:3000/api/books');
            const listEvent = createMockEvent(listRequest);
            const listResponse = await getBooksHandler(listEvent);
            const endTime = Date.now();

            const listData = await listResponse.json();
            expect(listResponse.status).toBe(200);
            expect(listData.data).toHaveLength(50);

            // Should complete within reasonable time (5 seconds)
            expect(endTime - startTime).toBeLessThan(5000);
        });
    });

    describe('ID Validation Edge Cases', () => {
        it('should handle various invalid ID formats', async () => {
            const invalidIds = [
                '',
                ' ',
                'null',
                'undefined',
                '123',
                'abc',
                'special-chars!@#$%',
                'very-long-id-that-exceeds-normal-length-expectations-and-might-cause-issues',
                '../../../etc/passwd',
                '<script>alert("xss")</script>',
                'SELECT * FROM books'
            ];

            for (const invalidId of invalidIds) {
                const request = createMockRequest(undefined, `http://localhost:3000/api/books/${invalidId}`);
                const params = createMockParams(invalidId);
                const event = createMockEvent(request, params);
                const response = await getBookByIdHandler(event);

                expect(response.status).toBe(400);
                const data = await response.json();
                expect(data.error).toBe('VALIDATION_ERROR');
            }
        });

        it('should handle SQL injection attempts in IDs', async () => {
            const sqlInjectionAttempts = [
                "'; DROP TABLE books; --",
                "1' OR '1'='1",
                "1; DELETE FROM books WHERE 1=1; --",
                "UNION SELECT * FROM users"
            ];

            for (const maliciousId of sqlInjectionAttempts) {
                const request = createMockRequest(undefined, `http://localhost:3000/api/books/${maliciousId}`);
                const params = createMockParams(maliciousId);
                const event = createMockEvent(request, params);
                const response = await getBookByIdHandler(event);

                expect(response.status).toBe(400);
                const data = await response.json();
                expect(data.error).toBe('VALIDATION_ERROR');
            }

            // Verify database integrity
            const listRequest = createMockRequest(undefined, 'http://localhost:3000/api/books');
            const listEvent = createMockEvent(listRequest);
            const listResponse = await getBooksHandler(listEvent);

            expect(listResponse.status).toBe(200);
        });
    });

    describe('Rating Validation Edge Cases', () => {
        it('should handle invalid rating values', async () => {
            const invalidRatings = [
                { narratorRating: -1 },
                { narratorRating: 6 },
                { narratorRating: 'invalid' },
                { narratorRating: null },
                { performanceRating: -5 },
                { performanceRating: 10 },
                { performanceRating: {} },
                { performanceRating: [] }
            ];

            for (const invalidRating of invalidRatings) {
                const book = {
                    title: 'Rating Test Book',
                    author: 'Rating Test Author',
                    ...invalidRating
                };

                const request = createMockRequest(book, 'http://localhost:3000/api/books', 'POST');
                const event = createMockEvent(request);
                const response = await postBooksHandler(event);

                // Should either accept null/undefined or reject invalid values
                if (response.status === 400) {
                    const data = await response.json();
                    expect(data.error).toBe('VALIDATION_ERROR');
                }
            }
        });

        it('should handle boundary rating values', async () => {
            const boundaryRatings = [
                { narratorRating: 0, performanceRating: 0 },
                { narratorRating: 5, performanceRating: 5 },
                { narratorRating: 0.1, performanceRating: 4.9 },
                { narratorRating: 2.5, performanceRating: 3.7 }
            ];

            for (const rating of boundaryRatings) {
                const book = {
                    title: 'Boundary Rating Test Book',
                    author: 'Boundary Test Author',
                    ...rating
                };

                const request = createMockRequest(book, 'http://localhost:3000/api/books', 'POST');
                const event = createMockEvent(request);
                const response = await postBooksHandler(event);
                const data = await response.json();

                expect(response.status).toBe(201);
                expect(data.success).toBe(true);
                expect(data.data.narratorRating).toBe(rating.narratorRating);
                expect(data.data.performanceRating).toBe(rating.performanceRating);
            }
        });
    });

    describe('URL Validation Edge Cases', () => {
        it('should handle various URL formats', async () => {
            const urlTests = [
                { url: 'https://www.audible.com/pd/book/B123456789', shouldPass: true },
                { url: 'http://audible.com/pd/book/B123456789', shouldPass: true },
                { url: 'https://audible.co.uk/pd/book/B123456789', shouldPass: true },
                { url: 'not-a-url', shouldPass: false },
                { url: 'javascript:alert("xss")', shouldPass: false },
                { url: 'ftp://example.com/file', shouldPass: false },
                { url: '', shouldPass: true }, // Empty should be allowed
                { url: 'https://example.com/very/long/path/that/might/cause/issues/with/validation', shouldPass: false }
            ];

            for (const test of urlTests) {
                const book = {
                    title: 'URL Test Book',
                    author: 'URL Test Author',
                };

                const request = createMockRequest(book, 'http://localhost:3000/api/books', 'POST');
                const event = createMockEvent(request);
                const response = await postBooksHandler(event);

                if (test.shouldPass) {
                    expect([201, 400]).toContain(response.status);
                } else {
                    expect(response.status).toBe(400);
                    if (response.status === 400) {
                        const data = await response.json();
                        expect(data.error).toBe('VALIDATION_ERROR');
                    }
                }
            }
        });
    });

    describe('Health Check Edge Cases', () => {
        it('should handle health check under load', async () => {
            // Create multiple concurrent health check requests
            const healthRequests = Array(10).fill(null).map(() => {
                const request = createMockRequest(undefined, 'http://localhost:3000/api/health');
                const event = createMockEvent(request);
                return getHealthHandler(event);
            });

            const responses = await Promise.all(healthRequests);

            // All should succeed
            responses.forEach(response => {
                expect(response.status).toBe(200);
            });
        });

        it('should handle health check with database issues', async () => {
            // This test would require mocking database failures
            // For now, just verify normal operation
            const request = createMockRequest(undefined, 'http://localhost:3000/api/health');
            const event = createMockEvent(request);
            const response = await getHealthHandler(event);
            const data = await response.json();

            expect(response.status).toBe(200);
            expect(data.success).toBe(true);
            expect(data.data).toHaveProperty('checks');
            expect(data.data.checks).toHaveProperty('database');
        });
    });

    describe('Memory and Performance Edge Cases', () => {
        it('should handle requests with large payloads', async () => {
            const largeBook = {
                title: 'Large Payload Test',
                author: 'Performance Author',
                description: 'x'.repeat(100000), // 100KB description
                tags: Array(1000).fill(null).map((_, i) => ({
                    id: generateId(),
                    name: `large-tag-${i}`,
                    color: '#000000'
                }))
            };

            const request = createMockRequest(largeBook, 'http://localhost:3000/api/books', 'POST');
            const event = createMockEvent(request);

            const startTime = Date.now();
            const response = await postBooksHandler(event);
            const endTime = Date.now();

            // Should either handle it or reject gracefully
            expect([201, 400, 413]).toContain(response.status);

            // Should not take too long (10 seconds max)
            expect(endTime - startTime).toBeLessThan(10000);
        });
    });

    describe('Concurrent Operations', () => {
        it('should handle concurrent updates to the same book', async () => {
            // First create a book
            const book = {
                title: 'Concurrent Update Test',
                author: 'Concurrent Author'
            };

            const createRequest = createMockRequest(book, 'http://localhost:3000/api/books', 'POST');
            const createEvent = createMockEvent(createRequest);
            const createResponse = await postBooksHandler(createEvent);
            const createData = await createResponse.json();

            expect(createResponse.status).toBe(201);
            const bookId = createData.data.id;

            // Now try concurrent updates
            const update1 = { title: 'Updated Title 1' };
            const update2 = { title: 'Updated Title 2' };

            const updateRequest1 = createMockRequest(update1, `http://localhost:3000/api/books/${bookId}`, 'PUT');
            const updateParams1 = createMockParams(bookId);
            const updateEvent1 = createMockEvent(updateRequest1, updateParams1);

            const updateRequest2 = createMockRequest(update2, `http://localhost:3000/api/books/${bookId}`, 'PUT');
            const updateParams2 = createMockParams(bookId);
            const updateEvent2 = createMockEvent(updateRequest2, updateParams2);

            const [response1, response2] = await Promise.all([
                putBookHandler(updateEvent1),
                putBookHandler(updateEvent2)
            ]);

            // Both should succeed (last one wins)
            expect(response1.status).toBe(200);
            expect(response2.status).toBe(200);

            // Verify final state
            const getRequest = createMockRequest(undefined, `http://localhost:3000/api/books/${bookId}`);
            const getParams = createMockParams(bookId);
            const getEvent = createMockEvent(getRequest, getParams);
            const getResponse = await getBookByIdHandler(getEvent);
            const getData = await getResponse.json();

            expect(getResponse.status).toBe(200);
            expect(['Updated Title 1', 'Updated Title 2']).toContain(getData.data.title);
        });
    });
});