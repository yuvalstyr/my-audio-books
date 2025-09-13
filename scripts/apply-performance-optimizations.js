#!/usr/bin/env node

/**
 * Script to apply performance optimizations to the database
 */

import { applyPerformanceOptimizations, analyzeQueryPerformance, getDatabaseSizeStats } from '../src/lib/server/db/performance-migration.js';

async function main() {
    console.log('🚀 Applying performance optimizations...\n');

    try {
        // Apply optimizations
        const optimizationResult = applyPerformanceOptimizations();

        console.log('✅ Performance Optimization Results:');
        console.log(`   Success: ${optimizationResult.success}`);
        console.log(`   Operations: ${optimizationResult.operations.length}`);

        if (optimizationResult.operations.length > 0) {
            console.log('\n📋 Operations performed:');
            optimizationResult.operations.forEach((op, index) => {
                console.log(`   ${index + 1}. ${op}`);
            });
        }

        if (optimizationResult.error) {
            console.log(`\n❌ Error: ${optimizationResult.error}`);
        }

        // Analyze query performance
        console.log('\n🔍 Analyzing query performance...');
        const analysisResult = analyzeQueryPerformance();

        if (analysisResult.success) {
            console.log('✅ Query analysis completed');
            if (analysisResult.analysis?.indexes) {
                console.log(`   Found ${analysisResult.analysis.indexes.length} indexes`);
            }
        } else {
            console.log(`❌ Query analysis failed: ${analysisResult.error}`);
        }

        // Get database size stats
        console.log('\n📊 Getting database statistics...');
        const sizeStats = getDatabaseSizeStats();

        if (sizeStats.success && sizeStats.stats) {
            console.log('✅ Database statistics:');
            if (sizeStats.stats.totalSize) {
                console.log(`   Total size: ${Math.round(sizeStats.stats.totalSize / 1024)} KB`);
            }
            if (sizeStats.stats.tableSizes) {
                console.log('   Table sizes:');
                Object.entries(sizeStats.stats.tableSizes).forEach(([table, count]) => {
                    console.log(`     ${table}: ${count} records`);
                });
            }
        } else {
            console.log(`❌ Database statistics failed: ${sizeStats.error}`);
        }

        console.log('\n🎉 Performance optimization completed!');

    } catch (error) {
        console.error('❌ Failed to apply performance optimizations:', error.message);
        process.exit(1);
    }
}

main();