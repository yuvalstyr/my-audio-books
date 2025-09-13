/**
 * Error logging service for development and user feedback
 * Provides centralized error handling, logging, and user-friendly error messages
 */

export type LogLevel = 'debug' | 'info' | 'warn' | 'error';

export interface ErrorLogEntry {
    id: string;
    timestamp: Date;
    level: LogLevel;
    message: string;
    context?: string;
    error?: Error;
    userAgent?: string;
    url?: string;
    userId?: string;
    additionalData?: any;
}

export interface UserFriendlyError {
    title: string;
    message: string;
    action?: string;
    type: 'error' | 'warning' | 'info';
}

export class ErrorLogger {
    private static isDevelopment = import.meta.env.DEV ?? true; // Force logging for debugging

    /**
     * Log an error with context
     */
    static error(message: string, error?: Error, context?: string, additionalData?: any): void {
        this.log('error', message, error, context, additionalData);
    }

    /**
     * Log a warning
     */
    static warn(message: string, context?: string): void {
        this.log('warn', message, undefined, context);
    }

    /**
     * Log info message
     */
    static info(message: string, context?: string): void {
        this.log('info', message, undefined, context);
    }

    /**
     * Log debug message (only in development)
     */
    static debug(message: string, context?: string): void {
        if (this.isDevelopment) {
            this.log('debug', message, undefined, context);
        }
    }

    /**
     * Core logging method
     */
    private static log(level: LogLevel, message: string, error?: Error, context?: string, additionalData?: any): void {
        const logEntry: ErrorLogEntry = {
            id: this.generateId(),
            timestamp: new Date(),
            level,
            message,
            context,
            error,
            userAgent: typeof navigator !== 'undefined' ? navigator.userAgent : 'Unknown',
            url: typeof window !== 'undefined' ? window.location.href : 'Unknown',
            additionalData: additionalData ? this.sanitizeAdditionalData(additionalData) : undefined
        };

        // Log to console for debugging
        this.logToConsole(logEntry);
    }

    /**
     * Sanitize additional data to remove sensitive information
     */
    private static sanitizeAdditionalData(data: any): any {
        if (!data || typeof data !== 'object') {
            return data;
        }

        const sanitized = { ...data };

        // Remove or mask sensitive fields
        const sensitiveFields = ['token', 'authorization', 'password', 'secret', 'key', 'auth'];

        const sanitizeObject = (obj: any): any => {
            if (!obj || typeof obj !== 'object') {
                return obj;
            }

            if (Array.isArray(obj)) {
                return obj.map(sanitizeObject);
            }

            const result: any = {};
            for (const [key, value] of Object.entries(obj)) {
                const lowerKey = key.toLowerCase();
                if (sensitiveFields.some(field => lowerKey.includes(field))) {
                    result[key] = '[REDACTED]';
                } else if (typeof value === 'object') {
                    result[key] = sanitizeObject(value);
                } else {
                    result[key] = value;
                }
            }
            return result;
        };

        return sanitizeObject(sanitized);
    }

    /**
     * Log to browser console with appropriate level
     */
    private static logToConsole(entry: ErrorLogEntry): void {
        const prefix = `[${entry.level.toUpperCase()}] ${entry.timestamp.toISOString()}`;
        const contextSuffix = entry.context ? ` (${entry.context})` : '';
        const fullMessage = `${prefix} ${entry.message}${contextSuffix}`;

        const logArgs = [fullMessage];
        if (entry.error) {
            logArgs.push(entry.error);
        }
        if (entry.additionalData) {
            logArgs.push('Additional Data:', entry.additionalData);
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
     * Convert technical error to user-friendly message
     */
    static getUserFriendlyError(error: Error | string, context?: string): UserFriendlyError {
        const errorMessage = typeof error === 'string' ? error : error.message;
        const errorName = typeof error === 'string' ? 'Error' : error.name;

        // Map common errors to user-friendly messages
        const errorMappings: Record<string, UserFriendlyError> = {
            'NetworkError': {
                title: 'Connection Problem',
                message: 'Unable to connect to the server. Please check your internet connection and try again.',
                action: 'Retry',
                type: 'error'
            },

            'ValidationError': {
                title: 'Invalid Data',
                message: 'The information provided is not valid. Please check your input and try again.',
                action: 'Fix Input',
                type: 'error'
            },
            'QuotaExceededError': {
                title: 'Storage Full',
                message: 'Your device storage is full. Please free up some space or export your data.',
                action: 'Export Data',
                type: 'warning'
            },
            'TypeError': {
                title: 'Unexpected Error',
                message: 'Something unexpected happened. Please try refreshing the page.',
                action: 'Refresh',
                type: 'error'
            }
        };

        // Check for specific error patterns
        if (errorMessage.includes('fetch')) {
            return errorMappings['NetworkError'];
        }

        if (errorMessage.includes('validation') || errorMessage.includes('invalid')) {
            return errorMappings['ValidationError'];
        }

        if (errorMessage.includes('quota') || errorMessage.includes('storage')) {
            return errorMappings['QuotaExceededError'];
        }

        // Check by error name
        if (errorMappings[errorName]) {
            return errorMappings[errorName];
        }

        // Default fallback
        return {
            title: 'Something Went Wrong',
            message: this.isDevelopment
                ? `${errorMessage}${context ? ` (${context})` : ''}`
                : 'An unexpected error occurred. Please try again or contact support if the problem persists.',
            action: 'Try Again',
            type: 'error'
        };
    }

    /**
     * Log and return user-friendly error
     */
    static logAndGetUserError(error: Error | string, context?: string): UserFriendlyError {
        // Log the technical error
        if (typeof error === 'string') {
            this.error(error, undefined, context);
        } else {
            this.error(error.message, error, context);
        }

        // Return user-friendly version
        return this.getUserFriendlyError(error, context);
    }

    /**
     * Generate unique ID for log entries
     */
    private static generateId(): string {
        return Date.now().toString(36) + Math.random().toString(36).substring(2);
    }
}