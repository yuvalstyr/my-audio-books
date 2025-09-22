<script lang="ts">
    import { onMount, tick } from "svelte";
    import type { PageData } from "./$types";
    import type { Book, CreateBookInput, BookTag } from "$lib/types/book";
    import { BookList, BookForm, SearchAndFilter } from "$lib/components";
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
    let showFilters = false;

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
            highlyRatedFor: updatedBook.highlyRatedFor,
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

        // Listen for the add book event from the mobile menu
        function handleAddBookEvent() {
            openAddBookModal();
        }

        // Listen for the filter toggle event
        function handleToggleFiltersEvent() {
            showFilters = !showFilters;
        }

        window.addEventListener('open-add-book-modal', handleAddBookEvent);
        window.addEventListener('toggle-filters', handleToggleFiltersEvent);


        return () => {
            window.removeEventListener('open-add-book-modal', handleAddBookEvent);
            window.removeEventListener('toggle-filters', handleToggleFiltersEvent);
        };
    });
</script>

<svelte:head>
    <title>My Audiobook Wishlist</title>
</svelte:head>

<div class="w-full lg:container lg:mx-auto p-0 lg:p-2 lg:max-w-7xl">

    <!-- Enhanced Error Alert with Recovery Options -->
    {#if error}
        <div class="alert alert-error mb-2 lg:mb-6 mx-0 lg:mx-0">
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
                <div class="font-semibold">Unable to load books</div>
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
    {#if loading && books.length === 0}
        <LoadingState message="Loading your audiobooks..." />
    {:else if isRefreshing && books.length > 0}
        <!-- Show refreshing indicator while keeping existing content visible -->
        <div class="mb-2 lg:mb-4 mx-0 lg:mx-0">
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
                <span>Refreshing your book collection...</span>
            </div>
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

    <!-- Filters Modal -->
    {#if showFilters}
        <div class="modal modal-open" role="dialog" aria-modal="true">
            <div class="modal-box max-w-2xl">
                <div class="flex justify-between items-center mb-4">
                    <h3 class="font-bold text-lg">Advanced Filters</h3>
                    <button
                        class="btn btn-ghost btn-sm btn-circle"
                        on:click={() => showFilters = false}
                        aria-label="Close filters"
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>
                </div>

                <SearchAndFilter hideFilterToggle={true} />

                <div class="modal-action">
                    <button class="btn btn-primary" on:click={() => showFilters = false}>
                        Apply Filters
                    </button>
                </div>
            </div>
            <div class="modal-backdrop" on:click={() => showFilters = false}></div>
        </div>
    {/if}

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
