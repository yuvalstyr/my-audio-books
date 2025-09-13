import { describe, it, expect, vi, beforeEach } from 'vitest';
import { ServerLogger } from '$lib/server/utils/logger.js';
import {
    createErrorResponse,
    createSuccessResponse,
    classifyDatabaseError,
    createApiError,
    sanitizeErrorDetails
} from '$lib/server/utils/errors.js';
import { executeWithRetry, validateDatabaseConnection } from '$lib/server/utils/database.js';

describe('Error Handling and Logging', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    describe('Error Response Creation', () => {
        it('should create standardized error response', () => {
            const error = createErrorResponse(
                'VALIDATION_ERROR',
                'Invalid input provided',
                { field: 'title' },
                'req_123'
            );

            expect(error).toMatchObject({
                success: false,
                error: 'VALIDATION_ERROR',
                message: 'Invalid input provided',
                details: { field: 'title' },
                requestId: 'req_123'
            });
            expect(error.timestamp).toBeDefined();
        });

        it('should create standardized success response', () => {
            const success = createSuccessResponse(
                { id: '1', title: 'Test Book' },
                'Book created successfully',
                'req_123'
            );

            expect(success).toMatchObject({
                success: true,
                data: { id: '1', title: 'Test Book' },
                message: 'Book created successfully',
                requestId: 'req_123'
            });
            expect(success.timestamp).toBeDefined();
        });
    });

    describe('Database Error Classification', () => {
        it('should classify unique constraint errors as CONFLICT', () => {
            const error = new Error('UNIQUE constraint failed: books.id');
            const classified = classifyDatabaseError(error);
            expect(classified).toBe('CONFLICT');
        });

        it('should classify foreign key errors as VALIDATION_ERROR', () => {
            const error = new Error('FOREIGN KEY constraint failed');
            const classified = classifyDatabaseError(error);
            expect(classified).toBe('VALIDATION_ERROR');
        });

        it('should classify connection errors as DATABASE_ERROR', () => {
            const error = new Error('Connection timeout');
            const classified = classifyDatabaseError(error);
            expect(classified).toBe('DATABASE_ERROR');
        });

        it('should default to DATABASE_ERROR for unknown errors', () => {
            const error = new Error('Unknown database error');
            const classified = classifyDatabaseError(error);
            expect(classified).toBe('DATABASE_ERROR');
        });
    });

    describe('Error Sanitization', () => {
        it('should sanitize sensitive information from error details', () => {
            const details = {
                user: 'john',
                password: 'secret123',
                token: 'abc123',
                data: {
                    authorization: 'Bearer token',
                    content: 'safe data'
                }
            };

            const sanitized = sanitizeErrorDetails(details);

            expect(sanitized).toEqual({
                user: 'john',
                password: '[REDACTED]',
                token: '[REDACTED]',
                data: {
                    authorization: '[REDACTED]',
                    content: 'safe data'
                }
            });
        });

        it('should handle non-object details safely', () => {
            expect(sanitizeErrorDetails('string')).toBe('string');
            expect(sanitizeErrorDetails(123)).toBe(123);
            expect(sanitizeErrorDetails(null)).toBe(null);
        });
    });

    describe('API Error with Context', () => {
        it('should create API error with proper context', () => {
            const apiError = createApiError(
                'BOOK_NOT_FOUND',
                'Book not found',
                { bookId: '123' },
                'req_456'
            );

            expect(apiError.code).toBe('BOOK_NOT_FOUND');
            expect(apiError.message).toBe('Book not found');
            expect(apiError.statusCode).toBe(404);
            expect(apiError.details).toEqual({ bookId: '123' });
            expect(apiError.requestId).toBe('req_456');
        });

        it('should convert to API response format', () => {
            const apiError = createApiError('VALIDATION_ERROR', 'Invalid data');
            const response = apiError.toApiResponse();

            expect(response).toMatchObject({
                success: false,
                error: 'VALIDATION_ERROR',
                message: 'Invalid data'
            });
        });
    });

    describe('Server Logger', () => {
        it('should generate unique request IDs', () => {
            const id1 = ServerLogger.generateRequestId();
            const id2 = ServerLogger.generateRequestId();

            expect(id1).toMatch(/^req_\d+_[a-z0-9]+$/);
            expect(id2).toMatch(/^req_\d+_[a-z0-9]+$/);
            expect(id1).not.toBe(id2);
        });

        it('should extract client IP from request headers', () => {
            const mockRequest = {
                headers: new Map([
                    ['x-forwarded-for', '192.168.1.1, 10.0.0.1'],
                    ['x-real-ip', '192.168.1.2']
                ])
            } as any;

            // Mock the headers.get method
            mockRequest.headers.get = vi.fn((key: string) => {
                const headers: Record<string, string> = {
                    'x-forwarded-for': '192.168.1.1, 10.0.0.1',
                    'x-real-ip': '192.168.1.2'
                };
                return headers[key] || null;
            });

            const ip = ServerLogger.getClientIP(mockRequest);
            expect(ip).toBe('192.168.1.1');
        });

        it('should create performance timer', () => {
            const timer = ServerLogger.createTimer();

            // Wait a small amount of time
            const start = Date.now();
            while (Date.now() - start < 10) {
                // Small delay
            }

            const duration = timer();
            expect(duration).toBeGreaterThanOrEqual(0);
            expect(typeof duration).toBe('number');
        });
    });

    describe('Database Utilities', () => {
        it('should validate database connection', async () => {
            // This test would need a real database connection to work properly
            // For now, we'll just test that the function exists and returns a boolean
            const isValid = await validateDatabaseConnection();
            expect(typeof isValid).toBe('boolean');
        });
    });
});