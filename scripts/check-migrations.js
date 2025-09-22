#!/usr/bin/env node

/**
 * Check migration status locally and compare with available migrations
 */

import { readdirSync, existsSync } from 'fs';
import Database from 'better-sqlite3';

// Simple database path resolution
function getDbPath() {
    if (process.env.RAILWAY_VOLUME_MOUNT_PATH) {
        return `${process.env.RAILWAY_VOLUME_MOUNT_PATH}/audiobook-wishlist.db`;
    }
    if (process.env.DATABASE_PATH) {
        return process.env.DATABASE_PATH;
    }
    return process.env.NODE_ENV === 'production' ? '/data/audiobook-wishlist.db' : './dev.db';
}

const dbPath = getDbPath();

console.log('🔍 Checking migration status...');
console.log(`📁 Database path: ${dbPath}`);

try {
    // Check if database exists
    if (!existsSync(dbPath)) {
        console.log('❌ Database file does not exist');
        process.exit(1);
    }

    const db = new Database(dbPath);

    // Check if migrations table exists
    const tables = db.prepare(`
        SELECT name FROM sqlite_master
        WHERE type='table' AND name='_migrations'
    `).all();

    if (tables.length === 0) {
        console.log('⚠️  Migrations table does not exist');
        console.log('💡 Run "npm run db:push" or "npm run railway:init"');
    } else {
        // Get applied migrations
        const appliedMigrations = db.prepare('SELECT * FROM _migrations ORDER BY applied_at').all();
        console.log(`✅ Applied migrations: ${appliedMigrations.length}`);

        appliedMigrations.forEach(migration => {
            console.log(`  - ${migration.id} (${migration.applied_at})`);
        });

        // Check available migration files
        const migrationDir = './drizzle';
        if (existsSync(migrationDir)) {
            const migrationFiles = readdirSync(migrationDir)
                .filter(file => file.endsWith('.sql'))
                .sort();

            console.log(`\n📄 Available migration files: ${migrationFiles.length}`);
            migrationFiles.forEach(file => {
                console.log(`  - ${file}`);
            });

            // Compare applied vs available
            const appliedIds = new Set(appliedMigrations.map(m => m.id));
            const availableIds = migrationFiles.map(f => f.replace('.sql', ''));
            const pending = availableIds.filter(id => !appliedIds.has(id));

            if (pending.length > 0) {
                console.log(`\n⏳ Pending migrations: ${pending.length}`);
                pending.forEach(id => console.log(`  - ${id}`));
            } else {
                console.log('\n✅ All migrations applied');
            }
        }
    }

    db.close();

} catch (error) {
    console.error('❌ Error checking migrations:', error.message);
    process.exit(1);
}