import type { PageLoad } from './$types';
import { error } from '@sveltejs/kit';

export const load: PageLoad = async ({ fetch, url }) => {
    const startTime = Date.now();

    try {
        // Create optimized API request for next books only
        // Use query parameter to enable server-side filtering in the future
        const apiUrl = '/api/books?filter=next';

        const response = await fetch(apiUrl, {
            headers: {
                'Content-Type': 'application/json',
                'Accept': 'application/json'
            }
        });

        if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            throw new Error(errorData.message || `HTTP ${response.status}: ${response.statusText}`);
        }

        const responseData = await response.json();

        if (!responseData.success) {
            throw new Error(responseData.message || 'API request failed');
        }

        // Server-side filtering is now applied, so we get only "next" books
        const nextBooks = responseData.data || [];

        const loadTime = Date.now() - startTime;

        // Log performance metrics in development
        if (typeof window === 'undefined') {
            console.log(`[SSR] Loaded ${nextBooks.length} next books in ${loadTime}ms`);
        }

        return {
            nextBooks,
            totalNextBooks: nextBooks.length,
            loadTime,
            loadError: null,
            // Performance metadata
            meta: {
                totalBooks: nextBooks.length, // Now this represents filtered books since we only loaded "next" books
                filteredBooks: nextBooks.length,
                loadTime,
                timestamp: new Date().toISOString(),
                serverFiltered: true // Indicate that filtering was done server-side
            }
        };
    } catch (err) {
        const loadTime = Date.now() - startTime;
        const errorMessage = err instanceof Error ? err.message : 'Unknown error occurred';

        // Log error details for debugging
        console.error('[SSR] Failed to load next books data:', {
            error: errorMessage,
            loadTime,
            url: url.pathname,
            timestamp: new Date().toISOString()
        });

        // Return error state instead of throwing to allow graceful degradation
        // The component can handle the error and show appropriate UI
        return {
            nextBooks: [],
            totalNextBooks: 0,
            loadTime,
            loadError: errorMessage,
            meta: {
                totalBooks: 0,
                filteredBooks: 0,
                loadTime,
                timestamp: new Date().toISOString(),
                errorOccurred: true
            }
        };
    }
};

// Enable prerendering for better performance
export const prerender = false; // Keep false since we have dynamic data

// Enable client-side navigation caching
export const csr = true;

// Enable server-side rendering
export const ssr = true;