#!/usr/bin/env node

/**
 * Railway initialization script
 * This script runs on Railway deployment to set up the database and environment
 */

import { execSync } from 'child_process';
import { existsSync, mkdirSync, writeFileSync } from 'fs';
import { dirname } from 'path';

console.log('🚀 Starting Railway initialization...');

// Environment validation
function validateEnvironment() {
    console.log('🔍 Validating environment...');

    const nodeEnv = process.env.NODE_ENV || 'development';
    console.log(`📊 Environment: ${nodeEnv}`);

    if (nodeEnv === 'production') {
        console.log('✅ Production environment detected');
    } else {
        console.log('⚠️  Non-production environment');
    }

    // Log Railway-specific environment variables (without values for security)
    const railwayVars = Object.keys(process.env).filter(key => key.startsWith('RAILWAY_'));
    if (railwayVars.length > 0) {
        console.log(`🚂 Railway environment variables detected: ${railwayVars.length}`);
    }
}

// Get database path with enhanced logic - MUST match application logic exactly
function getDbPath() {
    let dbPath;
    let source;

    // Check for explicit DATABASE_PATH first (highest priority)
    if (process.env.DATABASE_PATH) {
        dbPath = process.env.DATABASE_PATH;
        source = 'DATABASE_PATH';
        console.log(`📁 Railway-init using DATABASE_PATH: ${dbPath}`);
    } else if (process.env.RAILWAY_VOLUME_MOUNT_PATH) {
        // Handle case where RAILWAY_VOLUME_MOUNT_PATH might be the full file path
        dbPath = process.env.RAILWAY_VOLUME_MOUNT_PATH.endsWith('.db')
            ? process.env.RAILWAY_VOLUME_MOUNT_PATH
            : `${process.env.RAILWAY_VOLUME_MOUNT_PATH}/audiobook-wishlist.db`;
        source = 'RAILWAY_VOLUME_MOUNT_PATH';
        console.log(`📁 Railway-init using Railway volume path: ${dbPath}`);
    } else {
        // Default based on environment (fallback)
        const isDev = process.env.NODE_ENV !== 'production';
        dbPath = isDev ? './dev.db' : './prod.db';
        source = 'DEFAULT';
        console.log(`📁 Railway-init using default path: ${dbPath} (NODE_ENV: ${process.env.NODE_ENV || 'undefined'})`);
    }

    console.log(`🗃️  RAILWAY-INIT DB PATH: ${dbPath} (source: ${source})`);
    return dbPath;
}

// Setup database directory and permissions
function setupDatabase(dbPath) {
    console.log(`📁 Database path: ${dbPath}`);

    const dbDir = dirname(dbPath);

    // Ensure database directory exists
    if (!existsSync(dbDir)) {
        console.log(`📂 Creating database directory: ${dbDir}`);
        try {
            mkdirSync(dbDir, { recursive: true });
            console.log('✅ Database directory created');
        } catch (error) {
            console.error('❌ Failed to create database directory:', error.message);
            throw error;
        }
    } else {
        console.log('✅ Database directory exists');
    }

    // Set DATABASE_PATH for the application
    if (!process.env.DATABASE_PATH) {
        process.env.DATABASE_PATH = dbPath;
        console.log('📝 Set DATABASE_PATH environment variable');
    }
}

// Check if database has existing tables
async function checkDatabaseExists(dbPath) {
    if (!existsSync(dbPath)) {
        return false;
    }

    try {
        const Database = (await import('better-sqlite3')).default;
        const db = new Database(dbPath, { readonly: true });

        // Check if tables exist by querying sqlite_master
        const tables = db.prepare("SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%'").all();
        db.close();

        return tables.length > 0;
    } catch (error) {
        console.log(`ℹ️  Could not check existing tables: ${error.message}`);
        return false;
    }
}

