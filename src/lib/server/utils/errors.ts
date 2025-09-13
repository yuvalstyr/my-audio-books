/**
 * Server-side error handling utilities
 * Provides standardized error responses and error classification
 */

export type ApiErrorCode =
    | 'VALIDATION_ERROR'
    | 'BOOK_NOT_FOUND'
    | 'TAG_NOT_FOUND'
    | 'DATABASE_ERROR'
    | 'NETWORK_ERROR'
    | 'INTERNAL_ERROR'
    | 'RATE_LIMIT_ERROR'
    | 'UNAUTHORIZED'
    | 'FORBIDDEN'
    | 'CONFLICT'
    | 'BAD_REQUEST';

export interface ApiError {
    success: false;
    error: ApiErrorCode;
    message: string;
    details?: any;
    timestamp: string;
    requestId?: string;
}

export interface ApiSuccess<T = any> {
    success: true;
    data: T;
    message?: string;
    timestamp: string;
    requestId?: string;
}

export type ApiResponse<T = any> = ApiSuccess<T> | ApiError;

/**
 * Standard HTTP status codes for different error types
 */
export const ERROR_STATUS_MAP: Record<ApiErrorCode, number> = {
    VALIDATION_ERROR: 400,
    BAD_REQUEST: 400,
    UNAUTHORIZED: 401,
    FORBIDDEN: 403,
    BOOK_NOT_FOUND: 404,
    TAG_NOT_FOUND: 404,
    CONFLICT: 409,
    RATE_LIMIT_ERROR: 429,
    DATABASE_ERROR: 500,
    NETWORK_ERROR: 500,
    INTERNAL_ERROR: 500
};

/**
 * Create a standardized error response
 */
export function createErrorResponse(
    error: ApiErrorCode,
    message: string,
    details?: any,
    requestId?: string
): ApiError {
    return {
        success: false,
        error,
        message,
        details,
        timestamp: new Date().toISOString(),
        requestId
    };
}

/**
 * Create a standardized success response
 */
export function createSuccessResponse<T>(
    data: T,
    message?: string,
    requestId?: string
): ApiSuccess<T> {
    return {
        success: true,
        data,
        message,
        timestamp: new Date().toISOString(),
        requestId
    };
}

/**
 * Get HTTP status code for error type
 */
export function getErrorStatus(errorCode: ApiErrorCode): number {
    return ERROR_STATUS_MAP[errorCode] || 500;
}

/**
 * Classify database errors into appropriate API error codes
 */
export function classifyDatabaseError(error: Error): ApiErrorCode {
    const message = error.message.toLowerCase();

    if (message.includes('unique constraint') || message.includes('duplicate')) {
        return 'CONFLICT';
    }

    if (message.includes('foreign key constraint')) {
        return 'VALIDATION_ERROR';
    }

    if (message.includes('not null constraint')) {
        return 'VALIDATION_ERROR';
    }

    if (message.includes('check constraint')) {
        return 'VALIDATION_ERROR';
    }

    if (message.includes('syntax error')) {
        return 'INTERNAL_ERROR';
    }

    if (message.includes('connection') || message.includes('timeout')) {
        return 'DATABASE_ERROR';
    }

    // Default to database error for unknown database issues
    return 'DATABASE_ERROR';
}

/**
 * Enhanced error class with additional context
 */
export class ApiErrorWithContext extends Error {
    public readonly code: ApiErrorCode;
    public readonly statusCode: number;
    public readonly details?: any;
    public readonly requestId?: string;

    constructor(
        code: ApiErrorCode,
        message: string,
        details?: any,
        requestId?: string
    ) {
        super(message);
        this.name = 'ApiErrorWithContext';
        this.code = code;
        this.statusCode = getErrorStatus(code);
        this.details = details;
        this.requestId = requestId;
    }

    toApiResponse(): ApiError {
        return createErrorResponse(this.code, this.message, this.details, this.requestId);
    }
}

/**
 * Create an API error with context
 */
export function createApiError(
    code: ApiErrorCode,
    message: string,
    details?: any,
    requestId?: string
): ApiErrorWithContext {
    return new ApiErrorWithContext(code, message, details, requestId);
}

/**
 * Sanitize error details for client response (remove sensitive information)
 */
export function sanitizeErrorDetails(details: any): any {
    if (!details || typeof details !== 'object') {
        return details;
    }

    const sensitiveFields = ['password', 'token', 'secret', 'key', 'auth', 'authorization'];

    const sanitize = (obj: any): any => {
        if (!obj || typeof obj !== 'object') {
            return obj;
        }

        if (Array.isArray(obj)) {
            return obj.map(sanitize);
        }

        const result: any = {};
        for (const [key, value] of Object.entries(obj)) {
            const lowerKey = key.toLowerCase();
            if (sensitiveFields.some(field => lowerKey.includes(field))) {
                result[key] = '[REDACTED]';
            } else if (typeof value === 'object') {
                result[key] = sanitize(value);
            } else {
                result[key] = value;
            }
        }
        return result;
    };

    return sanitize(details);
}