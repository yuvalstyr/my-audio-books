#!/usr/bin/env node

/**
 * Railway deployment debug script
 * Helps diagnose common deployment issues
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

console.log('🔍 Railway Deployment Debug Information');
console.log('=====================================\n');

// Check Node.js version
console.log('📋 Environment Information:');
console.log(`Node.js version: ${process.version}`);
console.log(`Platform: ${process.platform}`);
console.log(`Architecture: ${process.arch}`);
console.log(`NPM version: ${process.env.npm_version || 'unknown'}`);

// Check package.json
try {
    const packageJsonPath = path.join(__dirname, '..', 'package.json');
    const packageJsonContent = fs.readFileSync(packageJsonPath, 'utf8');
    const packageJson = JSON.parse(packageJsonContent);

    console.log(`\n📦 Package Information:`);
    console.log(`Name: ${packageJson.name}`);
    console.log(`Version: ${packageJson.version}`);
    console.log(`Type: ${packageJson.type}`);

    if (packageJson.engines) {
        console.log(`\n⚙️  Engine Requirements:`);
        console.log(`Node: ${packageJson.engines.node || 'not specified'}`);
        console.log(`NPM: ${packageJson.engines.npm || 'not specified'}`);
    }

    console.log(`\n📚 Dependencies:`);
    console.log(`Production: ${Object.keys(packageJson.dependencies || {}).length}`);
    console.log(`Development: ${Object.keys(packageJson.devDependencies || {}).length}`);

} catch (error) {
    console.log(`❌ Error reading package.json: ${error.message}`);
}

// Check critical files
console.log(`\n📁 Critical Files Check:`);
const criticalFiles = [
    'package.json',
    'svelte.config.js',
    'vite.config.ts',
    'railway.json',
    'nixpacks.toml',
    '.dockerignore'
];

const rootDir = path.join(__dirname, '..');
criticalFiles.forEach(file => {
    const filePath = path.join(rootDir, file);
    if (fs.existsSync(filePath)) {
        console.log(`✅ ${file}`);
    } else {
        console.log(`❌ ${file} (missing)`);
    }
});

// Check build directory
console.log(`\n🏗️  Build Status:`);
const buildDir = path.join(rootDir, 'build');
if (fs.existsSync(buildDir)) {
    console.log(`✅ Build directory exists`);
    try {
        const buildFiles = fs.readdirSync(buildDir);
        console.log(`   Files: ${buildFiles.join(', ')}`);
    } catch (error) {
        console.log(`   Error reading build directory: ${error.message}`);
    }
} else {
    console.log(`❌ Build directory missing (run 'npm run build' first)`);
}

// Check database files
console.log(`\n🗄️  Database Files:`);
const dbFiles = ['dev.db', 'prod.db'];
dbFiles.forEach(file => {
    const filePath = path.join(rootDir, file);
    if (fs.existsSync(filePath)) {
        const stats = fs.statSync(filePath);
        console.log(`✅ ${file} (${Math.round(stats.size / 1024)}KB)`);
    } else {
        console.log(`ℹ️  ${file} (not found - will be created)`);
    }
});

console.log(`\n🚀 Deployment Tips:`);
console.log(`1. Ensure all files are committed to git`);
console.log(`2. Check that 'better-sqlite3' compiles on your platform`);
console.log(`3. Verify Railway has access to your repository`);
console.log(`4. Consider adding a Railway volume for database persistence`);

console.log(`\n✅ Debug information complete!`);