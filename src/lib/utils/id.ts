/**
 * Utility functions for generating unique IDs
 */

/**
 * Generates a unique ID using timestamp and random string
 * Format: timestamp-randomString (e.g., "1694520000000-abc123")
 */
export function generateId(): string {
    const timestamp = Date.now();
    const randomString = Math.random().toString(36).substring(2, 8);
    return `${timestamp}-${randomString}`;
}

/**
 * Generates a shorter unique ID for tags
 * Format: randomString (e.g., "abc123")
 */
export function generateTagId(): string {
    return Math.random().toString(36).substring(2, 8);
}

/**
 * Validates if a string is a valid ID format
 * @param id - The ID to validate
 * @returns true if the ID matches the expected format
 */
export function isValidId(id: string): boolean {
    // Check for timestamp-randomString format
    const timestampPattern = /^\d{13}-[a-z0-9]{6}$/;
    // Check for simple randomString format (for tags)
    const simplePattern = /^[a-z0-9]{6}$/;

    return timestampPattern.test(id) || simplePattern.test(id);
}

/**
 * Extracts timestamp from an ID if it contains one
 * @param id - The ID to extract timestamp from
 * @returns Date object or null if no timestamp found
 */
export function getTimestampFromId(id: string): Date | null {
    const match = id.match(/^(\d{13})-/);
    if (match) {
        return new Date(parseInt(match[1]));
    }
    return null;
}