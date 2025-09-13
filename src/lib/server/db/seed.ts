import { db } from './connection.js';
import { books, tags, bookTags } from './schema.js';
import { generateId } from '../../utils/id.js';

export interface SeedData {
    books: Array<{
        id: string;
        title: string;
        author: string;
        audibleUrl?: string;
        narratorRating?: number;
        performanceRating?: number;
        description?: string;
        coverImageUrl?: string;
        queuePosition?: number;
        dateAdded: string;
        dateUpdated: string;
        createdAt: string;
        updatedAt: string;
    }>;
    tags: Array<{
        id: string;
        name: string;
        color: string;
        createdAt: string;
    }>;
    bookTags: Array<{
        bookId: string;
        tagId: string;
    }>;
}

export function generateSeedData(): SeedData {
    const now = new Date().toISOString();

    // Generate sample tags
    const sampleTags = [
        { name: 'Fantasy', color: '#8B5CF6' },
        { name: 'Science Fiction', color: '#06B6D4' },
        { name: 'Mystery', color: '#EF4444' },
        { name: 'Biography', color: '#10B981' },
        { name: 'Self-Help', color: '#F59E0B' },
        { name: 'History', color: '#6366F1' },
        { name: 'Romance', color: '#EC4899' },
        { name: 'Thriller', color: '#DC2626' },
    ].map(tag => ({
        id: generateId(),
        name: tag.name,
        color: tag.color,
        createdAt: now,
    }));

    // Generate sample books
    const sampleBooks = [
        {
            title: 'The Name of the Wind',
            author: 'Patrick Rothfuss',
            audibleUrl: 'https://www.audible.com/pd/The-Name-of-the-Wind-Audiobook/B002UZMLXM',
            narratorRating: 4.8,
            performanceRating: 4.9,
            description: 'The first book in the Kingkiller Chronicle series.',
            queuePosition: 1,
            tagNames: ['Fantasy'],
        },
        {
            title: 'Dune',
            author: 'Frank Herbert',
            audibleUrl: 'https://www.audible.com/pd/Dune-Audiobook/B002V8KKTC',
            narratorRating: 4.5,
            performanceRating: 4.6,
            description: 'A science fiction masterpiece set on the desert planet Arrakis.',
            queuePosition: 2,
            tagNames: ['Science Fiction'],
        },
        {
            title: 'The Thursday Murder Club',
            author: 'Richard Osman',
            audibleUrl: 'https://www.audible.com/pd/The-Thursday-Murder-Club-Audiobook/B08FHXZ7QR',
            narratorRating: 4.7,
            performanceRating: 4.8,
            description: 'A cozy mystery featuring four unlikely friends in a retirement village.',
            queuePosition: 3,
            tagNames: ['Mystery'],
        },
        {
            title: 'Educated',
            author: 'Tara Westover',
            audibleUrl: 'https://www.audible.com/pd/Educated-Audiobook/B077LBB5J7',
            narratorRating: 4.9,
            performanceRating: 4.8,
            description: 'A memoir about education, family, and the struggle for self-invention.',
            queuePosition: 4,
            tagNames: ['Biography'],
        },
        {
            title: 'Atomic Habits',
            author: 'James Clear',
            audibleUrl: 'https://www.audible.com/pd/Atomic-Habits-Audiobook/1524779261',
            narratorRating: 4.6,
            performanceRating: 4.5,
            description: 'An easy and proven way to build good habits and break bad ones.',
            queuePosition: 5,
            tagNames: ['Self-Help'],
        },
        {
            title: 'Sapiens',
            author: 'Yuval Noah Harari',
            audibleUrl: 'https://www.audible.com/pd/Sapiens-Audiobook/B00VXKD3GY',
            narratorRating: 4.4,
            performanceRating: 4.3,
            description: 'A brief history of humankind.',
            queuePosition: 6,
            tagNames: ['History'],
        },
        {
            title: 'The Seven Husbands of Evelyn Hugo',
            author: 'Taylor Jenkins Reid',
            audibleUrl: 'https://www.audible.com/pd/The-Seven-Husbands-of-Evelyn-Hugo-Audiobook/B071Z96XYG',
            narratorRating: 4.8,
            performanceRating: 4.9,
            description: 'A reclusive Hollywood icon finally tells her story.',
            queuePosition: 7,
            tagNames: ['Romance'],
        },
        {
            title: 'Gone Girl',
            author: 'Gillian Flynn',
            audibleUrl: 'https://www.audible.com/pd/Gone-Girl-Audiobook/B008ELGS9Y',
            narratorRating: 4.7,
            performanceRating: 4.8,
            description: 'A psychological thriller about a marriage gone terribly wrong.',
            queuePosition: 8,
            tagNames: ['Thriller', 'Mystery'],
        },
    ].map(book => ({
        id: generateId(),
        title: book.title,
        author: book.author,
        audibleUrl: book.audibleUrl,
        narratorRating: book.narratorRating,
        performanceRating: book.performanceRating,
        description: book.description,
        coverImageUrl: undefined,
        queuePosition: book.queuePosition,
        dateAdded: now,
        dateUpdated: now,
        createdAt: now,
        updatedAt: now,
        tagNames: book.tagNames,
    }));

    // Generate book-tag relationships
    const bookTagRelations: Array<{ bookId: string; tagId: string }> = [];

    sampleBooks.forEach(book => {
        book.tagNames.forEach(tagName => {
            const tag = sampleTags.find(t => t.name === tagName);
            if (tag) {
                bookTagRelations.push({
                    bookId: book.id,
                    tagId: tag.id,
                });
            }
        });
    });

    return {
        books: sampleBooks.map(({ tagNames, ...book }) => book),
        tags: sampleTags,
        bookTags: bookTagRelations,
    };
}

export async function seedDatabase(): Promise<void> {
    console.log('🌱 Starting database seeding...');

    try {
        const seedData = generateSeedData();

        // Clear existing data
        console.log('🧹 Clearing existing data...');
        await db.delete(bookTags);
        await db.delete(books);
        await db.delete(tags);

        // Insert tags first (referenced by book_tags)
        console.log('🏷️  Inserting tags...');
        await db.insert(tags).values(seedData.tags);

        // Insert books
        console.log('📚 Inserting books...');
        await db.insert(books).values(seedData.books);

        // Insert book-tag relationships
        console.log('🔗 Inserting book-tag relationships...');
        await db.insert(bookTags).values(seedData.bookTags);

        console.log('✅ Database seeding completed successfully!');
        console.log(`   - ${seedData.tags.length} tags inserted`);
        console.log(`   - ${seedData.books.length} books inserted`);
        console.log(`   - ${seedData.bookTags.length} book-tag relationships inserted`);

    } catch (error) {
        console.error('❌ Database seeding failed:', error);
        throw error;
    }
}

export async function clearDatabase(): Promise<void> {
    console.log('🧹 Clearing database...');

    try {
        await db.delete(bookTags);
        await db.delete(books);
        await db.delete(tags);

        console.log('✅ Database cleared successfully!');
    } catch (error) {
        console.error('❌ Database clearing failed:', error);
        throw error;
    }
}