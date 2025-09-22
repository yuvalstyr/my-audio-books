/**
 * JSON data validation functions for the Audiobook Wishlist Manager
 */

import type { Book, BookTag, WishlistData, CreateBookInput } from '../types/book.js';

/**
 * Validates if a value is a valid BookTag
 */
export function isValidBookTag(tag: any): tag is BookTag {
    if (!tag || typeof tag !== 'object') return false;

    return (
        typeof tag.id === 'string' &&
        tag.id.length > 0 &&
        typeof tag.name === 'string' &&
        tag.name.trim().length > 0 &&
        typeof tag.color === 'string' &&
        tag.color.length > 0
    );
}

/**
 * Validates if a value is a valid Book object
 */
export function isValidBook(book: any): book is Book {
    if (!book || typeof book !== 'object') return false;

    // Required fields
    if (
        typeof book.id !== 'string' ||
        book.id.length === 0 ||
        typeof book.title !== 'string' ||
        book.title.length === 0 ||
        typeof book.author !== 'string' ||
        book.author.length === 0 ||
        !Array.isArray(book.tags) ||
        !(book.dateAdded instanceof Date || typeof book.dateAdded === 'string')
    ) {
        return false;
    }

    // Validate tags array
    if (!book.tags.every(isValidBookTag)) {
        return false;
    }


    if (book.narratorRating !== undefined &&
        (typeof book.narratorRating !== 'number' || book.narratorRating < 0 || book.narratorRating > 5)) {
        return false;
    }

    if (book.queuePosition !== undefined &&
        (typeof book.queuePosition !== 'number' || book.queuePosition < 0)) {
        return false;
    }

    if (book.coverImageUrl !== undefined && typeof book.coverImageUrl !== 'string') {
        return false;
    }

    if (book.description !== undefined && typeof book.description !== 'string') {
        return false;
    }

    return true;
}

/**
 * Validates if a value is valid WishlistData
 */
export function isValidWishlistData(data: any): data is WishlistData {
    if (!data || typeof data !== 'object') return false;

    if (!Array.isArray(data.books)) return false;

    // Validate each book in the array
    if (!data.books.every(isValidBook)) return false;

    if (typeof data.lastUpdated !== 'string') return false;

    // Validate lastUpdated is a valid ISO date string
    const date = new Date(data.lastUpdated);
    if (isNaN(date.getTime())) return false;

    return true;
}

/**
 * Validates CreateTagInput for adding new tags
 */
export function isValidCreateTagInput(input: any): boolean {
    if (!input || typeof input !== 'object') return false;

    // Required fields
    if (
        typeof input.name !== 'string' ||
        input.name.trim().length === 0 ||
        typeof input.color !== 'string' ||
        input.color.trim().length === 0
    ) {
        return false;
    }

    // Optional ID field
    if (input.id !== undefined && (typeof input.id !== 'string' || input.id.length === 0)) {
        return false;
    }

    return true;
}

/**
 * Validates CreateBookInput for adding new books
 */
