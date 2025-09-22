/**
 * Core data models for the Audiobook Wishlist Manager
 */

export interface Book {
    id: string;
    title: string;
    author: string;
    tags: BookTag[];
    narratorRating?: number;
    performanceRating?: number;
    dateAdded: Date;
    queuePosition?: number;
    coverImageUrl?: string;
    description?: string;
    highlyRatedFor?: string;
}

export interface BookTag {
    id: string;
    name: string;
    color: string;
}

export interface WishlistState {
    books: Book[];
    filters: FilterState;
    syncStatus: 'synced' | 'syncing' | 'offline' | 'error';
}

export interface FilterState {
    searchQuery: string;
    selectedTags: string[];
    sortBy: 'dateAdded' | 'title' | 'author' | 'narratorRating' | 'performanceRating';
    sortOrder: 'asc' | 'desc';
}

export interface WishlistData {
    books: Book[];
    lastUpdated: string;
}

// Type for creating a new book (without generated fields)
export interface CreateBookInput {
    title: string;
    author: string;
    tags?: BookTag[];
    narratorRating?: number;
    performanceRating?: number;
    queuePosition?: number;
    coverImageUrl?: string;
    description?: string;
    highlyRatedFor?: string;
}

// Type for updating an existing book
export interface UpdateBookInput extends Partial<CreateBookInput> {
    id: string;
}