import { defineConfig } from 'drizzle-kit';

// Get database path based on environment - must match the unified path logic
function getDbPath() {
    // Check for explicit DATABASE_PATH first (highest priority)
    if (process.env.DATABASE_PATH) {
        console.log(`🔧 Drizzle using DATABASE_PATH: ${process.env.DATABASE_PATH}`);
        return process.env.DATABASE_PATH;
    }

    // Check for Railway volume path
    if (process.env.RAILWAY_VOLUME_MOUNT_PATH) {
        // Handle case where RAILWAY_VOLUME_MOUNT_PATH might be the full file path
        const railwayPath = process.env.RAILWAY_VOLUME_MOUNT_PATH.endsWith('.db')
            ? process.env.RAILWAY_VOLUME_MOUNT_PATH
            : `${process.env.RAILWAY_VOLUME_MOUNT_PATH}/audiobook-wishlist.db`;
        console.log(`🔧 Drizzle using Railway volume path: ${railwayPath}`);
        return railwayPath;
    }

    // Default to dev mode
    const isDev = process.env.NODE_ENV !== 'production';
    const defaultPath = isDev ? './dev.db' : './prod.db';
    console.log(`🔧 Drizzle using default path: ${defaultPath} (NODE_ENV: ${process.env.NODE_ENV || 'undefined'})`);
    return defaultPath;
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