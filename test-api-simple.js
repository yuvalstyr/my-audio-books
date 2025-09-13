// Simple API test - run this in the browser console on the preview site
// Or test manually by visiting these URLs:

console.log('Testing API endpoints:');
console.log('1. Health check: /api/health');
console.log('2. Books list: /api/books');
console.log('3. Tags list: /api/tags');

// Test health endpoint
fetch('/api/health')
    .then(response => response.json())
    .then(data => console.log('Health check:', data))
    .catch(error => console.error('Health check failed:', error));

// Test books endpoint
fetch('/api/books')
    .then(response => response.json())
    .then(data => console.log('Books:', data))
    .catch(error => console.error('Books failed:', error));

// Test tags endpoint
fetch('/api/tags')
    .then(response => response.json())
    .then(data => console.log('Tags:', data))
    .catch(error => console.error('Tags failed:', error));