export function isValidCreateBookInput(input: any): input is CreateBookInput {
    if (!input || typeof input !== 'object') {
        console.error('Validation failed: input is not an object', input);
        return false;
    }

    // Required fields
    if (
        typeof input.title !== 'string' ||
        input.title.trim().length === 0 ||
        typeof input.author !== 'string' ||
        input.author.trim().length === 0
    ) {
        console.error('Validation failed: title or author invalid', { title: input.title, author: input.author });
        return false;
    }


    if (input.tags !== undefined && input.tags !== null) {
        if (!Array.isArray(input.tags)) {
            console.error('Validation failed: tags is not an array', input.tags);
            return false;
        }
        // Allow empty tags array, but validate non-empty arrays
        if (input.tags.length > 0 && !input.tags.every(isValidBookTag)) {
            console.error('Validation failed: invalid tags', input.tags);
            return false;
        }
    }

    // Rating validation - allow null, undefined, or valid numbers
    if (input.narratorRating !== undefined && input.narratorRating !== null &&
        (typeof input.narratorRating !== 'number' || isNaN(input.narratorRating) || input.narratorRating < 0 || input.narratorRating > 5)) {
        console.error('Validation failed: narratorRating invalid', input.narratorRating, typeof input.narratorRating);
        return false;
    }

    if (input.performanceRating !== undefined && input.performanceRating !== null &&
        (typeof input.performanceRating !== 'number' || isNaN(input.performanceRating) || input.performanceRating < 0 || input.performanceRating > 5)) {
        console.error('Validation failed: performanceRating invalid', input.performanceRating, typeof input.performanceRating);
        return false;
    }

    if (input.queuePosition !== undefined && input.queuePosition !== null &&
        (typeof input.queuePosition !== 'number' || isNaN(input.queuePosition) || input.queuePosition < 0)) {
        console.error('Validation failed: queuePosition invalid', input.queuePosition);
        return false;
    }

    if (input.coverImageUrl !== undefined && input.coverImageUrl !== null && typeof input.coverImageUrl !== 'string') {
        console.error('Validation failed: coverImageUrl invalid', input.coverImageUrl);
        return false;
    }

    if (input.description !== undefined && input.description !== null && typeof input.description !== 'string') {
        console.error('Validation failed: description invalid', input.description);
        return false;
    }

    console.log('Validation passed for CreateBookInput:', input);
    return true;
}

/**
 * Validates UpdateBookInput for updating existing books (partial validation)
 */
export function isValidUpdateBookInput(input: any): boolean {
    if (!input || typeof input !== 'object') return false;

    // All fields are optional for updates, but if provided they must be valid
    if (input.title !== undefined) {
        if (typeof input.title !== 'string' || input.title.trim().length === 0) {
            return false;
        }
    }

    if (input.author !== undefined) {
        if (typeof input.author !== 'string' || input.author.trim().length === 0) {
            return false;
        }
    }


    if (input.tags !== undefined && input.tags !== null) {
        if (!Array.isArray(input.tags)) {
            return false;
        }
        // Allow empty tags array, but validate non-empty arrays
        if (input.tags.length > 0 && !input.tags.every(isValidBookTag)) {
            return false;
        }
    }

    if (input.narratorRating !== undefined && input.narratorRating !== null &&
        (typeof input.narratorRating !== 'number' || isNaN(input.narratorRating) || input.narratorRating < 0 || input.narratorRating > 5)) {
        return false;
    }

    if (input.performanceRating !== undefined && input.performanceRating !== null &&
        (typeof input.performanceRating !== 'number' || isNaN(input.performanceRating) || input.performanceRating < 0 || input.performanceRating > 5)) {
        return false;
    }

    if (input.queuePosition !== undefined && input.queuePosition !== null &&
        (typeof input.queuePosition !== 'number' || isNaN(input.queuePosition) || input.queuePosition < 0)) {
        return false;
    }

    if (input.coverImageUrl !== undefined && input.coverImageUrl !== null && typeof input.coverImageUrl !== 'string') {
        return false;
    }

    if (input.description !== undefined && input.description !== null && typeof input.description !== 'string') {
        return false;
    }

    return true;
}

/**
 * Validates and sanitizes JSON data from import
 * @param jsonString - Raw JSON string to validate
 * @returns Parsed and validated WishlistData or throws error
 */
export function validateAndParseWishlistJson(jsonString: string): WishlistData {
    let parsed: any;

    try {
        parsed = JSON.parse(jsonString);
    } catch (error) {
        throw new Error('Invalid JSON format');
    }

    // Convert date strings to Date objects for books
    if (parsed.books && Array.isArray(parsed.books)) {
        parsed.books = parsed.books.map((book: any) => ({
            ...book,
            dateAdded: typeof book.dateAdded === 'string' ? new Date(book.dateAdded) : book.dateAdded
        }));
    }

    if (!isValidWishlistData(parsed)) {
        throw new Error('Invalid wishlist data format');
    }

    return parsed;
}

/**
 * Sanitizes a book object for JSON serialization
 */
export function sanitizeBookForJson(book: Book): any {
    return {
        ...book,
        dateAdded: book.dateAdded instanceof Date ? book.dateAdded.toISOString() : book.dateAdded
    };
}

