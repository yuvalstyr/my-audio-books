/**
 * Example usage of the API Client Service
 * This file demonstrates how to use the ApiClient for common operations
 */

import {
    apiClient,
    ApiClientError,
    isNetworkError,
    isValidationError,
    getErrorMessage
} from '../api-client.js';
import type { CreateBookRequest, UpdateBookRequest } from '../api-client.js';

/**
 * Example: Fetch and display all books
 */
export async function fetchAllBooksExample() {
    try {
        console.log('Fetching all books...');
        const books = await apiClient.getBooks();

        console.log(`Found ${books.length} books:`);
        books.forEach(book => {
            console.log(`- ${book.title} by ${book.author} (${book.tags.length} tags)`);
        });

        return books;
    } catch (error) {
        console.error('Failed to fetch books:', getErrorMessage(error));
        throw error;
    }
}

/**
 * Example: Create a new book with error handling
 */
export async function createBookExample() {
    const newBook: CreateBookRequest = {
        title: 'The Hobbit',
        author: 'J.R.R. Tolkien',
        audibleUrl: 'https://www.audible.com/pd/The-Hobbit-Audiobook/B0099RKQLY',
        description: 'A classic fantasy adventure',
        narratorRating: 5,
        performanceRating: 5,
        tags: [
            { id: 'fantasy-tag', name: 'Fantasy', color: '#purple' },
            { id: 'classic-tag', name: 'Classic', color: '#gold' }
        ]
    };

    try {
        console.log('Creating new book:', newBook.title);
        const createdBook = await apiClient.createBook(newBook);

        console.log('Book created successfully:', {
            id: createdBook.id,
            title: createdBook.title,
            author: createdBook.author,
            tags: createdBook.tags.map(tag => tag.name)
        });

        return createdBook;
    } catch (error) {
        if (isValidationError(error)) {
            console.error('Validation error:', error.message);
            console.error('Details:', error.details);
        } else if (isNetworkError(error)) {
            console.error('Network error - please check your connection');
        } else {
            console.error('Unexpected error:', getErrorMessage(error));
        }
        throw error;
    }
}

/**
 * Example: Update a book with partial data
 */
export async function updateBookExample(bookId: string) {
    const updates: UpdateBookRequest = {
        narratorRating: 4,
        performanceRating: 4,
        description: 'Updated description with more details'
    };

    try {
        console.log(`Updating book ${bookId}...`);
        const updatedBook = await apiClient.updateBook(bookId, updates);

        console.log('Book updated successfully:', {
            id: updatedBook.id,
            title: updatedBook.title,
            narratorRating: updatedBook.narratorRating,
            performanceRating: updatedBook.performanceRating
        });

        return updatedBook;
    } catch (error) {
        if (error instanceof ApiClientError && error.code === 'BOOK_NOT_FOUND') {
            console.error(`Book with ID ${bookId} not found`);
        } else {
            console.error('Failed to update book:', getErrorMessage(error));
        }
        throw error;
    }
}

/**
 * Example: Delete a book with confirmation
 */
export async function deleteBookExample(bookId: string) {
    try {
        // First, fetch the book to show what we're deleting
        const book = await apiClient.getBook(bookId);
        console.log(`Deleting book: "${book.title}" by ${book.author}`);

        // Delete the book
        const result = await apiClient.deleteBook(bookId);
        console.log(`Book deleted successfully. ID: ${result.id}`);

        return result;
    } catch (error) {
        console.error('Failed to delete book:', getErrorMessage(error));
        throw error;
    }
}

/**
 * Example: Fetch and manage tags
 */
export async function manageTagsExample() {
    try {
        console.log('Fetching all tags...');
        const tags = await apiClient.getTags();

        console.log(`Found ${tags.length} tags:`);
        tags.forEach(tag => {
            console.log(`- ${tag.name} (${tag.color}) - used ${tag.usageCount} times`);
        });

        // Create a new tag if needed
        const newTag = {
            name: 'Science Fiction',
            color: '#blue'
        };

        const existingTag = tags.find(tag => tag.name === newTag.name);
        if (!existingTag) {
            console.log('Creating new tag:', newTag.name);
            const createdTag = await apiClient.createTag(newTag);
            console.log('Tag created:', createdTag);
            return [...tags, createdTag];
        } else {
            console.log('Tag already exists:', existingTag.name);
            return tags;
        }
    } catch (error) {
        console.error('Failed to manage tags:', getErrorMessage(error));
        throw error;
    }
}

/**
 * Example: Health check with retry logic
 */
export async function healthCheckExample() {
    try {
        console.log('Checking API health...');
        const health = await apiClient.healthCheck();

        console.log('API Health Status:', {
            status: health.status,
            timestamp: health.timestamp
        });

        return health.status === 'healthy';
    } catch (error) {
        console.error('Health check failed:', getErrorMessage(error));
        return false;
    }
}

/**
 * Example: Complete workflow - create, update, and manage a book
 */
export async function completeWorkflowExample() {
    try {
        // 1. Check API health
        const isHealthy = await healthCheckExample();
        if (!isHealthy) {
            throw new Error('API is not healthy');
        }

        // 2. Fetch existing books
        const existingBooks = await fetchAllBooksExample();
        console.log(`Starting with ${existingBooks.length} books`);

        // 3. Create a new book
        const newBook = await createBookExample();

        // 4. Update the book
        const updatedBook = await updateBookExample(newBook.id);

        // 5. Manage tags
        await manageTagsExample();

        // 6. Fetch updated book list
        const finalBooks = await fetchAllBooksExample();
        console.log(`Ending with ${finalBooks.length} books`);

        return {
            created: newBook,
            updated: updatedBook,
            totalBooks: finalBooks.length
        };
    } catch (error) {
        console.error('Workflow failed:', getErrorMessage(error));
        throw error;
    }
}

/**
 * Example: Error handling patterns
 */
export async function errorHandlingExample() {
    try {
        // This will likely fail - demonstrating error handling
        await apiClient.getBook('nonexistent-id');
    } catch (error) {
        if (error instanceof ApiClientError) {
            console.log('API Error Details:');
            console.log('- Code:', error.code);
            console.log('- Message:', error.message);
            console.log('- Status Code:', error.statusCode);
            console.log('- Request ID:', error.requestId);
            console.log('- Details:', error.details);

            // Handle specific error types
            switch (error.code) {
                case 'BOOK_NOT_FOUND':
                    console.log('→ Book does not exist');
                    break;
                case 'VALIDATION_ERROR':
                    console.log('→ Invalid input data');
                    break;
                case 'NETWORK_ERROR':
                    console.log('→ Connection problem');
                    break;
                default:
                    console.log('→ Other error type');
            }
        } else {
            console.log('Non-API error:', error);
        }
    }
}