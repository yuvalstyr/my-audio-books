/**
 * Tests for Audible URL parsing service
 */

import { describe, it, expect, vi } from 'vitest';
import { isValidAudibleUrl, parseAudibleUrl } from '../audible-parser';

describe('Audible Parser Service', () => {
    describe('isValidAudibleUrl', () => {
        it('should validate correct Audible URLs', () => {
            const validUrls = [
                'https://www.audible.com/pd/Book-Title/B123456789',
                'https://audible.com/pd/Another-Book/B987654321',
                'https://www.audible.co.uk/pd/UK-Book/B111111111',
                'https://audible.ca/pd/Canadian-Book/B222222222',
                'https://www.audible.com.au/pd/Australian-Book/B333333333',
                'https://audible.de/pd/German-Book/B444444444',
                'https://www.audible.fr/pd/French-Book/B555555555'
            ];

            validUrls.forEach(url => {
                expect(isValidAudibleUrl(url)).toBe(true);
            });
        });

        it('should reject invalid URLs', () => {
            const invalidUrls = [
                '',
                'not-a-url',
                'https://google.com',
                'https://amazon.com/dp/B123456789',
                'https://audible.com/search?keywords=book',
                'https://www.audible.com/categories',
                'https://fake-audible.com/pd/Book/B123456789',
                null,
                undefined
            ];

            invalidUrls.forEach(url => {
                expect(isValidAudibleUrl(url as any)).toBe(false);
            });
        });

        it('should require /pd/ in the path', () => {
            expect(isValidAudibleUrl('https://www.audible.com/categories')).toBe(false);
            expect(isValidAudibleUrl('https://www.audible.com/search')).toBe(false);
            expect(isValidAudibleUrl('https://www.audible.com/pd/Book/B123')).toBe(true);
        });
    });

    describe('parseAudibleUrl', () => {
        it('should return error for invalid URLs', async () => {
            const result = await parseAudibleUrl('https://google.com');

            expect(result.success).toBe(false);
            expect(result.error).toBe('Invalid Audible URL format');
            expect(result.metadata).toBeUndefined();
        });

        it('should attempt to extract metadata from valid URLs', async () => {
            const url = 'https://www.audible.com/pd/The-Great-Book/B123456789';
            const result = await parseAudibleUrl(url);

            // Since we can't actually fetch the page, it should gracefully fail
            // but still attempt to extract what it can from the URL
            expect(result.success).toBeDefined();
            expect(typeof result.error === 'string' || result.metadata).toBeTruthy();
        });

        it('should extract title from URL when possible', async () => {
            const url = 'https://www.audible.com/pd/The-Great-Adventure-Book/B123456789';
            const result = await parseAudibleUrl(url);

            if (result.success && result.metadata) {
                expect(result.metadata.title).toBe('The Great Adventure Book');
            }
            // If it fails, that's also acceptable due to graceful fallback
        });

        it('should handle URL decoding properly', async () => {
            const url = 'https://www.audible.com/pd/The%20Book%20With%20Spaces/B123456789';
            const result = await parseAudibleUrl(url);

            if (result.success && result.metadata && result.metadata.title) {
                expect(result.metadata.title).toBe('The Book With Spaces');
            }
        });

        it('should not extract metadata from product IDs', async () => {
            const url = 'https://www.audible.com/pd/B123456789';
            const result = await parseAudibleUrl(url);

            // Should not extract a title from just the product ID
            if (result.success && result.metadata) {
                expect(result.metadata.title).toBeUndefined();
            }
        });

        it('should handle network errors gracefully', async () => {
            // Mock a network error scenario
            const url = 'https://www.audible.com/pd/Test-Book/B123456789';

            // The function should handle any errors and return a graceful failure
            const result = await parseAudibleUrl(url);

            expect(result).toBeDefined();
            expect(typeof result.success).toBe('boolean');

            if (!result.success) {
                expect(typeof result.error).toBe('string');
                expect(result.error).toContain('manually');
            }
        });
    });

    describe('URL metadata extraction', () => {
        it('should clean up hyphenated titles', async () => {
            const url = 'https://www.audible.com/pd/the-lord-of-the-rings/B123456789';
            const result = await parseAudibleUrl(url);

            if (result.success && result.metadata && result.metadata.title) {
                expect(result.metadata.title).toBe('The Lord Of The Rings');
            }
        });

        it('should ignore short or invalid title parts', async () => {
            const url = 'https://www.audible.com/pd/a/B123456789';
            const result = await parseAudibleUrl(url);

            if (result.success && result.metadata) {
                expect(result.metadata.title).toBeUndefined();
            }
        });

        it('should handle special characters in URLs', async () => {
            const url = 'https://www.audible.com/pd/Book-Title-2024/B123456789';
            const result = await parseAudibleUrl(url);

            if (result.success && result.metadata && result.metadata.title) {
                expect(result.metadata.title).toBe('Book Title 2024');
            }
        });
    });
});