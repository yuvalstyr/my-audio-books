import { writable, derived } from 'svelte/store';
import type { Book, FilterState } from '$lib/types/book';

// Initial filter state
const initialFilterState: FilterState = {
    searchQuery: '',
    selectedTags: [],
    sortBy: 'title',
    sortOrder: 'asc'
};

// Create the filter store
export const filterStore = writable<FilterState>(initialFilterState);

// Helper functions for updating filter state
export const filterActions = {
    setSearchQuery: (query: string) => {
        filterStore.update(state => ({ ...state, searchQuery: query }));
    },

    toggleTag: (tagName: string) => {
        filterStore.update(state => ({
            ...state,
            selectedTags: state.selectedTags.includes(tagName)
                ? state.selectedTags.filter(tag => tag !== tagName)
                : [...state.selectedTags, tagName]
        }));
    },

    setSortBy: (sortBy: FilterState['sortBy']) => {
        filterStore.update(state => ({ ...state, sortBy }));
    },

    setSortOrder: (sortOrder: FilterState['sortOrder']) => {
        filterStore.update(state => ({ ...state, sortOrder }));
    },

    clearFilters: () => {
        filterStore.set(initialFilterState);
    }
};

// Derived store for filtered and sorted books
export function createFilteredBooks(books: Book[]) {
    return derived(
        filterStore,
        ($filterState) => {
            let filteredBooks = [...books];

            // Apply search filter
            if ($filterState.searchQuery.trim()) {
                const query = $filterState.searchQuery.toLowerCase().trim();
                filteredBooks = filteredBooks.filter(book =>
                    book.title.toLowerCase().includes(query) ||
                    book.author.toLowerCase().includes(query)
                );
            }

            // Apply tag filters
            if ($filterState.selectedTags.length > 0) {
                filteredBooks = filteredBooks.filter(book =>
                    $filterState.selectedTags.every(tagName =>
                        book.tags.some(tag => tag.name === tagName)
                    )
                );
            }

            // Apply sorting
            filteredBooks.sort((a, b) => {
                let comparison = 0;

                switch ($filterState.sortBy) {
                    case 'title':
                        comparison = a.title.localeCompare(b.title);
                        break;
                    case 'author':
                        comparison = a.author.localeCompare(b.author);
                        break;
                    case 'dateAdded':
                        comparison = new Date(a.dateAdded).getTime() - new Date(b.dateAdded).getTime();
                        break;
                    case 'performanceRating':
                        comparison = (a.performanceRating || 0) - (b.performanceRating || 0);
                        break;
                    case 'storyRating':
                        comparison = (a.storyRating || 0) - (b.storyRating || 0);
                        break;
                }

                return $filterState.sortOrder === 'desc' ? -comparison : comparison;
            });

            return filteredBooks;
        }
    );
}