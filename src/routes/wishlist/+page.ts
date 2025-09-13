import type { PageLoad } from './$types';
import { apiClient } from '$lib/services/api-client.js';
import { error } from '@sveltejs/kit';

export const load: PageLoad = async ({ fetch, url }) => {
    try {
        // Use SvelteKit's fetch for SSR compatibility and caching
        const customApiClient = new (await import('$lib/services/api-client.js')).ApiClient({
            enableLogging: false // Disable logging during SSR
        });

        // Override the fetch method to use SvelteKit's fetch
        const originalMakeRequest = (customApiClient as any).makeRequest;
        (customApiClient as any).makeRequest = async function (endpoint: string, options: RequestInit = {}) {
            const url = `${this.config.baseUrl}${endpoint}`;
            const response = await fetch(url, {
                ...options,
                headers: {
                    'Content-Type': 'application/json',
                    ...options.headers
                }
            });

            const responseData = await response.json();

            if (!response.ok || !responseData.success) {
                throw new Error(responseData.message || `HTTP ${response.status}`);
            }

            return responseData.data;
        };

        // Load books data during page load for better performance
        const books = await customApiClient.getBooks();

        // Load tags data as well
        const tags = await customApiClient.getTags();

        return {
            books,
            tags,
            // Add cache headers for better performance
            cache: {
                maxAge: 60, // Cache for 1 minute
                staleWhileRevalidate: 300 // Allow stale content for 5 minutes while revalidating
            }
        };
    } catch (err) {
        console.error('Failed to load wishlist data:', err);

        // Don't throw error, let the component handle loading
        // This allows the app to work even if SSR fails
        return {
            books: [],
            tags: [],
            loadError: err instanceof Error ? err.message : 'Failed to load data'
        };
    }
};

// Enable prerendering for better performance
export const prerender = false; // Keep false since we have dynamic data

// Enable client-side navigation caching
export const csr = true;

// Enable server-side rendering
export const ssr = true;