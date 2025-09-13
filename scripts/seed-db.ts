#!/usr/bin/env tsx

import { seedDatabase } from '../src/lib/server/db/seed.js';

async function main() {
    try {
        await seedDatabase();
        process.exit(0);
    } catch (error) {
        console.error('Seeding failed:', error);
        process.exit(1);
    }
}

main();