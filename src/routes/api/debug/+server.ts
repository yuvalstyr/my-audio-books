import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { sqlite } from '$lib/server/db/connection.js';

export const GET: RequestHandler = async () => {
    try {
        // Check the actual database structure
        const columns = sqlite.prepare('PRAGMA table_info(books)').all();

        // Get a sample of actual data
        const sampleBook = sqlite.prepare('SELECT * FROM books LIMIT 1').get();

        return json({
            success: true,
            data: {
                tableColumns: columns,
                sampleBook: sampleBook
            }
        });
    } catch (error) {
        return json({
            success: false,
            error: (error as Error).message
        }, { status: 500 });
    }
};