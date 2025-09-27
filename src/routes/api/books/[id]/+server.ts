import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { db } from '$lib/server/db/connection.js';
import { books, bookTags, tags } from '$lib/server/db/schema.js';
import { eq } from 'drizzle-orm';
import { isValidId } from '$lib/utils/id.js';
import { isValidCreateBookInput, isValidUpdateBookInput } from '$lib/utils/validation.js';
import type { UpdateBookInput } from '$lib/types/book.js';
import { ServerLogger, createRequestLogger } from '$lib/server/utils/logger.js';
import {
    createSuccessResponse,
    createErrorResponse,
    classifyDatabaseError,
    getErrorStatus,
    sanitizeErrorDetails,
    createApiError
} from '$lib/server/utils/errors.js';

const requestLogger = createRequestLogger();

// GET /api/books/[id] - Get a specific book by ID
export const GET: RequestHandler = async ({ params, request }) => {
    const logRequest = requestLogger.logRequest(request);
    const requestId = requestLogger.getRequestId();

    try {
        const { id } = params;

        ServerLogger.info(`Fetching book by ID: ${id}`, 'API_BOOKS_GET_BY_ID', requestId);

        // Validate ID format
        if (!isValidId(id)) {
            ServerLogger.warn(`Invalid book ID format: ${id}`, 'API_BOOKS_GET_BY_ID', requestId);

            const errorResponse = createErrorResponse(
                'VALIDATION_ERROR',
                'Invalid book ID format',
                { providedId: id },
                requestId
            );

            logRequest(400);
            return json(errorResponse, { status: 400 });
        }

        // Query book with its associated tags
        const bookWithTags = await db
            .select({
                id: books.id,
                title: books.title,
                author: books.author,
                performanceRating: books.performanceRating,
                storyRating: books.storyRating,
                description: books.description,
                coverImageUrl: books.coverImageUrl,
                audibleUrl: books.audibleUrl,
                queuePosition: books.queuePosition,
                dateAdded: books.dateAdded,
                highlyRatedFor: books.highlyRatedFor,
                tagId: tags.id,
                tagName: tags.name,
                tagColor: tags.color
            })
            .from(books)
            .leftJoin(bookTags, eq(books.id, bookTags.bookId))
            .leftJoin(tags, eq(bookTags.tagId, tags.id))
            .where(eq(books.id, id));

        if (bookWithTags.length === 0) {
            ServerLogger.warn(`Book not found: ${id}`, 'API_BOOKS_GET_BY_ID', requestId);

            const errorResponse = createErrorResponse(
                'BOOK_NOT_FOUND',
                'Book not found',
                { bookId: id },
                requestId
            );

            logRequest(404);
            return json(errorResponse, { status: 404 });
        }

        // Format the response
        const book = {
            id: bookWithTags[0].id,
            title: bookWithTags[0].title,
            author: bookWithTags[0].author,
            performanceRating: bookWithTags[0].performanceRating,
            storyRating: bookWithTags[0].storyRating,
            description: bookWithTags[0].description,
            coverImageUrl: bookWithTags[0].coverImageUrl,
            audibleUrl: bookWithTags[0].audibleUrl,
            queuePosition: bookWithTags[0].queuePosition,
            dateAdded: new Date(bookWithTags[0].dateAdded),
            highlyRatedFor: bookWithTags[0].highlyRatedFor,
            tags: bookWithTags
                .filter(row => row.tagId)
                .map(row => ({
                    id: row.tagId!,
                    name: row.tagName!,
                    color: row.tagColor!
                }))
        };

        ServerLogger.info(`Successfully retrieved book: ${book.title}`, 'API_BOOKS_GET_BY_ID', requestId);

        const response = createSuccessResponse(
            book,
            'Book retrieved successfully',
            requestId
        );

        logRequest(200);
        return json(response);

    } catch (error) {
        const err = error as Error;
        ServerLogger.error('Failed to fetch book', err, 'API_BOOKS_GET_BY_ID', requestId);

        const errorCode = classifyDatabaseError(err);
        const errorResponse = createErrorResponse(
            errorCode,
            'Failed to fetch book',
            sanitizeErrorDetails({ originalError: err.message }),
            requestId
        );

        const statusCode = getErrorStatus(errorCode);
        logRequest(statusCode, err);

        return json(errorResponse, { status: statusCode });
    }
};

