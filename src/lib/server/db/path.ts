/**
 * Unified database path resolution for both application and migrations
 * This ensures the same database file is used everywhere
 */

import { env } from '$env/dynamic/private';

export function getUnifiedDbPath(): string {
    let resolvedPath: string;
    let source: string;

    // Check for Railway volume path first (highest priority)
    if (env.RAILWAY_VOLUME_MOUNT_PATH) {
        resolvedPath = `${env.RAILWAY_VOLUME_MOUNT_PATH}/audiobook-wishlist.db`;
        source = 'RAILWAY_VOLUME_MOUNT_PATH';

        // Validate Railway volume mount path exists
        try {
            const fs = require('fs');

            // Check if the mount path directory exists
            if (!fs.existsSync(env.RAILWAY_VOLUME_MOUNT_PATH)) {
                console.warn(`⚠️  Railway volume mount path does not exist: ${env.RAILWAY_VOLUME_MOUNT_PATH}`);
                console.warn('⚠️  Falling back to DATABASE_PATH or default');
            } else {
                // Check if directory is writable
                try {
                    fs.accessSync(env.RAILWAY_VOLUME_MOUNT_PATH, fs.constants.W_OK);
                    console.log(`✅ Using Railway volume database: ${resolvedPath}`);
                    return resolvedPath;
                } catch (accessError) {
                    console.warn(`⚠️  Railway volume mount path is not writable: ${env.RAILWAY_VOLUME_MOUNT_PATH}`);
                    console.warn('⚠️  Falling back to DATABASE_PATH or default');
                }
            }
        } catch (error) {
            console.error('❌ Error validating Railway volume path:', error);
            console.warn('⚠️  Falling back to DATABASE_PATH or default');
        }
    }

    // Check for custom database path (second priority)
    if (env.DATABASE_PATH) {
        resolvedPath = env.DATABASE_PATH;
        source = 'DATABASE_PATH';
        console.log(`✅ Using custom database path: ${resolvedPath}`);
        return resolvedPath;
    }

    // Default based on environment (fallback)
    const isDev = env.NODE_ENV !== 'production';
    resolvedPath = isDev ? 'dev.db' : 'prod.db';
    source = 'DEFAULT';

    console.log(`✅ Using default database path: ${resolvedPath} (NODE_ENV: ${env.NODE_ENV || 'undefined'})`);
    return resolvedPath;
}

// Log the resolved path when this module is imported
const finalPath = getUnifiedDbPath();
console.log(`🗃️  UNIFIED DB PATH: ${finalPath}`);

export default finalPath;