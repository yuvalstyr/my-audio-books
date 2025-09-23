/**
 * Import/Export service for JSON backup and restore functionality
 * Handles exporting wishlist data to JSON files and importing from JSON files with validation
 */

import type { WishlistData, Book } from '$lib/types/book';
import { apiClient } from './api-client';
import { ErrorLogger } from './error-logger';

export interface ImportResult {
    success: boolean;
    data?: WishlistData;
    error?: string;
    warnings?: string[];
}

export interface ExportResult {
    success: boolean;
    error?: string;
}

export class ImportExportService {
    /**
     * Export current wishlist data to a JSON file
     */
    static async exportToJSON(): Promise<ExportResult> {
        try {
            // Load current data from database via API
            const books = await apiClient.getBooks();

            const data: WishlistData = {
                books,
                lastUpdated: new Date().toISOString()
            };

            // Create formatted JSON string
            const jsonString = JSON.stringify(data, null, 2);

            // Create blob and download
            const blob = new Blob([jsonString], { type: 'application/json' });
            const url = URL.createObjectURL(blob);

            // Create download link
            const link = document.createElement('a');
            link.href = url;
            link.download = `audiobook-wishlist-${new Date().toISOString().split('T')[0]}.json`;

            // Trigger download
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);

            // Clean up
            URL.revokeObjectURL(url);

            return {
                success: true
            };
        } catch (error) {
            ErrorLogger.error('Export failed', error instanceof Error ? error : undefined, 'ImportExportService.exportToJSON');
            return {
                success: false,
                error: error instanceof Error ? error.message : 'Unknown error during export'
            };
        }
    }

    /**
     * Import wishlist data from a JSON file
     */
    static async importFromJSON(file: File): Promise<ImportResult> {
        try {
            // Validate file type
            if (!file.type.includes('json') && !file.name.endsWith('.json')) {
                return {
                    success: false,
                    error: 'Please select a valid JSON file'
                };
            }

            // Check file size (limit to 10MB)
            const maxSize = 10 * 1024 * 1024; // 10MB
            if (file.size > maxSize) {
                return {
                    success: false,
                    error: 'File is too large. Maximum size is 10MB'
                };
            }

            // Read file content
            const fileContent = await this.readFileAsText(file);

            // Parse and validate JSON
            const validationResult = this.validateImportData(fileContent);
            if (!validationResult.success) {
                return validationResult;
            }

            return {
                success: true,
                data: validationResult.data,
                warnings: validationResult.warnings
            };
        } catch (error) {
            ErrorLogger.error('Import failed', error instanceof Error ? error : undefined, 'ImportExportService.importFromJSON');
            return {
                success: false,
                error: error instanceof Error ? error.message : 'Unknown error during import'
            };
        }
    }

    /**
     * Read file content as text
     */
    private static readFileAsText(file: File): Promise<string> {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();

            reader.onload = (event) => {
                const result = event.target?.result;
                if (typeof result === 'string') {
                    resolve(result);
                } else {
                    reject(new Error('Failed to read file as text'));
                }
            };

            reader.onerror = () => {
                reject(new Error('Failed to read file'));
            };

            reader.readAsText(file);
        });
    }

    /**
     * Validate imported JSON data
     */
    private static validateImportData(jsonString: string): ImportResult {
        const warnings: string[] = [];

        try {
            // Parse JSON
            const parsed = JSON.parse(jsonString);

            // Check if it's an object
            if (!parsed || typeof parsed !== 'object') {
                return {
                    success: false,
                    error: 'Invalid JSON format: root must be an object'
                };
            }

            // Check for required fields
            if (!parsed.hasOwnProperty('books')) {
                return {
                    success: false,
                    error: 'Invalid format: missing "books" field'
                };
            }

            if (!Array.isArray(parsed.books)) {
                return {
                    success: false,
                    error: 'Invalid format: "books" must be an array'
                };
            }

            // Validate and clean books array
            const validBooks: Book[] = [];
            const invalidBooks: any[] = [];

            for (let i = 0; i < parsed.books.length; i++) {
                const book = parsed.books[i];
                const bookValidation = this.validateBook(book, i);

                if (bookValidation.isValid && bookValidation.book) {
                    validBooks.push(bookValidation.book);
                } else {
                    invalidBooks.push({ index: i, book, errors: bookValidation.errors });
                    warnings.push(`Book at index ${i} is invalid: ${bookValidation.errors.join(', ')}`);
                }
            }

            // If no valid books found
            if (validBooks.length === 0 && parsed.books.length > 0) {
                return {
                    success: false,
                    error: 'No valid books found in the import file'
                };
            }

            // Add warnings for invalid books
            if (invalidBooks.length > 0) {
                warnings.push(`${invalidBooks.length} invalid books were skipped during import`);
            }

            // Create valid wishlist data
            const wishlistData: WishlistData = {
                books: validBooks,
                lastUpdated: parsed.lastUpdated || new Date().toISOString()
            };

            return {
                success: true,
                data: wishlistData,
                warnings: warnings.length > 0 ? warnings : undefined
            };

        } catch (error) {
            if (error instanceof SyntaxError) {
                return {
                    success: false,
                    error: 'Invalid JSON format: ' + error.message
                };
            }

            return {
                success: false,
                error: error instanceof Error ? error.message : 'Unknown validation error'
            };
        }
    }

    /**
     * Validate individual book object
     */
    private static validateBook(book: any, index: number): {
        isValid: boolean;
        book?: Book;
        errors: string[]
    } {
        const errors: string[] = [];

        // Check required fields
        if (!book || typeof book !== 'object') {
            return { isValid: false, errors: ['Book must be an object'] };
        }

        if (!book.id || typeof book.id !== 'string') {
            errors.push('Missing or invalid id');
        }

        if (!book.title || typeof book.title !== 'string') {
            errors.push('Missing or invalid title');
        }

        if (!book.author || typeof book.author !== 'string') {
            errors.push('Missing or invalid author');
        }

        // Validate optional fields

        if (book.narratorRating && (typeof book.narratorRating !== 'number' || book.narratorRating < 0 || book.narratorRating > 5)) {
            errors.push('Invalid narratorRating (must be number between 0-5)');
        }

        if (book.performanceRating && (typeof book.performanceRating !== 'number' || book.performanceRating < 0 || book.performanceRating > 5)) {
            errors.push('Invalid performanceRating (must be number between 0-5)');
        }

        if (book.description && typeof book.description !== 'string') {
            errors.push('Invalid description');
        }

        if (book.coverImageUrl && typeof book.coverImageUrl !== 'string') {
            errors.push('Invalid coverImageUrl');
        }

        if (book.highlyRatedFor && typeof book.highlyRatedFor !== 'string') {
            errors.push('Invalid highlyRatedFor');
        }

        // Validate tags array
        if (!Array.isArray(book.tags)) {
            errors.push('Missing or invalid tags array');
        } else {
            for (let i = 0; i < book.tags.length; i++) {
                const tag = book.tags[i];
                if (!tag || typeof tag !== 'object' || !tag.id || !tag.name || !tag.color) {
                    errors.push(`Invalid tag at index ${i}`);
                }
            }
        }

        // Validate dateAdded
        if (!book.dateAdded) {
            errors.push('Missing dateAdded');
        } else {
            const date = new Date(book.dateAdded);
            if (isNaN(date.getTime())) {
                errors.push('Invalid dateAdded format');
            }
        }

        // If there are errors, return invalid
        if (errors.length > 0) {
            return { isValid: false, errors };
        }

        // Create valid book object
        const validBook: Book = {
            id: book.id,
            title: book.title,
            author: book.author,
            tags: book.tags,
            narratorRating: book.narratorRating,
            performanceRating: book.performanceRating,
            dateAdded: new Date(book.dateAdded),
            queuePosition: book.queuePosition,
            coverImageUrl: book.coverImageUrl,
            description: book.description,
            highlyRatedFor: book.highlyRatedFor
        };

        return { isValid: true, book: validBook, errors: [] };
    }

    /**
     * Merge imported data with existing data
     */
    static async mergeImportedData(
        importedData: WishlistData,
        strategy: 'replace' | 'merge' | 'skip-duplicates' = 'replace'
    ): Promise<ImportResult> {
        try {
            if (strategy === 'replace') {
                // Delete all existing books and create new ones
                const existingBooks = await apiClient.getBooks();
                for (const book of existingBooks) {
                    await apiClient.deleteBook(book.id);
                }

                // Create imported books
                const createdBooks: Book[] = [];
                for (const book of importedData.books) {
                    const created = await apiClient.createBook({
                        title: book.title,
                        author: book.author,
                        tags: book.tags,
                        narratorRating: book.narratorRating,
                        performanceRating: book.performanceRating,
                        queuePosition: book.queuePosition,
                        coverImageUrl: book.coverImageUrl,
                        description: book.description,
                        highlyRatedFor: book.highlyRatedFor
                    });
                    createdBooks.push(created);
                }

                return {
                    success: true,
                    data: { books: createdBooks, lastUpdated: new Date().toISOString() }
                };
            }

            // For merge strategies, load existing data
            const existingBooks = await apiClient.getBooks();
            const warnings: string[] = [];
            let mergedBooks: Book[] = [...existingBooks];

            if (strategy === 'merge') {
                // Add all imported books, replacing duplicates by ID

            // Update or create books based on strategy
            if (strategy === 'merge') {
                for (const importedBook of importedData.books) {
                    const existingIndex = mergedBooks.findIndex(book => book.id === importedBook.id);
                    if (existingIndex >= 0) {
                        // Update existing book
                        await apiClient.updateBook(importedBook.id, {
                            id: importedBook.id,
                            title: importedBook.title,
                            author: importedBook.author,
                            tags: importedBook.tags,
                            narratorRating: importedBook.narratorRating,
                            performanceRating: importedBook.performanceRating,
                            queuePosition: importedBook.queuePosition,
                            coverImageUrl: importedBook.coverImageUrl,
                            description: importedBook.description,
                            highlyRatedFor: importedBook.highlyRatedFor
                        });
                    } else {
                        // Create new book
                        await apiClient.createBook({
                            title: importedBook.title,
                            author: importedBook.author,
                            tags: importedBook.tags,
                            narratorRating: importedBook.narratorRating,
                            performanceRating: importedBook.performanceRating,
                            queuePosition: importedBook.queuePosition,
                            coverImageUrl: importedBook.coverImageUrl,
                            description: importedBook.description,
                            highlyRatedFor: importedBook.highlyRatedFor
                        });
                    }
                }
            } else if (strategy === 'skip-duplicates') {
                for (const importedBook of importedData.books) {
                    const exists = mergedBooks.some(book => book.id === importedBook.id);
                    if (!exists) {
                        await apiClient.createBook({
                            title: importedBook.title,
                            author: importedBook.author,
                            tags: importedBook.tags,
                            narratorRating: importedBook.narratorRating,
                            performanceRating: importedBook.performanceRating,
                            queuePosition: importedBook.queuePosition,
                            coverImageUrl: importedBook.coverImageUrl,
                            description: importedBook.description,
                            highlyRatedFor: importedBook.highlyRatedFor
                        });
                    } else {
                        warnings.push(`Skipped duplicate book: ${importedBook.title}`);
                    }
                }
            }

            // Get updated book list
            const finalBooks = await apiClient.getBooks();
            const mergedData: WishlistData = {
                books: finalBooks,
                lastUpdated: new Date().toISOString()
            };

            return {
                success: true,
                data: mergedData,
                warnings: warnings.length > 0 ? warnings : undefined
            };

        } catch (error) {
            ErrorLogger.error('Merge failed', error instanceof Error ? error : undefined, 'ImportExportService.mergeImportedData');
            return {
                success: false,
                error: error instanceof Error ? error.message : 'Unknown error during merge'
            };
        }
    }

    /**
     * Get import/export statistics
     */
    static async getExportStats(): Promise<{ bookCount: number; dataSize: string; lastUpdated?: string }> {
        try {
            const books = await apiClient.getBooks();
            const data: WishlistData = {
                books,
                lastUpdated: new Date().toISOString()
            };

            const jsonString = JSON.stringify(data, null, 2);
            const sizeInBytes = new Blob([jsonString]).size;
            const sizeInKB = (sizeInBytes / 1024).toFixed(1);

            return {
                bookCount: data.books.length,
                dataSize: `${sizeInKB} KB`,
                lastUpdated: data.lastUpdated
            };
        } catch (error) {
            ErrorLogger.error('Failed to get export stats', error instanceof Error ? error : undefined, 'ImportExportService.getExportStats');
            return {
                bookCount: 0,
                dataSize: '0 KB'
            };
        }
    }
}