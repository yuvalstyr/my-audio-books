<script lang="ts">
    import type { Book, BookTag, CreateBookInput } from "$lib/types/book";
    import { generateId, generateTagId } from "$lib/utils/id";
    import {
        isValidCreateBookInput,
        isValidAudibleUrl,
    } from "$lib/utils/validation";
    import {
        parseAudibleUrl,
        type AudibleMetadata,
    } from "$lib/services/audible-parser";
    import { ErrorLogger } from "$lib/services/error-logger";
    import { NotificationService } from "$lib/services/notification-service";
    import { createEventDispatcher } from "svelte";

    export let book: Book | null = null; // null for add mode, Book for edit mode
    export let isOpen = false;

    const dispatch = createEventDispatcher<{
        save: { book: CreateBookInput | Book };
        cancel: void;
    }>();

    // Form state
    let title = "";
    let author = "";
    let audibleUrl = "";
    let coverImageUrl = "";
    let narratorRating: number | undefined = undefined;
    let performanceRating: number | undefined = undefined;
    let description = "";
    let selectedTags: Set<string> = new Set();

    // Validation state
    let errors: Record<string, string> = {};
    let isSubmitting = false;
    let submitError: string | null = null;

    // Audible parsing state
    let isParsing = false;
    let parseMessage = "";
    let lastParsedUrl = "";

    // Predefined tag options based on requirements
    const availableTags: Array<{
        name: BookTag["name"];
        color: string;
        label: string;
    }> = [
        { name: "funny", color: "badge-warning", label: "Funny" },
        { name: "action", color: "badge-error", label: "Action" },
        { name: "series", color: "badge-info", label: "Series" },
        { name: "standalone", color: "badge-success", label: "Standalone" },
        { name: "thriller", color: "badge-secondary", label: "Thriller" },
        { name: "next", color: "badge-primary", label: "Next to Read" },
    ];

    $: isEditMode = book !== null;
    $: modalTitle = isEditMode ? "Edit Book" : "Add New Book";

    // Initialize form when book changes or modal opens
    $: if (isOpen) {
        initializeForm();
    }

    function initializeForm() {
        if (book) {
            // Edit mode - populate with existing book data
            title = book.title;
            author = book.author;
            audibleUrl = book.audibleUrl || "";
            coverImageUrl = book.coverImageUrl || "";
            narratorRating = book.narratorRating;
            performanceRating = book.performanceRating;
            description = book.description || "";
            selectedTags = new Set(book.tags.map((tag) => tag.name));
        } else {
            // Add mode - reset form
            title = "";
            author = "";
            audibleUrl = "";
            coverImageUrl = "";
            narratorRating = undefined;
            performanceRating = undefined;
            description = "";
            selectedTags = new Set();
        }
        errors = {};
        isSubmitting = false;
        submitError = null;
        isParsing = false;
        parseMessage = "";
        lastParsedUrl = "";
    }

    function validateForm(): boolean {
        errors = {};

        // Required field validation
        if (!title.trim()) {
            errors.title = "Title is required";
        }

        if (!author.trim()) {
            errors.author = "Author is required";
        }

        // Audible URL validation (optional but must be valid if provided)
        if (audibleUrl.trim() && !isValidAudibleUrl(audibleUrl.trim())) {
            errors.audibleUrl = "Please enter a valid Audible URL";
        }

        // Rating validation
        if (
            narratorRating !== undefined &&
            (narratorRating < 0 || narratorRating > 5)
        ) {
            errors.narratorRating = "Rating must be between 0 and 5";
        }

        if (
            performanceRating !== undefined &&
            (performanceRating < 0 || performanceRating > 5)
        ) {
            errors.performanceRating = "Rating must be between 0 and 5";
        }

        return Object.keys(errors).length === 0;
    }

    function toggleTag(tagName: BookTag["name"]) {
        if (selectedTags.has(tagName)) {
            selectedTags.delete(tagName);
        } else {
            selectedTags.add(tagName);
        }
        selectedTags = selectedTags; // Trigger reactivity
    }

    function createBookTags(): BookTag[] {
        const tags = Array.from(selectedTags).map((tagName) => {
            const tagConfig = availableTags.find((t) => t.name === tagName);
            const tag = {
                id: generateTagId(),
                name: tagName as BookTag["name"],
                color: tagConfig?.color || "badge-neutral",
            };
            return tag;
        });
        console.log("Created tags:", tags);
        return tags;
    }

    /**
     * Attempts to parse Audible URL and populate form fields
     */
    async function handleAudibleUrlParse() {
        const url = audibleUrl.trim();

        // Don't parse if URL is empty, invalid, or already parsed
        if (!url || !isValidAudibleUrl(url) || url === lastParsedUrl) {
            return;
        }

        isParsing = true;
        parseMessage = "Parsing Audible URL...";

        try {
            const result = await parseAudibleUrl(url);

            if (result.success && result.metadata) {
                const metadata = result.metadata;
                let fieldsUpdated = [];

                // Only update empty fields to avoid overwriting user input
                if (metadata.title && !title.trim()) {
                    title = metadata.title;
                    fieldsUpdated.push("title");
                }

                if (metadata.author && !author.trim()) {
                    author = metadata.author;
                    fieldsUpdated.push("author");
                }

                if (metadata.narratorRating && narratorRating === undefined) {
                    narratorRating = metadata.narratorRating;
                    fieldsUpdated.push("narrator rating");
                }

                if (metadata.description && !description.trim()) {
                    description = metadata.description;
                    fieldsUpdated.push("description");
                }

                if (metadata.coverImageUrl && !coverImageUrl.trim()) {
                    coverImageUrl = metadata.coverImageUrl;
                    fieldsUpdated.push("cover image");
                }

                if (fieldsUpdated.length > 0) {
                    parseMessage = `✓ Extracted: ${fieldsUpdated.join(", ")}`;
                } else {
                    parseMessage =
                        "✓ URL validated - no new information extracted";
                }
            } else {
                parseMessage =
                    result.error ||
                    "Unable to extract information. Please enter details manually.";
            }

            lastParsedUrl = url;
        } catch (error) {
            ErrorLogger.error(
                "Error parsing Audible URL",
                error instanceof Error ? error : undefined,
                "BookForm.handleAudibleUrlParse",
            );
            parseMessage =
                "Failed to parse URL. Please enter details manually.";
        } finally {
            isParsing = false;

            // Clear the message after a few seconds
            setTimeout(() => {
                parseMessage = "";
            }, 5000);
        }
    }

    /**
     * Handles Audible URL input changes with debounced parsing
     */
    let parseTimeout: number;
    function handleAudibleUrlChange() {
        // Clear any existing timeout
        if (parseTimeout) {
            clearTimeout(parseTimeout);
        }

        // Clear previous parse message
        parseMessage = "";

        // Debounce the parsing to avoid excessive API calls
        parseTimeout = setTimeout(() => {
            handleAudibleUrlParse();
        }, 1000);
    }

    async function handleSubmit() {
        if (!validateForm()) {
            return;
        }

        isSubmitting = true;

        try {
            const tags = createBookTags();
            const bookData: CreateBookInput = {
                title: title.trim(),
                author: author.trim(),
                audibleUrl: audibleUrl.trim() || undefined,
                coverImageUrl: coverImageUrl.trim() || undefined,
                narratorRating:
                    narratorRating !== undefined &&
                    narratorRating !== null &&
                    !isNaN(narratorRating)
                        ? narratorRating
                        : undefined,
                performanceRating:
                    performanceRating !== undefined &&
                    performanceRating !== null &&
                    !isNaN(performanceRating)
                        ? performanceRating
                        : undefined,
                description: description.trim() || undefined,
                tags: tags.length > 0 ? tags : undefined,
            };

            // Validate the complete book data
            if (!isValidCreateBookInput(bookData)) {
                console.error("Validation failed for book data:", bookData);
                throw new Error("Invalid book data");
            }

            if (isEditMode && book) {
                // Edit mode - include the existing book ID
                dispatch("save", {
                    book: {
                        ...bookData,
                        id: book.id,
                        dateAdded: book.dateAdded,
                        queuePosition: book.queuePosition,
                        coverImageUrl: book.coverImageUrl,
                    },
                });
            } else {
                // Add mode - dispatch CreateBookInput
                dispatch("save", { book: bookData });
            }

            handleCancel(); // Close modal after successful save
        } catch (error) {
            let errorMessage = "Failed to save book. Please try again.";

            // Handle specific API errors
            if (error instanceof Error) {
                if (
                    error.message.includes("network") ||
                    error.message.includes("fetch")
                ) {
                    errorMessage =
                        "Network error. Please check your connection and try again.";
                } else if (error.message.includes("validation")) {
                    errorMessage =
                        "Invalid book data. Please check your input.";
                } else if (error.message.includes("conflict")) {
                    errorMessage = "A book with this title already exists.";
                } else {
                    errorMessage = error.message;
                }
            }

            ErrorLogger.error(
                errorMessage,
                error instanceof Error ? error : undefined,
                "BookForm.handleSubmit",
            );
            submitError = errorMessage;
            NotificationService.error("Save Failed", errorMessage);
        } finally {
            isSubmitting = false;
        }
    }

    function handleCancel() {
        dispatch("cancel");
    }

    // Handle modal backdrop click
    function handleModalClick(event: MouseEvent) {
        if (event.target === event.currentTarget) {
            handleCancel();
        }
    }
