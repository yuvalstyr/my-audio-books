import { expect } from 'vitest';
import * as jestDOM from '@testing-library/jest-dom/matchers';
import { vi } from 'vitest';

expect.extend(jestDOM);

// Mock global fetch for tests
global.fetch = vi.fn();

// Mock setTimeout to return a number (Node.js behavior) instead of Timeout object
global.setTimeout = vi.fn((callback, delay) => {
    return callback();
}) as any;

// Mock console.error to avoid noise in tests
global.console.error = vi.fn();

// Mock window.location for tests
Object.defineProperty(window, 'location', {
    value: {
        href: 'http://localhost:3000',
        origin: 'http://localhost:3000',
        pathname: '/',
        search: '',
        hash: ''
    },
    writable: true
});