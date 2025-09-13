import { describe, it, expect, beforeEach } from 'vitest';
import { get } from 'svelte/store';
import { filterStore, filterActions, createFilteredBooks } from '../filter-store';
import type { Book } from '$lib/types/book';

describe('Filter Store', () => {
    beforeEach(() => {
        // Reset filter store before each test
        filterActions.clearFilters();
    });

    describe('filterStore', () => {
        it('should have correct initial state', () => {
            const state = get(filterStore);
            expect(state).toEqual({
                searchQuery: '',
                selectedTags: [],
                sortBy: 'title',
                sortOrder: 'asc'
            });
        });
    });

    describe('filterActions', () => {
        it('should update search query', () => {
            filterActions.setSearchQuery('test query');
            const state = get(filterStore);
            expect(state.searchQuery).toBe('test query');
        });

        it('should toggle tags correctly', () => {
            filterActions.toggleTag('funny');
            let state = get(filterStore);
            expect(state.selectedTags).toContain('funny');

            filterActions.toggleTag('action');
            state = get(filterStore);
            expect(state.selectedTags).toEqual(['funny', 'action']);

            filterActions.toggleTag('funny');
            state = get(filterStore);
            expect(state.selectedTags).toEqual(['action']);
        });

        it('should update sort options', () => {
            filterActions.setSortBy('title');
            filterActions.setSortOrder('asc');

            const state = get(filterStore);
            expect(state.sortBy).toBe('title');
            expect(state.sortOrder).toBe('asc');
        });

        it('should clear all filters', () => {
            filterActions.setSearchQuery('test');
            filterActions.toggleTag('funny');
            filterActions.setSortBy('title');

            filterActions.clearFilters();

            const state = get(filterStore);
            expect(state).toEqual({
                searchQuery: '',
                selectedTags: [],
                sortBy: 'title',
                sortOrder: 'asc'
            });
        });
    });

    describe('createFilteredBooks', () => {
        const mockBooks: Book[] = [
            {
                id: '1',
                title: 'The Hobbit',
                author: 'J.R.R. Tolkien',
                tags: [{ id: '1', name: 'action', color: 'red' }],
                narratorRating: 4.5,
                dateAdded: new Date('2023-01-01')
            },
            {
                id: '2',
                title: 'Funny Book',
                author: 'Comedy Author',
                tags: [{ id: '2', name: 'funny', color: 'blue' }],
                narratorRating: 3.8,
                dateAdded: new Date('2023-02-01')
            },
            {
                id: '3',
                title: 'Action Adventure',
                author: 'Adventure Writer',
                tags: [
                    { id: '3', name: 'action', color: 'red' },
                    { id: '4', name: 'series', color: 'green' }
                ],
                narratorRating: 4.2,
                dateAdded: new Date('2023-03-01')
            }
        ];

        it('should filter by search query (title)', () => {
            const filteredBooks = createFilteredBooks(mockBooks);

            filterActions.setSearchQuery('hobbit');
            const result = get(filteredBooks);

            expect(result).toHaveLength(1);
            expect(result[0].title).toBe('The Hobbit');
        });

        it('should filter by search query (author)', () => {
            const filteredBooks = createFilteredBooks(mockBooks);

            filterActions.setSearchQuery('tolkien');
            const result = get(filteredBooks);

            expect(result).toHaveLength(1);
            expect(result[0].author).toBe('J.R.R. Tolkien');
        });

        it('should filter by tags', () => {
            const filteredBooks = createFilteredBooks(mockBooks);

            filterActions.toggleTag('action');
            const result = get(filteredBooks);

            expect(result).toHaveLength(2);
            expect(result.every(book => book.tags.some(tag => tag.name === 'action'))).toBe(true);
        });

        it('should filter by multiple tags (AND logic)', () => {
            const filteredBooks = createFilteredBooks(mockBooks);

            filterActions.toggleTag('action');
            filterActions.toggleTag('series');
            const result = get(filteredBooks);

            expect(result).toHaveLength(1);
            expect(result[0].title).toBe('Action Adventure');
        });

        it('should sort by title ascending', () => {
            const filteredBooks = createFilteredBooks(mockBooks);

            filterActions.setSortBy('title');
            filterActions.setSortOrder('asc');
            const result = get(filteredBooks);

            expect(result[0].title).toBe('Action Adventure');
            expect(result[1].title).toBe('Funny Book');
            expect(result[2].title).toBe('The Hobbit');
        });

        it('should sort by narrator rating descending', () => {
            const filteredBooks = createFilteredBooks(mockBooks);

            filterActions.setSortBy('narratorRating');
            filterActions.setSortOrder('desc');
            const result = get(filteredBooks);

            expect(result[0].narratorRating).toBe(4.5);
            expect(result[1].narratorRating).toBe(4.2);
            expect(result[2].narratorRating).toBe(3.8);
        });

        it('should sort by title ascending by default', () => {
            const filteredBooks = createFilteredBooks(mockBooks);
            const result = get(filteredBooks);

            // With default sorting (title, asc), books should be in alphabetical order
            expect(result[0].title).toBe('Action Adventure');
            expect(result[1].title).toBe('Funny Book');
            expect(result[2].title).toBe('The Hobbit');
        });

        it('should maintain alphabetical sorting when filters are cleared', () => {
            const filteredBooks = createFilteredBooks(mockBooks);

            // Change sorting to something else
            filterActions.setSortBy('narratorRating');
            filterActions.setSortOrder('desc');

            // Clear filters should return to default alphabetical sorting
            filterActions.clearFilters();
            const result = get(filteredBooks);

            expect(result[0].title).toBe('Action Adventure');
            expect(result[1].title).toBe('Funny Book');
            expect(result[2].title).toBe('The Hobbit');
        });

        it('should combine search and tag filters', () => {
            const filteredBooks = createFilteredBooks(mockBooks);

            filterActions.setSearchQuery('action');
            filterActions.toggleTag('series');
            const result = get(filteredBooks);

            expect(result).toHaveLength(1);
            expect(result[0].title).toBe('Action Adventure');
        });
    });
});