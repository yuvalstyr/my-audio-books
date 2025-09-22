/**
 * Simple database path resolution
 */

import { env } from '$env/dynamic/private';

function getDbPath(): string {
    if (env.DATABASE_PATH) {
        console.log(`✅ Using explicit DATABASE_PATH: ${env.DATABASE_PATH}`);
        return env.DATABASE_PATH;
    }

    if (env.RAILWAY_VOLUME_MOUNT_PATH) {
        const path = `${env.RAILWAY_VOLUME_MOUNT_PATH}/audiobook-wishlist.db`;
        console.log(`✅ Using Railway volume: ${path}`);
        return path;
    }

    console.log(`✅ Using local development: ./dev.db`);
    return './dev.db';
}

const dbPath = getDbPath();
console.log(`🗃️  Database path: ${dbPath}`);

export default dbPath;