/**
 * Server-side logging utilities
 * Provides structured logging for API requests and database operations
 */

export type LogLevel = 'debug' | 'info' | 'warn' | 'error';

export interface LogEntry {
    timestamp: string;
    level: LogLevel;
    message: string;
    context?: string;
    requestId?: string;
    method?: string;
    url?: string;
    statusCode?: number;
    duration?: number;
    userAgent?: string;
    ip?: string;
    error?: {
        name: string;
        message: string;
        stack?: string;
    };
    metadata?: Record<string, any>;
}

export class ServerLogger {
    private static isDevelopment = process.env.NODE_ENV !== 'production';

    /**
     * Log an error with context
     */
    static error(
        message: string,
        error?: Error,
        context?: string,
        requestId?: string,
        metadata?: Record<string, any>
    ): void {
        this.log('error', message, {
            context,
            requestId,
            error: error ? {
                name: error.name,
                message: error.message,
                stack: this.isDevelopment ? error.stack : undefined
            } : undefined,
            metadata
        });
    }

    /**
     * Log a warning
     */
    static warn(
        message: string,
        context?: string,
        requestId?: string,
        metadata?: Record<string, any>
    ): void {
        this.log('warn', message, { context, requestId, metadata });
    }

    /**
     * Log info message
     */
    static info(
        message: string,
        context?: string,
        requestId?: string,
        metadata?: Record<string, any>
    ): void {
        this.log('info', message, { context, requestId, metadata });
    }

    /**
     * Log debug message (only in development)
     */
    static debug(
        message: string,
        context?: string,
        requestId?: string,
        metadata?: Record<string, any>
    ): void {
        if (this.isDevelopment) {
            this.log('debug', message, { context, requestId, metadata });
        }
    }

    /**
     * Log API request
     */
    static logRequest(
        method: string,
        url: string,
        statusCode: number,
        duration: number,
        requestId: string,
        userAgent?: string,
        ip?: string,
        error?: Error
    ): void {
        const level: LogLevel = statusCode >= 500 ? 'error' : statusCode >= 400 ? 'warn' : 'info';
        const message = `${method} ${url} - ${statusCode} (${duration}ms)`;

        this.log(level, message, {
            context: 'API_REQUEST',
            requestId,
            method,
            url,
            statusCode,
            duration,
            userAgent,
            ip,
            error: error ? {
                name: error.name,
                message: error.message,
                stack: this.isDevelopment ? error.stack : undefined
            } : undefined
        });
    }

    /**
     * Log database operation
     */
    static logDatabaseOperation(
        operation: string,
        table: string,
        duration: number,
        requestId?: string,
        error?: Error,
        metadata?: Record<string, any>
    ): void {
        const level: LogLevel = error ? 'error' : duration > 1000 ? 'warn' : 'debug';
        const message = `DB ${operation} on ${table} (${duration}ms)${error ? ' - FAILED' : ''}`;

        this.log(level, message, {
            context: 'DATABASE',
            requestId,
            metadata: {
                operation,
                table,
                duration,
                ...metadata
            },
            error: error ? {
                name: error.name,
                message: error.message,
                stack: this.isDevelopment ? error.stack : undefined
            } : undefined
        });
    }

    /**
     * Core logging method
     */
    private static log(level: LogLevel, message: string, options: {
        context?: string;
        requestId?: string;
        method?: string;
        url?: string;
        statusCode?: number;
        duration?: number;
        userAgent?: string;
        ip?: string;
        error?: {
            name: string;
            message: string;
            stack?: string;
        };
        metadata?: Record<string, any>;
    } = {}): void {
        const logEntry: LogEntry = {
            timestamp: new Date().toISOString(),
            level,
            message,
            ...options
        };

        // Log to console with appropriate level
        this.logToConsole(logEntry);

        // In production, you might want to send logs to external service
        // this.sendToExternalLogger(logEntry);
    }

    /**
     * Log to console with structured format
     */
    private static logToConsole(entry: LogEntry): void {
        const prefix = `[${entry.level.toUpperCase()}] ${entry.timestamp}`;
        const requestIdSuffix = entry.requestId ? ` [${entry.requestId}]` : '';
        const contextSuffix = entry.context ? ` (${entry.context})` : '';
        const fullMessage = `${prefix}${requestIdSuffix} ${entry.message}${contextSuffix}`;

        const logArgs = [fullMessage];

        if (entry.error) {
            logArgs.push('\nError:', entry.error);
        }

        if (entry.metadata && Object.keys(entry.metadata).length > 0) {
            logArgs.push('\nMetadata:', entry.metadata);
        }

        switch (entry.level) {
            case 'error':
                console.error(...logArgs);
                break;
            case 'warn':
                console.warn(...logArgs);
                break;
            case 'info':
                console.info(...logArgs);
                break;
            case 'debug':
                console.debug(...logArgs);
                break;
        }
    }

    /**
     * Generate unique request ID
     */
    static generateRequestId(): string {
        return `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    }

    /**
     * Extract client IP from request
     */
    static getClientIP(request: Request): string {
        // Check various headers for client IP
        const headers = request.headers;

        return (
            headers.get('x-forwarded-for')?.split(',')[0]?.trim() ||
            headers.get('x-real-ip') ||
            headers.get('x-client-ip') ||
            headers.get('cf-connecting-ip') ||
            'unknown'
        );
    }

    /**
     * Performance timer utility
     */
    static createTimer(): () => number {
        const start = Date.now();
        return () => Date.now() - start;
    }
}

/**
 * Request logging middleware for SvelteKit
 */
export function createRequestLogger() {
    return {
        /**
         * Log request start and return a function to log completion
         */
        logRequest(request: Request): (statusCode: number, error?: Error) => void {
            const requestId = ServerLogger.generateRequestId();
            const method = request.method;
            const url = new URL(request.url).pathname;
            const userAgent = request.headers.get('user-agent') || 'unknown';
            const ip = ServerLogger.getClientIP(request);
            const timer = ServerLogger.createTimer();

            ServerLogger.debug(`Request started: ${method} ${url}`, 'API_REQUEST', requestId);

            return (statusCode: number, error?: Error) => {
                const duration = timer();
                ServerLogger.logRequest(method, url, statusCode, duration, requestId, userAgent, ip, error);
            };
        },

        /**
         * Get request ID for current request
         */
        getRequestId(): string {
            return ServerLogger.generateRequestId();
        }
    };
}