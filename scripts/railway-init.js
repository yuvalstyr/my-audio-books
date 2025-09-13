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

// Run database migrations with error handling
function runMigrations() {
    console.log('🔄 Running database migrations...');

    try {
        // First, try to generate any pending migrations
        try {
            execSync('npm run db:generate', { stdio: 'pipe' });
            console.log('📋 Migration generation completed');
        } catch (genError) {
            console.log('ℹ️  No new migrations to generate (this is normal)');
        }

        // Run the migrations
        execSync('npm run db:migrate', { stdio: 'inherit' });
        console.log('✅ Database migrations completed successfully');

    } catch (error) {
        console.error('❌ Database migration failed:', error.message);

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
        } catch (error) {
            console.log('⚠️  Could not read database stats');
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
        runMigrations();
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