// Run database migrations with safe incremental approach
async function runMigrations(dbPath) {
    console.log('🔄 Setting up database schema...');

    try {
        // Always use incremental migration approach - it handles both new and existing databases
        await executeIncrementalMigrations(dbPath);
        console.log('✅ Database migrations completed successfully');

    } catch (error) {
        console.error('❌ Database migration failed:', error.message);

        // Provide helpful error information
        if (error.message.includes('ENOENT')) {
            console.error('💡 Hint: Migration files not found - check if drizzle directory exists');
        } else if (error.message.includes('permission')) {
            console.error('💡 Hint: Check database directory permissions');
        } else if (error.message.includes('locked')) {
            console.error('💡 Hint: Database may be locked by another process');
        } else if (error.message.includes('no such table')) {
            console.error('💡 Hint: Database exists but tables are missing - this is normal for first run');
        }

        throw error;
    }
}

// Verify database setup
async function verifyDatabase(dbPath) {
    console.log('🔍 Verifying database setup...');

    if (existsSync(dbPath)) {
        console.log('✅ Database file exists');

        try {
            // Try to get file stats using already imported fs functions
            const { statSync } = await import('fs');
            const stats = statSync(dbPath);
            console.log(`📊 Database size: ${Math.round(stats.size / 1024)} KB`);

            // Try to verify database is accessible with SQLite
            try {
                const Database = (await import('better-sqlite3')).default;
                const db = new Database(dbPath, { readonly: true });

                // Test basic functionality
                const result = db.prepare('SELECT 1 as test').get();
                if (result && result.test === 1) {
                    console.log('✅ Database connectivity verified');
                } else {
                    console.log('⚠️  Database test query failed');
                }

                db.close();
            } catch (sqliteError) {
                console.log(`⚠️  Database verification error: ${sqliteError.message}`);
            }
        } catch (error) {
            console.log('⚠️  Could not read database stats:', error.message);
        }
    } else {
        console.log('⚠️  Database file not found, it will be created on first use');
    }
}

// Create a simple health check file
function createHealthCheck() {
    try {
        const healthInfo = {
            initialized: new Date().toISOString(),
            environment: process.env.NODE_ENV || 'development',
            version: process.env.npm_package_version || '1.0.0'
        };

        writeFileSync('.railway-init-complete', JSON.stringify(healthInfo, null, 2));
        console.log('✅ Initialization marker created');
    } catch (error) {
        console.log('⚠️  Could not create initialization marker:', error.message);
    }
}