// PUT /api/books/[id] - Update a specific book
export const PUT: RequestHandler = async ({ params, request }) => {
    const logRequest = requestLogger.logRequest(request);
    const requestId = requestLogger.getRequestId();

    try {
        const { id } = params;
        const body = await request.json();

        ServerLogger.info(`Updating book: ${id}`, 'API_BOOKS_PUT', requestId, {
            bookId: id,
            updateFields: Object.keys(body)
        });

        // Validate ID format
        if (!isValidId(id)) {
            ServerLogger.warn(`Invalid book ID format: ${id}`, 'API_BOOKS_PUT', requestId);

            const errorResponse = createErrorResponse(
                'VALIDATION_ERROR',
                'Invalid book ID format',
                { providedId: id },
                requestId
            );

            logRequest(400);
            return json(errorResponse, { status: 400 });
        }

        // Validate input (using UpdateBookInput validation for partial updates)
        if (!isValidUpdateBookInput(body)) {
            ServerLogger.warn('Invalid book update data provided', 'API_BOOKS_PUT', requestId, { body });

            const errorResponse = createErrorResponse(
                'VALIDATION_ERROR',
                'Invalid book data provided',
                sanitizeErrorDetails({ providedData: body }),
                requestId
            );

            logRequest(400);
            return json(errorResponse, { status: 400 });
        }

        const input = body as Partial<UpdateBookInput>;
        const now = new Date().toISOString();

        // Check if book exists
        const existingBook = await db
            .select()
            .from(books)
            .where(eq(books.id, id))
            .limit(1);

        if (existingBook.length === 0) {
            ServerLogger.warn(`Book not found: ${id}`, 'API_BOOKS_PUT', requestId);

            const errorResponse = createErrorResponse(
                'BOOK_NOT_FOUND',
                'Book not found',
                { bookId: id },
                requestId
            );

            logRequest(404);
            return json(errorResponse, { status: 404 });
        }

        // Prepare update data (only include provided fields)
        const updateData: any = {};

        if (input.title !== undefined) updateData.title = input.title.trim();
        if (input.author !== undefined) updateData.author = input.author.trim();
        if (input.performanceRating !== undefined) updateData.performanceRating = input.performanceRating;
        if (input.storyRating !== undefined) updateData.storyRating = input.storyRating;
        if (input.description !== undefined) updateData.description = input.description?.trim() || null;
        if (input.coverImageUrl !== undefined) updateData.coverImageUrl = input.coverImageUrl?.trim() || null;
        if (input.audibleUrl !== undefined) updateData.audibleUrl = input.audibleUrl?.trim() || null;
        if (input.queuePosition !== undefined) updateData.queuePosition = input.queuePosition;
        if (input.highlyRatedFor !== undefined) updateData.highlyRatedFor = input.highlyRatedFor?.trim() || null;

        // Update the book
        if (Object.keys(updateData).length > 0) {
            await db.update(books).set(updateData).where(eq(books.id, id));
        }

        // Handle tags if provided
        if (input.tags !== undefined) {
            // Remove existing tag relationships
            await db.delete(bookTags).where(eq(bookTags.bookId, id));

            // Add new tag relationships
            if (input.tags.length > 0) {
                const bookTagsToInsert = [];

                for (const tag of input.tags) {
                    // Check if tag exists
                    const existingTag = await db
                        .select()
                        .from(tags)
                        .where(eq(tags.name, tag.name))
                        .limit(1);

                    let tagId = tag.id;

                    if (existingTag.length === 0) {
                        // Tag doesn't exist, create it
                        try {
                            await db.insert(tags).values({
                                id: tag.id,
                                name: tag.name,
                                color: tag.color,
                                createdAt: now,
                            });
                        } catch (tagCreateError) {
                            // If tag creation fails due to concurrent creation, fetch it
                            const refetchedTag = await db
                                .select()
                                .from(tags)
                                .where(eq(tags.name, tag.name))
                                .limit(1);

                            if (refetchedTag.length > 0) {
                                tagId = refetchedTag[0].id;
                            }
                        }
                    } else {
                        // Tag exists, use its ID
                        tagId = existingTag[0].id;
                    }

                    bookTagsToInsert.push({
                        bookId: id,
                        tagId
                    });
                }

                // Insert book-tag relationships
                if (bookTagsToInsert.length > 0) {
                    await db.insert(bookTags).values(bookTagsToInsert);
                }
            }
        }

        // Fetch the updated book with tags
        const updatedBookWithTags = await db
            .select({
                id: books.id,
                title: books.title,
                author: books.author,
                performanceRating: books.performanceRating,
                storyRating: books.storyRating,
                description: books.description,
                coverImageUrl: books.coverImageUrl,
                audibleUrl: books.audibleUrl,
                queuePosition: books.queuePosition,
                dateAdded: books.dateAdded,
                highlyRatedFor: books.highlyRatedFor,
                tagId: tags.id,
                tagName: tags.name,
                tagColor: tags.color
            })
            .from(books)
            .leftJoin(bookTags, eq(books.id, bookTags.bookId))
            .leftJoin(tags, eq(bookTags.tagId, tags.id))
            .where(eq(books.id, id));

        // Format the response
        const book = {
            id: updatedBookWithTags[0].id,
            title: updatedBookWithTags[0].title,
            author: updatedBookWithTags[0].author,
            performanceRating: updatedBookWithTags[0].performanceRating,
            storyRating: updatedBookWithTags[0].storyRating,
            description: updatedBookWithTags[0].description,
            coverImageUrl: updatedBookWithTags[0].coverImageUrl,
            audibleUrl: updatedBookWithTags[0].audibleUrl,
            queuePosition: updatedBookWithTags[0].queuePosition,
            dateAdded: new Date(updatedBookWithTags[0].dateAdded),
            highlyRatedFor: updatedBookWithTags[0].highlyRatedFor,
            tags: updatedBookWithTags
                .filter(row => row.tagId)
                .map(row => ({
                    id: row.tagId!,
                    name: row.tagName!,
                    color: row.tagColor!
                }))
        };

        ServerLogger.info(`Successfully updated book: ${book.title}`, 'API_BOOKS_PUT', requestId, {
            bookId: book.id
        });

        const response = createSuccessResponse(
            book,
            'Book updated successfully',
            requestId
        );

        logRequest(200);
        return json(response);

    } catch (error) {
        const err = error as Error;
        ServerLogger.error('Failed to update book', err, 'API_BOOKS_PUT', requestId);

        const errorCode = classifyDatabaseError(err);
        const errorResponse = createErrorResponse(
            errorCode,
            'Failed to update book',
            sanitizeErrorDetails({ originalError: err.message }),
            requestId
        );

        const statusCode = getErrorStatus(errorCode);
        logRequest(statusCode, err);

        return json(errorResponse, { status: statusCode });
    }
};

