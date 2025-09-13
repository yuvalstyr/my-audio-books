/**
 * Audible URL parsing service for extracting book metadata
 * Implements basic metadata extraction with graceful fallback to manual entry
 * 
 * CURRENT LIMITATIONS:
 * - Only extracts title from URL structure (when available in path)
 * - Cannot extract author, ratings, or cover images due to CORS restrictions
 * - Requires actual page scraping for full metadata (future enhancement)
 */

import { ErrorLogger } from './error-logger';

export interface AudibleMetadata {
    title?: string;
    author?: string;
    narratorRating?: number;
    description?: string;
    coverImageUrl?: string;
}

export interface ParseResult {
    success: boolean;
    metadata?: AudibleMetadata;
    error?: string;
}

/**
 * Validates if a URL is a valid Audible URL
 */
export function isValidAudibleUrl(url: string): boolean {
    if (!url || typeof url !== 'string') return false;

    try {
        const parsedUrl = new URL(url);

        // Check if it's an Audible domain
        const validDomains = [
            'audible.com',
            'www.audible.com',
            'audible.co.uk',
            'www.audible.co.uk',
            'audible.ca',
            'www.audible.ca',
            'audible.com.au',
            'www.audible.com.au',
            'audible.de',
            'www.audible.de',
            'audible.fr',
            'www.audible.fr'
        ];

        const isValidDomain = validDomains.some(domain =>
            parsedUrl.hostname === domain || parsedUrl.hostname.endsWith('.' + domain)
        );

        if (!isValidDomain) return false;

        // Check if it's a product page (contains /pd/ in the path)
        return parsedUrl.pathname.includes('/pd/');
    } catch {
        return false;
    }
}

/**
 * Attempts to extract metadata from an Audible URL
 * Uses a simple approach with graceful fallback
 */
export async function parseAudibleUrl(url: string): Promise<ParseResult> {
    // Validate URL first
    if (!isValidAudibleUrl(url)) {
        return {
            success: false,
            error: 'Invalid Audible URL format'
        };
    }

    try {
        // For now, implement a basic approach that attempts to fetch the page
        // In a real implementation, this would need a CORS proxy or server-side parsing

        // Since we can't directly fetch Audible pages due to CORS restrictions,
        // we'll implement a graceful fallback approach

        // Try to extract basic info from the URL structure itself
        const urlMetadata = extractMetadataFromUrl(url);

        if (urlMetadata.title || urlMetadata.author) {
            return {
                success: true,
                metadata: urlMetadata
            };
        }

        // If no metadata could be extracted from URL, return graceful failure
        return {
            success: false,
            error: 'Unable to extract metadata from URL. Please enter details manually.'
        };

    } catch (error) {
        ErrorLogger.error('Error parsing Audible URL', error instanceof Error ? error : undefined, 'AudibleParser.parseAudibleUrl');
        return {
            success: false,
            error: 'Failed to parse Audible URL. Please enter details manually.'
        };
    }
}

/**
 * Attempts to extract basic metadata from the URL structure
 * Some Audible URLs contain title information in the path
 */
function extractMetadataFromUrl(url: string): AudibleMetadata {
    const metadata: AudibleMetadata = {};

    try {
        const parsedUrl = new URL(url);
        const pathParts = parsedUrl.pathname.split('/');

        // Look for title in URL path (some Audible URLs include title after /pd/)
        const pdIndex = pathParts.findIndex(part => part === 'pd');
        if (pdIndex !== -1 && pdIndex + 1 < pathParts.length) {
            const titlePart = pathParts[pdIndex + 1];

            // Clean up the title part (remove hyphens, decode URI components)
            if (titlePart && titlePart !== 'B0' && !titlePart.match(/^[A-Z0-9]+$/)) {
                try {
                    const decodedTitle = decodeURIComponent(titlePart);
                    // Convert hyphens to spaces and title case
                    const cleanTitle = decodedTitle
                        .replace(/-/g, ' ')
                        .replace(/\b\w/g, l => l.toUpperCase());

                    if (cleanTitle.length > 3) {
                        metadata.title = cleanTitle;
                    }
                } catch {
                    // Ignore decoding errors
                }
            }
        }

        // Look for additional metadata in URL parameters
        const searchParams = parsedUrl.searchParams;

        // Some Audible URLs might have ref parameters with useful info
        const ref = searchParams.get('ref');
        if (ref && ref.includes('author')) {
            // This is a very basic attempt - in practice, this would need more sophisticated parsing
        }

    } catch {
        // Ignore URL parsing errors
    }

    return metadata;
}

/**
 * Attempts to fetch and parse Audible page content
 * Note: This is a placeholder for future implementation with CORS proxy
 */
async function fetchAudiblePageContent(url: string): Promise<AudibleMetadata> {
    // This would require a CORS proxy or server-side implementation
    // For now, we'll return empty metadata to maintain graceful fallback

    // Future implementation could use:
    // 1. A CORS proxy service
    // 2. Server-side parsing endpoint
    // 3. Browser extension for direct page access

    throw new Error('Direct page fetching not implemented - CORS restrictions');
}

/**
 * Parses HTML content to extract book metadata
 * This would be used with the fetchAudiblePageContent function
 */
function parseAudiblePageHtml(html: string): AudibleMetadata {
    const metadata: AudibleMetadata = {};

    try {
        // Create a temporary DOM parser (would need DOMParser in browser)
        // This is a placeholder for the actual HTML parsing logic

        // In a real implementation, we would:
        // 1. Parse the HTML using DOMParser
        // 2. Extract title from <title> tag or specific selectors
        // 3. Extract author from author links or metadata
        // 4. Extract narrator rating from rating elements
        // 5. Extract description from product description
        // 6. Extract cover image URL from image elements

        // Example selectors that might be used:
        // - Title: h1[data-asin] or .bc-heading
        // - Author: .authorLabel a or .bc-text
        // - Rating: .bc-rating-stars or similar
        // - Description: .bc-expander-content
        // - Cover: img[alt*="cover"] or .bc-image-inset-border img

    } catch (error) {
        ErrorLogger.error('Error parsing Audible page HTML', error instanceof Error ? error : undefined, 'AudibleParser.parsePageContent');
    }

    return metadata;
}

/**
 * Utility function to clean and validate extracted text
 */
function cleanExtractedText(text: string | null | undefined): string | undefined {
    if (!text || typeof text !== 'string') return undefined;

    const cleaned = text.trim().replace(/\s+/g, ' ');
    return cleaned.length > 0 ? cleaned : undefined;
}

/**
 * Utility function to parse rating from text
 */
function parseRating(ratingText: string | null | undefined): number | undefined {
    if (!ratingText) return undefined;

    const match = ratingText.match(/(\d+(?:\.\d+)?)\s*(?:out of|\/)\s*5/i);
    if (match) {
        const rating = parseFloat(match[1]);
        return rating >= 0 && rating <= 5 ? rating : undefined;
    }

    return undefined;
}