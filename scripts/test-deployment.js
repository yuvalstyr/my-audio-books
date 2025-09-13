#!/usr/bin/env node

/**
 * Deployment test script
 * Tests all API endpoints to verify the deployment is working correctly
 */

import { execSync } from 'child_process';

const BASE_URL = process.env.TEST_URL || 'http://localhost:3000';

console.log(`🧪 Testing deployment at: ${BASE_URL}`);

async function testEndpoint(method, path, body = null, expectedStatus = 200) {
    const url = `${BASE_URL}${path}`;
    console.log(`${method} ${path}`);

    try {
        const options = {
            method,
            headers: {
                'Content-Type': 'application/json',
            },
        };

        if (body) {
            options.body = JSON.stringify(body);
        }

        const response = await fetch(url, options);
        const data = await response.json().catch(() => ({}));

        if (response.status === expectedStatus) {
            console.log(`  ✅ ${response.status} - Success`);
            return { success: true, data, status: response.status };
        } else {
            console.log(`  ❌ ${response.status} - Expected ${expectedStatus}`);
            return { success: false, data, status: response.status };
        }
    } catch (error) {
        console.log(`  ❌ Error: ${error.message}`);
        return { success: false, error: error.message };
    }
}

async function runTests() {
    console.log('\n🏥 Testing Health Check...');
    const health = await testEndpoint('GET', '/api/health');

    if (!health.success) {
        console.log('❌ Health check failed - deployment may not be ready');
        return false;
    }

    console.log('\n📚 Testing Books API...');

    // Test GET /api/books (should work even if empty)
    const getBooks = await testEndpoint('GET', '/api/books');
    if (!getBooks.success) return false;

    // Test POST /api/books (create a test book)
    const testBook = {
        title: 'Test Book',
        author: 'Test Author',
        audibleUrl: 'https://audible.com/test',
        description: 'A test book for deployment verification'
    };

    const createBook = await testEndpoint('POST', '/api/books', testBook, 201);
    if (!createBook.success) return false;

    const bookId = createBook.data?.data?.id;
    if (!bookId) {
        console.log('  ❌ No book ID returned from create');
        return false;
    }

    // Test GET /api/books/[id]
    const getBook = await testEndpoint('GET', `/api/books/${bookId}`);
    if (!getBook.success) return false;

    // Test PUT /api/books/[id]
    const updateBook = await testEndpoint('PUT', `/api/books/${bookId}`, {
        title: 'Updated Test Book'
    });
    if (!updateBook.success) return false;

    // Test DELETE /api/books/[id]
    const deleteBook = await testEndpoint('DELETE', `/api/books/${bookId}`, null, 200);
    if (!deleteBook.success) return false;

    console.log('\n🏷️  Testing Tags API...');

    // Test GET /api/tags
    const getTags = await testEndpoint('GET', '/api/tags');
    if (!getTags.success) return false;

    // Test POST /api/tags
    const testTag = {
        name: 'test-tag',
        color: '#ff0000'
    };

    const createTag = await testEndpoint('POST', '/api/tags', testTag, 201);
    if (!createTag.success) return false;

    console.log('\n✅ All tests passed! Deployment is working correctly.');
    return true;
}

// Run the tests
runTests().then(success => {
    if (success) {
        console.log('\n🎉 Deployment test completed successfully!');
        process.exit(0);
    } else {
        console.log('\n💥 Deployment test failed!');
        process.exit(1);
    }
}).catch(error => {
    console.error('\n💥 Test runner error:', error);
    process.exit(1);
});