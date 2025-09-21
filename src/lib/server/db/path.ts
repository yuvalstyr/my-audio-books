/**
 * Unified database path resolution for both application and migrations
 * This ensures the same database file is used everywhere
 */

import { env } from '$env/dynamic/private';
import { existsSync, statSync } from 'fs';

export function getUnifiedDbPath(): string {
    // In production, try multiple Railway-specific paths where the database might exist
    if (env.NODE_ENV === 'production') {
        try {

        // Common Railway volume mount paths to check
        const potentialPaths = [
            // Standard Railway volume mount
            env.RAILWAY_VOLUME_MOUNT_PATH ? `${env.RAILWAY_VOLUME_MOUNT_PATH}/audiobook-wishlist.db` : null,
            // Custom DATABASE_PATH
            env.DATABASE_PATH,
            // Common Railway volume paths
            '/data/audiobook-wishlist.db',
            '/app/data/audiobook-wishlist.db',
            '/railway-volume/audiobook-wishlist.db',
            // Legacy paths
            './audiobook-wishlist.db',
            './prod.db'
        ].filter(Boolean);

        console.log(`🔍 Production mode: checking ${potentialPaths.length} potential database paths...`);

            // Check each path and use the first one that exists and has data
            for (const path of potentialPaths) {
                if (path && existsSync(path)) {
                    try {
                        const stats = statSync(path);
                        if (stats.size > 1024) { // Database should be > 1KB if it has data
                            console.log(`✅ Found database with data: ${path} (${Math.round(stats.size/1024)}KB)`);
                            return path;
                        } else {
                            console.log(`⚠️  Found empty database: ${path} (${stats.size} bytes) - skipping`);
                        }
                    } catch (error) {
                        console.log(`⚠️  Cannot access ${path}: ${(error as Error).message}`);
                    }
                }
            }
        } catch (error) {
            console.warn('⚠️  Error scanning for database:', (error as Error).message);
        }

        console.warn('⚠️  No existing database found, using Railway volume path or default');

        // Fallback to Railway volume or default
        if (env.RAILWAY_VOLUME_MOUNT_PATH) {
            const railwayPath = `${env.RAILWAY_VOLUME_MOUNT_PATH}/audiobook-wishlist.db`;
            console.log(`📁 Using Railway volume fallback: ${railwayPath}`);
            return railwayPath;
        }
    }

    // Development or fallback logic
    if (env.DATABASE_PATH) {
        console.log(`✅ Using DATABASE_PATH: ${env.DATABASE_PATH}`);
        return env.DATABASE_PATH;
    }

    const isDev = env.NODE_ENV !== 'production';
    const defaultPath = isDev ? 'dev.db' : 'prod.db';
    console.log(`✅ Using default path: ${defaultPath} (NODE_ENV: ${env.NODE_ENV || 'undefined'})`);
    return defaultPath;
}

// Log the resolved path when this module is imported
const finalPath = getUnifiedDbPath();
console.log(`🗃️  UNIFIED DB PATH: ${finalPath}`);

export default finalPath;