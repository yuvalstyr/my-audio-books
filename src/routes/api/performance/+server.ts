import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { ServerLogger, createRequestLogger } from '$lib/server/utils/logger.js';
import { createSuccessResponse, createErrorResponse } from '$lib/server/utils/errors.js';
import { getDatabasePerformanceMetrics, performDatabaseMaintenance } from '$lib/server/utils/database.js';
import { getDatabaseHealth } from '$lib/server/db/connection.js';

const requestLogger = createRequestLogger();

// GET /api/performance - Get performance metrics
export const GET: RequestHandler = async ({ request, url }) => {
    const logRequest = requestLogger.logRequest(request);
    const requestId = requestLogger.getRequestId();

    try {
        ServerLogger.info('Performance metrics requested', 'PERFORMANCE_METRICS', requestId);

        const startTime = Date.now();

        // Get database performance metrics
        const performanceMetrics = await getDatabasePerformanceMetrics();

        // Get database health
        const dbHealth = getDatabaseHealth();

        // Get system metrics
        const memoryUsage = process.memoryUsage();
        const cpuUsage = process.cpuUsage();

        const responseTime = Date.now() - startTime;

        const performanceData = {
            timestamp: new Date().toISOString(),
            responseTime,
            database: {
                performance: performanceMetrics,
                health: dbHealth
            },
            system: {
                memory: {
                    heapUsed: Math.round(memoryUsage.heapUsed / 1024 / 1024), // MB
                    heapTotal: Math.round(memoryUsage.heapTotal / 1024 / 1024), // MB
                    external: Math.round(memoryUsage.external / 1024 / 1024), // MB
                    rss: Math.round(memoryUsage.rss / 1024 / 1024), // MB
                    heapUsagePercent: Math.round((memoryUsage.heapUsed / memoryUsage.heapTotal) * 100)
                },
                cpu: {
                    user: cpuUsage.user,
                    system: cpuUsage.system
                },
                uptime: Math.floor(process.uptime()),
                nodeVersion: process.version,
                platform: process.platform
            },
            recommendations: generatePerformanceRecommendations(performanceMetrics, memoryUsage)
        };

        ServerLogger.info('Performance metrics retrieved successfully', 'PERFORMANCE_METRICS', requestId, {
            responseTime,
            queryCount: performanceMetrics.queryCount,
            averageQueryTime: performanceMetrics.averageQueryTime
        });

        const response = createSuccessResponse(
            performanceData,
            'Performance metrics retrieved successfully',
            requestId
        );

        logRequest(200);
        return json(response, {
            headers: {
                'Cache-Control': 'no-cache, no-store, must-revalidate'
            }
        });

    } catch (error) {
        const err = error as Error;
        ServerLogger.error('Failed to get performance metrics', err, 'PERFORMANCE_METRICS', requestId);

        const errorResponse = createErrorResponse(
            'INTERNAL_ERROR',
            'Failed to get performance metrics',
            { error: err.message },
            requestId
        );

        logRequest(500, err);
        return json(errorResponse, { status: 500 });
    }
};

// POST /api/performance/maintenance - Trigger database maintenance
export const POST: RequestHandler = async ({ request }) => {
    const logRequest = requestLogger.logRequest(request);
    const requestId = requestLogger.getRequestId();

    try {
        ServerLogger.info('Database maintenance requested', 'DATABASE_MAINTENANCE', requestId);

        const startTime = Date.now();

        // Perform database maintenance
        const maintenanceResult = performDatabaseMaintenance(requestId);

        const responseTime = Date.now() - startTime;

        if (!maintenanceResult.success) {
            const errorResponse = createErrorResponse(
                'DATABASE_ERROR',
                'Database maintenance failed',
                {
                    operations: maintenanceResult.operations,
                    error: maintenanceResult.error,
                    responseTime
                },
                requestId
            );

            logRequest(500);
            return json(errorResponse, { status: 500 });
        }

        const maintenanceData = {
            timestamp: new Date().toISOString(),
            responseTime,
            operations: maintenanceResult.operations,
            success: true
        };

        ServerLogger.info('Database maintenance completed successfully', 'DATABASE_MAINTENANCE', requestId, {
            responseTime,
            operationsCount: maintenanceResult.operations.length
        });

        const response = createSuccessResponse(
            maintenanceData,
            'Database maintenance completed successfully',
            requestId
        );

        logRequest(200);
        return json(response);

    } catch (error) {
        const err = error as Error;
        ServerLogger.error('Database maintenance failed', err, 'DATABASE_MAINTENANCE', requestId);

        const errorResponse = createErrorResponse(
            'INTERNAL_ERROR',
            'Database maintenance failed',
            { error: err.message },
            requestId
        );

        logRequest(500, err);
        return json(errorResponse, { status: 500 });
    }
};

