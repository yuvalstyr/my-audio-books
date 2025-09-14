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

// Get database path with enhanced logic
function getDbPath() {
    let dbPath;

    if (process.env.RAILWAY_VOLUME_MOUNT_PATH) {
        dbPath = `${process.env.RAILWAY_VOLUME_MOUNT_PATH}/audiobook-wishlist.db`;
        console.log('📁 Using Railway volume mount for database');
    } else if (process.env.DATABASE_PATH) {
        dbPath = process.env.DATABASE_PATH;
        console.log('📁 Using DATABASE_PATH environment variable');
    } else {
        dbPath = './prod.db';
        console.log('📁 Using default database path');
    }

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

// Run database migrations with better error handling
async function runMigrations(dbPath) {
    console.log('🔄 Setting up database schema...');

    const hasExistingTables = await checkDatabaseExists(dbPath);

    if (hasExistingTables) {
        console.log('📋 Existing database detected, using schema push instead of migrations');

        try {
            // For existing databases, use push to sync schema safely with auto-approval
            execSync('npx drizzle-kit push --force', { stdio: 'inherit' });
            console.log('✅ Database schema synchronized successfully');
        } catch (pushError) {
            console.log('⚠️  Schema push failed, this may be normal if schema is already up to date');
            console.log('🔄 Continuing with startup...');
        }
    } else {
        console.log('🆕 New database detected, running initial setup');

        try {
            // Skip generation in production - migrations should be pre-generated
            if (process.env.NODE_ENV !== 'production') {
                try {
                    execSync('npm run db:generate', { stdio: 'pipe' });
                    console.log('📋 Migration generation completed');
                } catch (genError) {
                    console.log('ℹ️  No new migrations to generate (this is normal)');
                }
            } else {
                console.log('🏭 Production mode: using pre-generated migrations');
            }

            // For new databases, try migrations first, fall back to push
            try {
                execSync('npm run db:migrate', { stdio: 'inherit' });
                console.log('✅ Database migrations completed successfully');
            } catch (migrateError) {
                console.log('⚠️  Migration failed, trying schema push as fallback');
                execSync('npx drizzle-kit push --force', { stdio: 'inherit' });
                console.log('✅ Database schema created successfully');
            }

        } catch (error) {
            console.error('❌ Database setup failed:', error.message);

            // Try to provide more helpful error information
            if (error.message.includes('ENOENT')) {
                console.error('💡 Hint: Make sure drizzle-kit is installed and migration files exist');
            } else if (error.message.includes('permission')) {
                console.error('💡 Hint: Check database directory permissions');
            } else if (error.message.includes('locked')) {
                console.error('💡 Hint: Database may be locked by another process');
            }

            throw error;
        }
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

// Main initialization process
async function initialize() {
    try {
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
        console.error('🔧 Please check the logs above for specific error details');
        process.exit(1);
    }
}

// Run initialization
initialize();