</script>

<!-- Modal -->
{#if isOpen}
    <div
        class="modal modal-open"
        role="dialog"
        aria-modal="true"
        aria-labelledby="modal-title"
        tabindex="-1"
        on:click={handleModalClick}
        on:keydown={(e) => e.key === "Escape" && handleCancel()}
    >
        <div class="modal-box w-11/12 max-w-2xl max-h-[90vh] overflow-y-auto">
            <!-- Modal Header -->
            <div class="flex justify-between items-center mb-6">
                <h2 id="modal-title" class="text-2xl font-bold">
                    {modalTitle}
                </h2>
                <button
                    class="btn btn-sm btn-circle btn-ghost"
                    on:click={handleCancel}
                    aria-label="Close"
                >
                    <svg
                        xmlns="http://www.w3.org/2000/svg"
                        class="h-6 w-6"
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

            <!-- Form -->
            <form on:submit|preventDefault={handleSubmit} class="space-y-6">
                <!-- Submit Error -->
                {#if submitError}
                    <div class="alert alert-error">
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
                            <div class="font-semibold">Save Failed</div>
                            <div class="text-sm">{submitError}</div>
                        </div>
                        <button
                            class="btn btn-sm btn-ghost"
                            on:click={() => (submitError = null)}
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
                {/if}

                <!-- Title Field -->
                <div class="form-control">
                    <label class="label" for="title">
                        <span class="label-text font-medium"
                            >Title <span class="text-error">*</span></span
                        >
                    </label>
                    <input
                        id="title"
                        type="text"
                        bind:value={title}
                        class="input input-bordered w-full {errors.title
                            ? 'input-error'
                            : ''}"
                        placeholder="Enter book title"
                        required
                        disabled={isSubmitting}
                    />
                    {#if errors.title}
                        <div class="label">
                            <span class="label-text-alt text-error"
                                >{errors.title}</span
                            >
                        </div>
                    {/if}
                </div>

                <!-- Author Field -->
                <div class="form-control">
                    <label class="label" for="author">
                        <span class="label-text font-medium"
                            >Author <span class="text-error">*</span></span
                        >
                    </label>
                    <input
                        id="author"
                        type="text"
                        bind:value={author}
                        class="input input-bordered w-full {errors.author
                            ? 'input-error'
                            : ''}"
                        placeholder="Enter author name"
                        required
                        disabled={isSubmitting}
                    />
                    {#if errors.author}
                        <div class="label">
                            <span class="label-text-alt text-error"
                                >{errors.author}</span
                            >
                        </div>
                    {/if}
                </div>

                <!-- Audible URL Field -->
                <div class="form-control">
                    <label class="label" for="audibleUrl">
                        <span class="label-text font-medium">Audible URL</span>
                        <span class="label-text-alt"
                            >Optional - Auto-extracts info</span
                        >
                    </label>
                    <div class="relative">
                        <input
                            id="audibleUrl"
                            type="url"
                            bind:value={audibleUrl}
                            on:input={handleAudibleUrlChange}
                            class="input input-bordered w-full {errors.audibleUrl
                                ? 'input-error'
                                : ''} {isParsing ? 'pr-10' : ''}"
                            placeholder="https://www.audible.com/pd/..."
                            disabled={isSubmitting}
                        />
                        {#if isParsing}
                            <div
                                class="absolute inset-y-0 right-0 flex items-center pr-3"
                            >
                                <span class="loading loading-spinner loading-sm"
                                ></span>
                            </div>
                        {/if}
                    </div>
                    {#if parseMessage}
                        <div class="label">
                            <span
                                class="label-text-alt {parseMessage.startsWith(
                                    '✓',
                                )
                                    ? 'text-success'
                                    : 'text-info'}">{parseMessage}</span
                            >
                        </div>
                    {/if}
                    {#if errors.audibleUrl}
                        <div class="label">
                            <span class="label-text-alt text-error"
                                >{errors.audibleUrl}</span
                            >
                        </div>
                    {/if}
                </div>

                <!-- Cover Image URL Field -->
                <div class="form-control">
                    <label class="label" for="coverImageUrl">
                        <span class="label-text font-medium"
                            >Cover Image URL</span
                        >
                        <span class="label-text-alt">Optional</span>
                    </label>
                    <input
                        id="coverImageUrl"
                        type="url"
                        bind:value={coverImageUrl}
                        class="input input-bordered w-full"
                        placeholder="https://example.com/book-cover.jpg"
                        disabled={isSubmitting}
                    />
                    <div class="label">
                        <span class="label-text-alt text-info">
                            Tip: Right-click on book covers and "Copy image
                            address"
                        </span>
                    </div>
                </div>

                <!-- Ratings Row -->
                <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <!-- Narrator Rating -->
                    <div class="form-control">
                        <label class="label" for="narratorRating">
                            <span class="label-text font-medium"
                                >Narrator Rating</span
                            >
                            <span class="label-text-alt">0-5</span>
                        </label>
                        <input
                            id="narratorRating"
                            type="number"
                            bind:value={narratorRating}
                            class="input input-bordered w-full {errors.narratorRating
                                ? 'input-error'
                                : ''}"
                            placeholder="4.5"
                            min="0"
                            max="5"
                            step="0.1"
                            disabled={isSubmitting}
                        />
                        {#if errors.narratorRating}
                            <div class="label">
                                <span class="label-text-alt text-error"
                                    >{errors.narratorRating}</span
                                >
                            </div>
                        {/if}
                    </div>

                    <!-- Performance Rating -->
                    <div class="form-control">
                        <label class="label" for="performanceRating">
                            <span class="label-text font-medium"
                                >Story Rating</span
                            >
                            <span class="label-text-alt">0-5</span>
                        </label>
                        <input
                            id="performanceRating"
                            type="number"
                            bind:value={performanceRating}
                            class="input input-bordered w-full {errors.performanceRating
                                ? 'input-error'
                                : ''}"
                            placeholder="4.0"
                            min="0"
                            max="5"
                            step="0.1"
                            disabled={isSubmitting}
                        />
                        {#if errors.performanceRating}
                            <div class="label">
                                <span class="label-text-alt text-error"
                                    >{errors.performanceRating}</span
                                >
                            </div>
                        {/if}
                    </div>
                </div>

                <!-- Tags Selection -->
                <div class="form-control">
                    <div class="label">
                        <span class="label-text font-medium">Tags</span>
                        <span class="label-text-alt">Select categories</span>
                    </div>
                    <div class="flex flex-wrap gap-2">
                        {#each availableTags as tag}
                            <button
                                type="button"
                                class="badge {selectedTags.has(tag.name)
                                    ? tag.color
                                    : 'badge-outline'} badge-lg cursor-pointer hover:scale-105 transition-transform"
                                on:click={() => toggleTag(tag.name)}
                                disabled={isSubmitting}
                            >
                                {tag.label}
                                {#if selectedTags.has(tag.name)}
                                    <svg
                                        xmlns="http://www.w3.org/2000/svg"
                                        class="h-3 w-3 ml-1"
                                        fill="none"
                                        viewBox="0 0 24 24"
                                        stroke="currentColor"
                                    >
                                        <path
                                            stroke-linecap="round"
                                            stroke-linejoin="round"
                                            stroke-width="2"
                                            d="M5 13l4 4L19 7"
                                        />
                                    </svg>
                                {/if}
                            </button>
                        {/each}
                    </div>
                </div>

                <!-- Description Field -->
                <div class="form-control">
                    <label class="label" for="description">
                        <span class="label-text font-medium">Description</span>
                        <span class="label-text-alt">Optional</span>
                    </label>
                    <textarea
                        id="description"
                        bind:value={description}
                        class="textarea textarea-bordered w-full h-24 resize-none"
                        placeholder="Add a personal note or description..."
                        disabled={isSubmitting}
                    ></textarea>
                </div>

                <!-- Form Actions -->
                <div class="modal-action">
                    <button
                        type="button"
                        class="btn btn-ghost"
                        on:click={handleCancel}
                        disabled={isSubmitting}
                    >
                        Cancel
                    </button>
                    <button
                        type="submit"
                        class="btn btn-primary"
                        disabled={isSubmitting ||
                            !title.trim() ||
                            !author.trim()}
                    >
                        {#if isSubmitting}
                            <span
                                class="loading loading-spinner loading-sm mr-2"
                            ></span>
                            {isEditMode ? "Updating..." : "Adding..."}
                        {:else}
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
                                    d={isEditMode
                                        ? "M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
                                        : "M12 4v16m8-8H4"}
                                />
                            </svg>
                            {isEditMode ? "Update Book" : "Add Book"}
                        {/if}
                    </button>
                </div>
            </form>
        </div>
    </div>
{/if}