// PUT /api/performance/optimize - Apply performance optimizations
export const PUT: RequestHandler = async ({ request }) => {
    const logRequest = requestLogger.logRequest(request);
    const requestId = requestLogger.getRequestId();

    try {
        ServerLogger.info('Performance optimization requested', 'DATABASE_OPTIMIZATION', requestId);

        const startTime = Date.now();

        // Apply performance optimizations
        const { applyPerformanceOptimizations, analyzeQueryPerformance, getDatabaseSizeStats } = await import('$lib/server/db/performance-migration.js');

        const optimizationResult = applyPerformanceOptimizations();
        const analysisResult = analyzeQueryPerformance();
        const sizeStats = getDatabaseSizeStats();

        const responseTime = Date.now() - startTime;

        if (!optimizationResult.success) {
            const errorResponse = createErrorResponse(
                'DATABASE_ERROR',
                'Performance optimization failed',
                {
                    operations: optimizationResult.operations,
                    error: optimizationResult.error,
                    responseTime
                },
                requestId
            );

            logRequest(500);
            return json(errorResponse, { status: 500 });
        }

        const optimizationData = {
            timestamp: new Date().toISOString(),
            responseTime,
            optimization: optimizationResult,
            analysis: analysisResult,
            sizeStats: sizeStats,
            success: true
        };

        ServerLogger.info('Performance optimization completed successfully', 'DATABASE_OPTIMIZATION', requestId, {
            responseTime,
            operationsCount: optimizationResult.operations.length
        });

        const response = createSuccessResponse(
            optimizationData,
            'Performance optimization completed successfully',
            requestId
        );

        logRequest(200);
        return json(response);

    } catch (error) {
        const err = error as Error;
        ServerLogger.error('Performance optimization failed', err, 'DATABASE_OPTIMIZATION', requestId);

        const errorResponse = createErrorResponse(
            'INTERNAL_ERROR',
            'Performance optimization failed',
            { error: err.message },
            requestId
        );

        logRequest(500, err);
        return json(errorResponse, { status: 500 });
    }
};

/**
 * Generate performance recommendations based on metrics
 */
function generatePerformanceRecommendations(
    performanceMetrics: any,
    memoryUsage: NodeJS.MemoryUsage
): string[] {
    const recommendations: string[] = [];

    // Database performance recommendations
    if (performanceMetrics.averageQueryTime > 500) {
        recommendations.push('Consider optimizing slow database queries or adding indexes');
    }

    if (performanceMetrics.slowQueries > 10) {
        recommendations.push('High number of slow queries detected - review query patterns');
    }

    if (performanceMetrics.errorRate > 5) {
        recommendations.push('High database error rate - check for connection issues');
    }

    if (performanceMetrics.connectionStats.overloaded) {
        recommendations.push('Database connection pool is overloaded - consider scaling');
    }

    // Memory recommendations
    const heapUsagePercent = (memoryUsage.heapUsed / memoryUsage.heapTotal) * 100;
    if (heapUsagePercent > 80) {
        recommendations.push('High memory usage detected - consider memory optimization');
    }

    if (memoryUsage.heapUsed > 500 * 1024 * 1024) { // 500MB
        recommendations.push('Memory usage is high - monitor for memory leaks');
    }

    // Table size recommendations
    if (performanceMetrics.tableStats) {
        const totalRecords = Object.values(performanceMetrics.tableStats).reduce((sum: number, count: any) => sum + count, 0);
        if (totalRecords > 10000) {
            recommendations.push('Large dataset detected - consider implementing pagination');
        }
    }

    if (recommendations.length === 0) {
        recommendations.push('System performance is optimal');
    }

    return recommendations;
}