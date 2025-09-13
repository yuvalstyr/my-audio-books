/**
 * Performance optimization migration
 * Adds additional indexes and optimizations to existing database
 */

import { sqlite } from './connection.js';
import { ServerLogger } from '../utils/logger.js';

export interface MigrationResult {
    success: boolean;
    operations: string[];
    error?: string;
}

/**
 * Apply performance optimizations to existing database
 */
export function applyPerformanceOptimizations(): MigrationResult {
    const operations: string[] = [];

    try {
        // Start transaction for all optimizations
        sqlite.transaction(() => {
            // Add new indexes if they don't exist
            const indexesToAdd = [
                {
                    name: 'books_updated_at_idx',
                    sql: 'CREATE INDEX IF NOT EXISTS books_updated_at_idx ON books(updated_at)'
                },
                {
                    name: 'books_title_author_idx',
                    sql: 'CREATE INDEX IF NOT EXISTS books_title_author_idx ON books(title, author)'
                },
                {
                    name: 'books_created_at_title_idx',
                    sql: 'CREATE INDEX IF NOT EXISTS books_created_at_title_idx ON books(created_at, title)'
                },
                {
                    name: 'books_rated_idx',
                    sql: 'CREATE INDEX IF NOT EXISTS books_rated_idx ON books(narrator_rating) WHERE narrator_rating IS NOT NULL'
                }
            ];

            for (const index of indexesToAdd) {
                try {
                    sqlite.prepare(index.sql).run();
                    operations.push(`Added index: ${index.name}`);
                } catch (error) {
                    // Index might already exist, log but continue
                    operations.push(`Index ${index.name} already exists or failed: ${(error as Error).message}`);
                }
            }

            // Analyze tables for query optimization
            try {
                sqlite.prepare('ANALYZE books').run();
                operations.push('Analyzed books table');
            } catch (error) {
                operations.push(`Analysis warning: ${(error as Error).message}`);
            }

            try {
                sqlite.prepare('ANALYZE tags').run();
                operations.push('Analyzed tags table');
            } catch (error) {
                operations.push(`Analysis warning: ${(error as Error).message}`);
            }

            try {
                sqlite.prepare('ANALYZE book_tags').run();
                operations.push('Analyzed book_tags table');
            } catch (error) {
                operations.push(`Analysis warning: ${(error as Error).message}`);
            }

            // Update database statistics
            try {
                sqlite.prepare('PRAGMA optimize').run();
                operations.push('Database optimization completed');
            } catch (error) {
                operations.push(`Optimization warning: ${(error as Error).message}`);
            }

            operations.push('Performance optimizations applied successfully');
        })();

        ServerLogger.info('Performance optimizations completed', 'DATABASE_PERFORMANCE', undefined, {
            operationsCount: operations.length
        });

        return { success: true, operations };

    } catch (error) {
        const errorMessage = (error as Error).message;
        ServerLogger.error('Performance optimization failed', error as Error, 'DATABASE_PERFORMANCE');

        return {
            success: false,
            operations,
            error: errorMessage
        };
    }
}

/**
 * Get query performance analysis
 */
export function analyzeQueryPerformance(): {
    success: boolean;
    analysis?: any;
    error?: string;
} {
    try {
        // Get query plan for common queries
        const queries = [
            'SELECT * FROM books ORDER BY created_at DESC LIMIT 10',
            'SELECT * FROM books WHERE title LIKE ? ORDER BY title',
            'SELECT * FROM books WHERE author = ? ORDER BY created_at DESC',
            'SELECT b.*, t.name as tag_name FROM books b LEFT JOIN book_tags bt ON b.id = bt.book_id LEFT JOIN tags t ON bt.tag_id = t.id'
        ];

        const analysis: any = {};

        for (let i = 0; i < queries.length; i++) {
            const query = queries[i];
            try {
                const plan = sqlite.prepare(`EXPLAIN QUERY PLAN ${query}`).all();
                analysis[`query_${i + 1}`] = {
                    sql: query,
                    plan: plan
                };
            } catch (error) {
                analysis[`query_${i + 1}`] = {
                    sql: query,
                    error: (error as Error).message
                };
            }
        }

        // Get index usage statistics
        try {
            const indexList = sqlite.prepare('PRAGMA index_list(books)').all();
            analysis.indexes = indexList;
        } catch (error) {
            analysis.indexError = (error as Error).message;
        }

        return { success: true, analysis };

    } catch (error) {
        return {
            success: false,
            error: (error as Error).message
        };
    }
}

/**
 * Get database size and statistics
 */
export function getDatabaseSizeStats(): {
    success: boolean;
    stats?: any;
    error?: string;
} {
    try {
        const stats: any = {};

        // Get page count and size
        try {
            const pageCount = sqlite.prepare('PRAGMA page_count').get();
            const pageSize = sqlite.prepare('PRAGMA page_size').get();
            stats.pages = pageCount;
            stats.pageSize = pageSize;
            stats.totalSize = (pageCount as any).page_count * (pageSize as any).page_size;
        } catch (error) {
            stats.sizeError = (error as Error).message;
        }

        // Get table sizes
        try {
            const tables = ['books', 'tags', 'book_tags'];
            stats.tableSizes = {};

            for (const table of tables) {
                const count = sqlite.prepare(`SELECT COUNT(*) as count FROM ${table}`).get();
                stats.tableSizes[table] = (count as any).count;
            }
        } catch (error) {
            stats.tableError = (error as Error).message;
        }

        // Get cache statistics
        try {
            const cacheSize = sqlite.prepare('PRAGMA cache_size').get();
            const cacheSpill = sqlite.prepare('PRAGMA cache_spill').get();
            stats.cache = {
                size: cacheSize,
                spill: cacheSpill
            };
        } catch (error) {
            stats.cacheError = (error as Error).message;
        }

        return { success: true, stats };

    } catch (error) {
        return {
            success: false,
            error: (error as Error).message
        };
    }
}