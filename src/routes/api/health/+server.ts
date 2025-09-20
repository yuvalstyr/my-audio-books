import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { ServerLogger, createRequestLogger } from '$lib/server/utils/logger.js';
import { createSuccessResponse, createErrorResponse } from '$lib/server/utils/errors.js';
import { db } from '$lib/server/db/connection.js';
import { books, tags, bookTags } from '$lib/server/db/schema.js';
import { sql } from 'drizzle-orm';

const requestLogger = createRequestLogger();

// GET /api/health - Health check endpoint for monitoring
export const GET: RequestHandler = async ({ request, url }) => {
    const logRequest = requestLogger.logRequest(request);
    const requestId = requestLogger.getRequestId();

    try {
        ServerLogger.info('Health check requested', 'HEALTH_CHECK', requestId);

        const startTime = Date.now();

        // Check database connection with timeout
        let dbConnected = false;
        let dbStats = { isConnected: false, error: 'Not checked' };

        try {
            // Add timeout to database operations
            const dbPromise = Promise.all([
                validateDatabaseConnection(),
                getDatabaseStats()
            ]);

            const timeoutPromise = new Promise<never>((_, reject) => {
                setTimeout(() => reject(new Error('Database check timeout')), 5000);
            });

            const [connected, stats] = await Promise.race([dbPromise, timeoutPromise]);
            dbConnected = connected;
            dbStats = stats;
        } catch (error) {
            ServerLogger.warn('Database health check failed or timed out', 'HEALTH_CHECK', requestId, { error: (error as Error).message });
            dbStats = { isConnected: false, error: (error as Error).message };
        }

        // Check system resources (basic checks)
        const memoryUsage = process.memoryUsage();
        const uptime = process.uptime();

        // Determine overall health status based on database connection
        const isHealthy = dbConnected && dbStats.isConnected;
        const responseTime = Date.now() - startTime;

        const healthData = {
            status: isHealthy ? 'healthy' : 'unhealthy',
            timestamp: new Date().toISOString(),
            version: process.env.npm_package_version || '1.0.0',
            environment: process.env.NODE_ENV || 'development',
            uptime: Math.floor(uptime),
            responseTime,
            checks: {
                database: {
                    status: dbConnected ? 'up' : 'down',
                    connected: dbStats.isConnected,
                    tableCount: dbStats.tableCount,
                    totalRecords: dbStats.totalRecords,
                    error: dbStats.error
                },
                memory: {
                    used: Math.round(memoryUsage.heapUsed / 1024 / 1024), // MB
                    total: Math.round(memoryUsage.heapTotal / 1024 / 1024), // MB
                    external: Math.round(memoryUsage.external / 1024 / 1024), // MB
                    rss: Math.round(memoryUsage.rss / 1024 / 1024) // MB
                },
                system: {
                    nodeVersion: process.version,
                    platform: process.platform,
                    arch: process.arch
                }
            }
        };

        const statusCode = isHealthy ? 200 : 503;
        const response = isHealthy
            ? createSuccessResponse(healthData, 'System is healthy', requestId)
            : createErrorResponse('DATABASE_ERROR', 'System is unhealthy', healthData, requestId);

        logRequest(statusCode);

        return json(response, {
            status: statusCode,
            headers: {
                'Cache-Control': 'no-cache, no-store, must-revalidate',
                'Pragma': 'no-cache',
                'Expires': '0'
            }
        });

    } catch (error) {
        const err = error as Error;
        ServerLogger.error('Health check failed', err, 'HEALTH_CHECK', requestId);

        const errorResponse = createErrorResponse(
            'INTERNAL_ERROR',
            'Health check failed',
            { error: err.message },
            requestId
        );

        logRequest(500, err);

        return json(errorResponse, {
            status: 500,
            headers: {
                'Cache-Control': 'no-cache, no-store, must-revalidate'
            }
        });
    }
};