// Safe incremental migration execution
async function executeIncrementalMigrations(dbPath) {
    console.log('🔧 Executing incremental migrations...');
    console.log(`🔍 Database path: ${dbPath}`);

    // Import fs at the top of the try block
    const { existsSync, statSync } = await import('fs');
    console.log(`🔍 Database path exists: ${existsSync(dbPath)}`);

    // Check file permissions
    try {
        const stats = statSync(dbPath);
        console.log(`📊 File stats: size=${stats.size}, mode=${stats.mode.toString(8)}, uid=${stats.uid}, gid=${stats.gid}`);
    } catch (err) {
        console.log(`⚠️  Could not get file stats: ${err.message}`);
    }

    try {
        const { readFileSync, readdirSync } = await import('fs');
        const { join } = await import('path');
        const Database = (await import('better-sqlite3')).default;

        const db = new Database(dbPath, {
            fileMustExist: false,
            timeout: 5000,
            verbose: console.log
        });

        // Create migrations tracking table if it doesn't exist
        db.exec(`
            CREATE TABLE IF NOT EXISTS _migrations (
                id TEXT PRIMARY KEY,
                applied_at TEXT NOT NULL
            )
        `);

        // Check if this is an existing database that needs migration tracking setup
        const existingTables = db.prepare(`
            SELECT name FROM sqlite_master
            WHERE type='table' AND name NOT LIKE 'sqlite_%' AND name != '_migrations'
        `).all().map(row => row.name);

        console.log(`📋 Existing tables in database: ${existingTables.join(', ') || 'none'}`);

        // Get applied migrations
        const appliedMigrations = new Set(
            db.prepare('SELECT id FROM _migrations').all().map(row => row.id)
        );

        // If database has tables but no migration records, mark appropriate migrations as applied
        if (existingTables.length > 0 && appliedMigrations.size === 0) {
            console.log('🔧 Detected existing database without migration tracking, setting up...');

            // If we have the main tables (books, tags, book_tags), mark the base migration as applied
            const expectedBaseTables = ['books', 'tags', 'book_tags'];
            const hasBaseTables = expectedBaseTables.every(table => existingTables.includes(table));

            if (hasBaseTables) {
                console.log('📋 Base tables exist, marking initial migration (0000) as applied');
                db.prepare('INSERT INTO _migrations (id, applied_at) VALUES (?, ?)').run(
                    '0000_parched_sandman',
                    new Date().toISOString()
                );
                appliedMigrations.add('0000_parched_sandman');
            }
        }

        console.log(`📋 Already applied migrations: ${appliedMigrations.size}`);

        // Get all migration files in order
        const migrationDir = './drizzle';
        let allMigrationFiles = [];

        try {
            allMigrationFiles = readdirSync(migrationDir)
                .filter(file => file.endsWith('.sql'))
                .sort(); // This will sort 0000_, 0001_, etc. in order
        } catch (dirError) {
            console.error('❌ Could not read migration directory:', dirError.message);
            throw new Error(`Migration directory not found: ${migrationDir}`);
        }

        // Filter to only pending migrations
        const pendingMigrations = allMigrationFiles.filter(file => {
            const migrationId = file.replace('.sql', '');
            return !appliedMigrations.has(migrationId);
        });

        console.log(`📋 Found ${allMigrationFiles.length} total migrations, ${pendingMigrations.length} pending:`, pendingMigrations);

        if (pendingMigrations.length === 0) {
            console.log('✅ All migrations already applied, database is up to date');
            db.close();
            return;
        }

        // Execute pending migrations
        const insertMigration = db.prepare('INSERT INTO _migrations (id, applied_at) VALUES (?, ?)');

        for (const file of pendingMigrations) {
            console.log(`🔄 Executing migration: ${file}`);
            const migrationPath = join(migrationDir, file);
            const sql = readFileSync(migrationPath, 'utf8');
            const migrationId = file.replace('.sql', '');

            try {
                // Split by statement separator and execute each statement
                const statements = sql.split('--> statement-breakpoint').filter(stmt => stmt.trim());

                for (const statement of statements) {
                    const cleanStatement = statement.trim();
                    if (cleanStatement) {
                        db.exec(cleanStatement);
                    }
                }

                // Mark migration as applied
                insertMigration.run(migrationId, new Date().toISOString());
                console.log(`✅ Migration ${file} completed successfully`);

            } catch (migrationError) {
                console.error(`❌ Migration ${file} failed:`, migrationError.message);
                throw migrationError;
            }
        }

        db.close();
        console.log(`✅ Applied ${pendingMigrations.length} migrations successfully`);

    } catch (error) {
        console.error('❌ Incremental migration failed:', error.message);
        throw error;
    }
}

// Main initialization process
async function initialize() {
    try {
        console.log('📝 NODE_ENV:', process.env.NODE_ENV);
        console.log('📝 RAILWAY_VOLUME_MOUNT_PATH:', process.env.RAILWAY_VOLUME_MOUNT_PATH ? 'SET' : 'NOT SET');
        console.log('📝 DATABASE_PATH:', process.env.DATABASE_PATH || 'NOT SET');

        validateEnvironment();

        const dbPath = getDbPath();
        setupDatabase(dbPath);
        await runMigrations(dbPath);
        await verifyDatabase(dbPath);
        createHealthCheck();

        console.log('🎉 Railway initialization completed successfully!');
        console.log('🚀 Application is ready to start');

    } catch (error) {
        console.error('💥 Railway initialization failed:', error.message);
        console.error('🔧 Error stack:', error.stack);
        console.error('🔧 Please check the logs above for specific error details');

        // In production, try to continue without failing completely
        if (process.env.NODE_ENV === 'production') {
            console.log('⚠️  Continuing startup despite initialization error (production mode)');
            return;
        }

        process.exit(1);
    }
}

// Run initialization
initialize();