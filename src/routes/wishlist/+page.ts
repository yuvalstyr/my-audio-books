import type { PageLoad } from './$types';

export const load: PageLoad = async ({ fetch }) => {
    try {
        // Use SvelteKit's fetch directly
        const booksResponse = await fetch('/api/books');
        const booksData = await booksResponse.json();

        if (!booksData.success) {
            throw new Error(booksData.message || 'Failed to load books');
        }

        const tagsResponse = await fetch('/api/tags');
        const tagsData = await tagsResponse.json();

        if (!tagsData.success) {
            throw new Error(tagsData.message || 'Failed to load tags');
        }

        return {
            books: booksData.data || [],
            tags: tagsData.data || []
        };
    } catch (err) {
        console.error('Failed to load wishlist data:', err);

        // Return empty data if loading fails
        return {
            books: [],
            tags: [],
            loadError: err instanceof Error ? err.message : 'Failed to load data'
        };
    }
};