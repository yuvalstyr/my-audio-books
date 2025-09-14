<script lang="ts">
    import { filterStore, filterActions } from "$lib/stores/filter-store";
    import type { FilterState } from "$lib/types/book";

    // Available tag options
    const availableTags = [
        { name: "next", label: "Next to Read", color: "badge-primary" },
        { name: "funny", label: "Funny", color: "badge-accent" },
        { name: "action", label: "Action", color: "badge-warning" },
        { name: "series", label: "Series", color: "badge-info" },
        { name: "standalone", label: "Standalone", color: "badge-success" },
        { name: "thriller", label: "Thriller", color: "badge-error" },
    ];

    // Sort options
    const sortOptions: Array<{ value: FilterState["sortBy"]; label: string }> =
        [
            { value: "dateAdded", label: "Date Added" },
            { value: "title", label: "Title" },
            { value: "author", label: "Author" },
            { value: "narratorRating", label: "Narrator Rating" },
            { value: "performanceRating", label: "Performance Rating" },
        ];

    let showFilters = false;

    function handleSearchInput(event: Event) {
        const target = event.target as HTMLInputElement;
        filterActions.setSearchQuery(target.value);
    }

    function handleTagToggle(tagName: string) {
        filterActions.toggleTag(tagName);
    }

    function handleSortChange(event: Event) {
        const target = event.target as HTMLSelectElement;
        filterActions.setSortBy(target.value as FilterState["sortBy"]);
    }

    function handleSortOrderToggle() {
        filterStore.update((state) => ({
            ...state,
            sortOrder: state.sortOrder === "asc" ? "desc" : "asc",
        }));
    }

    function clearAllFilters() {
        filterActions.clearFilters();
        showFilters = false;
    }
</script>

<div
    class="search-and-filter bg-base-100/95 backdrop-blur-sm p-4 rounded-lg shadow-lg border border-base-300/50 mb-6"
>
    <!-- Search Bar -->
    <div class="flex flex-col sm:flex-row gap-4 mb-4">
        <div class="flex-1">
            <div class="form-control">
                <div class="relative">
                    <div
                        class="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none"
                    >
                        <svg
                            xmlns="http://www.w3.org/2000/svg"
                            class="h-5 w-5 text-base-content/50"
                            fill="none"
                            viewBox="0 0 24 24"
                            stroke="currentColor"
                        >
                            <path
                                stroke-linecap="round"
                                stroke-linejoin="round"
                                stroke-width="2"
                                d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                            />
                        </svg>
                    </div>
                    <input
                        type="text"
                        placeholder="Search by title or author..."
                        class="input input-bordered w-full pl-10 bg-base-100 border-base-300/60 focus:border-primary/40 focus:ring-0 focus:outline-none {$filterStore.searchQuery
                            ? 'pr-12'
                            : ''}"
                        value={$filterStore.searchQuery}
                        on:input={handleSearchInput}
                    />
                    {#if $filterStore.searchQuery}
                        <div
                            class="absolute inset-y-0 right-0 pr-3 flex items-center"
                        >
                            <button
                                class="btn btn-ghost btn-xs btn-circle"
                                on:click={() =>
                                    filterActions.setSearchQuery("")}
                                aria-label="Clear search"
                            >
                                <svg
                                    xmlns="http://www.w3.org/2000/svg"
                                    class="h-4 w-4"
                                    fill="none"
                                    viewBox="0 0 24 24"
                                    stroke="currentColor"
                                >
                                    <path
                                        stroke-linecap="round"
                                        stroke-linejoin="round"
                                        stroke-width="2"
                                        d="M6 18L18 6M6 6l12 12"
                                    />
                                </svg>
                            </button>
                        </div>
                    {/if}
                </div>
            </div>
        </div>

        <!-- Filter Toggle Button -->
        <div class="flex gap-2 items-start">
            <button
                class="btn btn-outline btn-sm"
                class:btn-active={showFilters}
                on:click={() => (showFilters = !showFilters)}
            >
                <svg class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.207A1 1 0 013 6.5V4z" />
                </svg>
                {#if $filterStore.selectedTags.length > 0}
                    <span class="badge badge-primary badge-xs ml-1">{$filterStore.selectedTags.length}</span>
                {/if}
            </button>

            {#if $filterStore.searchQuery || $filterStore.selectedTags.length > 0}
                <button class="btn btn-ghost btn-xs" on:click={clearAllFilters}>
                    Clear
                </button>
            {/if}
        </div>
    </div>

    <!-- Expanded Filters -->
    {#if showFilters}
        <div class="border-t border-base-300/40 pt-4 bg-base-200/20 -mx-4 px-4 -mb-4 pb-4 rounded-b-lg">
            <!-- Tag Filters -->
            <div class="mb-4">
                <h4 class="font-semibold mb-3 text-sm text-base-content/80">Filter by Tags:</h4>
                <div class="flex flex-wrap gap-2">
                    {#each availableTags as tag}
                        <label class="cursor-pointer flex items-center gap-2 p-2 rounded-md hover:bg-base-300/30 transition-colors">
                            <input
                                type="checkbox"
                                class="checkbox checkbox-sm checkbox-primary"
                                checked={$filterStore.selectedTags.includes(
                                    tag.name,
                                )}
                                on:change={() => handleTagToggle(tag.name)}
                            />
                            <span
                                class="badge {$filterStore.selectedTags.includes(tag.name) ? tag.color : tag.color + ' badge-outline'} transition-colors"
                            >
                                {tag.label}
                            </span>
                        </label>
                    {/each}
                </div>
            </div>

            <!-- Sort Options -->
            <div class="flex flex-col sm:flex-row gap-4 items-end">
                <div class="form-control flex-1 sm:flex-initial">
                    <label class="label" for="sort-by-select">
                        <span class="label-text text-sm font-semibold text-base-content/80"
                            >Sort by:</span
                        >
                    </label>
                    <select
                        id="sort-by-select"
                        class="select select-bordered select-sm w-full sm:w-auto"
                        value={$filterStore.sortBy}
                        on:change={handleSortChange}
                    >
                        {#each sortOptions as option}
                            <option value={option.value}>{option.label}</option>
                        {/each}
                    </select>
                </div>

                <div class="form-control flex-1 sm:flex-initial">
                    <div class="label">
                        <span class="label-text text-sm font-semibold text-base-content/80"
                            >Order:</span
                        >
                    </div>
                    <button
                        class="btn btn-outline btn-sm w-full sm:w-auto"
                        on:click={handleSortOrderToggle}
                    >
                        {#if $filterStore.sortOrder === "desc"}
                            <svg
                                xmlns="http://www.w3.org/2000/svg"
                                class="h-4 w-4 mr-1"
                                fill="none"
                                viewBox="0 0 24 24"
                                stroke="currentColor"
                            >
                                <path
                                    stroke-linecap="round"
                                    stroke-linejoin="round"
                                    stroke-width="2"
                                    d="M19 14l-7 7m0 0l-7-7m7 7V3"
                                />
                            </svg>
                            Descending
                        {:else}
                            <svg
                                xmlns="http://www.w3.org/2000/svg"
                                class="h-4 w-4 mr-1"
                                fill="none"
                                viewBox="0 0 24 24"
                                stroke="currentColor"
                            >
                                <path
                                    stroke-linecap="round"
                                    stroke-linejoin="round"
                                    stroke-width="2"
                                    d="M5 10l7-7m0 0l7 7m-7-7v18"
                                />
                            </svg>
                            Ascending
                        {/if}
                    </button>
                </div>
            </div>
        </div>
    {/if}
</div>

