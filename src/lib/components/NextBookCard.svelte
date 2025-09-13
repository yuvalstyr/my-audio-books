<script lang="ts">
    import type { Book } from "$lib/types/book";
    import { createEventDispatcher } from "svelte";

    export let book: Book;
    export let isUpdating: boolean = false;

    const dispatch = createEventDispatcher<{
        removeFromNext: { book: Book };
        viewDetails: { book: Book };
    }>();

    function handleRemoveFromNext() {
        dispatch("removeFromNext", { book });
    }

    function handleViewDetails() {
        dispatch("viewDetails", { book });
    }

    function formatRating(rating?: number): string {
        if (!rating) return "N/A";
        return `${rating.toFixed(1)}/5`;
    }

    // Get the highest rating to display prominently
    $: bestRating = Math.max(
        book.narratorRating || 0,
        book.performanceRating || 0,
    );
    $: hasRating = book.narratorRating || book.performanceRating;
</script>

<div
    class="card bg-base-100 shadow-md hover:shadow-lg transition-all duration-300 border border-base-300 h-full flex flex-col group"
>
    <div class="card-body p-4 flex-1 flex flex-col">
        <!-- Book Cover and Title Section -->
        <div class="flex gap-4 mb-4 flex-shrink-0">
            <!-- Larger Book Cover for Reading Queue -->
            <div class="flex-shrink-0">
                <div
                    class="w-20 h-28 bg-gradient-to-br from-base-200 to-base-300 rounded-lg overflow-hidden shadow-md"
                >
                    {#if book.coverImageUrl}
                        <img
                            src={book.coverImageUrl}
                            alt="Cover of {book.title}"
                            class="w-full h-full object-cover"
                            loading="lazy"
                        />
                    {:else}
                        <!-- Enhanced placeholder cover -->
                        <div
                            class="w-full h-full flex flex-col items-center justify-center text-base-content/40 bg-gradient-to-br from-primary/10 to-secondary/10"
                        >
                            <svg
                                xmlns="http://www.w3.org/2000/svg"
                                class="h-8 w-8"
                                fill="none"
                                viewBox="0 0 24 24"
                                stroke="currentColor"
                            >
                                <path
                                    stroke-linecap="round"
                                    stroke-linejoin="round"
                                    stroke-width="1.5"
                                    d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.746 0 3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"
                                />
                            </svg>
                        </div>
                    {/if}
                </div>
            </div>

            <!-- Book Info -->
            <div class="flex-1 min-w-0 flex flex-col">
                <h3
                    class="font-bold text-lg line-clamp-2 mb-2 text-base-content group-hover:text-primary transition-colors"
                >
                    {book.title}
                </h3>
                <p class="text-base-content/80 font-medium mb-2">
                    by {book.author}
                </p>

                <!-- Simplified Rating Display -->
                {#if hasRating}
                    <div class="flex items-center gap-2 text-sm">
                        <div class="rating rating-sm">
                            {#each Array(5) as _, i}
                                <input
                                    type="radio"
                                    class="mask mask-star-2 bg-primary"
                                    disabled
                                    checked={i < Math.round(bestRating)}
                                />
                            {/each}
                        </div>
                        <span class="text-base-content/70 font-medium">
                            {formatRating(bestRating)}
                        </span>
                    </div>
                {/if}
            </div>
        </div>

        <!-- Quick Tags (only show most relevant ones) -->
        {#if book.tags.length > 0}
            <div class="flex flex-wrap gap-1 mb-4 flex-shrink-0">
                {#each book.tags
                    .filter((tag) => tag.name !== "next")
                    .slice(0, 3) as tag}
                    <div class="badge badge-outline badge-sm">
                        {tag.name}
                    </div>
                {/each}
                {#if book.tags.filter((tag) => tag.name !== "next").length > 3}
                    <div class="badge badge-ghost badge-sm">
                        +{book.tags.filter((tag) => tag.name !== "next")
                            .length - 3} more
                    </div>
                {/if}
            </div>
        {/if}

        <!-- Spacer -->
        <div class="flex-1"></div>

        <!-- Action Buttons - Simplified for Reading Queue -->
        <div class="flex gap-2 flex-shrink-0">
            <button
                class="btn btn-primary btn-sm flex-1"
                on:click={handleViewDetails}
                disabled={isUpdating}
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
                        d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                    />
                    <path
                        stroke-linecap="round"
                        stroke-linejoin="round"
                        stroke-width="2"
                        d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
                    />
                </svg>
                View Details
            </button>

            <button
                class="btn btn-outline btn-sm"
                on:click={handleRemoveFromNext}
                disabled={isUpdating}
                title="Remove from reading queue"
            >
                {#if isUpdating}
                    <span class="loading loading-spinner loading-xs"></span>
                {:else}
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
                {/if}
            </button>
        </div>
    </div>
</div>

<style>
    .line-clamp-2 {
        display: -webkit-box;
        -webkit-line-clamp: 2;
        -webkit-box-orient: vertical;
        overflow: hidden;
    }
</style>
