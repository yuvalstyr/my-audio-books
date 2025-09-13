#!/usr/bin/env tsx

import { drizzle } from 'drizzle-orm/better-sqlite3';
import Database from 'better-sqlite3';
import * as schema from '../src/lib/server/db/schema.js';

// Simple database setup for seeding
const dbPath = process.env.DATABASE_PATH || 'dev.db';
const sqlite = new Database(dbPath);

// Basic SQLite optimizations
sqlite.pragma('journal_mode = WAL');
sqlite.pragma('synchronous = NORMAL');

const db = drizzle(sqlite, { schema });

// Sample data
const sampleBooks = [
    {
        id: 'book-1',
        title: 'The Hobbit',
        author: 'J.R.R. Tolkien',
        audibleUrl: 'https://www.audible.com/pd/The-Hobbit-Audiobook/B0099RKQLY',
        narratorRating: 4.8,
        performanceRating: 4.9,
        description: 'A classic fantasy adventure about Bilbo Baggins and his unexpected journey.',
        coverImageUrl: 'https://m.media-amazon.com/images/I/91b0C2YNSrL._SL1500_.jpg',
        queuePosition: 1,
        dateAdded: new Date().toISOString(),
        dateUpdated: new Date().toISOString(),
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
    },
    {
        id: 'book-2',
        title: 'Project Hail Mary',
        author: 'Andy Weir',
        audibleUrl: 'https://www.audible.com/pd/Project-Hail-Mary-Audiobook/B08G9PRS1K',
        narratorRating: 4.9,
        performanceRating: 4.8,
        description: 'A science fiction thriller about saving humanity.',
        queuePosition: 2,
        dateAdded: new Date().toISOString(),
        dateUpdated: new Date().toISOString(),
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
    },
    {
        id: 'book-3',
        title: 'The Name of the Wind',
        author: 'Patrick Rothfuss',
        narratorRating: 4.7,
        performanceRating: 4.6,
        description: 'First book in The Kingkiller Chronicle series.',
        dateAdded: new Date().toISOString(),
        dateUpdated: new Date().toISOString(),
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
    }
];

const sampleTags = [
    {
        id: 'tag-1',
        name: 'next',
        color: '#3b82f6',
        createdAt: new Date().toISOString()
    },
    {
        id: 'tag-2',
        name: 'fantasy',
        color: '#8b5cf6',
        createdAt: new Date().toISOString()
    },
    {
        id: 'tag-3',
        name: 'sci-fi',
        color: '#06b6d4',
        createdAt: new Date().toISOString()
    },
    {
        id: 'tag-4',
        name: 'standalone',
        color: '#10b981',
        createdAt: new Date().toISOString()
    },
    {
        id: 'tag-5',
        name: 'series',
        color: '#f59e0b',
        createdAt: new Date().toISOString()
    }
];

const sampleBookTags = [
    { bookId: 'book-1', tagId: 'tag-1' }, // The Hobbit -> next
    { bookId: 'book-1', tagId: 'tag-2' }, // The Hobbit -> fantasy
    { bookId: 'book-1', tagId: 'tag-4' }, // The Hobbit -> standalone
    { bookId: 'book-2', tagId: 'tag-1' }, // Project Hail Mary -> next
    { bookId: 'book-2', tagId: 'tag-3' }, // Project Hail Mary -> sci-fi
    { bookId: 'book-2', tagId: 'tag-4' }, // Project Hail Mary -> standalone
    { bookId: 'book-3', tagId: 'tag-2' }, // The Name of the Wind -> fantasy
    { bookId: 'book-3', tagId: 'tag-5' }, // The Name of the Wind -> series
];

async function seedDatabase() {
    try {
        console.log('🌱 Starting database seeding...');

        // Clear existing data
        console.log('🧹 Clearing existing data...');
        await db.delete(schema.bookTags);
        await db.delete(schema.books);
        await db.delete(schema.tags);

        // Insert tags
        console.log('🏷️  Inserting tags...');
        await db.insert(schema.tags).values(sampleTags);
        console.log(`✅ Inserted ${sampleTags.length} tags`);

        // Insert books
        console.log('📚 Inserting books...');
        await db.insert(schema.books).values(sampleBooks);
        console.log(`✅ Inserted ${sampleBooks.length} books`);

        // Insert book-tag relationships
        console.log('🔗 Creating book-tag relationships...');
        await db.insert(schema.bookTags).values(sampleBookTags);
        console.log(`✅ Created ${sampleBookTags.length} book-tag relationships`);

        console.log('🎉 Database seeding completed successfully!');
        console.log(`📊 Database location: ${dbPath}`);

    } catch (error) {
        console.error('❌ Seeding failed:', error);
        throw error;
    } finally {
        sqlite.close();
    }
}

// Run the seeding
seedDatabase().then(() => {
    process.exit(0);
}).catch((error) => {
    console.error('Seeding failed:', error);
    process.exit(1);
});