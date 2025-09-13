import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { GET as getBooksAPI, POST as postBooksAPI } from '../books/+server.js';
import { GET as getTagsAPI, POST as postTagsAPI } from '../tags/+server.js';
import { db } from '$lib/server/db/connection.js';
import { tags, bookTags, books } from '$lib/server/db/schema.js';
import { generateId } from '$lib/utils/id.js';

// Mock request helpers
function createMockRequest(body?: any) {
    return {
        json: async () => body
    } as any;
}

function createMockParams(params: Record<string, string> = {}) {
    return { params } as any;
}

describe('Book-Tag Integration', () => {
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

    it('should create tags when creating books with new tags', async () => {
        const bookData = {
            title: 'Test Book',
            author: 'Test Author',
            tags: [
                {
                    id: generateId(),
                    name: 'fantasy',
                    color: '#ff0000'
                },
                {
                    id: generateId(),
                    name: 'adventure',
                    color: '#00ff00'
                }
            ]
        };

        // Create book with tags
        const bookResponse = await postBooksAPI({
            request: createMockRequest(bookData),
            ...createMockParams()
        });
        const bookResult = await bookResponse.json();

        expect(bookResponse.status).toBe(201);
        expect(bookResult.success).toBe(true);
        expect(bookResult.data.tags).toHaveLength(2);

        // Verify tags were created in tags table
        const tagsResponse = await getTagsAPI(createMockParams());
        const tagsResult = await tagsResponse.json();

        expect(tagsResponse.status).toBe(200);
        expect(tagsResult.data).toHaveLength(2);

        const fantasyTag = tagsResult.data.find((t: any) => t.name === 'fantasy');
        const adventureTag = tagsResult.data.find((t: any) => t.name === 'adventure');

        expect(fantasyTag.usageCount).toBe(1);
        expect(adventureTag.usageCount).toBe(1);
    });

    it('should reuse existing tags when creating books', async () => {
        // First create a tag directly
        const tagData = {
            name: 'existing-tag',
            color: '#0066cc'
        };

        const tagResponse = await postTagsAPI({
            request: createMockRequest(tagData),
            ...createMockParams()
        });
        const tagResult = await tagResponse.json();

        expect(tagResponse.status).toBe(201);
        const existingTagId = tagResult.data.id;

        // Now create a book that uses the existing tag
        const bookData = {
            title: 'Test Book',
            author: 'Test Author',
            tags: [
                {
                    id: generateId(), // Different ID
                    name: 'existing-tag', // Same name
                    color: '#ff0000' // Different color
                }
            ]
        };

        const bookResponse = await postBooksAPI({
            request: createMockRequest(bookData),
            ...createMockParams()
        });
        const bookResult = await bookResponse.json();

        expect(bookResponse.status).toBe(201);
        expect(bookResult.data.tags).toHaveLength(1);
        expect(bookResult.data.tags[0].id).toBe(existingTagId); // Should use existing tag ID
        expect(bookResult.data.tags[0].color).toBe('#0066cc'); // Should keep original color

        // Verify only one tag exists in tags table
        const tagsResponse = await getTagsAPI(createMockParams());
        const tagsResult = await tagsResponse.json();

        expect(tagsResult.data).toHaveLength(1);
        expect(tagsResult.data[0].usageCount).toBe(1);
    });

    it('should update tag usage counts correctly', async () => {
        // Create two books with overlapping tags
        const tag1Id = generateId();
        const tag2Id = generateId();
        const tag3Id = generateId();

        const book1Data = {
            title: 'Book 1',
            author: 'Author 1',
            tags: [
                { id: tag1Id, name: 'shared-tag', color: '#ff0000' },
                { id: tag2Id, name: 'unique-tag-1', color: '#00ff00' }
            ]
        };

        const book2Data = {
            title: 'Book 2',
            author: 'Author 2',
            tags: [
                { id: tag1Id, name: 'shared-tag', color: '#ff0000' },
                { id: tag3Id, name: 'unique-tag-2', color: '#0000ff' }
            ]
        };

        // Create both books
        await postBooksAPI({
            request: createMockRequest(book1Data),
            ...createMockParams()
        });

        await postBooksAPI({
            request: createMockRequest(book2Data),
            ...createMockParams()
        });

        // Check tag usage counts
        const tagsResponse = await getTagsAPI(createMockParams());
        const tagsResult = await tagsResponse.json();

        expect(tagsResult.data).toHaveLength(3);

        const sharedTag = tagsResult.data.find((t: any) => t.name === 'shared-tag');
        const uniqueTag1 = tagsResult.data.find((t: any) => t.name === 'unique-tag-1');
        const uniqueTag2 = tagsResult.data.find((t: any) => t.name === 'unique-tag-2');

        expect(sharedTag.usageCount).toBe(2);
        expect(uniqueTag1.usageCount).toBe(1);
        expect(uniqueTag2.usageCount).toBe(1);

        // Tags should be ordered by usage count (desc), then name
        expect(tagsResult.data[0].name).toBe('shared-tag'); // Highest usage count
    });

    it('should prevent duplicate tag names via tags API', async () => {
        // Create a tag
        const tagData = {
            name: 'duplicate-test',
            color: '#ff0000'
        };

        const firstResponse = await postTagsAPI({
            request: createMockRequest(tagData),
            ...createMockParams()
        });

        expect(firstResponse.status).toBe(201);

        // Try to create another tag with the same name
        const duplicateData = {
            name: 'duplicate-test',
            color: '#00ff00'
        };

        const secondResponse = await postTagsAPI({
            request: createMockRequest(duplicateData),
            ...createMockParams()
        });
        const secondResult = await secondResponse.json();

        expect(secondResponse.status).toBe(409);
        expect(secondResult.success).toBe(false);
        expect(secondResult.error).toBe('VALIDATION_ERROR');
        expect(secondResult.message).toBe('A tag with this name already exists');
    });
});