import { drizzle } from 'drizzle-orm/better-sqlite3';
import Database from 'better-sqlite3';
import * as schema from './schema.js';
import { env } from '$env/dynamic/private';

// Database file path - use different files for dev/prod
function getDbPath() {
    // Check for Railway volume path first
    if (env.RAILWAY_VOLUME_MOUNT_PATH) {
        return `${env.RAILWAY_VOLUME_MOUNT_PATH}/audiobook-wishlist.db`;
    }

    // Check for custom database path
    if (env.DATABASE_PATH) {
        return env.DATABASE_PATH;
    }

    // Default to dev mode
    const isDev = env.NODE_ENV !== 'production';
    return isDev ? 'dev.db' : 'prod.db';
}

const dbPath = getDbPath();

// Performance-optimized SQLite configuration
const sqlite = new Database(dbPath, {
    // Enable verbose logging in development
    verbose: env.NODE_ENV === 'development' ? console.log : undefined,
    // Optimize for performance
    fileMustExist: false,
    timeout: 5000,
    readonly: false
});

// Performance optimizations for SQLite
sqlite.pragma('journal_mode = WAL'); // Write-Ahead Logging for better concurrency
sqlite.pragma('synchronous = NORMAL'); // Balance between safety and performance
sqlite.pragma('cache_size = 1000'); // Increase cache size (1000 pages = ~4MB)
sqlite.pragma('temp_store = MEMORY'); // Store temporary tables in memory
sqlite.pragma('mmap_size = 268435456'); // Enable memory-mapped I/O (256MB)
sqlite.pragma('optimize'); // Optimize database on startup

// Connection pool management for better-sqlite3
class ConnectionManager {
    private static instance: ConnectionManager;
    private connectionCount = 0;
    private maxConnections = 10;
    private activeQueries = new Set<string>();

    static getInstance(): ConnectionManager {
        if (!ConnectionManager.instance) {
            ConnectionManager.instance = new ConnectionManager();
        }
        return ConnectionManager.instance;
    }

    trackQuery(queryId: string): void {
        this.activeQueries.add(queryId);
        this.connectionCount++;
    }

    releaseQuery(queryId: string): void {
        this.activeQueries.delete(queryId);
        this.connectionCount = Math.max(0, this.connectionCount - 1);
    }

    getStats() {
        return {
            activeConnections: this.connectionCount,
            activeQueries: this.activeQueries.size,
            maxConnections: this.maxConnections
        };
    }

    isOverloaded(): boolean {
        return this.connectionCount >= this.maxConnections;
    }
}

export const connectionManager = ConnectionManager.getInstance();

// Create Drizzle instance with schema and performance logging
export const db = drizzle(sqlite, {
    schema,
    logger: env.NODE_ENV === 'development' ? {
        logQuery: (query: string, params: unknown[]) => {
            console.log(`[DB Query] ${query}`, params);
        }
    } : undefined
});

// Export the raw sqlite instance for migrations if needed
export { sqlite };

// Database health monitoring
export function getDatabaseHealth() {
    try {
        const stats = sqlite.prepare('PRAGMA database_list').all();
        const walInfo = sqlite.prepare('PRAGMA wal_checkpoint').get();
        const cacheInfo = sqlite.prepare('PRAGMA cache_size').get();

        return {
            isHealthy: true,
            stats: {
                databases: stats,
                walCheckpoint: walInfo,
                cacheSize: cacheInfo,
                connections: connectionManager.getStats()
            }
        };
    } catch (error) {
        return {
            isHealthy: false,
            error: (error as Error).message
        };
    }
}

// Graceful shutdown handler
export function closeDatabaseConnection() {
    try {
        sqlite.close();
        console.log('Database connection closed gracefully');
    } catch (error) {
        console.error('Error closing database connection:', error);
    }
}

// Handle process termination
process.on('SIGINT', closeDatabaseConnection);
process.on('SIGTERM', closeDatabaseConnection);
process.on('exit', closeDatabaseConnection);