// DELETE /api/books/[id] - Delete a specific book
export const DELETE: RequestHandler = async ({ params, request }) => {
    const logRequest = requestLogger.logRequest(request);
    const requestId = requestLogger.getRequestId();

    try {
        const { id } = params;

        ServerLogger.info(`Deleting book: ${id}`, 'API_BOOKS_DELETE', requestId);

        // Validate ID format
        if (!isValidId(id)) {
            ServerLogger.warn(`Invalid book ID format: ${id}`, 'API_BOOKS_DELETE', requestId);

            const errorResponse = createErrorResponse(
                'VALIDATION_ERROR',
                'Invalid book ID format',
                { providedId: id },
                requestId
            );

            logRequest(400);
            return json(errorResponse, { status: 400 });
        }

        // Check if book exists
        const existingBook = await db
            .select()
            .from(books)
            .where(eq(books.id, id))
            .limit(1);

        if (existingBook.length === 0) {
            ServerLogger.warn(`Book not found: ${id}`, 'API_BOOKS_DELETE', requestId);

            const errorResponse = createErrorResponse(
                'BOOK_NOT_FOUND',
                'Book not found',
                { bookId: id },
                requestId
            );

            logRequest(404);
            return json(errorResponse, { status: 404 });
        }

        // Delete book-tag relationships (cascade should handle this, but being explicit)
        await db.delete(bookTags).where(eq(bookTags.bookId, id));

        // Delete the book
        await db.delete(books).where(eq(books.id, id));

        const deletedBook = existingBook[0];

        ServerLogger.info(`Successfully deleted book: ${deletedBook.title}`, 'API_BOOKS_DELETE', requestId, {
            bookId: deletedBook.id
        });

        const response = createSuccessResponse(
            { id: deletedBook.id },
            'Book deleted successfully',
            requestId
        );

        logRequest(200);
        return json(response);

    } catch (error) {
        const err = error as Error;
        ServerLogger.error('Failed to delete book', err, 'API_BOOKS_DELETE', requestId);

        const errorCode = classifyDatabaseError(err);
        const errorResponse = createErrorResponse(
            errorCode,
            'Failed to delete book',
            sanitizeErrorDetails({ originalError: err.message }),
            requestId
        );

        const statusCode = getErrorStatus(errorCode);
        logRequest(statusCode, err);

        return json(errorResponse, { status: statusCode });
    }
};