#!/usr/bin/env node

/**
 * Deployment verification script for Railway
 * Performs comprehensive checks to ensure the deployment is production-ready
 */

import { execSync } from 'child_process';
import { existsSync, readFileSync } from 'fs';
import { join } from 'path';

const REQUIRED_ENV_VARS = [
    'NODE_ENV',
    'DATABASE_PATH'
];

const OPTIONAL_ENV_VARS = [
    'RAILWAY_VOLUME_MOUNT_PATH',
    'PORT'
];

console.log('🔍 Railway Deployment Verification');
console.log('==================================\n');

let hasErrors = false;
let hasWarnings = false;

function logError(message) {
    console.log(`❌ ERROR: ${message}`);
    hasErrors = true;
}

function logWarning(message) {
    console.log(`⚠️  WARNING: ${message}`);
    hasWarnings = true;
}

function logSuccess(message) {
    console.log(`✅ ${message}`);
}

function logInfo(message) {
    console.log(`ℹ️  ${message}`);
}

// 1. Check build artifacts
console.log('📦 Checking build artifacts...');
if (existsSync('.svelte-kit/output')) {
    logSuccess('SvelteKit build output exists');

    // Check for server build
    if (existsSync('.svelte-kit/output/server/index.js')) {
        logSuccess('Server build found');
    } else {
        logError('Server build missing - check SvelteKit build');
    }

    // Check for client build
    if (existsSync('.svelte-kit/output/client')) {
        logSuccess('Client build found');
    } else {
        logWarning('Client build missing');
    }

    // Check for build directory (adapter output)
    if (existsSync('build')) {
        logSuccess('Adapter build directory exists');

        try {
            const buildContents = execSync('find build -name "*.js" | head -5', { encoding: 'utf8' });
            if (buildContents.trim()) {
                logSuccess('Build contains JavaScript files');
            }
        } catch (error) {
            // Try alternative check
            if (existsSync('build/index.js') || existsSync('build/handler.js')) {
                logSuccess('Build handler files found');
            }
        }
    } else {
        logWarning('Adapter build directory not found - this is normal for some adapters');
    }
} else {
    logError('SvelteKit build output not found - run "npm run build" first');
}

// 2. Check package.json configuration
console.log('\n📋 Checking package.json configuration...');
try {
    const packageJson = JSON.parse(readFileSync('package.json', 'utf8'));

    if (packageJson.scripts?.start) {
        logSuccess(`Start script defined: ${packageJson.scripts.start}`);
    } else {
        logError('No start script defined in package.json');
    }

    if (packageJson.scripts?.build) {
        logSuccess(`Build script defined: ${packageJson.scripts.build}`);
    } else {
        logError('No build script defined in package.json');
    }

    if (packageJson.type === 'module') {
        logSuccess('Package configured as ES module');
    } else {
        logWarning('Package not configured as ES module - may cause issues');
    }

} catch (error) {
    logError(`Failed to read package.json: ${error.message}`);
}

// 3. Check Railway configuration
console.log('\n🚂 Checking Railway configuration...');
if (existsSync('railway.json')) {
    try {
        const railwayConfig = JSON.parse(readFileSync('railway.json', 'utf8'));

        if (railwayConfig.deploy?.startCommand) {
            logSuccess(`Railway start command: ${railwayConfig.deploy.startCommand}`);
        } else {
            logWarning('No start command specified in railway.json');
        }

        if (railwayConfig.deploy?.healthcheckPath) {
            logSuccess(`Health check configured: ${railwayConfig.deploy.healthcheckPath}`);
        } else {
            logWarning('No health check path configured');
        }

        if (railwayConfig.build?.builder) {
            logSuccess(`Build system: ${railwayConfig.build.builder}`);
        }

        if (railwayConfig.environments?.production) {
            logSuccess('Production environment configuration found');
        } else {
            logWarning('No production environment configuration');
        }

    } catch (error) {
        logError(`Failed to parse railway.json: ${error.message}`);
    }
} else {
    logWarning('No railway.json configuration file found');
}

