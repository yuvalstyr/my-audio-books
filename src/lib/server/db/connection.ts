import { drizzle } from 'drizzle-orm/better-sqlite3';
import Database from 'better-sqlite3';
import * as schema from './schema.js';
import dbPath from './path.js';

// Simple SQLite database connection
const sqlite = new Database(dbPath, {
    fileMustExist: false,
    timeout: 5000
});

// Basic SQLite optimizations
sqlite.pragma('journal_mode = WAL');
sqlite.pragma('synchronous = NORMAL');

// Simple Drizzle instance
export const db = drizzle(sqlite, { schema });

// Export the raw sqlite instance for migrations
export { sqlite };

// Simple database health check
export function getDatabaseHealth() {
    try {
        sqlite.prepare('SELECT 1').get();
        return { isHealthy: true };
    } catch (error) {
        return {
            isHealthy: false,
            error: (error as Error).message
        };
    }
}

// Simple shutdown handler
export function closeDatabaseConnection() {
    try {
        sqlite.close();
        console.log('Database connection closed');
    } catch (error) {
        console.error('Error closing database:', error);
    }
}

// Handle Ctrl+C gracefully
process.on('SIGINT', () => {
    console.log('Shutting down...');
    closeDatabaseConnection();
    process.exit(0);
});