import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { GET, POST } from '../+server.js';
import { db } from '$lib/server/db/connection.js';
import { tags, bookTags, books } from '$lib/server/db/schema.js';
import { generateId } from '$lib/utils/id.js';

// Mock request and response helpers
function createMockRequest(body?: any) {
    return {
        json: async () => body
    } as any;
}

function createMockParams(params: Record<string, string> = {}) {
    return { params } as any;
}

describe('Tags API', () => {
    beforeEach(async () => {
        // Clean up database before each test
        await db.delete(bookTags);
        await db.delete(books);
        await db.delete(tags);
    });

    afterEach(async () => {
        // Clean up database after each test
        await db.delete(bookTags);
        await db.delete(books);
        await db.delete(tags);
    });

    describe('GET /api/tags', () => {
        it('should return empty array when no tags exist', async () => {
            const response = await GET(createMockParams());
            const data = await response.json();

            expect(response.status).toBe(200);
            expect(data.success).toBe(true);
            expect(data.data).toEqual([]);
            expect(data.message).toBe('Retrieved 0 tags');
        });

        it('should return all tags with usage count', async () => {
            // Create test tags
            const tag1Id = generateId();
            const tag2Id = generateId();
            const now = new Date().toISOString();

            await db.insert(tags).values([
                {
                    id: tag1Id,
                    name: 'fiction',
                    color: '#ff0000',
                    createdAt: now
                },
                {
                    id: tag2Id,
                    name: 'thriller',
                    color: '#00ff00',
                    createdAt: now
                }
            ]);

            // Create a book and associate it with one tag
            const bookId = generateId();
            await db.insert(books).values({
                id: bookId,
                title: 'Test Book',
                author: 'Test Author',
                dateAdded: now,
                dateUpdated: now,
                createdAt: now,
                updatedAt: now
            });

            await db.insert(bookTags).values({
                bookId,
                tagId: tag1Id
            });

            const response = await GET(createMockParams());
            const data = await response.json();

            expect(response.status).toBe(200);
            expect(data.success).toBe(true);
            expect(data.data).toHaveLength(2);

            // Should be ordered by usage count (desc), then name
            const tag1 = data.data.find((t: any) => t.name === 'fiction');
            const tag2 = data.data.find((t: any) => t.name === 'thriller');

            expect(tag1.usageCount).toBe(1);
            expect(tag2.usageCount).toBe(0);
            expect(data.message).toBe('Retrieved 2 tags');
        });


    });

    describe('POST /api/tags', () => {
        it('should create a new tag successfully', async () => {
            const tagData = {
                name: 'science-fiction',
                color: '#0066cc'
            };

            const response = await POST({
                request: createMockRequest(tagData),
                ...createMockParams()
            });
            const data = await response.json();

            expect(response.status).toBe(201);
            expect(data.success).toBe(true);
            expect(data.data.name).toBe('science-fiction');
            expect(data.data.color).toBe('#0066cc');
            expect(data.data.usageCount).toBe(0);
            expect(data.data.id).toBeDefined();
            expect(data.message).toBe('Tag created successfully');
        });

        it('should create a tag with provided ID', async () => {
            const tagId = generateId();
            const tagData = {
                id: tagId,
                name: 'fantasy',
                color: '#9900cc'
            };

            const response = await POST({
                request: createMockRequest(tagData),
                ...createMockParams()
            });
            const data = await response.json();

            expect(response.status).toBe(201);
            expect(data.success).toBe(true);
            expect(data.data.id).toBe(tagId);
            expect(data.data.name).toBe('fantasy');
        });

        it('should reject duplicate tag names', async () => {
            // Create first tag
            const now = new Date().toISOString();
            await db.insert(tags).values({
                id: generateId(),
                name: 'duplicate',
                color: '#ff0000',
                createdAt: now
            });

            // Try to create tag with same name
            const tagData = {
                name: 'duplicate',
                color: '#00ff00'
            };

            const response = await POST({
                request: createMockRequest(tagData),
                ...createMockParams()
            });
            const data = await response.json();

            expect(response.status).toBe(409);
            expect(data.success).toBe(false);
            expect(data.error).toBe('VALIDATION_ERROR');
            expect(data.message).toBe('A tag with this name already exists');
        });

        it('should validate required fields', async () => {
            const invalidData = {
                name: '', // Empty name
                color: '#ff0000'
            };

            const response = await POST({
                request: createMockRequest(invalidData),
                ...createMockParams()
            });
            const data = await response.json();

            expect(response.status).toBe(400);
            expect(data.success).toBe(false);
            expect(data.error).toBe('VALIDATION_ERROR');
            expect(data.message).toBe('Invalid tag data provided');
        });

        it('should validate color field', async () => {
            const invalidData = {
                name: 'valid-name',
                color: '' // Empty color
            };

            const response = await POST({
                request: createMockRequest(invalidData),
                ...createMockParams()
            });
            const data = await response.json();

            expect(response.status).toBe(400);
            expect(data.success).toBe(false);
            expect(data.error).toBe('VALIDATION_ERROR');
        });

        it('should trim whitespace from name and color', async () => {
            const tagData = {
                name: '  whitespace-test  ',
                color: '  #ff0000  '
            };

            const response = await POST({
                request: createMockRequest(tagData),
                ...createMockParams()
            });
            const data = await response.json();

            expect(response.status).toBe(201);
            expect(data.data.name).toBe('whitespace-test');
            expect(data.data.color).toBe('#ff0000');
        });


    });
});