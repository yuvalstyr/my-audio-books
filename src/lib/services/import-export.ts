/**
 * Import/Export service for JSON backup and restore functionality
 * Handles exporting wishlist data to JSON files and importing from JSON files with validation
 */

import type { WishlistData, Book } from '$lib/types/book';
import { apiClient } from './api-client';
import { ErrorLogger } from './error-logger';
import { generateId } from '$lib/utils/id';
import { ServerLogger } from '$lib/server/utils/logger';

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

          ServerLogger.info(`trying to created book: ${book.title}`, 'API_BOOKS_POST', "debug", {
            bookId: book.id,
            strotyRating: book.storyRating,
            preformenceRating: book.performanceRating
          });
          const created = await apiClient.createBook({
            title: book.title,
            author: book.author,
            tags: book.tags,
            performanceRating: book.performanceRating,
            storyRating: book.storyRating,
            queuePosition: book.queuePosition,
            coverImageUrl: book.coverImageUrl,
            audibleUrl: book.audibleUrl,
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

      // Update or create books based on strategy
      if (strategy === 'merge') {
        for (const importedBook of importedData.books) {
          // Find existing book by ID, or by title+author if ID is empty/missing
          let existingBook = null;
          if (importedBook.id && importedBook.id.trim() !== '') {
            existingBook = mergedBooks.find(book => book.id === importedBook.id);
          }

          // If not found by ID, try to match by title and author
          if (!existingBook) {
            existingBook = mergedBooks.find(book =>
              book.title.toLowerCase() === importedBook.title.toLowerCase() &&
              book.author.toLowerCase() === importedBook.author.toLowerCase()
            );
          }

          if (existingBook) {
            // Update existing book using the existing book's ID
            await apiClient.updateBook(existingBook.id, {
              title: importedBook.title,
              author: importedBook.author,
              tags: importedBook.tags,
              performanceRating: importedBook.performanceRating,
              storyRating: importedBook.storyRating,
              queuePosition: importedBook.queuePosition,
              coverImageUrl: importedBook.coverImageUrl,
              audibleUrl: importedBook.audibleUrl,
              description: importedBook.description,
              highlyRatedFor: importedBook.highlyRatedFor
            });
          } else {
            // Create new book
            await apiClient.createBook({
              title: importedBook.title,
              author: importedBook.author,
              tags: importedBook.tags,
              performanceRating: importedBook.performanceRating,
              storyRating: importedBook.storyRating,
              queuePosition: importedBook.queuePosition,
              coverImageUrl: importedBook.coverImageUrl,
              audibleUrl: importedBook.audibleUrl,
              description: importedBook.description,
              highlyRatedFor: importedBook.highlyRatedFor
            });
          }
        }
      } else if (strategy === 'skip-duplicates') {
        for (const importedBook of importedData.books) {
          // Check for existing book by ID or title+author
          let exists = false;
          if (importedBook.id && importedBook.id.trim() !== '') {
            exists = mergedBooks.some(book => book.id === importedBook.id);
          }

          // If not found by ID, check by title and author
          if (!exists) {
            exists = mergedBooks.some(book =>
              book.title.toLowerCase() === importedBook.title.toLowerCase() &&
              book.author.toLowerCase() === importedBook.author.toLowerCase()
            );
          }

          if (!exists) {
            await apiClient.createBook({
              title: importedBook.title,
              author: importedBook.author,
              tags: importedBook.tags,
              performanceRating: importedBook.performanceRating,
              storyRating: importedBook.storyRating,
              queuePosition: importedBook.queuePosition,
              coverImageUrl: importedBook.coverImageUrl,
              audibleUrl: importedBook.audibleUrl,
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
