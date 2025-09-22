import { defineConfig } from 'drizzle-kit';

// Simple database path logic - same as railway-init.js
function getDbPath() {
    if (process.env.DATABASE_PATH) {
        console.log(`🔧 Drizzle using explicit DATABASE_PATH: ${process.env.DATABASE_PATH}`);
        return process.env.DATABASE_PATH;
    }

    if (process.env.RAILWAY_VOLUME_MOUNT_PATH) {
        const path = `${process.env.RAILWAY_VOLUME_MOUNT_PATH}/audiobook-wishlist.db`;
        console.log(`🔧 Drizzle using Railway volume: ${path}`);
        return path;
    }

    console.log(`🔧 Drizzle using local development: ./dev.db`);
    return './dev.db';
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