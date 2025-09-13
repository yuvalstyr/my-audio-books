<script lang="ts">
	import type { Book, BookTag } from "$lib/types/book";
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
	class="card bg-base-100 shadow-lg hover:shadow-xl transition-all duration-300 border border-base-300 h-full flex flex-col"
>
	<div class="card-body p-4 flex-1 flex flex-col">
		<!-- Top section with image and title -->
		<div class="flex gap-3 mb-3 flex-shrink-0">
			<!-- Small Book Cover Image -->
			<div class="flex-shrink-0">
				<div
					class="w-16 h-20 bg-gradient-to-br from-base-200 to-base-300 rounded-md overflow-hidden shadow-sm"
				>
					{#if book.coverImageUrl}
						<img
							src={book.coverImageUrl}
							alt="Cover of {book.title}"
							class="w-full h-full object-cover"
							loading="lazy"
						/>
					{:else}
						<!-- Placeholder cover with book icon -->
						<div
							class="w-full h-full flex flex-col items-center justify-center text-base-content/40"
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
									stroke-width="1.5"
									d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.746 0 3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"
								/>
							</svg>
						</div>
					{/if}
				</div>
			</div>

			<!-- Book Title and Author -->
			<div class="flex-1 min-w-0">
				<h3
					class="card-title text-base font-bold line-clamp-2 mb-1 text-base-content"
				>
					{book.title}
				</h3>
				<p class="text-base-content/80 text-sm font-medium">
					by {book.author}
				</p>
			</div>
		</div>

		<!-- Ratings -->
		{#if book.narratorRating || book.performanceRating}
			<div class="space-y-1 mb-3 flex-shrink-0">
				{#if book.narratorRating}
					<div class="flex items-center gap-2 text-xs">
						<span class="text-base-content/60 font-medium w-14"
							>Narrator:</span
						>
						<div class="rating rating-xs">
							{#each Array(5) as _, i}
								<input
									type="radio"
									class="mask mask-star-2 bg-orange-400"
									disabled
									checked={i <
										Math.round(book.narratorRating || 0)}
								/>
							{/each}
						</div>
						<span class="text-base-content/70 font-medium"
							>{formatRating(book.narratorRating)}</span
						>
					</div>
				{/if}

				{#if book.performanceRating}
					<div class="flex items-center gap-2 text-xs">
						<span class="text-base-content/60 font-medium w-14"
							>Story:</span
						>
						<div class="rating rating-xs">
							{#each Array(5) as _, i}
								<input
									type="radio"
									class="mask mask-star-2 bg-blue-400"
									disabled
									checked={i <
										Math.round(book.performanceRating || 0)}
								/>
							{/each}
						</div>
						<span class="text-base-content/70 font-medium"
							>{formatRating(book.performanceRating)}</span
						>
					</div>
				{/if}
			</div>
		{/if}

		<!-- Tags -->
		{#if book.tags.length > 0}
			<div class="flex flex-wrap gap-1 mb-4 flex-shrink-0">
				{#each book.tags as tag}
					<div
						class="badge {getTagColor(
							tag.name,
						)} badge-sm font-medium"
					>
						{tag.name}
					</div>
				{/each}
			</div>
		{/if}

		<!-- Spacer to push buttons to bottom -->
		<div class="flex-1"></div>

		<!-- Action Buttons -->
		<div class="card-actions justify-end flex-shrink-0">
			<div class="btn-group">
				<button
					class="btn btn-sm btn-outline hover:btn-primary"
					on:click={handleEdit}
					aria-label="Edit {book.title}"
					disabled={isUpdating || isDeleting}
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
							d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
						/>
					</svg>
				</button>

				<button
					class="btn btn-sm {hasNextTag
						? 'btn-primary'
						: 'btn-outline hover:btn-secondary'}"
					on:click={handleToggleNext}
					aria-label="{hasNextTag
						? 'Remove from'
						: 'Add to'} next queue"
					disabled={isUpdating || isDeleting}
				>
					{#if isUpdating}
						<span class="loading loading-spinner loading-xs"></span>
					{:else if hasNextTag}
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
								d="M5 13l4 4L19 7"
							/>
						</svg>
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
								d="M12 4v16m8-8H4"
							/>
						</svg>
					{/if}
				</button>

				<button
					class="btn btn-sm btn-outline btn-error hover:btn-error"
					on:click={handleDelete}
					aria-label="Delete {book.title}"
					disabled={isUpdating || isDeleting}
				>
					{#if isDeleting}
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
								d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
							/>
						</svg>
					{/if}
				</button>
			</div>
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
