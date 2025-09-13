<script lang="ts">
    import { onMount, tick } from "svelte";
    import type { PageData } from "./$types";
    import type { Book, CreateBookInput, BookTag } from "$lib/types/book";
    import { BookList, BookForm } from "$lib/components";
    import Toast from "$lib/components/Toast.svelte";
    import LoadingState from "$lib/components/LoadingState.svelte";
    import {
        bookActions,
        allBooks,
        isLoading,
        storeError,
        updatingBooks,
    } from "$lib/stores/book-store";
    import { apiClient, getErrorMessage } from "$lib/services/api-client";
    import { ErrorLogger } from "$lib/services/error-logger";
    import { NotificationService } from "$lib/services/notification-service";

    // Page data from load function
    export let data: PageData;

    // Reactive state from store
    $: books = $allBooks;
    $: loading = $isLoading;
    $: error = $storeError;
    $: currentUpdatingBooks = $updatingBooks;

    // Local state
    let tags: BookTag[] = data.tags || [];
    let isRefreshing = false;

    // Modal states
    let showBookForm = false;
    let editingBook: Book | null = null;
    let showDeleteConfirm = false;
    let bookToDelete: Book | null = null;

    // Individual book operation states (for delete operations not handled by store)
    let deletingBooks = new Set<string>();

    // Initialize store with preloaded data and load if needed
    onMount(async () => {
        // Initialize store with preloaded data if available
        if (data.books && data.books.length > 0) {
            bookActions.initializeWithData(data.books);
            ErrorLogger.debug(
                `Initialized store with ${data.books.length} books`,
                "WishlistPage.onMount",
            );
        }

        // Load books if we don't have data or have an error
        if (!data.books || data.books.length === 0 || data.loadError) {
            await loadBooks();
        }
    });

    /**
     * Load books using shared store
     */
    async function loadBooks(forceRefresh = false) {
        // Prevent multiple simultaneous loads
        if (loading || isRefreshing) return;

        if (forceRefresh) {
            isRefreshing = true;
        }

        try {
            // Load books and tags concurrently
            const [, apiTags] = await Promise.all([
                bookActions.loadBooks(forceRefresh),
                apiClient.getTags().catch(() => tags), // Fallback to existing tags if fetch fails
            ]);

            tags = apiTags;

            ErrorLogger.debug(
                `${forceRefresh ? "Refreshed" : "Loaded"} books via store`,
                "WishlistPage.loadBooks",
            );
        } catch (err) {
            const errorMessage = getErrorMessage(err);
            ErrorLogger.error(
                errorMessage,
                undefined,
                "WishlistPage.loadBooks",
            );
            NotificationService.error("Load Error", errorMessage);
        } finally {
            isRefreshing = false;
        }
    }

    /**
     * Add a new book using shared store
     */
    async function handleAddBook(
        event: CustomEvent<{ book: CreateBookInput }>,
    ) {
        const bookInput = event.detail.book;
        showBookForm = false;

        const result = await bookActions.addBook({
            ...bookInput,
            tags: bookInput.tags || [],
        });

        if (result) {
            ErrorLogger.info(
                `Added book: ${result.title}`,
                "WishlistPage.handleAddBook",
            );
        }
    }

    /**
     * Update an existing book using shared store
     */
    async function handleUpdateBook(event: CustomEvent<{ book: Book }>) {
        const updatedBook = event.detail.book;

        const result = await bookActions.updateBook(updatedBook.id, {
            title: updatedBook.title,
            author: updatedBook.author,
            audibleUrl: updatedBook.audibleUrl,
            tags: updatedBook.tags,
            narratorRating: updatedBook.narratorRating,
            performanceRating: updatedBook.performanceRating,
            description: updatedBook.description,
            coverImageUrl: updatedBook.coverImageUrl,
        });

        if (result) {
            showBookForm = false;
            editingBook = null;

            ErrorLogger.info(
                `Updated book: ${result.title}`,
                "WishlistPage.handleUpdateBook",
            );
            NotificationService.operationFeedback("update", true, result.title);
        }
    }

    /**
     * Handle book form save (add or update)
     */
    function handleBookSave(
        event: CustomEvent<{ book: CreateBookInput | Book }>,
    ) {
        const bookData = event.detail.book;

        if ("id" in bookData) {
            // Update existing book
            handleUpdateBook(event as CustomEvent<{ book: Book }>);
        } else {
            // Add new book
            handleAddBook(event as CustomEvent<{ book: CreateBookInput }>);
        }
    }

    /**
     * Open add book modal
     */
    function openAddBookModal() {
        editingBook = null;
        showBookForm = true;
    }

    /**
     * Open edit book modal
     */
    function handleEditBook(event: CustomEvent<{ book: Book }>) {
        editingBook = event.detail.book;
        showBookForm = true;
    }

    /**
     * Handle delete book request
     */
    function handleDeleteBook(event: CustomEvent<{ book: Book }>) {
        bookToDelete = event.detail.book;
        showDeleteConfirm = true;
    }

    /**
     * Confirm book deletion using shared store
     */
    async function confirmDeleteBook() {
        if (!bookToDelete) return;

        const bookTitle = bookToDelete.title;
        const bookId = bookToDelete.id;

        // Track deleting state locally (since store handles updating state)
        deletingBooks.add(bookId);
        deletingBooks = deletingBooks;

        const success = await bookActions.deleteBook(bookId);

        if (success) {
            ErrorLogger.info(
                `Deleted book: ${bookTitle}`,
                "WishlistPage.confirmDeleteBook",
            );
        }

        // Clear local deleting state
        deletingBooks.delete(bookId);
        deletingBooks = deletingBooks;
        showDeleteConfirm = false;
        bookToDelete = null;
    }

    /**
     * Cancel book deletion
     */
    function cancelDeleteBook() {
        showDeleteConfirm = false;
        bookToDelete = null;
    }

    /**
     * Toggle "next" tag on a book using shared store
     */
    async function handleToggleNext(event: CustomEvent<{ book: Book }>) {
        const book = event.detail.book;

        const success = await bookActions.toggleNextTag(book.id);

        if (success) {
            const hasNextTag = book.tags.some((tag) => tag.name === "next");
            const action = hasNextTag ? "added to" : "removed from"; // Inverted because action already happened
            ErrorLogger.debug(
                `${book.title} ${action} reading queue`,
                "WishlistPage.handleToggleNext",
            );
        }
    }

    /**
     * Close book form modal
     */
    function handleBookFormCancel() {
        showBookForm = false;
        editingBook = null;
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
        await loadBooks(true); // Force refresh
    }

    /**
     * Performance optimization: debounced search/filter
     */
    let searchTimeout: NodeJS.Timeout;
    function debounceSearch(callback: () => void, delay = 300) {
        clearTimeout(searchTimeout);
        searchTimeout = setTimeout(callback, delay);
    }

    /**
     * Preload critical resources
     */
    onMount(() => {
        // Preload the book form component for faster modal opening
        import("$lib/components/BookForm.svelte");

        // Prefetch performance data in the background (non-blocking)
        fetch("/api/performance")
            .then((response) => response.json())
            .then((data) => {
                if (data.success) {
                    ErrorLogger.debug(
                        "Performance metrics loaded",
                        "WishlistPage.preloadPerformance",
                        { metrics: data.data }
                    );
                }
            })
            .catch(() => {
                // Silently fail - this is just background optimization
            });
    });
