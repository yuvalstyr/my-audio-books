/**
 * Predefined tag constants and utilities
 */

import type { BookTag } from '../types/book.js';
import { generateTagId } from './id.js';

/**
 * Predefined tag configurations
 */
export const PREDEFINED_TAGS: Record<string, Omit<BookTag, 'id'>> = {
    funny: {
        name: 'funny',
        color: '#fbbf24' // yellow-400
    },
    action: {
        name: 'action',
        color: '#ef4444' // red-500
    },
    series: {
        name: 'series',
        color: '#8b5cf6' // violet-500
    },
    standalone: {
        name: 'standalone',
        color: '#06b6d4' // cyan-500
    },
    thriller: {
        name: 'thriller',
        color: '#dc2626' // red-600
    },
    next: {
        name: 'next',
        color: '#10b981' // emerald-500
    }
};

/**
 * Creates a BookTag from a predefined tag name
 */
export function createPredefinedTag(tagName: keyof typeof PREDEFINED_TAGS): BookTag {
    const config = PREDEFINED_TAGS[tagName];
    if (!config) {
        throw new Error(`Unknown predefined tag: ${tagName}`);
    }

    return {
        id: generateTagId(),
        ...config
    };
}

/**
 * Gets all available predefined tag names
 */
export function getPredefinedTagNames(): string[] {
    return Object.keys(PREDEFINED_TAGS);
}

/**
 * Checks if a tag name is predefined
 */
export function isPredefinedTag(tagName: string): tagName is keyof typeof PREDEFINED_TAGS {
    return tagName in PREDEFINED_TAGS;
}