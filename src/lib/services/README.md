# Services Module

This module provides comprehensive services for the Audiobook Wishlist Manager, including local storage management and Audible URL parsing.

## Overview

The services module consists of four main services:

1. **LocalStorageService** - Local data management and offline functionality
2. **ConfigManager** - Local configuration and credential management  
3. **ApiClient** - Backend API communication for data synchronization
4. **AudibleParser** - Audible URL parsing and metadata extraction

## Features

- ✅ Robust local storage management with data validation
- ✅ Automatic backup and recovery mechanisms
- ✅ Audible URL parsing and metadata extraction

## Quick Start

### 1. Local Storage Operations

```typescript
import { LocalStorageService } from '$lib/services';

// Load data from local storage
const result = LocalStorageService.loadData();
if (result.success) {
    console.log('Books:', result.data.books);
}

// Save data to local storage
const saveResult = LocalStorageService.saveData(wishlistData);
if (saveResult.success) {
    console.log('Data saved successfully');
}
```

### 2. Parse Audible URLs

```typescript
import { parseAudibleUrl, isValidAudibleUrl } from '$lib/services';

// Check if URL is valid
if (isValidAudibleUrl(url)) {
    // Parse metadata
    const result = parseAudibleUrl(url);
    if (result.success) {
        console.log('Title:', result.metadata.title);
        console.log('Author:', result.metadata.author);
    }
}
```

## Configuration Management

The ConfigManager handles local configuration storage:

```typescript
import { ConfigManager } from '$lib/services';

// Get current configuration
const config = ConfigManager.getConfig();

// Clear configuration
ConfigManager.clearConfig();
```

## LocalStorageService

Manages local data storage with automatic validation and error handling.

```typescript
import { LocalStorageService } from '$lib/services';

// Load wishlist data
const loadResult = LocalStorageService.loadData();
if (loadResult.success) {
    const wishlistData = loadResult.data;
    console.log(`Loaded ${wishlistData.books.length} books`);
} else {
    console.error('Failed to load data:', loadResult.error);
}

// Save wishlist data
const saveResult = LocalStorageService.saveData(wishlistData);
if (!saveResult.success) {
    console.error('Failed to save data:', saveResult.error);
}

// Clear all data
LocalStorageService.clearData();

// Get storage statistics
const stats = LocalStorageService.getStorageStats();
console.log(`Storage used: ${stats.usedSpace}, Available: ${stats.availableSpace}`);
```

## API Reference

### LocalStorageService

Manages local data storage and retrieval.

### ConfigManager

Manages local storage of configuration and credentials.

```typescript
// Get configuration
const config = ConfigManager.getConfig();

// Clear all configuration
ConfigManager.clearConfig();
```

### ApiClient

Backend API communication service for data synchronization.

```typescript
import { apiClient } from '$lib/services/api-client';

// Get all books from API
const books = await apiClient.getBooks();

// Create a new book
const newBook = await apiClient.createBook({
    title: 'The Hobbit',
    author: 'J.R.R. Tolkien',
    tags: []
});

// Update a book
const updatedBook = await apiClient.updateBook(bookId, {
    narratorRating: 5
});

// Delete a book
await apiClient.deleteBook(bookId);

// Check API health
const health = await apiClient.healthCheck();
```

### AudibleParser

Parses Audible URLs and extracts metadata.

```typescript
import { parseAudibleUrl, isValidAudibleUrl } from '$lib/services';

// Validate URL
const isValid = isValidAudibleUrl('https://www.audible.com/pd/Book-Title/B123456789');

// Parse metadata
const result = parseAudibleUrl(url);
if (result.success) {
    console.log('Metadata:', result.metadata);
} else {
    console.error('Parse error:', result.error);
}
```

## Error Handling

All services use comprehensive error handling:

```typescript
import { ErrorLogger } from '$lib/services';

try {
    // Service operations
} catch (error) {
    ErrorLogger.error('Operation failed', error, 'ComponentName');
}
```

## Data Format

The services handle `WishlistData` objects with automatic date serialization:

```typescript
interface WishlistData {
    books: Book[];
    lastUpdated: string; // ISO date string
}

interface Book {
    id: string;
    title: string;
    author: string;
    audibleUrl: string;
    dateAdded: string;
    tags: Tag[];
    // ... other properties
}
```

## Offline Support

The services automatically handle offline scenarios:

- Local storage is used as primary data storage
- Changes are persisted locally
- Data validation ensures integrity

## Security Considerations

- Configuration data is stored in localStorage
- All data operations are performed locally
- No external API calls for core functionality

## Testing

The services include comprehensive test coverage:

```bash
npm test -- src/lib/services
```

The tests cover:
- Local storage operations
- Data validation and serialization
- Error handling scenarios
- URL parsing functionality

## Troubleshooting

Common issues and solutions:

1. **Storage Quota Exceeded**
   - Clear old data or export to free space
   - Check browser storage limits

2. **Data Corruption**
   - Use the built-in data validation
   - Restore from backup if available

3. **Parse Errors**
   - Verify Audible URL format
   - Check for supported regions

4. **Storage Quota**
   - Browser localStorage has size limits
   - Consider data cleanup for large wishlists