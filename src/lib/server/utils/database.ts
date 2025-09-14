/**
 * Database utilities with transaction support and error handling
 */

import { db } from '$lib/server/db/connection.js';
import { books, tags, bookTags } from '$lib/server/db/schema.js';
import { ServerLogger } from './logger.js';
import { classifyDatabaseError, createApiError, type ApiErrorCode } from './errors.js';
import { sql } from 'drizzle-orm';

export interface TransactionOptions {
    requestId?: string;
    timeout?: number;
    retries?: number;
}

export interface DatabaseOperationResult<T> {
    success: boolean;
    data?: T;
    error?: Error;
    duration: number;
}

/**
 * Execute a database operation with error handling and logging
 */
export async function executeWithErrorHandling<T>(
    operation: () => Promise<T>,
    operationName: string,
    tableName: string,
    requestId?: string
): Promise<DatabaseOperationResult<T>> {
    const timer = ServerLogger.createTimer();
    const queryId = `${operationName}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    try {
        // Track query for connection management
        const { connectionManager } = await import('$lib/server/db/connection.js');
        connectionManager.trackQuery(queryId);

        // Check if system is overloaded
        if (connectionManager.isOverloaded()) {
            ServerLogger.warn(`Database overloaded, queuing operation: ${operationName}`, 'DATABASE', requestId);
            // Add small delay to prevent overwhelming the database
            await new Promise(resolve => setTimeout(resolve, 50));
        }

        ServerLogger.debug(`Starting ${operationName} on ${tableName}`, 'DATABASE', requestId, { queryId });

        const result = await operation();
        const duration = timer();

        // Log performance metrics
        ServerLogger.logDatabaseOperation(operationName, tableName, duration, requestId, undefined, {
            queryId,
            performanceLevel: duration > 1000 ? 'slow' : duration > 500 ? 'medium' : 'fast'
        });

        // Track slow queries
        if (duration > 1000) {
            ServerLogger.warn(`Slow query detected: ${operationName} on ${tableName} took ${duration}ms`, 'DATABASE_PERFORMANCE', requestId, {
                queryId,
                duration,
                operationName,
                tableName
            });
        }

        connectionManager.releaseQuery(queryId);

        return {
            success: true,
            data: result,
            duration
        };
    } catch (error) {
        const duration = timer();
        const dbError = error as Error;

        // Release query tracking
        const { connectionManager } = await import('$lib/server/db/connection.js');
        connectionManager.releaseQuery(queryId);

        ServerLogger.logDatabaseOperation(operationName, tableName, duration, requestId, dbError, { queryId });

        return {
            success: false,
            error: dbError,
            duration
        };
    }
}

/**
 * Execute a database transaction with automatic rollback on error
 * Note: For better-sqlite3, transaction functions must be synchronous
 */
export function executeTransaction<T>(
    transactionFn: (tx: any) => T,
    options: TransactionOptions = {}
): T {
    const { requestId, retries = 0 } = options;
    const timer = ServerLogger.createTimer();

    let lastError: Error | null = null;

    for (let attempt = 0; attempt <= retries; attempt++) {
        try {
            if (attempt > 0) {
                ServerLogger.info(
                    `Retrying transaction (attempt ${attempt + 1}/${retries + 1})`,
                    'DATABASE_TRANSACTION',
                    requestId
                );
                // Add synchronous delay for retries (not ideal but necessary for sync transactions)
                const start = Date.now();
                while (Date.now() - start < Math.pow(2, attempt) * 100) {
                    // Busy wait - not ideal but better-sqlite3 transactions must be sync
                }
            }

            ServerLogger.debug('Starting database transaction', 'DATABASE_TRANSACTION', requestId);

            const result = db.transaction(transactionFn);

            const duration = timer();
            ServerLogger.logDatabaseOperation('TRANSACTION', 'multiple', duration, requestId);

            return result;
        } catch (error) {
            lastError = error as Error;
            const duration = timer();

            ServerLogger.logDatabaseOperation(
                'TRANSACTION',
                'multiple',
                duration,
                requestId,
                lastError,
                { attempt: attempt + 1, maxAttempts: retries + 1 }
            );

            // Don't retry on certain types of errors
            if (isNonRetryableError(lastError)) {
                break;
            }

            // If this was the last attempt, break
            if (attempt === retries) {
                break;
            }
        }
    }

    // If we get here, all attempts failed
    const errorCode = classifyDatabaseError(lastError!);
    throw createApiError(
        errorCode,
        `Transaction failed after ${retries + 1} attempts: ${lastError!.message}`,
        { originalError: lastError!.message, attempts: retries + 1 },
        requestId
    );
}

/**
 * Check if an error should not be retried
 */
function isNonRetryableError(error: Error): boolean {
    const message = error.message.toLowerCase();

    // Don't retry validation errors, constraint violations, etc.
    const nonRetryablePatterns = [
        'unique constraint',
        'foreign key constraint',
        'not null constraint',
        'check constraint',
        'syntax error',
        'validation',
        'duplicate'
    ];

    return nonRetryablePatterns.some(pattern => message.includes(pattern));
}

/**
 * Execute a database query with retry logic for transient failures
 */
export async function executeWithRetry<T>(
    operation: () => Promise<T>,
    operationName: string,
    tableName: string,
    options: TransactionOptions = {}
): Promise<T> {
    const { requestId, retries = 2 } = options;
    let lastError: Error | null = null;

    for (let attempt = 0; attempt <= retries; attempt++) {
        const result = await executeWithErrorHandling(
            operation,
            operationName,
            tableName,
            requestId
        );

        // Record performance metrics
        performanceMonitor.recordQuery(result.duration, result.success);

        if (result.success) {
            return result.data!;
        }

        lastError = result.error!;

        // Don't retry on certain types of errors
        if (isNonRetryableError(lastError)) {
            break;
        }

        // If this was the last attempt, break
        if (attempt === retries) {
            break;
        }

        // Add exponential backoff with jitter
        const baseDelay = Math.pow(2, attempt) * 100;
        const jitter = Math.random() * 50; // Add up to 50ms jitter
        await new Promise(resolve => setTimeout(resolve, baseDelay + jitter));
    }

    // If we get here, all attempts failed
    const errorCode = classifyDatabaseError(lastError!);
    throw createApiError(
        errorCode,
        `Operation ${operationName} failed after ${retries + 1} attempts: ${lastError!.message}`,
        { originalError: lastError!.message, attempts: retries + 1 },
        requestId
    );
}

/**
 * Validate database connection
 */
export async function validateDatabaseConnection(): Promise<boolean> {
    try {
        // Simple query to test connection - just select 1
        const result = await db.select({ test: sql`1 as test` });
        return Array.isArray(result) && result.length > 0;
    } catch (error) {
        const errorMessage = (error as Error).message;

        // Log specific error types for debugging
        if (errorMessage.includes('no such table') || errorMessage.includes('database is locked')) {
            ServerLogger.warn(`Database validation warning: ${errorMessage}`, 'DATABASE_HEALTH');
        } else {
            ServerLogger.error('Database connection validation failed', error as Error, 'DATABASE_HEALTH');
        }

        return false;
    }
}

/**
 * Get database statistics for health monitoring
 */
export async function getDatabaseStats(): Promise<{
    isConnected: boolean;
    tableCount?: number;
    totalRecords?: number;
    error?: string;
}> {
    try {
        const isConnected = await validateDatabaseConnection();

        if (!isConnected) {
            return { isConnected: false, error: 'Database connection failed' };
        }

        // Get table count (SQLite specific) - simplified approach
        let tableCount = 0;
        let totalRecords = 0;

        try {
            // Try to count books and tags tables (main tables we care about)
            // Check if tables exist first
            const bookCountResult = await db.select({ count: sql<number>`count(*)` }).from(books);
            const tagCountResult = await db.select({ count: sql<number>`count(*)` }).from(tags);

            const bookCount = bookCountResult[0]?.count || 0;
            const tagCount = tagCountResult[0]?.count || 0;
            totalRecords = bookCount + tagCount;
            tableCount = 2; // We know we have books and tags tables
        } catch (error) {
            const errorMessage = (error as Error).message;

            // Handle specific "no such table" errors gracefully
            if (errorMessage.includes('no such table')) {
                ServerLogger.info('Database tables not yet created (normal during initialization)', 'DATABASE_HEALTH');
                return {
                    isConnected: true,
                    tableCount: 0,
                    totalRecords: 0,
                    error: 'Tables not yet created'
                };
            } else {
                // Other errors are more concerning
                ServerLogger.warn('Could not get table statistics', 'DATABASE_HEALTH', undefined, { error: errorMessage });
                return {
                    isConnected: true,
                    tableCount: 0,
                    totalRecords: 0,
                    error: errorMessage
                };
            }
        }

        return {
            isConnected: true,
            tableCount,
            totalRecords
        };
    } catch (error) {
        ServerLogger.error('Failed to get database stats', error as Error, 'DATABASE_HEALTH');
        return {
            isConnected: false,
            error: (error as Error).message
        };
    }
}

/**
 * Performance monitoring utilities
 */
export interface DatabasePerformanceMetrics {
    queryCount: number;
    averageQueryTime: number;
    slowQueries: number;
    errorRate: number;
    connectionStats: {
        active: number;
        total: number;
        overloaded: boolean;
    };
}

class PerformanceMonitor {
    private static instance: PerformanceMonitor;
    private queryMetrics: Array<{ duration: number; success: boolean; timestamp: number }> = [];
    private readonly maxMetrics = 1000; // Keep last 1000 queries

    static getInstance(): PerformanceMonitor {
        if (!PerformanceMonitor.instance) {
            PerformanceMonitor.instance = new PerformanceMonitor();
        }
        return PerformanceMonitor.instance;
    }

    recordQuery(duration: number, success: boolean): void {
        this.queryMetrics.push({
            duration,
            success,
            timestamp: Date.now()
        });

        // Keep only recent metrics
        if (this.queryMetrics.length > this.maxMetrics) {
            this.queryMetrics = this.queryMetrics.slice(-this.maxMetrics);
        }
    }

    async getMetrics(): Promise<DatabasePerformanceMetrics> {
        const recentMetrics = this.queryMetrics.filter(
            m => Date.now() - m.timestamp < 300000 // Last 5 minutes
        );

        const totalQueries = recentMetrics.length;
        const successfulQueries = recentMetrics.filter(m => m.success);
        const slowQueries = recentMetrics.filter(m => m.duration > 1000).length;

        const averageQueryTime = totalQueries > 0
            ? recentMetrics.reduce((sum, m) => sum + m.duration, 0) / totalQueries
            : 0;

        const errorRate = totalQueries > 0
            ? ((totalQueries - successfulQueries.length) / totalQueries) * 100
            : 0;

        const { connectionManager } = await import('$lib/server/db/connection.js');
        const connectionStats = connectionManager.getStats();

        return {
            queryCount: totalQueries,
            averageQueryTime: Math.round(averageQueryTime),
            slowQueries,
            errorRate: Math.round(errorRate * 100) / 100,
            connectionStats: {
                active: connectionStats.activeConnections,
                total: connectionStats.activeQueries,
                overloaded: connectionStats.activeConnections >= connectionStats.maxConnections * 0.8
            }
        };
    }

    clearMetrics(): void {
        this.queryMetrics = [];
    }
}

export const performanceMonitor = PerformanceMonitor.getInstance();

/**
 * Get comprehensive database performance metrics
 */
export async function getDatabasePerformanceMetrics(): Promise<DatabasePerformanceMetrics & {
    databaseSize?: number;
    tableStats?: Record<string, number>;
}> {
    const baseMetrics = await performanceMonitor.getMetrics();

    try {
        // Get database size and table statistics
        const bookCountResult = await db.select({ count: sql<number>`count(*)` }).from(books);
        const tagCountResult = await db.select({ count: sql<number>`count(*)` }).from(tags);
        const bookTagCountResult = await db.select({ count: sql<number>`count(*)` }).from(bookTags);

        const tableStats = {
            books: bookCountResult[0]?.count || 0,
            tags: tagCountResult[0]?.count || 0,
            bookTags: bookTagCountResult[0]?.count || 0
        };

        return {
            ...baseMetrics,
            tableStats
        };
    } catch (error) {
        ServerLogger.warn('Could not get extended performance metrics', 'DATABASE_PERFORMANCE', undefined, {
            error: (error as Error).message
        });
        return baseMetrics;
    }
}

/**
 * Cleanup old or orphaned records (maintenance utility)
 */
export function performDatabaseMaintenance(requestId?: string): {
    success: boolean;
    operations: string[];
    error?: string;
} {
    const operations: string[] = [];

    try {
        executeTransaction((tx) => {
            // Analyze and optimize database
            try {
                tx.prepare('ANALYZE').run();
                operations.push('Database analysis completed');
            } catch (error) {
                operations.push(`Analysis warning: ${(error as Error).message}`);
            }

            // Optimize database
            try {
                tx.prepare('PRAGMA optimize').run();
                operations.push('Database optimization completed');
            } catch (error) {
                operations.push(`Optimization warning: ${(error as Error).message}`);
            }

            // Clear old performance metrics
            performanceMonitor.clearMetrics();
            operations.push('Performance metrics cleared');

            operations.push('Database maintenance completed successfully');
        }, { requestId });

        return { success: true, operations };
    } catch (error) {
        ServerLogger.error('Database maintenance failed', error as Error, 'DATABASE_MAINTENANCE', requestId);
        return {
            success: false,
            operations,
            error: (error as Error).message
        };
    }
}