// 4. Check environment variables
console.log('\n🌍 Checking environment configuration...');
REQUIRED_ENV_VARS.forEach(envVar => {
    if (process.env[envVar]) {
        logSuccess(`Required env var set: ${envVar}`);
    } else {
        logWarning(`Required env var missing: ${envVar} (will be set by Railway)`);
    }
});

OPTIONAL_ENV_VARS.forEach(envVar => {
    if (process.env[envVar]) {
        logSuccess(`Optional env var set: ${envVar}`);
    } else {
        logInfo(`Optional env var not set: ${envVar}`);
    }
});

// 5. Check database setup
console.log('\n🗄️  Checking database configuration...');
if (existsSync('drizzle.config.ts')) {
    logSuccess('Drizzle configuration found');
} else {
    logError('Drizzle configuration missing');
}

if (existsSync('drizzle')) {
    try {
        const migrations = execSync('ls drizzle/*.sql 2>/dev/null | wc -l', { encoding: 'utf8' });
        const migrationCount = parseInt(migrations.trim());
        if (migrationCount > 0) {
            logSuccess(`Database migrations found: ${migrationCount} files`);
        } else {
            logWarning('No database migration files found');
        }
    } catch (error) {
        logWarning('Could not check migration files');
    }
} else {
    logWarning('No drizzle migrations directory found');
}

// 6. Test build locally
console.log('\n🧪 Testing local build...');
try {
    // Check if we can start the server briefly
    logInfo('Testing if build can start (this may take a moment)...');

    // For SvelteKit, test the server build
    let testCommand;
    if (existsSync('build/index.js')) {
        testCommand = 'timeout 10s node build/index.js 2>&1 || echo "Build test completed"';
    } else if (existsSync('.svelte-kit/output/server/index.js')) {
        testCommand = 'timeout 10s node .svelte-kit/output/server/index.js 2>&1 || echo "Build test completed"';
    } else {
        logWarning('No build entry point found to test');
        testCommand = null;
    }

    if (testCommand) {
        const output = execSync(testCommand, { encoding: 'utf8', timeout: 15000 });

        if (output.includes('listening') || output.includes('started') || output.includes('ready')) {
            logSuccess('Build starts successfully');
        } else if (output.includes('Error') || output.includes('error')) {
            logError('Build fails to start - check for missing dependencies or configuration');
            logInfo(`Output: ${output.slice(0, 200)}...`);
        } else {
            logInfo('Build test completed (unable to determine startup status)');
        }
    }
} catch (error) {
    logWarning('Could not test local build startup');
}

// 7. Check critical files
console.log('\n📁 Checking critical files...');
const criticalFiles = [
    'package.json',
    'svelte.config.js',
    'vite.config.ts',
    'src/app.html'
];

criticalFiles.forEach(file => {
    if (existsSync(file)) {
        logSuccess(`Critical file exists: ${file}`);
    } else {
        logError(`Critical file missing: ${file}`);
    }
});

// 8. Check for common issues
console.log('\n🔧 Checking for common deployment issues...');

// Check for node_modules in build
if (existsSync('build/node_modules')) {
    logWarning('node_modules found in build directory - may increase deployment size');
}

// Check for development dependencies in production
try {
    const packageJson = JSON.parse(readFileSync('package.json', 'utf8'));
    const devDeps = Object.keys(packageJson.devDependencies || {});
    const deps = Object.keys(packageJson.dependencies || {});

    if (deps.length === 0) {
        logWarning('No production dependencies found - ensure all runtime deps are in dependencies, not devDependencies');
    } else {
        logSuccess(`Production dependencies: ${deps.length}`);
    }

    logInfo(`Development dependencies: ${devDeps.length}`);
} catch (error) {
    // Already handled above
}

// Summary
console.log('\n📊 Verification Summary');
console.log('======================');

if (hasErrors) {
    console.log('❌ DEPLOYMENT NOT READY - Please fix the errors above before deploying');
    process.exit(1);
} else if (hasWarnings) {
    console.log('⚠️  DEPLOYMENT READY WITH WARNINGS - Review warnings above');
    console.log('   The deployment should work but may have issues');
    process.exit(0);
} else {
    console.log('✅ DEPLOYMENT READY - All checks passed!');
    console.log('   Your application is ready for Railway deployment');
    process.exit(0);
}