</script>

<svelte:head>
    <title>My Audiobook Wishlist</title>
</svelte:head>

<div class="container mx-auto p-4 max-w-7xl">
    <!-- Header -->
    <div
        class="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6"
    >
        <div>
            <h1 class="text-3xl font-bold">📚 My Audiobook Wishlist</h1>
            <p class="text-base-content/70 mt-1">
                Manage your audiobook collection and reading queue
            </p>
        </div>

        <div class="flex items-center gap-3">
            <!-- Add Book Button -->
            <button
                class="btn btn-primary"
                on:click={openAddBookModal}
                disabled={loading}
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
                        d="M12 4v16m8-8H4"
                    />
                </svg>
                Add Book
            </button>

            <!-- Refresh Button -->
            <button
                class="btn btn-outline btn-sm"
                class:loading={isRefreshing}
                on:click={retryLoad}
                disabled={loading || isRefreshing}
                title="Refresh data from server"
            >
                {#if !isRefreshing}
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
                            d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                        />
                    </svg>
                {/if}
                {isRefreshing ? "Refreshing..." : "Refresh"}
            </button>
        </div>
    </div>

    <!-- Error Alert -->
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
            <span>{error}</span>
            <button
                class="btn btn-sm btn-ghost"
                on:click={clearError}
                aria-label="Clear error"
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

    <!-- Book List -->
    <BookList
        {books}
        {loading}
        {error}
        updatingBooks={currentUpdatingBooks}
        {deletingBooks}
        on:edit={handleEditBook}
        on:delete={handleDeleteBook}
        on:toggleNext={handleToggleNext}
        on:addBook={openAddBookModal}
        on:retry={retryLoad}
    />

    <!-- Book Form Modal -->
    <BookForm
        book={editingBook}
        isOpen={showBookForm}
        on:save={handleBookSave}
        on:cancel={handleBookFormCancel}
    />

    <!-- Delete Confirmation Modal -->
    {#if showDeleteConfirm && bookToDelete}
        <div class="modal modal-open" role="dialog" aria-modal="true">
            <div class="modal-box">
                <h3 class="font-bold text-lg mb-4">Confirm Deletion</h3>
                <p class="mb-6">
                    Are you sure you want to delete
                    <span class="font-semibold">"{bookToDelete.title}"</span>
                    by {bookToDelete.author}? This action cannot be undone.
                </p>

                <div class="modal-action">
                    <button class="btn btn-ghost" on:click={cancelDeleteBook}>
                        Cancel
                    </button>
                    <button class="btn btn-error" on:click={confirmDeleteBook}>
                        <svg
                            xmlns="http://www.w3.org/2000/svg"
                            class="h-4 w-4 mr-2"
                            fill="none"
                            viewBox="0 0 24 24"
                            stroke="currentColor"
                        >
                            <path
                                stroke-linecap="round"
                                stroke-linejoin="round"
                                stroke-width="2"
                                d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                            />
                        </svg>
                        Delete Book
                    </button>
                </div>
            </div>
        </div>
    {/if}
</div>

<!-- Toast Notifications -->
<Toast />
