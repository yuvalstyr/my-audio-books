<script lang="ts">
    import { onMount } from "svelte";
    import type { PageData } from "./$types";
    import type { Book } from "$lib/types/book";
    import { BookCard, PageHeader, EmptyState } from "$lib/components";
    import Toast from "$lib/components/Toast.svelte";
    import LoadingState from "$lib/components/LoadingState.svelte";
    import {
        bookActions,
        nextBooks,
        isLoading,
        storeError,
        updatingBooks,
    } from "$lib/stores/book-store";
    import { ErrorLogger } from "$lib/services/error-logger";
    import { NotificationService } from "$lib/services/notification-service";

    // Page data from load function
    export let data: PageData;

    // Reactive state from store
    $: loading = $isLoading;
    $: error = $storeError;
    $: currentNextBooks = $nextBooks;
    $: currentUpdatingBooks = $updatingBooks;

    // Local state for refresh indicator
    let isRefreshing = false;

    // Initialize store with preloaded data and load if needed
    onMount(async () => {
        // Initialize store with preloaded data if available
        if (data.nextBooks && data.nextBooks.length > 0) {
            // Convert next books to full book list for store initialization
            // We'll need to load all books to maintain consistency
            bookActions.initializeWithData(data.nextBooks);
            ErrorLogger.debug(
                `Initialized store with ${data.nextBooks.length} next books`,
                "HomePage.onMount",
            );
        }

        // Load all books if we don't have data or have an error
        if (!data.nextBooks || data.nextBooks.length === 0 || data.loadError) {
            await loadNextBooks();
        }
    });

    /**
     * Load next books using shared store
     */
    async function loadNextBooks(forceRefresh = false) {
        // Prevent multiple simultaneous loads
        if (loading || isRefreshing) return;

        const startTime = Date.now();

        if (forceRefresh) {
            isRefreshing = true;
        }

        try {
            await bookActions.loadBooks(forceRefresh);

            const loadTime = Date.now() - startTime;
            ErrorLogger.debug(
                `${forceRefresh ? "Refreshed" : "Loaded"} books via store in ${loadTime}ms`,
                "HomePage.loadNextBooks",
            );
        } catch (err) {
            const loadTime = Date.now() - startTime;
            ErrorLogger.error(
                `Failed to load books via store`,
                err instanceof Error ? err : undefined,
                "HomePage.loadNextBooks",
                { loadTime, forceRefresh },
            );
        } finally {
            isRefreshing = false;
        }
    }

    /**
     * Handle edit book - navigate to wishlist page
     */
    function handleEditBook(event: CustomEvent<{ book: Book }>) {
        const book = event.detail.book;
        // Navigate to wishlist with the book ID as a query parameter for editing
        window.location.href = `/wishlist?highlight=${book.id}`;
    }

    /**
     * Handle delete book - navigate to wishlist page for deletion
     */
    function handleDeleteBook(event: CustomEvent<{ book: Book }>) {
        const book = event.detail.book;
        // Navigate to wishlist with the book ID as a query parameter for deletion
        window.location.href = `/wishlist?highlight=${book.id}`;
    }

    /**
     * Toggle book's "next" status using shared store
     */
    async function handleToggleNext(event: CustomEvent<{ book: Book }>) {
        const book = event.detail.book;

        // Prevent multiple operations on the same book
        if (currentUpdatingBooks.has(book.id)) {
            return;
        }

        // Use shared store action to toggle next tag
        await bookActions.toggleNextTag(book.id);
    }

    /**
     * Clear error message using shared store
     */
    function clearError() {
        bookActions.clearError();
    }

    /**
     * Retry loading books
     */
    async function retryLoad() {
        await loadNextBooks(true); // Force refresh
    }
</script>

<svelte:head>
    <title>Next Books to Read - My Audiobook Wishlist</title>
</svelte:head>

<div class="container mx-auto p-4 max-w-7xl">
    <!-- Unified Page Header -->
    <PageHeader
        title="Next Books to Read"
        emoji="📖"
        isLoading={loading}
        {isRefreshing}
        onRefresh={retryLoad}
        primaryAction={{
            label: "Manage Full Wishlist",
            href: "/wishlist"
        }}
    />

    <!-- Enhanced Error Alert with Recovery Options -->
    {#if error}
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
                <div class="font-semibold">Unable to load reading queue</div>
                <div class="text-sm opacity-90">{error}</div>
            </div>
            <div class="flex gap-2">
                <button
                    class="btn btn-sm btn-ghost"
                    on:click={retryLoad}
                    disabled={loading || isRefreshing}
                    title="Retry loading data"
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
                <button
                    class="btn btn-sm btn-ghost"
                    on:click={clearError}
                    aria-label="Dismiss error"
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
        </div>
    {/if}

    <!-- Enhanced Loading State -->
    {#if loading && currentNextBooks.length === 0}
        <LoadingState message="Loading your next books to read..." />
    {:else if isRefreshing && currentNextBooks.length > 0}
        <!-- Show refreshing indicator while keeping existing content visible -->
        <div class="mb-4">
            <div class="alert alert-info">
                <svg
                    xmlns="http://www.w3.org/2000/svg"
                    class="stroke-current shrink-0 h-6 w-6 animate-spin"
                    fill="none"
                    viewBox="0 0 24 24"
                >
                    <path
                        stroke-linecap="round"
                        stroke-linejoin="round"
                        stroke-width="2"
                        d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                    />
                </svg>
                <span>Refreshing your reading queue...</span>
            </div>
        </div>
    {/if}

    {#if !loading && currentNextBooks.length === 0 && !error}
        <!-- Unified Empty State -->
        <EmptyState
            icon="📖"
            title="Your Reading Queue is Empty"
            description="Mark books as 'next to read' from your wishlist to create a focused reading queue. This helps you concentrate on what to read next without getting overwhelmed by your entire collection."
            actions={[
                {
                    label: "Browse Wishlist",
                    icon: "📚",
                    href: "/wishlist",
                    variant: "primary"
                },
                {
                    label: "Refresh Queue",
                    icon: "🔄",
                    onClick: retryLoad,
                    variant: "outline"
                }
            ]}
        />
    {:else}
        <!-- Reading Queue Grid with Optimized Layout -->
        <div class="space-y-6">

            <!-- Responsive Grid for Next Books - 1 column on mobile, 2 columns on desktop -->
            <div class="books-grid gap-6">
                {#each currentNextBooks as book (book.id)}
                    <div class="book-item">
                        <BookCard
                            {book}
                            isUpdating={currentUpdatingBooks.has(book.id)}
                            on:edit={handleEditBook}
                            on:delete={handleDeleteBook}
                            on:toggleNext={handleToggleNext}
                        />
                    </div>
                {/each}
            </div>

        </div>
    {/if}
</div>

<!-- Toast Notifications -->
<Toast />

<style>
    /* Match BookList styling for consistent card appearance */
    .books-grid {
        display: grid;
        grid-template-columns: 1fr;
        gap: 1.5rem;
    }

    /* Desktop: 2 columns */
    @media (min-width: 1024px) {
        .books-grid {
            grid-template-columns: 1fr 1fr;
        }
    }

    .book-item {
        height: fit-content;
    }

    /* Ensure consistent card heights in grid */
    .book-item :global(.group) {
        height: 100%;
        display: flex;
        flex-direction: column;
    }
</style>
