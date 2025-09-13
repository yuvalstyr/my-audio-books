import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { db } from '$lib/server/db/connection.js';
import { tags, bookTags, books } from '$lib/server/db/schema.js';
import { eq, desc, sql } from 'drizzle-orm';
import { generateId } from '$lib/utils/id.js';
import { isValidCreateTagInput } from '$lib/utils/validation.js';
import type { BookTag } from '$lib/types/book.js';
import { ServerLogger, createRequestLogger } from '$lib/server/utils/logger.js';
import {
    createSuccessResponse,
    createErrorResponse,
    classifyDatabaseError,
    getErrorStatus,
    sanitizeErrorDetails
} from '$lib/server/utils/errors.js';
import { executeWithRetry } from '$lib/server/utils/database.js';

const requestLogger = createRequestLogger();

// GET /api/tags - Get all tags with usage count
export const GET: RequestHandler = async ({ request }) => {
    const logRequest = requestLogger.logRequest(request);
    const requestId = requestLogger.getRequestId();

    try {
        ServerLogger.info('Fetching all tags', 'API_TAGS_GET', requestId);

        // Query tags with their usage count using retry logic
        const tagsWithCount = await executeWithRetry(
            () => db
                .select({
                    id: tags.id,
                    name: tags.name,
                    color: tags.color,
                    createdAt: tags.createdAt,
                    usageCount: sql<number>`count(${bookTags.bookId})`.as('usage_count')
                })
                .from(tags)
                .leftJoin(bookTags, eq(tags.id, bookTags.tagId))
                .groupBy(tags.id, tags.name, tags.color, tags.createdAt)
                .orderBy(desc(sql`usage_count`), tags.name),
            'SELECT_TAGS_WITH_COUNT',
            'tags',
            { requestId }
        );

        const result = tagsWithCount.map(tag => ({
            id: tag.id,
            name: tag.name,
            color: tag.color,
            createdAt: new Date(tag.createdAt),
            usageCount: tag.usageCount || 0
        }));

        ServerLogger.info(`Successfully retrieved ${result.length} tags`, 'API_TAGS_GET', requestId);

        const response = createSuccessResponse(
            result,
            `Retrieved ${result.length} tags`,
            requestId
        );

        logRequest(200);
        return json(response);

    } catch (error) {
        const err = error as Error;
        ServerLogger.error('Failed to fetch tags', err, 'API_TAGS_GET', requestId);

        const errorCode = classifyDatabaseError(err);
        const errorResponse = createErrorResponse(
            errorCode,
            'Failed to fetch tags',
            sanitizeErrorDetails({ originalError: err.message }),
            requestId
        );

        const statusCode = getErrorStatus(errorCode);
        logRequest(statusCode, err);

        return json(errorResponse, { status: statusCode });
    }
};

// POST /api/tags - Create a new tag
export const POST: RequestHandler = async ({ request }) => {
    const logRequest = requestLogger.logRequest(request);
    const requestId = requestLogger.getRequestId();

    try {
        const body = await request.json();

        ServerLogger.info('Creating new tag', 'API_TAGS_POST', requestId, {
            tagName: body?.name
        });

        // Validate input
        if (!isValidCreateTagInput(body)) {
            ServerLogger.warn('Invalid tag data provided', 'API_TAGS_POST', requestId, { body });

            const errorResponse = createErrorResponse(
                'VALIDATION_ERROR',
                'Invalid tag data provided',
                sanitizeErrorDetails({ providedData: body }),
                requestId
            );

            logRequest(400);
            return json(errorResponse, { status: 400 });
        }

        const input = body;
        const now = new Date().toISOString();

        // Check if tag with this name already exists
        const existingTag = await executeWithRetry(
            () => db
                .select()
                .from(tags)
                .where(eq(tags.name, input.name))
                .limit(1),
            'CHECK_TAG_EXISTS',
            'tags',
            { requestId }
        );

        if (existingTag.length > 0) {
            ServerLogger.warn(`Tag already exists: ${input.name}`, 'API_TAGS_POST', requestId);

            const errorResponse = createErrorResponse(
                'CONFLICT',
                'A tag with this name already exists',
                { tagName: input.name },
                requestId
            );

            logRequest(409);
            return json(errorResponse, { status: 409 });
        }

        // Generate ID if not provided or use provided ID
        const tagId = input.id || generateId();

        // Insert the tag
        await executeWithRetry(
            () => db.insert(tags).values({
                id: tagId,
                name: input.name.trim(),
                color: input.color.trim(),
                createdAt: now
            }),
            'INSERT_TAG',
            'tags',
            { requestId }
        );

        // Fetch the created tag
        const createdTag = await executeWithRetry(
            () => db
                .select()
                .from(tags)
                .where(eq(tags.id, tagId))
                .limit(1),
            'SELECT_CREATED_TAG',
            'tags',
            { requestId }
        );

        const result = {
            id: createdTag[0].id,
            name: createdTag[0].name,
            color: createdTag[0].color,
            createdAt: new Date(createdTag[0].createdAt),
            usageCount: 0
        };

        ServerLogger.info(`Successfully created tag: ${result.name}`, 'API_TAGS_POST', requestId, {
            tagId: result.id
        });

        const response = createSuccessResponse(
            result,
            'Tag created successfully',
            requestId
        );

        logRequest(201);
        return json(response, { status: 201 });

    } catch (error) {
        const err = error as Error;
        ServerLogger.error('Failed to create tag', err, 'API_TAGS_POST', requestId);

        const errorCode = classifyDatabaseError(err);
        const errorResponse = createErrorResponse(
            errorCode,
            'Failed to create tag',
            sanitizeErrorDetails({ originalError: err.message }),
            requestId
        );

        const statusCode = getErrorStatus(errorCode);
        logRequest(statusCode, err);

        return json(errorResponse, { status: statusCode });
    }
};