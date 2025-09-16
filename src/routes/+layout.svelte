<script lang="ts">
	import "../app.css";
	import { page } from "$app/stores";
	import { ImportExport } from "$lib/components";
	import PWAInstaller from "$lib/components/PWAInstaller.svelte";
	import { filterStore, filterActions } from "$lib/stores/filter-store";

	import type { ImportResult } from "$lib/services/import-export";

	let { children } = $props();

	// Import/Export modal state
	let showImportExport = $state(false);

	// Navigation state
	const currentPath = $derived($page.url.pathname);
	const isHomePage = $derived(currentPath === "/");
	const isWishlistPage = $derived(currentPath === "/wishlist");

	/**
	 * Open import/export modal
	 */
	function openImportExportModal() {
		showImportExport = true;
	}

	/**
	 * Close import/export modal
	 */
	function closeImportExportModal() {
		showImportExport = false;
	}

	/**
	 * Handle successful data import
	 */
	function handleDataImported(event: any) {
		// The import was successful, we could refresh the page or show a notification
		console.log("Data imported successfully:", event.detail.result);
		// Optionally refresh the page to show new data
		window.location.reload();
	}

	/**
	 * Get navigation link classes with active state
	 */
	function getNavLinkClass(isActive: boolean): string {
		const baseClass =
			"hover:bg-base-300 transition-colors duration-200 rounded-lg px-3 py-2";
		return isActive
			? `${baseClass} bg-primary/10 text-primary font-semibold border border-primary/20`
			: baseClass;
	}
</script>

<svelte:head>
	<link rel="icon" href="/favicon.ico" />
	<title>Audiobook Wishlist Manager</title>
	<meta
		name="description"
		content="Personal audiobook wishlist management app"
	/>
	<meta name="viewport" content="width=device-width, initial-scale=1" />
</svelte:head>

