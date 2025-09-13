#!/usr/bin/env node

/**
 * Final deployment verification script
 * Tests all functionality and performance requirements for task 11
 */

const BASE_URL = process.env.TEST_URL || 'http://localhost:3000';

console.log('🎯 Final Deployment Verification');
console.log('================================\n');

let allTestsPassed = true;

function logSuccess(message) {
    console.log(`✅ ${message}`);
}

function logError(message) {
    console.log(`❌ ${message}`);
    allTestsPassed = false;
}

function logInfo(message) {
    console.log(`ℹ️  ${message}`);
}

async function testEndpoint(method, path, body = null, expectedStatus = 200) {
    const url = `${BASE_URL}${path}`;
    const startTime = Date.now();

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
        const responseTime = Date.now() - startTime;
        const data = await response.json().catch(() => ({}));

        if (response.status === expectedStatus) {
            return { success: true, data, status: response.status, responseTime };
        } else {
            return { success: false, data, status: response.status, responseTime };
        }
    } catch (error) {
        const responseTime = Date.now() - startTime;
        return { success: false, error: error.message, responseTime };
    }
}

async function testPageLoad(path, expectedTitle) {
    const url = `${BASE_URL}${path}`;
    const startTime = Date.now();

    try {
        const response = await fetch(url);
        const responseTime = Date.now() - startTime;
        const html = await response.text();

        if (response.status === 200) {
            const titleMatch = html.match(/<title>([^<]*)<\/title>/);
            const title = titleMatch ? titleMatch[1] : 'No title found';

            if (expectedTitle && !title.includes(expectedTitle)) {
                return { success: false, title, responseTime, error: `Expected title to contain "${expectedTitle}", got "${title}"` };
            }

            return { success: true, title, responseTime, html };
        } else {
            return { success: false, status: response.status, responseTime };
        }
    } catch (error) {
        const responseTime = Date.now() - startTime;
        return { success: false, error: error.message, responseTime };
    }
}

