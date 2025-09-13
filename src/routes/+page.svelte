<script lang="ts">
    import { onMount } from "svelte";
    import type { PageData } from "./$types";
    import type { Book } from "$lib/types/book";
    import { NextBookCard } from "$lib/components";
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
     * Remove book from "next" reading queue using shared store
     */
    async function handleRemoveFromNext(event: CustomEvent<{ book: Book }>) {
        const book = event.detail.book;

        // Prevent multiple operations on the same book
        if (currentUpdatingBooks.has(book.id)) {
            return;
        }

        // Use shared store action to toggle next tag (will remove it since it exists)
        await bookActions.toggleNextTag(book.id);
    }

    /**
     * Navigate to book details (wishlist page with book selected)
     */
    function handleViewDetails(event: CustomEvent<{ book: Book }>) {
        const book = event.detail.book;
        // Navigate to wishlist with the book ID as a query parameter for highlighting
        window.location.href = `/wishlist?highlight=${book.id}`;
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
    <!-- Enhanced Header with Better Visual Hierarchy -->
    <div class="mb-8">
        <div
            class="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6"
        >
            <!-- Title Section -->
            <div class="flex-1">
                <div class="flex items-center gap-3 mb-2">
                    <div class="text-4xl">📖</div>
                    <h1
                        class="text-4xl font-bold bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent"
                    >
                        Next Books to Read
                    </h1>
                </div>
                <p class="text-base-content/70 text-lg">
                    Your focused reading queue - books you've marked as "next to
                    read"
                </p>
                {#if currentNextBooks.length > 0}
                    <div class="mt-2">
                        <div class="badge badge-primary badge-lg">
                            {currentNextBooks.length} book{currentNextBooks.length ===
                            1
                                ? ""
                                : "s"} in queue
                        </div>
                    </div>
                {/if}
            </div>

            <!-- Action Buttons -->
            <div
                class="flex flex-col sm:flex-row items-stretch sm:items-center gap-3"
            >
                <!-- View All Books Button - Primary CTA -->
                <a href="/wishlist" class="btn btn-primary btn-lg gap-2">
                    <svg
                        xmlns="http://www.w3.org/2000/svg"
                        class="h-5 w-5"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                    >
                        <path
                            stroke-linecap="round"
                            stroke-linejoin="round"
                            stroke-width="2"
                            d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"
                        />
                    </svg>
                    Manage Full Wishlist
                </a>

                <!-- Refresh Button -->
                <button
                    class="btn btn-outline"
                    class:loading={isRefreshing}
                    on:click={retryLoad}
                    disabled={loading || isRefreshing}
                    title="Refresh reading queue"
                >
                    {#if !isRefreshing}
                        <svg
                            xmlns="http://www.w3.org/2000/svg"
                            class="h-5 w-5"
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
                    {/if}
                    {isRefreshing ? "Refreshing..." : "Refresh"}
                </button>
            </div>
        </div>
    </div>

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
        <!-- Enhanced Empty State with Better Visual Design -->
        <div class="text-center py-16">
            <div class="mb-8">
                <!-- Animated Book Icon -->
                <div class="relative mx-auto w-32 h-32 mb-6">
                    <div
                        class="absolute inset-0 bg-gradient-to-br from-primary/20 to-secondary/20 rounded-full animate-pulse"
                    ></div>
                    <svg
                        xmlns="http://www.w3.org/2000/svg"
                        class="h-20 w-20 mx-auto text-base-content/40 absolute inset-0 m-auto"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                    >
                        <path
                            stroke-linecap="round"
                            stroke-linejoin="round"
                            stroke-width="1"
                            d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.746 0 3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"
                        />
                    </svg>
                </div>
            </div>

            <h2 class="text-3xl font-bold mb-4 text-base-content">
                Your Reading Queue is Empty
            </h2>
            <p class="text-base-content/70 text-lg mb-8 max-w-2xl mx-auto">
                Mark books as "next to read" from your wishlist to create a
                focused reading queue. This helps you concentrate on what to
                read next without getting overwhelmed by your entire collection.
            </p>

            <!-- Call to Action Cards -->
            <div
                class="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-2xl mx-auto mb-8"
            >
                <div class="card bg-base-200 shadow-lg">
                    <div class="card-body text-center">
                        <div class="text-3xl mb-2">📚</div>
                        <h3 class="card-title justify-center mb-2">
                            Browse Wishlist
                        </h3>
                        <p class="text-sm text-base-content/70 mb-4">
                            Explore your full collection and mark books as "next
                            to read"
                        </p>
                        <a href="/wishlist" class="btn btn-primary">
                            <svg
                                xmlns="http://www.w3.org/2000/svg"
                                class="h-5 w-5 mr-2"
                                fill="none"
                                viewBox="0 0 24 24"
                                stroke="currentColor"
                            >
                                <path
                                    stroke-linecap="round"
                                    stroke-linejoin="round"
                                    stroke-width="2"
                                    d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"
                                />
                            </svg>
                            View Wishlist
                        </a>
                    </div>
                </div>

                <div class="card bg-base-200 shadow-lg">
                    <div class="card-body text-center">
                        <div class="text-3xl mb-2">🔄</div>
                        <h3 class="card-title justify-center mb-2">
                            Refresh Data
                        </h3>
                        <p class="text-sm text-base-content/70 mb-4">
                            Check for any recently marked books in your queue
                        </p>
                        <button
                            class="btn btn-outline"
                            on:click={retryLoad}
                            disabled={loading || isRefreshing}
                        >
                            <svg
                                xmlns="http://www.w3.org/2000/svg"
                                class="h-5 w-5 mr-2"
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
                            Refresh Queue
                        </button>
                    </div>
                </div>
            </div>
        </div>
    {:else}
        <!-- Reading Queue Grid with Optimized Layout -->
        <div class="space-y-6">
            <!-- Queue Stats -->
            <div class="flex items-center justify-between">
                <div class="flex items-center gap-4">
                    <h2 class="text-xl font-semibold">Your Reading Queue</h2>
                    <div class="badge badge-outline">
                        {currentNextBooks.length} book{currentNextBooks.length ===
                        1
                            ? ""
                            : "s"}
                    </div>
                </div>

                <!-- Quick Actions -->
                <div class="hidden sm:flex items-center gap-2">
                    <div class="text-sm text-base-content/70">
                        Focus on what's next
                    </div>
                </div>
            </div>

            <!-- Responsive Grid for Next Books -->
            <div
                class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6"
            >
                {#each currentNextBooks as book (book.id)}
                    <NextBookCard
                        {book}
                        isUpdating={currentUpdatingBooks.has(book.id)}
                        on:removeFromNext={handleRemoveFromNext}
                        on:viewDetails={handleViewDetails}
                    />
                {/each}
            </div>

            <!-- Bottom Navigation Hint -->
            <div class="text-center pt-8 border-t border-base-300">
                <p class="text-base-content/60 mb-4">
                    Need to add more books to your queue?
                </p>
                <a href="/wishlist" class="btn btn-outline btn-wide">
                    <svg
                        xmlns="http://www.w3.org/2000/svg"
                        class="h-5 w-5 mr-2"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                    >
                        <path
                            stroke-linecap="round"
                            stroke-linejoin="round"
                            stroke-width="2"
                            d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"
                        />
                    </svg>
                    Browse Full Wishlist
                </a>
            </div>
        </div>
    {/if}
</div>

<!-- Toast Notifications -->
<Toast />
