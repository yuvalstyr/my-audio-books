<script lang="ts">
	import "../app.css";
	import { page } from "$app/stores";
	// import { ImportExport } from "$lib/components"; // Temporarily disabled during API migration
	import PWAInstaller from "$lib/components/PWAInstaller.svelte";

	// import type { ImportResult } from "$lib/services/import-export"; // Temporarily disabled during API migration

	let { children } = $props();

	// Import/Export modal state - temporarily disabled during API migration
	// let showImportExport = $state(false);

	// Navigation state
	const currentPath = $derived($page.url.pathname);
	const isHomePage = $derived(currentPath === "/");
	const isWishlistPage = $derived(currentPath === "/wishlist");

	/**
	 * Open import/export modal - temporarily disabled during API migration
	 */
	function openImportExportModal() {
		// showImportExport = true;
		console.log("Import/Export temporarily disabled during API migration");
	}

	/**
	 * Close import/export modal - temporarily disabled during API migration
	 */
	function closeImportExportModal() {
		// showImportExport = false;
	}

	/**
	 * Handle successful data import - temporarily disabled during API migration
	 */
	function handleDataImported(event: any) {
		// The import was successful, we could show a toast notification here
		// or trigger a page refresh if needed
		console.log("Data imported successfully:", event.detail.result);
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
			<div
				class="flex items-center gap-2 bg-base-100 rounded-lg p-1 shadow-inner"
			>
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
		</div>

		<div class="navbar-end">
			<div class="flex gap-2">
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
								<span
									class="text-xs text-base-content/50 ml-auto"
									>Soon</span
								>
							</button>
						</li>
					</ul>
				</div>

				<!-- Settings Button (Desktop) -->
				<button
					class="btn btn-ghost btn-sm gap-2 hover:bg-base-300 transition-colors hidden lg:flex"
					onclick={openImportExportModal}
					title="Settings (Coming Soon)"
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

	<!-- Page Context Indicator (Breadcrumb-style) -->
	{#if isHomePage || isWishlistPage}
		<div
			class="bg-base-100 border-b border-base-200 safe-area-inset-left safe-area-inset-right"
		>
			<div class="container mx-auto px-4 py-3">
				<div class="flex items-center justify-between">
					<div class="flex items-center gap-2 text-sm">
						<span class="text-base-content/60"
							>You are viewing:</span
						>
						{#if isHomePage}
							<div
								class="flex items-center gap-2 text-primary font-medium"
							>
								<span>📖</span>
								<span>Reading Queue</span>
								<div class="badge badge-primary badge-sm">
									Focus Mode
								</div>
							</div>
						{:else if isWishlistPage}
							<div
								class="flex items-center gap-2 text-secondary font-medium"
							>
								<span>📚</span>
								<span>Full Wishlist</span>
								<div class="badge badge-secondary badge-sm">
									Complete Collection
								</div>
							</div>
						{/if}
					</div>

					<!-- Quick Navigation -->
					<div class="hidden sm:flex items-center gap-2">
						{#if isHomePage}
							<a
								href="/wishlist"
								class="btn btn-ghost btn-xs gap-1 text-base-content/70 hover:text-base-content"
							>
								<span>View all books</span>
								<svg
									xmlns="http://www.w3.org/2000/svg"
									class="h-3 w-3"
									fill="none"
									viewBox="0 0 24 24"
									stroke="currentColor"
								>
									<path
										stroke-linecap="round"
										stroke-linejoin="round"
										stroke-width="2"
										d="M9 5l7 7-7 7"
									/>
								</svg>
							</a>
						{:else if isWishlistPage}
							<a
								href="/"
								class="btn btn-ghost btn-xs gap-1 text-base-content/70 hover:text-base-content"
							>
								<svg
									xmlns="http://www.w3.org/2000/svg"
									class="h-3 w-3"
									fill="none"
									viewBox="0 0 24 24"
									stroke="currentColor"
								>
									<path
										stroke-linecap="round"
										stroke-linejoin="round"
										stroke-width="2"
										d="M15 19l-7-7 7-7"
									/>
								</svg>
								<span>Back to queue</span>
							</a>
						{/if}
					</div>
				</div>
			</div>
		</div>
	{/if}

	<main
		class="container mx-auto px-4 py-6 safe-area-inset-left safe-area-inset-right safe-area-inset-bottom"
	>
		{@render children?.()}
	</main>

	<!-- Import/Export Modal - temporarily disabled during API migration -->
	<!-- <ImportExport
		isOpen={showImportExport}
		on:close={closeImportExportModal}
		on:dataImported={handleDataImported}
	/> -->

	<!-- PWA Installer -->
	<PWAInstaller />
</div>
