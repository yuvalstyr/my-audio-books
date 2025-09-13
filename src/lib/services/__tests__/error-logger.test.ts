/**
 * Tests for ErrorLogger service
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { ErrorLogger } from '../error-logger';

// Mock localStorage
const localStorageMock = {
    getItem: vi.fn(),
    setItem: vi.fn(),
    removeItem: vi.fn(),
    clear: vi.fn(),
};

Object.defineProperty(window, 'localStorage', {
    value: localStorageMock
});

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
        localStorageMock.getItem.mockReturnValue(null);
    });

    describe('logging methods', () => {
        it('should log error messages', () => {
            const testError = new Error('Test error');
            ErrorLogger.error('Test message', testError, 'TestContext');

            expect(consoleMock.error).toHaveBeenCalled();
            expect(localStorageMock.setItem).toHaveBeenCalled();
        });

        it('should log warning messages', () => {
            ErrorLogger.warn('Test warning', 'TestContext');

            expect(consoleMock.warn).toHaveBeenCalled();
            expect(localStorageMock.setItem).toHaveBeenCalled();
        });

        it('should log info messages', () => {
            ErrorLogger.info('Test info', 'TestContext');

            expect(consoleMock.info).toHaveBeenCalled();
            expect(localStorageMock.setItem).toHaveBeenCalled();
        });

        it('should only log debug messages in development', () => {
            // Mock development environment
            vi.stubEnv('DEV', true);

            ErrorLogger.debug('Test debug', 'TestContext');

            expect(consoleMock.debug).toHaveBeenCalled();
            expect(localStorageMock.setItem).toHaveBeenCalled();
        });
    });

    describe('getUserFriendlyError', () => {
        it('should return user-friendly error for network errors', () => {
            const error = new Error('fetch failed');
            const userError = ErrorLogger.getUserFriendlyError(error);

            expect(userError.title).toBe('Connection Problem');
            expect(userError.type).toBe('error');
        });

        it('should return generic error for API-related errors', () => {
            const error = new Error('API error');
            const userError = ErrorLogger.getUserFriendlyError(error);

            expect(userError.title).toBe('Something Went Wrong');
            expect(userError.type).toBe('error');
        });

        it('should return generic error for unknown errors', () => {
            const error = new Error('Unknown error');
            const userError = ErrorLogger.getUserFriendlyError(error);

            expect(userError.title).toBe('Something Went Wrong');
            expect(userError.type).toBe('error');
        });
    });

    describe('log management', () => {
        it('should retrieve stored logs', () => {
            const mockLogs = JSON.stringify([
                {
                    id: 'test-1',
                    timestamp: new Date().toISOString(),
                    level: 'error',
                    message: 'Test error',
                    context: 'TestContext'
                }
            ]);

            localStorageMock.getItem.mockReturnValue(mockLogs);

            const logs = ErrorLogger.getLogs();
            expect(logs).toHaveLength(1);
            expect(logs[0].message).toBe('Test error');
        });

        it('should clear all logs', () => {
            ErrorLogger.clearLogs();
            expect(localStorageMock.removeItem).toHaveBeenCalledWith('audiobook-error-logs');
        });

        it('should get error statistics', () => {
            const mockLogs = JSON.stringify([
                {
                    id: 'test-1',
                    timestamp: new Date().toISOString(),
                    level: 'error',
                    message: 'Test error'
                },
                {
                    id: 'test-2',
                    timestamp: new Date().toISOString(),
                    level: 'warn',
                    message: 'Test warning'
                }
            ]);

            localStorageMock.getItem.mockReturnValue(mockLogs);

            const stats = ErrorLogger.getErrorStats();
            expect(stats.total).toBe(2);
            expect(stats.byLevel.error).toBe(1);
            expect(stats.byLevel.warn).toBe(1);
        });
    });

    describe('logAndGetUserError', () => {
        it('should log error and return user-friendly version', () => {
            const error = new Error('Test error');
            const userError = ErrorLogger.logAndGetUserError(error, 'TestContext');

            expect(consoleMock.error).toHaveBeenCalled();
            expect(localStorageMock.setItem).toHaveBeenCalled();
            expect(userError.title).toBeDefined();
            expect(userError.message).toBeDefined();
        });
    });
});