<div class="min-h-screen bg-base-100">
	<header
		class="navbar bg-base-200 shadow-lg safe-area-inset-top safe-area-inset-left safe-area-inset-right border-b border-base-300"
	>
		<div class="navbar-start">
			<a
				href="/"
				class="text-xl font-bold hover:text-primary transition-colors duration-200 flex items-center gap-3 px-2 py-1 rounded-lg hover:bg-base-300/50"
				><span class="text-2xl">📚</span>
				<span
					class="text-primary font-bold"
					>Audiobook Wishlist</span
				></a
			>
		</div>

		<div class="navbar-center hidden lg:flex">
			<!-- Search bar for desktop -->
			{#if isWishlistPage}
				<div class="form-control">
					<div class="relative">
						<div class="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
							<svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4 text-base-content/50" fill="none" viewBox="0 0 24 24" stroke="currentColor">
								<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
							</svg>
						</div>
						<input
							type="text"
							placeholder="Search books..."
							class="input input-bordered input-sm w-80 pl-10 bg-base-100"
							value={$filterStore.searchQuery}
							oninput={(e) => filterActions.setSearchQuery(e.currentTarget.value)}
						/>
						{#if $filterStore.searchQuery}
							<div class="absolute inset-y-0 right-0 pr-3 flex items-center">
								<button
									class="btn btn-ghost btn-xs btn-circle"
									onclick={() => filterActions.setSearchQuery("")}
									aria-label="Clear search"
								>
									<svg xmlns="http://www.w3.org/2000/svg" class="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
										<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
									</svg>
								</button>
							</div>
						{/if}
					</div>
				</div>
			{:else}
				<div class="flex items-center gap-2 bg-base-100 rounded-lg p-1 shadow-inner">
					<a
						href="/"
						class={getNavLinkClass(isHomePage)}
						aria-current={isHomePage ? "page" : undefined}
					>
						<span class="flex items-center gap-2">
							<span class="text-lg">📖</span>
							<span>Reading Queue</span>
							{#if isHomePage}
								<div class="badge badge-primary badge-xs"></div>
							{/if}
						</span>
					</a>
					<a
						href="/wishlist"
						class={getNavLinkClass(isWishlistPage)}
						aria-current={isWishlistPage ? "page" : undefined}
					>
						<span class="flex items-center gap-2">
							<span class="text-lg">📚</span>
							<span>Full Wishlist</span>
							{#if isWishlistPage}
								<div class="badge badge-primary badge-xs"></div>
							{/if}
						</span>
					</a>
				</div>
			{/if}
		</div>

		<div class="navbar-end">
			<div class="flex gap-2">
				<!-- Filter Button for Wishlist (Desktop) -->
				{#if isWishlistPage}
					<button
						class="btn btn-ghost btn-sm gap-2 hover:bg-base-300 transition-colors hidden lg:flex"
						onclick={() => {
							window.dispatchEvent(new CustomEvent('toggle-filters'));
						}}
						title="Advanced Filters"
					>
						<svg class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
							<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.207A1 1 0 013 6.5V4z" />
						</svg>
						{#if $filterStore.selectedTags.length > 0}
							<span class="badge badge-primary badge-xs">{$filterStore.selectedTags.length}</span>
						{/if}
					</button>
				{/if}

				<!-- Mobile Menu Dropdown -->
				<div class="dropdown dropdown-end lg:hidden">
					<div
						tabindex="0"
						role="button"
						class="btn btn-ghost btn-sm"
						aria-label="Open navigation menu"
					>
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
								d="M4 6h16M4 12h16M4 18h16"
							/>
						</svg>
					</div>
					<ul
						class="menu menu-sm dropdown-content mt-3 z-[1] p-2 shadow-lg bg-base-100 rounded-box w-56 border border-base-300"
					>
						<!-- Navigation Links with Active States -->
						<li>
							<a
								href="/"
								class={isHomePage
									? "active bg-primary/10 text-primary font-semibold"
									: ""}
								aria-current={isHomePage ? "page" : undefined}
							>
								<span class="flex items-center gap-3">
									<span class="text-lg">📖</span>
									<span>Reading Queue</span>
									{#if isHomePage}
										<div
											class="badge badge-primary badge-xs ml-auto"
										></div>
									{/if}
								</span>
							</a>
						</li>
						<li>
							<a
								href="/wishlist"
								class={isWishlistPage
									? "active bg-primary/10 text-primary font-semibold"
									: ""}
								aria-current={isWishlistPage
									? "page"
									: undefined}
							>
								<span class="flex items-center gap-3">
									<span class="text-lg">📚</span>
									<span>Full Wishlist</span>
									{#if isWishlistPage}
										<div
											class="badge badge-primary badge-xs ml-auto"
										></div>
									{/if}
								</span>
							</a>
						</li>

						<!-- Divider -->
						<li><hr class="my-2 border-base-300" /></li>

						<!-- Settings -->
						<li>
							<button
								onclick={openImportExportModal}
								class="flex items-center gap-3"
							>
								<span class="text-lg">⚙️</span>
								<span>Settings</span>
							</button>
						</li>
					</ul>
				</div>

				<!-- Settings Button (Desktop) -->
				<button
					class="btn btn-ghost btn-sm gap-2 hover:bg-base-300 transition-colors hidden lg:flex"
					onclick={openImportExportModal}
					title="Import/Export Settings"
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
							d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"
						/>
						<path
							stroke-linecap="round"
							stroke-linejoin="round"
							stroke-width="2"
							d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
						/>
					</svg>
					Settings
				</button>
			</div>
		</div>
	</header>

	<!-- Mobile Filter Bar (only on wishlist page) -->
	{#if isWishlistPage}
		<div class="lg:hidden bg-base-200 border-b border-base-300 safe-area-inset-left safe-area-inset-right">
			<div class="px-4 py-2">
				<div class="flex items-center justify-between gap-2">
					<!-- Search -->
					<div class="flex-1">
						<div class="form-control">
							<div class="relative">
								<div class="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
									<svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4 text-base-content/50" fill="none" viewBox="0 0 24 24" stroke="currentColor">
										<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
									</svg>
								</div>
								<input
									type="text"
									placeholder="Search books..."
									class="input input-bordered input-sm w-full pl-10 pr-10 bg-base-100"
									value={$filterStore.searchQuery}
									oninput={(e) => filterActions.setSearchQuery(e.currentTarget.value)}
								/>
								{#if $filterStore.searchQuery}
									<div class="absolute inset-y-0 right-0 pr-3 flex items-center">
										<button
											class="btn btn-ghost btn-xs btn-circle"
											onclick={() => filterActions.setSearchQuery("")}
											aria-label="Clear search"
										>
											<svg xmlns="http://www.w3.org/2000/svg" class="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
												<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
											</svg>
										</button>
									</div>
								{/if}
							</div>
						</div>
					</div>

					<!-- Filter and Add buttons -->
					<div class="flex gap-2">
						<button
							class="btn btn-outline btn-sm"
							onclick={() => {
								window.dispatchEvent(new CustomEvent('toggle-filters'));
							}}
							title="Advanced Filters"
						>
							<svg class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
								<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.207A1 1 0 013 6.5V4z" />
							</svg>
							{#if $filterStore.selectedTags.length > 0}
								<span class="badge badge-primary badge-xs ml-1">{$filterStore.selectedTags.length}</span>
							{/if}
						</button>
						<button
							class="btn btn-primary btn-sm"
							onclick={() => {
								window.dispatchEvent(new CustomEvent('open-add-book-modal'));
							}}
							title="Add Book"
						>
							<svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
								<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4" />
							</svg>
						</button>
					</div>
				</div>
			</div>
		</div>
	{/if}

	<main
		class="w-full lg:container lg:mx-auto px-0 lg:px-4 py-0 lg:py-2 safe-area-inset-left safe-area-inset-right safe-area-inset-bottom"
	>
		{@render children?.()}
	</main>

	<!-- Import/Export Modal -->
	<ImportExport
		isOpen={showImportExport}
		on:close={closeImportExportModal}
		on:dataImported={handleDataImported}
	/>

	<!-- PWA Installer -->
	<PWAInstaller />
</div>
