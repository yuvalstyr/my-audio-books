import { defineConfig } from 'drizzle-kit';

// Get database path based on environment
function getDbPath() {
    // Check for Railway volume path first
    if (process.env.RAILWAY_VOLUME_MOUNT_PATH) {
        return `${process.env.RAILWAY_VOLUME_MOUNT_PATH}/audiobook-wishlist.db`;
    }

    // Check for custom database path
    if (process.env.DATABASE_PATH) {
        return process.env.DATABASE_PATH;
    }

    // Default to dev mode
    const isDev = process.env.NODE_ENV !== 'production';
    return isDev ? './dev.db' : './prod.db';
}

export default defineConfig({
    schema: './src/lib/server/db/schema.ts',
    out: './drizzle',
    dialect: 'sqlite',
    dbCredentials: {
        url: getDbPath(),
    },
    verbose: true,
    strict: true,
});