// POST /api/health/detailed - Detailed health check with additional diagnostics
export const POST: RequestHandler = async ({ request }) => {
    const logRequest = requestLogger.logRequest(request);
    const requestId = requestLogger.getRequestId();

    try {
        ServerLogger.info('Detailed health check requested', 'HEALTH_CHECK_DETAILED', requestId);

        const startTime = Date.now();

        // Get basic health data
        const dbConnected = await validateDatabaseConnection();
        const dbStats = await getDatabaseStats();

        // Additional detailed checks
        const memoryUsage = process.memoryUsage();
        const cpuUsage = process.cpuUsage();

        // Test database performance with a simple query
        const dbPerformanceStart = Date.now();
        let dbPerformance = 0;
        let dbPerformanceError: string | undefined;

        try {
            await validateDatabaseConnection();
            dbPerformance = Date.now() - dbPerformanceStart;
        } catch (error) {
            dbPerformanceError = (error as Error).message;
        }

        const responseTime = Date.now() - startTime;
        const isHealthy = dbConnected && dbStats.isConnected && !dbPerformanceError;

        const detailedHealthData = {
            status: isHealthy ? 'healthy' : 'unhealthy',
            timestamp: new Date().toISOString(),
            version: process.env.npm_package_version || '1.0.0',
            environment: process.env.NODE_ENV || 'development',
            uptime: Math.floor(process.uptime()),
            responseTime,
            checks: {
                database: {
                    status: dbConnected ? 'up' : 'down',
                    connected: dbStats.isConnected,
                    tableCount: dbStats.tableCount,
                    totalRecords: dbStats.totalRecords,
                    performanceMs: dbPerformance,
                    performanceError: dbPerformanceError,
                    error: dbStats.error
                },
                memory: {
                    heapUsed: memoryUsage.heapUsed,
                    heapTotal: memoryUsage.heapTotal,
                    external: memoryUsage.external,
                    rss: memoryUsage.rss,
                    arrayBuffers: memoryUsage.arrayBuffers,
                    heapUsedMB: Math.round(memoryUsage.heapUsed / 1024 / 1024),
                    heapTotalMB: Math.round(memoryUsage.heapTotal / 1024 / 1024)
                },
                cpu: {
                    user: cpuUsage.user,
                    system: cpuUsage.system
                },
                system: {
                    nodeVersion: process.version,
                    platform: process.platform,
                    arch: process.arch,
                    pid: process.pid,
                    ppid: process.ppid
                },
                environment: {
                    nodeEnv: process.env.NODE_ENV,
                    timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
                    locale: Intl.DateTimeFormat().resolvedOptions().locale
                }
            }
        };

        const statusCode = isHealthy ? 200 : 503;
        const response = isHealthy
            ? createSuccessResponse(detailedHealthData, 'Detailed system health check completed', requestId)
            : createErrorResponse('DATABASE_ERROR', 'System health issues detected', detailedHealthData, requestId);

        logRequest(statusCode);

        return json(response, {
            status: statusCode,
            headers: {
                'Cache-Control': 'no-cache, no-store, must-revalidate'
            }
        });

    } catch (error) {
        const err = error as Error;
        ServerLogger.error('Detailed health check failed', err, 'HEALTH_CHECK_DETAILED', requestId);

        const errorResponse = createErrorResponse(
            'INTERNAL_ERROR',
            'Detailed health check failed',
            { error: err.message },
            requestId
        );

        logRequest(500, err);

        return json(errorResponse, {
            status: 500,
            headers: {
                'Cache-Control': 'no-cache, no-store, must-revalidate'
            }
        });
    }
};

// Helper functions to replace the deleted database utils
async function validateDatabaseConnection(): Promise<boolean> {
    try {
        await db.select({ test: sql`1` }).limit(1);
        return true;
    } catch (error) {
        return false;
    }
}

async function getDatabaseStats() {
    try {
        const [booksCount, tagsCount, bookTagsCount] = await Promise.all([
            db.select({ count: sql<number>`count(*)` }).from(books),
            db.select({ count: sql<number>`count(*)` }).from(tags),
            db.select({ count: sql<number>`count(*)` }).from(bookTags)
        ]);

        const totalRecords = (booksCount[0]?.count || 0) + (tagsCount[0]?.count || 0) + (bookTagsCount[0]?.count || 0);

        return {
            isConnected: true,
            tableCount: 3,
            totalRecords,
            error: null
        };
    } catch (error) {
        return {
            isConnected: false,
            tableCount: 0,
            totalRecords: 0,
            error: (error as Error).message
        };
    }
}