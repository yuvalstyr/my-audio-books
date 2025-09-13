import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { GET as getBooksHandler, POST as postBooksHandler } from '../books/+server.js';
import { GET as getBookByIdHandler, PUT as putBookHandler, DELETE as deleteBookHandler } from '../books/[id]/+server.js';
import { GET as getTagsHandler, POST as postTagsHandler } from '../tags/+server.js';
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

describe('API Integration Tests', () => {
    beforeEach(async () => {
        // Clean up test data before each test
        await db.delete(bookTags);
        await db.delete(books);
        await db.delete(tags);
    });

    afterEach(async () => {
        // Clean up test data after each test
        await db.delete(bookTags);
        await db.delete(books);
        await db.delete(tags);
    });

    describe('Complete Book Lifecycle', () => {
        it('should handle complete CRUD operations for books', async () => {
            // 1. Create a new book
            const newBook: CreateBookInput = {
                title: 'Integration Test Book',
                author: 'Integration Test Author',
                audibleUrl: 'https://www.audible.com/pd/integration-test/B123456789',
                narratorRating: 4.0,
                performanceRating: 4.5,
                description: 'A book for integration testing',
                coverImageUrl: 'https://example.com/integration-cover.jpg',
                queuePosition: 1,
                tags: [{
                    id: generateId(),
                    name: 'integration',
                    color: '#ff6600'
                }]
            };

            const createRequest = createMockRequest(newBook, 'http://localhost:3000/api/books', 'POST');
            const createEvent = createMockEvent(createRequest);
            const createResponse = await postBooksHandler(createEvent);
            const createData = await createResponse.json();

            expect(createResponse.status).toBe(201);
            expect(createData.success).toBe(true);
            expect(createData.data.title).toBe('Integration Test Book');
            expect(createData.data.tags).toHaveLength(1);
            expect(createData.data.tags[0].name).toBe('integration');

            const bookId = createData.data.id;

            // 2. Retrieve the created book
            const getRequest = createMockRequest(undefined, `http://localhost:3000/api/books/${bookId}`);
            const getParams = createMockParams(bookId);
            const getEvent = createMockEvent(getRequest, getParams);
            const getResponse = await getBookByIdHandler(getEvent);
            const getData = await getResponse.json();

            expect(getResponse.status).toBe(200);
            expect(getData.success).toBe(true);
            expect(getData.data.id).toBe(bookId);
            expect(getData.data.title).toBe('Integration Test Book');
            expect(getData.data.tags).toHaveLength(1);

            // 3. Update the book
            const updateData = {
                title: 'Updated Integration Test Book',
                narratorRating: 5.0,
                tags: [
                    ...getData.data.tags,
                    {
                        id: generateId(),
                        name: 'updated',
                        color: '#00ff66'
                    }
                ]
            };

            const updateRequest = createMockRequest(updateData, `http://localhost:3000/api/books/${bookId}`, 'PUT');
            const updateParams = createMockParams(bookId);
            const updateEvent = createMockEvent(updateRequest, updateParams);
            const updateResponse = await putBookHandler(updateEvent);
            const updateResponseData = await updateResponse.json();

            expect(updateResponse.status).toBe(200);
            expect(updateResponseData.success).toBe(true);
            expect(updateResponseData.data.title).toBe('Updated Integration Test Book');
            expect(updateResponseData.data.narratorRating).toBe(5.0);
            expect(updateResponseData.data.tags).toHaveLength(2);

            // 4. Verify the book appears in the books list
            const listRequest = createMockRequest(undefined, 'http://localhost:3000/api/books');
            const listEvent = createMockEvent(listRequest);
            const listResponse = await getBooksHandler(listEvent);
            const listData = await listResponse.json();

            expect(listResponse.status).toBe(200);
            expect(listData.success).toBe(true);
            expect(listData.data).toHaveLength(1);
            expect(listData.data[0].id).toBe(bookId);
            expect(listData.data[0].title).toBe('Updated Integration Test Book');

            // 5. Delete the book
            const deleteRequest = createMockRequest(undefined, `http://localhost:3000/api/books/${bookId}`, 'DELETE');
            const deleteParams = createMockParams(bookId);
            const deleteEvent = createMockEvent(deleteRequest, deleteParams);
            const deleteResponse = await deleteBookHandler(deleteEvent);
            const deleteData = await deleteResponse.json();

            expect(deleteResponse.status).toBe(200);
            expect(deleteData.success).toBe(true);
            expect(deleteData.data.id).toBe(bookId);

            // 6. Verify the book is deleted
            const verifyDeleteRequest = createMockRequest(undefined, `http://localhost:3000/api/books/${bookId}`);
            const verifyDeleteParams = createMockParams(bookId);
            const verifyDeleteEvent = createMockEvent(verifyDeleteRequest, verifyDeleteParams);
            const verifyDeleteResponse = await getBookByIdHandler(verifyDeleteEvent);

            expect(verifyDeleteResponse.status).toBe(404);

            // 7. Verify the books list is empty
            const finalListRequest = createMockRequest(undefined, 'http://localhost:3000/api/books');
            const finalListEvent = createMockEvent(finalListRequest);
            const finalListResponse = await getBooksHandler(finalListEvent);
            const finalListData = await finalListResponse.json();

            expect(finalListResponse.status).toBe(200);
            expect(finalListData.success).toBe(true);
            expect(finalListData.data).toHaveLength(0);
        });
    });

    describe('Tag Management Integration', () => {
        it('should handle tag creation and usage tracking', async () => {
            // 1. Create a tag directly
            const newTag = {
                name: 'direct-tag',
                color: '#ff0000'
            };

            const createTagRequest = createMockRequest(newTag, 'http://localhost:3000/api/tags', 'POST');
            const createTagEvent = createMockEvent(createTagRequest);
            const createTagResponse = await postTagsHandler(createTagEvent);
            const createTagData = await createTagResponse.json();

            expect(createTagResponse.status).toBe(201);
            expect(createTagData.success).toBe(true);
            expect(createTagData.data.name).toBe('direct-tag');
            expect(createTagData.data.usageCount).toBe(0);

            const directTagId = createTagData.data.id;

            // 2. Create a book with the existing tag and a new tag
            const newBook: CreateBookInput = {
                title: 'Tag Integration Book',
                author: 'Tag Test Author',
                tags: [
                    {
                        id: directTagId,
                        name: 'direct-tag',
                        color: '#ff0000'
                    },
                    {
                        id: generateId(),
                        name: 'book-created-tag',
                        color: '#00ff00'
                    }
                ]
            };

            const createBookRequest = createMockRequest(newBook, 'http://localhost:3000/api/books', 'POST');
            const createBookEvent = createMockEvent(createBookRequest);
            const createBookResponse = await postBooksHandler(createBookEvent);
            const createBookData = await createBookResponse.json();

            expect(createBookResponse.status).toBe(201);
            expect(createBookData.success).toBe(true);
            expect(createBookData.data.tags).toHaveLength(2);

            // 3. Check tag usage counts
            const getTagsRequest = createMockRequest(undefined, 'http://localhost:3000/api/tags');
            const getTagsEvent = createMockEvent(getTagsRequest);
            const getTagsResponse = await getTagsHandler(getTagsEvent);
            const getTagsData = await getTagsResponse.json();

            expect(getTagsResponse.status).toBe(200);
            expect(getTagsData.success).toBe(true);
            expect(getTagsData.data).toHaveLength(2);

            // Find the direct tag and verify its usage count
            const directTag = getTagsData.data.find((tag: any) => tag.id === directTagId);
            expect(directTag).toBeDefined();
            expect(directTag.usageCount).toBe(1);

            // Find the book-created tag and verify its usage count
            const bookCreatedTag = getTagsData.data.find((tag: any) => tag.name === 'book-created-tag');
            expect(bookCreatedTag).toBeDefined();
            expect(bookCreatedTag.usageCount).toBe(1);

            // 4. Create another book with the same tags
            const secondBook: CreateBookInput = {
                title: 'Second Tag Book',
                author: 'Second Author',
                tags: [
                    {
                        id: directTagId,
                        name: 'direct-tag',
                        color: '#ff0000'
                    }
                ]
            };

            const createSecondBookRequest = createMockRequest(secondBook, 'http://localhost:3000/api/books', 'POST');
            const createSecondBookEvent = createMockEvent(createSecondBookRequest);
            const createSecondBookResponse = await postBooksHandler(createSecondBookEvent);

            expect(createSecondBookResponse.status).toBe(201);

            // 5. Verify updated usage counts
            const finalTagsRequest = createMockRequest(undefined, 'http://localhost:3000/api/tags');
            const finalTagsEvent = createMockEvent(finalTagsRequest);
            const finalTagsResponse = await getTagsHandler(finalTagsEvent);
            const finalTagsData = await finalTagsResponse.json();

            const finalDirectTag = finalTagsData.data.find((tag: any) => tag.id === directTagId);
            expect(finalDirectTag.usageCount).toBe(2);

            const finalBookCreatedTag = finalTagsData.data.find((tag: any) => tag.name === 'book-created-tag');
            expect(finalBookCreatedTag.usageCount).toBe(1);
        });
    });

    describe('Error Handling Integration', () => {
        it('should handle cascading operations correctly', async () => {
            // 1. Try to create a book with invalid data
            const invalidBook = {
                title: '', // Invalid empty title
                author: 'Test Author'
            };

            const invalidRequest = createMockRequest(invalidBook, 'http://localhost:3000/api/books', 'POST');
            const invalidEvent = createMockEvent(invalidRequest);
            const invalidResponse = await postBooksHandler(invalidEvent);

            expect(invalidResponse.status).toBe(400);

            // 2. Verify no data was created
            const listRequest = createMockRequest(undefined, 'http://localhost:3000/api/books');
            const listEvent = createMockEvent(listRequest);
            const listResponse = await getBooksHandler(listEvent);
            const listData = await listResponse.json();

            expect(listData.data).toHaveLength(0);

            const tagsRequest = createMockRequest(undefined, 'http://localhost:3000/api/tags');
            const tagsEvent = createMockEvent(tagsRequest);
            const tagsResponse = await getTagsHandler(tagsEvent);
            const tagsData = await tagsResponse.json();

            expect(tagsData.data).toHaveLength(0);
        });

        it('should handle operations on non-existent resources', async () => {
            const nonExistentId = generateId();

            // Try to get non-existent book
            const getRequest = createMockRequest(undefined, `http://localhost:3000/api/books/${nonExistentId}`);
            const getParams = createMockParams(nonExistentId);
            const getEvent = createMockEvent(getRequest, getParams);
            const getResponse = await getBookByIdHandler(getEvent);

            expect(getResponse.status).toBe(404);

            // Try to update non-existent book
            const updateRequest = createMockRequest({ title: 'Updated' }, `http://localhost:3000/api/books/${nonExistentId}`, 'PUT');
            const updateParams = createMockParams(nonExistentId);
            const updateEvent = createMockEvent(updateRequest, updateParams);
            const updateResponse = await putBookHandler(updateEvent);

            expect(updateResponse.status).toBe(404);

            // Try to delete non-existent book
            const deleteRequest = createMockRequest(undefined, `http://localhost:3000/api/books/${nonExistentId}`, 'DELETE');
            const deleteParams = createMockParams(nonExistentId);
            const deleteEvent = createMockEvent(deleteRequest, deleteParams);
            const deleteResponse = await deleteBookHandler(deleteEvent);

            expect(deleteResponse.status).toBe(404);
        });
    });

    describe('Data Consistency Integration', () => {
        it('should maintain referential integrity', async () => {
            // 1. Create a book with tags
            const bookWithTags: CreateBookInput = {
                title: 'Consistency Test Book',
                author: 'Consistency Author',
                tags: [
                    {
                        id: generateId(),
                        name: 'consistency-tag',
                        color: '#purple'
                    }
                ]
            };

            const createRequest = createMockRequest(bookWithTags, 'http://localhost:3000/api/books', 'POST');
            const createEvent = createMockEvent(createRequest);
            const createResponse = await postBooksHandler(createEvent);
            const createData = await createResponse.json();

            expect(createResponse.status).toBe(201);
            const bookId = createData.data.id;
            const tagId = createData.data.tags[0].id;

            // 2. Verify tag exists and has correct usage count
            const tagsRequest = createMockRequest(undefined, 'http://localhost:3000/api/tags');
            const tagsEvent = createMockEvent(tagsRequest);
            const tagsResponse = await getTagsHandler(tagsEvent);
            const tagsData = await tagsResponse.json();

            const tag = tagsData.data.find((t: any) => t.id === tagId);
            expect(tag).toBeDefined();
            expect(tag.usageCount).toBe(1);

            // 3. Delete the book
            const deleteRequest = createMockRequest(undefined, `http://localhost:3000/api/books/${bookId}`, 'DELETE');
            const deleteParams = createMockParams(bookId);
            const deleteEvent = createMockEvent(deleteRequest, deleteParams);
            const deleteResponse = await deleteBookHandler(deleteEvent);

            expect(deleteResponse.status).toBe(200);

            // 4. Verify tag still exists but usage count is updated
            const finalTagsRequest = createMockRequest(undefined, 'http://localhost:3000/api/tags');
            const finalTagsEvent = createMockEvent(finalTagsRequest);
            const finalTagsResponse = await getTagsHandler(finalTagsEvent);
            const finalTagsData = await finalTagsResponse.json();

            const finalTag = finalTagsData.data.find((t: any) => t.id === tagId);
            expect(finalTag).toBeDefined();
            expect(finalTag.usageCount).toBe(0);
        });
    });
});