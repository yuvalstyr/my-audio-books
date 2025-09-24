import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { db } from '$lib/server/db/connection.js';
import { books, bookTags, tags } from '$lib/server/db/schema.js';
import { eq, desc } from 'drizzle-orm';
import { generateId } from '$lib/utils/id.js';
import { isValidCreateBookInput } from '$lib/utils/validation.js';
import type { CreateBookInput } from '$lib/types/book.js';
import { ServerLogger, createRequestLogger } from '$lib/server/utils/logger.js';
import {
    createSuccessResponse,
    createErrorResponse,
    classifyDatabaseError,
    getErrorStatus,
    sanitizeErrorDetails
} from '$lib/server/utils/errors.js';

const requestLogger = createRequestLogger();

// GET /api/books - Get all books with their tags, with optional filtering
export const GET: RequestHandler = async ({ request, url }) => {
    const logRequest = requestLogger.logRequest(request);
    const requestId = requestLogger.getRequestId();

    try {
        // Parse query parameters for filtering
        const filterTag = url.searchParams.get('filter');
        const tagFilter = url.searchParams.get('tag');
        const limit = url.searchParams.get('limit');
        const offset = url.searchParams.get('offset');

        // Determine if we need to filter by specific tag
        const targetTag = filterTag === 'next' ? 'next' : tagFilter;

        ServerLogger.info('Fetching books', 'API_BOOKS_GET', requestId, {
            filterTag,
            tagFilter: targetTag,
            limit,
            offset
        });

        let query = db
            .select({
                id: books.id,
                title: books.title,
                author: books.author,
                narratorRating: books.narratorRating,
                performanceRating: books.performanceRating,
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
            .leftJoin(tags, eq(bookTags.tagId, tags.id));

        // Apply tag filtering if specified
        if (targetTag) {
            // For tag filtering, we need to ensure the book has the specific tag
            // This requires a different approach - we'll filter after grouping
            ServerLogger.info(`Applying tag filter: ${targetTag}`, 'API_BOOKS_GET', requestId);
        }

        // Apply ordering
        query = query.orderBy(desc(books.dateAdded));

        // Execute query
        const booksWithTags = await query;

        // Group books and their tags
        const booksMap = new Map();

        for (const row of booksWithTags) {
            if (!booksMap.has(row.id)) {
                booksMap.set(row.id, {
                    id: row.id,
                    title: row.title,
                    author: row.author,
                    narratorRating: row.narratorRating,
                    performanceRating: row.performanceRating,
                    description: row.description,
                    coverImageUrl: row.coverImageUrl,
                    audibleUrl: row.audibleUrl,
                    queuePosition: row.queuePosition,
                    dateAdded: new Date(row.dateAdded),
                    highlyRatedFor: row.highlyRatedFor,
                    tags: []
                });
            }

            // Add tag if it exists
            if (row.tagId) {
                booksMap.get(row.id).tags.push({
                    id: row.tagId,
                    name: row.tagName,
                    color: row.tagColor
                });
            }
        }

        let result = Array.from(booksMap.values());

        // Apply tag filtering after grouping if specified
        if (targetTag) {
            const originalCount = result.length;
            result = result.filter(book =>
                book.tags.some((tag: any) => tag.name === targetTag)
            );
            ServerLogger.info(`Tag filter applied: ${originalCount} -> ${result.length} books`, 'API_BOOKS_GET', requestId);
        }

        // Apply pagination if specified
        if (limit || offset) {
            const limitNum = limit ? parseInt(limit, 10) : undefined;
            const offsetNum = offset ? parseInt(offset, 10) : 0;

            if (limitNum && limitNum > 0) {
                result = result.slice(offsetNum, offsetNum + limitNum);
                ServerLogger.info(`Pagination applied: limit=${limitNum}, offset=${offsetNum}`, 'API_BOOKS_GET', requestId);
            }
        }

        const message = targetTag
            ? `Retrieved ${result.length} books with tag "${targetTag}"`
            : `Retrieved ${result.length} books`;

        ServerLogger.info(message, 'API_BOOKS_GET', requestId);

        const response = createSuccessResponse(
            result,
            message,
            requestId
        );

        logRequest(200);
        return json(response);

    } catch (error) {
        const err = error as Error;
        ServerLogger.error('Failed to fetch books', err, 'API_BOOKS_GET', requestId);

        const errorCode = classifyDatabaseError(err);
        const errorResponse = createErrorResponse(
            errorCode,
            'Failed to fetch books',
            sanitizeErrorDetails({ originalError: err.message }),
            requestId
        );

        const statusCode = getErrorStatus(errorCode);
        logRequest(statusCode, err);

        return json(errorResponse, { status: statusCode });
    }
};

// POST /api/books - Create a new book
export const POST: RequestHandler = async ({ request }) => {
    const logRequest = requestLogger.logRequest(request);
    const requestId = requestLogger.getRequestId();

    try {
        const body = await request.json();

        ServerLogger.info('Creating new book', 'API_BOOKS_POST', requestId, {
            title: body?.title,
            author: body?.author
        });

        // Validate input
        if (!isValidCreateBookInput(body)) {
            ServerLogger.warn('Invalid book data provided', 'API_BOOKS_POST', requestId, { body });

            const errorResponse = createErrorResponse(
                'VALIDATION_ERROR',
                'Invalid book data provided',
                sanitizeErrorDetails({ providedData: body }),
                requestId
            );

            logRequest(400);
            return json(errorResponse, { status: 400 });
        }

        const input = body as CreateBookInput;
        const bookId = generateId();
        const now = new Date().toISOString();

        // Insert the book
        await db.insert(books).values({
            id: bookId,
            title: input.title.trim(),
            author: input.author.trim(),
            narratorRating: input.narratorRating || null,
            performanceRating: input.performanceRating || null,
            description: input.description?.trim() || null,
            coverImageUrl: input.coverImageUrl?.trim() || null,
            audibleUrl: input.audibleUrl?.trim() || null,
            queuePosition: input.queuePosition || null,
            dateAdded: now,
            highlyRatedFor: input.highlyRatedFor?.trim() || null
        });

        // Handle tags if provided
        if (input.tags && input.tags.length > 0) {
            const bookTagsToInsert = [];
            for (const tag of input.tags) {
                // Check if tag exists, create if not
                const existingTag = await db
                    .select()
                    .from(tags)
                    .where(eq(tags.name, tag.name))
                    .limit(1);

                let tagId = tag.id;
                if (existingTag.length === 0) {
                    // Create new tag
                    await db.insert(tags).values({
                        id: tag.id,
                        name: tag.name,
                        color: tag.color,
                        createdAt: now,
                    });
                } else {
                    tagId = existingTag[0].id;
                }

                bookTagsToInsert.push({
                    bookId,
                    tagId
                });
            }

            // Insert book-tag relationships
            if (bookTagsToInsert.length > 0) {
                await db.insert(bookTags).values(bookTagsToInsert);
            }
        }

        // Fetch the created book with tags
        const createdBookWithTags = await db
            .select({
                id: books.id,
                title: books.title,
                author: books.author,
                narratorRating: books.narratorRating,
                performanceRating: books.performanceRating,
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
            .where(eq(books.id, bookId));

        if (createdBookWithTags.length === 0) {
            throw new Error('Failed to retrieve created book');
        }

        // Format the response
        const book = {
            id: createdBookWithTags[0].id,
            title: createdBookWithTags[0].title,
            author: createdBookWithTags[0].author,
            narratorRating: createdBookWithTags[0].narratorRating,
            performanceRating: createdBookWithTags[0].performanceRating,
            description: createdBookWithTags[0].description,
            coverImageUrl: createdBookWithTags[0].coverImageUrl,
            audibleUrl: createdBookWithTags[0].audibleUrl,
            queuePosition: createdBookWithTags[0].queuePosition,
            dateAdded: new Date(createdBookWithTags[0].dateAdded),
            highlyRatedFor: createdBookWithTags[0].highlyRatedFor,
            tags: createdBookWithTags
                .filter(row => row.tagId)
                .map(row => ({
                    id: row.tagId!,
                    name: row.tagName!,
                    color: row.tagColor!
                }))
        };

        ServerLogger.info(`Successfully created book: ${book.title}`, 'API_BOOKS_POST', requestId, {
            bookId: book.id
        });

        const response = createSuccessResponse(
            book,
            'Book created successfully',
            requestId
        );

        logRequest(201);
        return json(response, { status: 201 });

    } catch (error) {
        const err = error as Error;
        ServerLogger.error('Failed to create book', err, 'API_BOOKS_POST', requestId);

        const errorCode = classifyDatabaseError(err);
        const errorResponse = createErrorResponse(
            errorCode,
            'Failed to create book',
            sanitizeErrorDetails({ originalError: err.message }),
            requestId
        );

        const statusCode = getErrorStatus(errorCode);
        logRequest(statusCode, err);

        return json(errorResponse, { status: statusCode });
    }
};