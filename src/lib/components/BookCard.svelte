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

  let isHovered = false;

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
    return `${rating.toFixed(1)}`;
  }

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

  function formatHighlyRatedFor(highlyRatedFor?: string): string[] {
    if (!highlyRatedFor?.trim()) return [];
    return highlyRatedFor
      .split("•")
      .map((item) => item.trim())
      .filter((item) => item.length > 0);
  }

  $: hasNextTag = book.tags.some((tag) => tag.name === "next");
  $: hasRatings = book.narratorRating || book.performanceRating;
  $: hasHighlyRated =
    book.highlyRatedFor && formatHighlyRatedFor(book.highlyRatedFor).length > 0;
</script>

<!-- Book Card: Horizontal layout with cover on left -->
<!-- svelte-ignore a11y_no_static_element_interactions -->
<div
  class="group relative bg-white dark:bg-base-100 rounded-none lg:rounded-2xl shadow-sm hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1 overflow-hidden border-0 lg:border border-base-300 h-full w-full lg:mx-0 my-1 lg:my-0"
  style="display: flex; flex-direction: row;"
  on:mouseenter={() => (isHovered = true)}
  on:mouseleave={() => (isHovered = false)}
>
  <!-- Book Cover (Left side) -->
  <div
    class="relative w-32 sm:w-40 flex-shrink-0 overflow-hidden bg-gradient-to-br from-base-200 to-base-300"
  >
    {#if book.coverImageUrl}
      <img
        src={book.coverImageUrl}
        alt="Cover of {book.title}"
        class="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
        loading="lazy"
      />
    {:else}
      <!-- Fun & Pretty Placeholder -->
      <div
        class="w-full h-full flex items-center justify-center bg-gradient-to-br from-purple-100 to-pink-200 dark:from-purple-900/30 dark:to-pink-800/30 relative overflow-hidden"
      >
        <!-- Background Pattern -->
        <div class="absolute inset-0 opacity-10">
          <div
            class="absolute top-2 left-2 text-purple-300 dark:text-purple-600"
          >
            📚
          </div>
          <div class="absolute top-6 right-4 text-pink-300 dark:text-pink-600">
            ✨
          </div>
          <div
            class="absolute bottom-4 left-3 text-purple-300 dark:text-purple-600"
          >
            📖
          </div>
          <div
            class="absolute bottom-2 right-2 text-pink-300 dark:text-pink-600"
          >
            💫
          </div>
        </div>

        <!-- Main Content -->
        <div class="text-center text-purple-600 dark:text-purple-300 z-10">
          <div class="text-3xl mb-2">📚</div>
          <div class="text-lg mb-1">🎧</div>
          <p class="text-xs font-bold text-purple-700 dark:text-purple-200">
            Mystery
          </p>
          <p class="text-xs font-medium text-purple-600 dark:text-purple-300">
            Audiobook!
          </p>
          <div class="text-sm mt-1">✨</div>
        </div>

        <!-- Floating Elements -->
        <div
          class="absolute top-1/4 right-2 text-pink-400 dark:text-pink-500 animate-bounce text-xs"
        >
          🎵
        </div>
        <div
          class="absolute bottom-1/3 left-2 text-purple-400 dark:text-purple-500 animate-pulse text-xs"
        >
          📝
        </div>
      </div>
    {/if}

    <!-- Next Badge (Always Visible if Present) -->
    {#if hasNextTag}
      <div class="absolute top-3 right-3">
        <div class="badge badge-primary badge-sm font-medium shadow-lg">
          <svg
            class="w-3 h-3 mr-1"
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
          Next
        </div>
      </div>
    {/if}

    <!-- Queue Position Badge (if exists) -->
    {#if book.queuePosition}
      <div class="absolute top-3 left-3">
        <div class="badge badge-info badge-sm font-medium shadow-lg">
          #{book.queuePosition}
        </div>
      </div>
    {/if}

    <!-- Hover Overlay with Quick Actions -->
    <div
      class="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center"
    >
      <div class="flex gap-3">
        <!-- Quick Toggle Next -->
        <button
          class="btn btn-sm btn-circle {hasNextTag
            ? 'btn-primary'
            : 'btn-accent'} shadow-lg"
          on:click={handleToggleNext}
          aria-label="{hasNextTag ? 'Remove from' : 'Add to'} next queue"
          disabled={isUpdating || isDeleting}
        >
          {#if isUpdating}
            <span class="loading loading-spinner loading-xs"></span>
          {:else if hasNextTag}
            <svg
              class="w-4 h-4"
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
          {:else}
            <svg
              class="w-4 h-4"
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

        <!-- Edit Button -->
        <!-- svelte-ignore a11y_consider_explicit_label -->
        <button
          class="btn btn-sm btn-circle btn-neutral shadow-lg"
          on:click={handleEdit}
          disabled={isUpdating || isDeleting}
        >
          <svg
            class="w-4 h-4"
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
        </button>

        <!-- Delete Button -->
        <button
          class="btn btn-sm btn-circle btn-error shadow-lg"
          on:click={handleDelete}
          disabled={isUpdating || isDeleting}
        >
          {#if isDeleting}
            <span class="loading loading-spinner loading-xs"></span>
          {:else}
            <svg
              class="w-4 h-4"
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
          {/if}
        </button>
      </div>
    </div>
  </div>

  <!-- Book Information (Right side) -->
  <div class="flex-1 p-5 space-y-4 min-w-0 relative" style="flex: 1;">

    <!-- Mobile Action Menu (Always Visible on Mobile) -->
    <div class="absolute top-3 right-3 lg:hidden">
      <div class="dropdown dropdown-end">
        <div tabindex="0" role="button" class="btn btn-ghost btn-sm btn-circle" aria-label="Book actions">
          <svg class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 5v.01M12 12v.01M12 19v.01" />
          </svg>
        </div>
        <ul class="dropdown-content menu p-2 shadow-lg bg-base-100 rounded-box w-48 border border-base-300 z-10">
          <li>
            <button
              class="flex items-center gap-2"
              on:click={handleEdit}
              disabled={isUpdating || isDeleting}
            >
              <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
              </svg>
              Edit Book
            </button>
          </li>
          <li>
            <button
              class="flex items-center gap-2 {hasNextTag ? 'text-error' : 'text-primary'}"
              on:click={handleToggleNext}
              disabled={isUpdating || isDeleting}
            >
              {#if isUpdating}
                <span class="loading loading-spinner loading-xs"></span>
              {:else if hasNextTag}
                <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
                </svg>
              {:else}
                <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4" />
                </svg>
              {/if}
              {hasNextTag ? 'Remove from Queue' : 'Add to Queue'}
            </button>
          </li>
          <li>
            <button
              class="flex items-center gap-2 text-error"
              on:click={handleDelete}
              disabled={isUpdating || isDeleting}
            >
              {#if isDeleting}
                <span class="loading loading-spinner loading-xs"></span>
              {:else}
                <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
              {/if}
              Delete Book
            </button>
          </li>
        </ul>
      </div>
    </div>
    <!-- Title and Author -->
    <div>
      <h3
        class="font-semibold text-lg leading-tight line-clamp-2 text-gray-900 dark:text-base-content mb-2"
      >
        {book.title}
      </h3>
      <p class="text-sm text-gray-600 dark:text-base-content/70 font-medium">
        by {book.author}
      </p>
    </div>

    <!-- Highly Rated For (Always Visible if Present, without label) -->
    {#if hasHighlyRated}
      <div
        class="text-sm text-gray-600 dark:text-base-content/70 italic leading-relaxed bg-accent/10 rounded-lg p-3"
      >
        {#each formatHighlyRatedFor(book.highlyRatedFor) as item, index}
          "{item}"{#if index < formatHighlyRatedFor(book.highlyRatedFor).length - 1}
            •
          {/if}
        {/each}
      </div>
    {/if}

    <!-- Tags (Always Visible if Present) -->
    {#if book.tags.length > 0}
      <div class="flex flex-wrap gap-1.5">
        {#each book.tags as tag}
          <span class="badge {getTagColor(tag.name)} badge-sm font-medium">
            {tag.name}
          </span>
        {/each}
      </div>
    {/if}

    <!-- Ratings (Always Visible if Present) -->
    {#if hasRatings}
      <div class="space-y-3">
        {#if book.narratorRating}
          <div class="flex items-center gap-3">
            <span
              class="text-gray-600 dark:text-base-content/60 text-sm font-medium min-w-[70px]"
              >Narrator:</span
            >
            <div class="flex items-center gap-2">
              <div class="flex items-center gap-0.5">
                {#each Array(5) as _, i}
                  <div
                    class="w-4 h-4 mask mask-star-2 {i <
                    Math.round(book.narratorRating || 0)
                      ? 'bg-warning'
                      : 'bg-base-300'}"
                  ></div>
                {/each}
              </div>
              <span
                class="text-sm font-semibold text-gray-700 dark:text-base-content/80"
                >{formatRating(book.narratorRating)}/5</span
              >
            </div>
          </div>
        {/if}

        {#if book.performanceRating}
          <div class="flex items-center gap-3">
            <span
              class="text-gray-600 dark:text-base-content/60 text-sm font-medium min-w-[70px]"
              >Story:</span
            >
            <div class="flex items-center gap-2">
              <div class="flex items-center gap-0.5">
                {#each Array(5) as _, i}
                  <div
                    class="w-4 h-4 mask mask-star-2 {i <
                    Math.round(book.performanceRating || 0)
                      ? 'bg-info'
                      : 'bg-base-300'}"
                  ></div>
                {/each}
              </div>
              <span
                class="text-sm font-semibold text-gray-700 dark:text-base-content/80"
                >{formatRating(book.performanceRating)}/5</span
              >
            </div>
          </div>
        {/if}
      </div>
    {/if}

    <!-- Meta Information -->
    <div
      class="flex justify-between items-center text-xs text-gray-500 dark:text-base-content/50 pt-2 border-t border-gray-200 dark:border-base-300"
    >
      <span>Added {new Date(book.dateAdded).toLocaleDateString()}</span>
      {#if book.audibleUrl}
        <a
          href={book.audibleUrl}
          target="_blank"
          rel="noopener noreferrer"
          class="link link-primary hover:link-accent"
        >
          View on Audible
        </a>
      {/if}
    </div>
  </div>
</div>
