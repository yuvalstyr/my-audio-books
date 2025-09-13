import { migrate } from 'drizzle-orm/better-sqlite3/migrator';
import { db, sqlite } from './connection.js';

export async function runMigrations() {
    try {
        console.log('Running database migrations...');
        migrate(db, { migrationsFolder: './drizzle' });
        console.log('Migrations completed successfully');
    } catch (error) {
        console.error('Migration failed:', error);
        throw error;
    }
}

// Auto-run migrations if this file is executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
    runMigrations()
        .then(() => {
            console.log('Database setup complete');
            sqlite.close();
            process.exit(0);
        })
        .catch((error) => {
            console.error('Database setup failed:', error);
            sqlite.close();
            process.exit(1);
        });
}