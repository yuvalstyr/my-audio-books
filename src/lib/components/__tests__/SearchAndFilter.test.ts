import { describe, it, expect, beforeEach } from 'vitest';
import { get } from 'svelte/store';
import { filterStore, filterActions } from '$lib/stores/filter-store';

describe('SearchAndFilter Component Integration', () => {
    beforeEach(() => {
        // Reset filter store before each test
        filterActions.clearFilters();
    });

    it('should have access to filter store', () => {
        const state = get(filterStore);
        expect(state).toBeDefined();
        expect(state.searchQuery).toBe('');
        expect(state.selectedTags).toEqual([]);
    });

    it('should update filter store through actions', () => {
        // Test search query
        filterActions.setSearchQuery('test search');
        let state = get(filterStore);
        expect(state.searchQuery).toBe('test search');

        // Test tag toggle
        filterActions.toggleTag('funny');
        state = get(filterStore);
        expect(state.selectedTags).toContain('funny');

        // Test sort options
        filterActions.setSortBy('title');
        filterActions.setSortOrder('asc');
        state = get(filterStore);
        expect(state.sortBy).toBe('title');
        expect(state.sortOrder).toBe('asc');
    });

    it('should clear all filters', () => {
        // Set some filters
        filterActions.setSearchQuery('test');
        filterActions.toggleTag('action');
        filterActions.setSortBy('author');

        // Clear all
        filterActions.clearFilters();

        const state = get(filterStore);
        expect(state.searchQuery).toBe('');
        expect(state.selectedTags).toEqual([]);
        expect(state.sortBy).toBe('title');
        expect(state.sortOrder).toBe('asc');
    });

    it('should handle multiple tag selections', () => {
        filterActions.toggleTag('funny');
        filterActions.toggleTag('action');
        filterActions.toggleTag('series');

        let state = get(filterStore);
        expect(state.selectedTags).toEqual(['funny', 'action', 'series']);

        // Toggle off one tag
        filterActions.toggleTag('action');
        state = get(filterStore);
        expect(state.selectedTags).toEqual(['funny', 'series']);
    });

    it('should validate available tag options', () => {
        const availableTags = ['next', 'funny', 'action', 'series', 'standalone', 'thriller'];

        availableTags.forEach(tag => {
            filterActions.toggleTag(tag);
        });

        const state = get(filterStore);
        expect(state.selectedTags).toEqual(availableTags);
    });

    it('should validate sort options', () => {
        const sortOptions = ['dateAdded', 'title', 'author', 'narratorRating', 'performanceRating'];

        sortOptions.forEach(sortBy => {
            filterActions.setSortBy(sortBy as any);
            const state = get(filterStore);
            expect(state.sortBy).toBe(sortBy);
        });
    });
});