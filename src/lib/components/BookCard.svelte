<script lang="ts">
  import type { Book } from "$lib/types/book";
  import { createEventDispatcher } from "svelte";

  export let book: Book;
  export let isUpdating: boolean = false;
  export let isDeleting: boolean = false;

  const dispatch = createEventDispatcher<{
    edit: { book: Book };
    delete: { book: Book };
    toggleNext: { book: Book };
  }>();

  function handleEdit() {
    dispatch("edit", { book });
  }

  function handleDelete() {
    dispatch("delete", { book });
  }

  function handleToggleNext() {
    dispatch("toggleNext", { book });
  }

  function formatRating(rating?: number): string {
    if (!rating) return "N/A";
    return `${rating.toFixed(1)}/5`;
  }

  // Keep the beloved tag color function exactly as it was!
  function getTagColor(tagName: string): string {
    const tagColors: Record<string, string> = {
      funny: "badge-warning",
      action: "badge-error",
      series: "badge-info",
      standalone: "badge-success",
      thriller: "badge-secondary",
      next: "badge-primary",
    };
    return tagColors[tagName] || "badge-neutral";
  }

  $: hasNextTag = book.tags.some((tag) => tag.name === "next");
</script>

<div
  class="card bg-base-100 shadow-sm hover:shadow-md transition-all duration-500 border border-gray-600 hover:border-gray-300/80 h-full flex flex-col rounded-xl"
>
  <div class="card-body p-4 flex-1 flex flex-col">
    <!-- Book Cover and Title Section -->
    <div class="flex gap-3 mb-3 flex-shrink-0">
      <!-- Book Cover -->
      <div class="flex-shrink-0">
        <div
          class="w-16 h-20 bg-base-200/60 border border-base-300/30 rounded-md overflow-hidden shadow-sm"
        >
          {#if book.coverImageUrl}
            <img
              src={book.coverImageUrl}
              alt="Cover of {book.title}"
              class="w-full h-full object-cover"
              loading="lazy"
            />
          {:else}
            <!-- Placeholder cover -->
            <div
              class="w-full h-full flex flex-col items-center justify-center text-base-content/30 bg-gradient-to-br from-base-200/40 to-base-300/40"
            >
              <svg
                class="h-5 w-5"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                stroke-width="1.5"
              >
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.746 0 3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"
                />
              </svg>
            </div>
          {/if}
        </div>
      </div>

      <!-- Book Info -->
      <div class="flex-1 min-w-0">
        <h3
          class="card-title text-base font-semibold line-clamp-2 mb-1 text-base-content leading-tight"
        >
          {book.title}
        </h3>
        <p class="text-base-content/60 text-sm font-normal">
          by {book.author}
        </p>

        <!-- Ratings Display -->
        {#if book.narratorRating || book.performanceRating}
          <div class="space-y-1 mb-3 flex-shrink-0">
            {#if book.narratorRating}
              <div class="flex items-center gap-2 text-xs">
                <span class="text-base-content/50 font-normal w-14"
                  >Narrator:</span
                >
                <div class="rating rating-xs gap-0.5">
                  {#each Array(5) as _, i}
                    <input
                      type="radio"
                      class="mask mask-star-2 bg-warning"
                      disabled
                      checked={i < Math.round(book.narratorRating || 0)}
                    />
                  {/each}
                </div>
                <span class="text-base-content/60 font-normal"
                  >{formatRating(book.narratorRating)}</span
                >
              </div>
            {/if}

            {#if book.performanceRating}
              <div class="flex items-center gap-2 text-xs">
                <span class="text-base-content/50 font-normal w-14">Story:</span
                >
                <div class="rating rating-xs gap-0.5">
                  {#each Array(5) as _, i}
                    <input
                      type="radio"
                      class="mask mask-star-2 bg-info"
                      disabled
                      checked={i < Math.round(book.performanceRating || 0)}
                    />
                  {/each}
                </div>
                <span class="text-base-content/60 font-normal"
                  >{formatRating(book.performanceRating)}</span
                >
              </div>
            {/if}
          </div>
        {/if}
      </div>
    </div>

    <!-- Tags -->
    {#if book.tags.length > 0}
      <div class="flex flex-wrap gap-1.5 mb-4 flex-shrink-0">
        {#each book.tags as tag}
          <div
            class="badge {getTagColor(tag.name)} badge-sm font-normal text-xs"
          >
            {tag.name}
          </div>
        {/each}
      </div>
    {/if}

    <!-- Spacer -->
    <div class="flex-1"></div>

    <!-- Action Buttons -->
    <div class="card-actions justify-end flex-shrink-0">
      <div class="flex gap-2">
        <!-- Quick Toggle Next Button -->
        <button
          class="btn btn-sm {hasNextTag ? 'btn-primary' : 'btn-outline'}"
          on:click={handleToggleNext}
          aria-label="{hasNextTag ? 'Remove from' : 'Add to'} next queue"
          disabled={isUpdating || isDeleting}
        >
          {#if isUpdating}
            <span class="loading loading-spinner loading-xs"></span>
          {:else if hasNextTag}
            <svg
              class="h-4 w-4"
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
          {:else}
            <svg
              class="h-4 w-4"
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
          {/if}
        </button>

        <!-- Actions Dropdown -->
        <div class="dropdown dropdown-end">
          <div
            tabindex="0"
            role="button"
            class="btn btn-sm btn-outline btn-square"
          >
            <svg
              class="h-4 w-4"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2"
                d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z"
              />
            </svg>
          </div>
          <ul
            tabindex="0"
            class="dropdown-content menu bg-base-100 rounded-box z-[1] w-36 p-1 shadow-lg border border-base-300/40"
          >
            <li>
              <button
                class="text-left"
                on:click={handleEdit}
                disabled={isUpdating || isDeleting}
              >
                <svg
                  class="h-4 w-4"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    stroke-width="2"
                    d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
                  />
                </svg>
                Edit Book
              </button>
            </li>
            <li>
              <button
                class="text-left text-error hover:bg-error/10"
                on:click={handleDelete}
                disabled={isUpdating || isDeleting}
              >
                {#if isDeleting}
                  <span class="loading loading-spinner loading-xs"></span>
                  Deleting...
                {:else}
                  <svg
                    class="h-4 w-4"
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
                {/if}
              </button>
            </li>
          </ul>
        </div>
      </div>
    </div>
  </div>
</div>