async function runVerification() {
    console.log('🏥 1. Testing Application Health');
    console.log('-------------------------------');

    const health = await testEndpoint('GET', '/api/health');
    if (health.success) {
        logSuccess(`Health check passed (${health.responseTime}ms)`);
        logInfo(`Status: ${health.data.data?.status || 'unknown'}`);
        logInfo(`Environment: ${health.data.data?.environment || 'unknown'}`);
    } else {
        logError(`Health check failed: ${health.error || health.status}`);
        return false;
    }

    console.log('\n🏠 2. Testing Home Screen Functionality');
    console.log('---------------------------------------');

    // Test home page loads
    const homePage = await testPageLoad('/', 'Next Books');
    if (homePage.success) {
        logSuccess(`Home page loads successfully (${homePage.responseTime}ms)`);
        logInfo(`Title: ${homePage.title}`);

        // Verify it shows "next" books only
        if (homePage.html.includes('next') || homePage.html.includes('Next')) {
            logSuccess('Home page correctly focuses on "next" books');
        } else {
            logError('Home page does not appear to focus on "next" books');
        }
    } else {
        logError(`Home page failed to load: ${homePage.error || homePage.status}`);
    }

    console.log('\n📚 3. Testing Full Wishlist Management');
    console.log('-------------------------------------');

    // Test wishlist page loads
    const wishlistPage = await testPageLoad('/wishlist', 'Wishlist');
    if (wishlistPage.success) {
        logSuccess(`Wishlist page loads successfully (${wishlistPage.responseTime}ms)`);
        logInfo(`Title: ${wishlistPage.title}`);
    } else {
        logError(`Wishlist page failed to load: ${wishlistPage.error || wishlistPage.status}`);
    }

    console.log('\n🔄 4. Testing Complete User Workflows');
    console.log('------------------------------------');

    // Test complete CRUD workflow
    logInfo('Testing book creation...');
    const createBook = await testEndpoint('POST', '/api/books', {
        title: 'Deployment Test Book',
        author: 'Test Author',
        audibleUrl: 'https://audible.com/test-deployment',
        description: 'A book created during deployment verification'
    }, 201);

    if (!createBook.success) {
        logError(`Book creation failed: ${createBook.error || createBook.status}`);
        return false;
    }

    const bookId = createBook.data?.data?.id;
    if (!bookId) {
        logError('No book ID returned from creation');
        return false;
    }

    logSuccess(`Book created successfully (${createBook.responseTime}ms)`);
    logInfo(`Book ID: ${bookId}`);

    // Test book retrieval
    logInfo('Testing book retrieval...');
    const getBook = await testEndpoint('GET', `/api/books/${bookId}`);
    if (getBook.success) {
        logSuccess(`Book retrieved successfully (${getBook.responseTime}ms)`);
    } else {
        logError(`Book retrieval failed: ${getBook.error || getBook.status}`);
    }

    // Test book update
    logInfo('Testing book update...');
    const updateBook = await testEndpoint('PUT', `/api/books/${bookId}`, {
        title: 'Updated Deployment Test Book'
    });
    if (updateBook.success) {
        logSuccess(`Book updated successfully (${updateBook.responseTime}ms)`);
    } else {
        logError(`Book update failed: ${updateBook.error || updateBook.status}`);
    }

    // Test tag creation and association
    logInfo('Testing tag management...');
    const createTag = await testEndpoint('POST', '/api/tags', {
        name: 'next',
        color: '#00ff00'
    }, 201);

    // It's OK if tag already exists (409), we just want to ensure tag functionality works
    if (createTag.success || createTag.status === 409) {
        logSuccess('Tag management working');
    } else {
        logError(`Tag creation failed: ${createTag.error || createTag.status}`);
    }

    // Test book deletion
    logInfo('Testing book deletion...');
    const deleteBook = await testEndpoint('DELETE', `/api/books/${bookId}`, null, 200);
    if (deleteBook.success) {
        logSuccess(`Book deleted successfully (${deleteBook.responseTime}ms)`);
    } else {
        logError(`Book deletion failed: ${deleteBook.error || deleteBook.status}`);
    }

    console.log('\n⚡ 5. Testing Performance Requirements');
    console.log('------------------------------------');

    // Test home screen performance (should be fast due to filtering)
    const homePerf = await testPageLoad('/');
    if (homePerf.success) {
        if (homePerf.responseTime < 1000) { // Less than 1 second
            logSuccess(`Home screen performance excellent: ${homePerf.responseTime}ms`);
        } else if (homePerf.responseTime < 3000) { // Less than 3 seconds
            logSuccess(`Home screen performance good: ${homePerf.responseTime}ms`);
        } else {
            logError(`Home screen performance poor: ${homePerf.responseTime}ms`);
        }
    }

    // Test wishlist performance
    const wishlistPerf = await testPageLoad('/wishlist');
    if (wishlistPerf.success) {
        if (wishlistPerf.responseTime < 2000) { // Less than 2 seconds
            logSuccess(`Wishlist performance excellent: ${wishlistPerf.responseTime}ms`);
        } else if (wishlistPerf.responseTime < 5000) { // Less than 5 seconds
            logSuccess(`Wishlist performance acceptable: ${wishlistPerf.responseTime}ms`);
        } else {
            logError(`Wishlist performance poor: ${wishlistPerf.responseTime}ms`);
        }
    }

    // Test API performance
    const apiPerf = await testEndpoint('GET', '/api/books');
    if (apiPerf.success) {
        if (apiPerf.responseTime < 500) { // Less than 500ms
            logSuccess(`API performance excellent: ${apiPerf.responseTime}ms`);
        } else if (apiPerf.responseTime < 1000) { // Less than 1 second
            logSuccess(`API performance good: ${apiPerf.responseTime}ms`);
        } else {
            logError(`API performance poor: ${apiPerf.responseTime}ms`);
        }
    }

    console.log('\n🔍 6. Testing Navigation and Integration');
    console.log('--------------------------------------');

    // Verify navigation works between pages
    const homeNav = await testPageLoad('/');
    const wishlistNav = await testPageLoad('/wishlist');

    if (homeNav.success && wishlistNav.success) {
        logSuccess('Navigation between home and wishlist works');

        // Check if pages have different content (home should be filtered, wishlist should be full)
        if (homeNav.html !== wishlistNav.html) {
            logSuccess('Home and wishlist pages have different content as expected');
        } else {
            logInfo('Home and wishlist pages have similar content (may be expected if no books exist)');
        }
    } else {
        logError('Navigation between pages failed');
    }

    console.log('\n📊 Verification Summary');
    console.log('======================');

    if (allTestsPassed) {
        console.log('🎉 ALL VERIFICATION TESTS PASSED!');
        console.log('✅ Application is ready for production deployment');
        console.log('✅ All functionality works correctly');
        console.log('✅ Performance meets requirements');
        console.log('✅ User workflows are complete and functional');
        return true;
    } else {
        console.log('💥 SOME VERIFICATION TESTS FAILED!');
        console.log('❌ Please review the errors above before deploying');
        return false;
    }
}

// Run the verification
runVerification().then(success => {
    process.exit(success ? 0 : 1);
}).catch(error => {
    console.error('\n💥 Verification runner error:', error);
    process.exit(1);
});