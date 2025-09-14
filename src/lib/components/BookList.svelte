<script lang="ts">
    import type { Book } from "$lib/types/book";
    import { BookCard, SearchAndFilter, EmptyState } from "$lib/components";
    import LoadingState from "./LoadingState.svelte";
    import { createEventDispatcher } from "svelte";
    import { createFilteredBooks } from "$lib/stores/filter-store";

    export let books: Book[] = [];
    export let loading: boolean = false;
    export let error: string | null = null;

    export let updatingBooks: Set<string> = new Set();
    export let deletingBooks: Set<string> = new Set();

    const dispatch = createEventDispatcher<{
        edit: { book: Book };
        delete: { book: Book };
        toggleNext: { book: Book };
        addBook: void;
        retry: void;
    }>();

    // Create filtered books store
    $: filteredBooks = createFilteredBooks(books);

    function handleBookEdit(event: CustomEvent<{ book: Book }>) {
        dispatch("edit", event.detail);
    }

    function handleBookDelete(event: CustomEvent<{ book: Book }>) {
        dispatch("delete", event.detail);
    }

    function handleBookToggleNext(event: CustomEvent<{ book: Book }>) {
        dispatch("toggleNext", event.detail);
    }

    function handleRetry() {
        dispatch("retry");
    }
</script>

<div class="book-list">
    {#if loading}
        <!-- Enhanced Loading State -->
        <LoadingState
            loading={true}
            message="Loading your audiobooks..."
            size="lg"
            type="spinner"
        >
            <div
                slot="skeleton"
                class="grid grid-cols-1 lg:grid-cols-4 gap-6"
            >
                {#each Array(8) as _}
                    <div
                        class="card bg-base-100 shadow-lg border border-base-300 h-full"
                    >
                        <div class="card-body p-4">
                            <div class="flex gap-3 mb-3">
                                <div
                                    class="w-16 h-20 bg-base-300 rounded-md animate-pulse"
                                ></div>
                                <div class="flex-1 space-y-2">
                                    <div
                                        class="h-4 bg-base-300 rounded animate-pulse w-3/4"
                                    ></div>
                                    <div
                                        class="h-3 bg-base-300 rounded animate-pulse w-1/2"
                                    ></div>
                                </div>
                            </div>
                            <div class="space-y-2 mb-4">
                                <div
                                    class="h-3 bg-base-300 rounded animate-pulse w-full"
                                ></div>
                                <div
                                    class="h-3 bg-base-300 rounded animate-pulse w-2/3"
                                ></div>
                            </div>
                            <div class="flex gap-1 mb-4">
                                <div
                                    class="h-5 w-12 bg-base-300 rounded-full animate-pulse"
                                ></div>
                                <div
                                    class="h-5 w-16 bg-base-300 rounded-full animate-pulse"
                                ></div>
                            </div>
                            <div class="flex justify-end gap-1">
                                <div
                                    class="h-8 w-8 bg-base-300 rounded animate-pulse"
                                ></div>
                                <div
                                    class="h-8 w-8 bg-base-300 rounded animate-pulse"
                                ></div>
                                <div
                                    class="h-8 w-8 bg-base-300 rounded animate-pulse"
                                ></div>
                            </div>
                        </div>
                    </div>
                {/each}
            </div>
        </LoadingState>
    {:else if error}
        <!-- Enhanced Error State -->
        <div class="alert alert-error mb-6">
            <svg
                xmlns="http://www.w3.org/2000/svg"
                class="stroke-current shrink-0 h-6 w-6"
                fill="none"
                viewBox="0 0 24 24"
            >
                <path
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    stroke-width="2"
                    d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z"
                />
            </svg>
            <div class="flex-1">
                <div class="font-semibold">Failed to load books</div>
                <div class="text-sm">{error}</div>
            </div>
            <button
                class="btn btn-sm btn-outline"
                on:click={handleRetry}
                disabled={loading}
            >
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
                        d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                    />
                </svg>
                Retry
            </button>
        </div>
    {:else if books.length === 0}
        <!-- Unified Empty State -->
        <EmptyState
            icon="📚"
            title="No books in your wishlist yet"
            description="Start building your audiobook collection by adding your first book. You can paste an Audible link or enter details manually."
            actions={[
                {
                    label: "Add Your First Book",
                    onClick: () => dispatch("addBook"),
                    variant: "primary"
                }
            ]}
        />
    {:else}
        <!-- Search and Filter Controls -->
        <SearchAndFilter />

        {#if $filteredBooks.length === 0}
            <!-- No Results State -->
            <EmptyState
                icon="🔍"
                title="No books match your filters"
                description="Try adjusting your search terms or removing some filters to see more results."
                actions={[]}
            />
        {:else}
            <!-- Books Grid - iPhone 16 to Mac responsive -->
            <div
                class="grid grid-cols-1 lg:grid-cols-4 gap-6"
            >
                {#each $filteredBooks as book (book.id)}
                    <div class="book-item">
                        <BookCard
                            {book}
                            isUpdating={updatingBooks.has(book.id)}
                            isDeleting={deletingBooks.has(book.id)}
                            on:edit={handleBookEdit}
                            on:delete={handleBookDelete}
                            on:toggleNext={handleBookToggleNext}
                        />
                    </div>
                {/each}
            </div>

            <!-- Books Count -->
            <div class="flex justify-center mt-8">
                <div class="stats shadow">
                    <div class="stat">
                        <div class="stat-title">Showing Books</div>
                        <div class="stat-value text-primary">
                            {$filteredBooks.length}
                        </div>
                        <div class="stat-desc">
                            of {books.length} total • {$filteredBooks.filter(
                                (book) =>
                                    book.tags.some(
                                        (tag) => tag.name === "next",
                                    ),
                            ).length} in next queue
                        </div>
                    </div>
                </div>
            </div>
        {/if}
    {/if}
</div>

<style>
    .book-list {
        width: 100%;
    }

    .book-item {
        height: fit-content;
    }

    /* Responsive adjustments for mobile */
    @media (max-width: 640px) {
        .grid {
            grid-template-columns: 1fr;
            gap: 1rem;
        }
    }

    /* Ensure consistent card heights in grid */
    .book-item :global(.card) {
        height: 100%;
        display: flex;
        flex-direction: column;
    }

    .book-item :global(.card-body) {
        flex: 1;
        display: flex;
        flex-direction: column;
    }

    .book-item :global(.card-actions) {
        margin-top: auto;
    }
</style>
