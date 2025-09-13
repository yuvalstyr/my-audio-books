/**
 * Example usage of the Audible URL parsing service
 */

import { parseAudibleUrl, isValidAudibleUrl } from '../audible-parser';

/**
 * Example: Basic Audible URL validation
 */
export function exampleUrlValidation() {
    const urls = [
        'https://www.audible.com/pd/The-Great-Book/B123456789',
        'https://audible.co.uk/pd/UK-Book/B987654321',
        'https://google.com',
        'not-a-url'
    ];

    console.log('URL Validation Examples:');
    urls.forEach(url => {
        const isValid = isValidAudibleUrl(url);
        console.log(`${url} -> ${isValid ? 'Valid' : 'Invalid'}`);
    });
}

/**
 * Example: Parsing Audible URLs for metadata
 */
export async function exampleUrlParsing() {
    const testUrls = [
        'https://www.audible.com/pd/The-Lord-of-the-Rings/B123456789',
        'https://audible.com/pd/Harry-Potter-and-the-Sorcerers-Stone/B987654321',
        'https://www.audible.co.uk/pd/Sherlock-Holmes-Collection/B111111111'
    ];

    console.log('\nURL Parsing Examples:');

    for (const url of testUrls) {
        console.log(`\nParsing: ${url}`);

        try {
            const result = await parseAudibleUrl(url);

            if (result.success && result.metadata) {
                console.log('✓ Success! Extracted metadata:');
                if (result.metadata.title) {
                    console.log(`  Title: ${result.metadata.title}`);
                }
                if (result.metadata.author) {
                    console.log(`  Author: ${result.metadata.author}`);
                }
                if (result.metadata.narratorRating) {
                    console.log(`  Narrator Rating: ${result.metadata.narratorRating}`);
                }
                if (result.metadata.description) {
                    console.log(`  Description: ${result.metadata.description.substring(0, 100)}...`);
                }
            } else {
                console.log(`✗ Failed: ${result.error}`);
                console.log('  → Fallback to manual entry');
            }
        } catch (error) {
            console.log(`✗ Error: ${error}`);
            console.log('  → Graceful fallback to manual entry');
        }
    }
}

/**
 * Example: Integration with BookForm component
 */
export function exampleBookFormIntegration() {
    console.log('\nBookForm Integration Example:');
    console.log('1. User pastes Audible URL into form');
    console.log('2. Form automatically validates URL format');
    console.log('3. If valid, form attempts to extract metadata');
    console.log('4. Extracted data populates empty form fields');
    console.log('5. User can review and modify before saving');
    console.log('6. If parsing fails, user enters data manually');
    console.log('\nThis provides a seamless experience with graceful fallback!');
}

/**
 * Run all examples
 */
export async function runAllExamples() {
    exampleUrlValidation();
    await exampleUrlParsing();
    exampleBookFormIntegration();
}

// Uncomment to run examples in development
// runAllExamples().catch(console.error);