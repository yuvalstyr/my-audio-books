/**
 * Test file to verify data models and utilities work correctly
 * This can be run in the browser console or used for manual testing
 */

import {
    generateId,
    generateTagId,
    isValidId,
    createPredefinedTag,
    isValidBook,
    isValidCreateBookInput,
    validateAndParseWishlistJson,
    sanitizeBookForJson
} from '../index.js';
import type { Book, CreateBookInput } from '../types/book.js';

/**
 * Test the ID generation utilities
 */
export function testIdGeneration() {
    console.log('Testing ID generation...');

    const id1 = generateId();
    const id2 = generateId();
    const tagId = generateTagId();

    console.log('Generated IDs:', { id1, id2, tagId });
    console.log('ID validation:', {
        id1Valid: isValidId(id1),
        id2Valid: isValidId(id2),
        tagIdValid: isValidId(tagId),
        invalidIdTest: isValidId('invalid-id')
    });

    return { id1, id2, tagId };
}

/**
 * Test tag creation
 */
export function testTagCreation() {
    console.log('Testing tag creation...');

    const funnyTag = createPredefinedTag('funny');
    const nextTag = createPredefinedTag('next');

    console.log('Created tags:', { funnyTag, nextTag });

    return { funnyTag, nextTag };
}

/**
 * Test book validation
 */
export function testBookValidation() {
    console.log('Testing book validation...');

    const { funnyTag, nextTag } = testTagCreation();

    // Valid book
    const validBook: Book = {
        id: generateId(),
        title: 'Test Audiobook',
        author: 'Test Author',
        tags: [funnyTag, nextTag],
        narratorRating: 4.5,
        dateAdded: new Date(),
        queuePosition: 1,
        description: 'A test book for validation'
    };

    // Invalid book (missing required fields)
    const invalidBook = {
        title: 'Test Book',
        // missing author and other required fields
    };

    console.log('Book validation results:', {
        validBookTest: isValidBook(validBook),
        invalidBookTest: isValidBook(invalidBook)
    });

    return validBook;
}

/**
 * Test CreateBookInput validation
 */
export function testCreateBookInputValidation() {
    console.log('Testing CreateBookInput validation...');

    const validInput: CreateBookInput = {
        title: 'New Book',
        author: 'New Author',
        narratorRating: 4.0
    };

    const invalidInput = {
        title: '', // empty title should be invalid
        author: 'Author'
    };

    console.log('CreateBookInput validation results:', {
        validInputTest: isValidCreateBookInput(validInput),
        invalidInputTest: isValidCreateBookInput(invalidInput)
    });

    return validInput;
}

/**
 * Test JSON serialization and validation
 */
export function testJsonHandling() {
    console.log('Testing JSON handling...');

    const book = testBookValidation();
    const serializedBook = sanitizeBookForJson(book);

    const wishlistData = {
        books: [serializedBook],
        lastUpdated: new Date().toISOString()
    };

    const jsonString = JSON.stringify(wishlistData, null, 2);
    console.log('Serialized JSON:', jsonString);

    try {
        const parsedData = validateAndParseWishlistJson(jsonString);
        console.log('JSON validation successful:', parsedData);
        return parsedData;
    } catch (error) {
        console.error('JSON validation failed:', error);
        return null;
    }
}

/**
 * Run all tests
 */
export function runAllTests() {
    console.log('=== Running Data Models Tests ===');

    testIdGeneration();
    testTagCreation();
    testBookValidation();
    testCreateBookInputValidation();
    testJsonHandling();

    console.log('=== All tests completed ===');
}