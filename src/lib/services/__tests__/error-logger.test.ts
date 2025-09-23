/**
 * Tests for ErrorLogger service
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { ErrorLogger } from '../error-logger';

// Mock console methods
const consoleMock = {
    error: vi.fn(),
    warn: vi.fn(),
    info: vi.fn(),
    debug: vi.fn(),
};

Object.defineProperty(console, 'error', { value: consoleMock.error });
Object.defineProperty(console, 'warn', { value: consoleMock.warn });
Object.defineProperty(console, 'info', { value: consoleMock.info });
Object.defineProperty(console, 'debug', { value: consoleMock.debug });

describe('ErrorLogger', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    describe('logging methods', () => {
        it('should log error messages', () => {
            ErrorLogger.error('Test error message');

            expect(consoleMock.error).toHaveBeenCalled();
            const args = consoleMock.error.mock.calls[0];
            expect(args[0]).toContain('[ERROR]');
            expect(args[0]).toContain('Test error message');
        });

        it('should log warning messages', () => {
            ErrorLogger.warn('Test warning message');

            expect(consoleMock.warn).toHaveBeenCalled();
            const args = consoleMock.warn.mock.calls[0];
            expect(args[0]).toContain('[WARN]');
            expect(args[0]).toContain('Test warning message');
        });

        it('should log info messages', () => {
            ErrorLogger.info('Test info message');

            expect(consoleMock.info).toHaveBeenCalled();
            const args = consoleMock.info.mock.calls[0];
            expect(args[0]).toContain('[INFO]');
            expect(args[0]).toContain('Test info message');
        });

        it('should log debug messages in development', () => {
            // Note: debug only logs in development mode
            ErrorLogger.debug('Test debug message');

            expect(consoleMock.debug).toHaveBeenCalled();
            const args = consoleMock.debug.mock.calls[0];
            expect(args[0]).toContain('[DEBUG]');
            expect(args[0]).toContain('Test debug message');
        });

        it('should include context in log messages', () => {
            ErrorLogger.error('Test error', undefined, 'TestContext');

            expect(consoleMock.error).toHaveBeenCalled();
            const args = consoleMock.error.mock.calls[0];
            expect(args[0]).toContain('(TestContext)');
        });

        it('should include error objects', () => {
            const testError = new Error('Test error object');
            ErrorLogger.error('Test message', testError);

            expect(consoleMock.error).toHaveBeenCalled();
            const args = consoleMock.error.mock.calls;
            expect(args[0]).toHaveLength(2); // message and error string
            expect(args[0][1]).toContain('Test error object');
        });

        it('should include additional data', () => {
            const additionalData = { key: 'value', number: 42 };
            ErrorLogger.error('Test message', undefined, undefined, additionalData);

            expect(consoleMock.error).toHaveBeenCalled();
            const args = consoleMock.error.mock.calls[0];
            expect(args).toContain('Additional Data:');
            expect(args).toContain(additionalData);
        });
    });

    describe('getUserFriendlyError', () => {
        it('should return user-friendly error for network errors', () => {
            const result = ErrorLogger.getUserFriendlyError('Failed to fetch data');

            expect(result.title).toBe('Connection Problem');
            expect(result.type).toBe('error');
        });

        it('should return user-friendly error for validation errors', () => {
            const result = ErrorLogger.getUserFriendlyError('Validation failed for input');

            expect(result.title).toBe('Invalid Data');
            expect(result.type).toBe('error');
        });

        it('should return user-friendly error for quota errors', () => {
            const result = ErrorLogger.getUserFriendlyError('Quota exceeded');

            expect(result.title).toBe('Storage Full');
            expect(result.type).toBe('warning');
        });

        it('should return default error for unknown errors', () => {
            const result = ErrorLogger.getUserFriendlyError('Some random error');

            expect(result.title).toBe('Something Went Wrong');
            expect(result.type).toBe('error');
        });

        it('should handle Error objects', () => {
            const error = new TypeError('Type error occurred');
            const result = ErrorLogger.getUserFriendlyError(error);

            expect(result.title).toBe('Unexpected Error');
            expect(result.type).toBe('error');
        });
    });

    describe('logAndGetUserError', () => {
        it('should log technical error and return user-friendly version', () => {
            const result = ErrorLogger.logAndGetUserError('Failed to fetch', 'API');

            expect(consoleMock.error).toHaveBeenCalled();
            expect(result.title).toBe('Connection Problem');
            expect(result.type).toBe('error');
        });

        it('should handle Error objects', () => {
            const error = new Error('Technical error');
            const result = ErrorLogger.logAndGetUserError(error, 'Component');

            expect(consoleMock.error).toHaveBeenCalled();
            expect(result.title).toBe('Something Went Wrong');
        });
    });

});