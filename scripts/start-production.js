#!/usr/bin/env node

/**
 * Production startup script that handles initialization and app startup
 */

import { spawn } from 'child_process';

console.log('🚀 Starting production application...');

// Function to run railway init with timeout
async function runRailwayInit() {
    return new Promise((resolve) => {
        console.log('🔧 Running Railway initialization...');

        const initProcess = spawn('node', ['scripts/railway-init.js'], {
            stdio: 'inherit',
            env: process.env
        });

        // Set a timeout for initialization
        const timeout = setTimeout(() => {
            console.log('⏰ Railway initialization timeout, continuing with app startup...');
            initProcess.kill('SIGTERM');
            resolve(false);
        }, 30000); // 30 second timeout

        initProcess.on('close', (code) => {
            clearTimeout(timeout);
            if (code === 0) {
                console.log('✅ Railway initialization completed successfully');
                resolve(true);
            } else {
                console.log(`⚠️  Railway initialization exited with code ${code}, continuing...`);
                resolve(false);
            }
        });

        initProcess.on('error', (error) => {
            clearTimeout(timeout);
            console.log('❌ Railway initialization error:', error.message);
            resolve(false);
        });
    });
}

// Function to start the main application
function startApp() {
    console.log('🚀 Starting main application...');

    const appProcess = spawn('node', ['build'], {
        stdio: 'inherit',
        env: { ...process.env, NODE_ENV: 'production' }
    });

    appProcess.on('close', (code) => {
        console.log(`Application exited with code ${code}`);
        process.exit(code);
    });

    appProcess.on('error', (error) => {
        console.error('Application startup error:', error);
        process.exit(1);
    });

    // Handle shutdown signals
    process.on('SIGTERM', () => {
        console.log('Received SIGTERM, shutting down gracefully...');
        appProcess.kill('SIGTERM');
    });

    process.on('SIGINT', () => {
        console.log('Received SIGINT, shutting down gracefully...');
        appProcess.kill('SIGINT');
    });
}

// Main execution
async function main() {
    try {
        // Try to initialize, but don't fail if it doesn't work
        await runRailwayInit();

        // Always start the app regardless of init result
        startApp();

    } catch (error) {
        console.error('Startup error:', error);
        console.log('🔄 Attempting to start application anyway...');
        startApp();
    }
}

main();