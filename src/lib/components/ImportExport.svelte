<script lang="ts">
	import { createEventDispatcher } from 'svelte';
	import { apiClient } from '$lib/services/api-client';
	import { generateId } from '$lib/utils/id';
	import type { Book, BookTag } from '$lib/types/book';

	let { isOpen = false } = $props<{ isOpen?: boolean }>();

	const dispatch = createEventDispatcher<{
		close: void;
		dataImported: { result: ImportResult };
	}>();

	interface ImportResult {
		success: boolean;
		data?: any;
		error?: string;
		warnings?: string[];
		booksImported?: number;
		booksSkipped?: number;
	}

	let importMode = $state<'replace' | 'merge' | 'skip-duplicates'>('replace');
	let isImporting = $state(false);
	let isExporting = $state(false);
	let importResult: ImportResult | null = $state(null);
	let dragOver = $state(false);
	let fileInputRef = $state<HTMLInputElement>();

	// Export functionality
	async function handleExport() {
		isExporting = true;
		try {
			// Get all books from the API
			const books = await apiClient.getBooks();

			// Convert API books to export format
			const exportData = {
				books: books.map(book => ({
					id: book.id,
					title: book.title,
					author: book.author,
					narratorRating: book.narratorRating,
					performanceRating: book.performanceRating,
					description: book.description,
					coverImageUrl: book.coverImageUrl,
					queuePosition: book.queuePosition,
					dateAdded: book.dateAdded.toISOString(),
					tags: book.tags || []
				})),
				lastUpdated: new Date().toISOString(),
				exportedAt: new Date().toISOString(),
				version: '1.0'
			};

			// Create and download the file
			const jsonString = JSON.stringify(exportData, null, 2);
			const blob = new Blob([jsonString], { type: 'application/json' });
			const url = URL.createObjectURL(blob);

			const link = document.createElement('a');
			link.href = url;
			link.download = `audiobook-wishlist-${new Date().toISOString().split('T')[0]}.json`;
			document.body.appendChild(link);
			link.click();
			document.body.removeChild(link);
			URL.revokeObjectURL(url);

		} catch (error) {
			console.error('Export failed:', error);
			importResult = {
				success: false,
				error: `Export failed: ${error instanceof Error ? error.message : 'Unknown error'}`
			};
		} finally {
			isExporting = false;
		}
	}

	// Import functionality
	async function handleFileSelect(event: Event) {
		const target = event.target as HTMLInputElement;
		const file = target.files?.[0];
		if (file) {
			await processImportFile(file);
		}
	}

	async function processImportFile(file: File) {
		isImporting = true;
		importResult = null;

		try {
			// Validate file type
			if (!file.type.includes('json') && !file.name.endsWith('.json')) {
				throw new Error('Please select a valid JSON file');
			}

			// Check file size (limit to 10MB)
			const maxSize = 10 * 1024 * 1024;
			if (file.size > maxSize) {
				throw new Error('File is too large. Maximum size is 10MB');
			}

			// Read file content
			const fileContent = await readFileAsText(file);
			const importData = JSON.parse(fileContent);

			// Validate import data structure
			if (!importData.books || !Array.isArray(importData.books)) {
				throw new Error('Invalid file format: missing books array');
			}

			// Process the import based on the selected mode
			const result = await performImport(importData, importMode);
			importResult = result;

			if (result.success) {
				dispatch('dataImported', { result });
			}

		} catch (error) {
			console.error('Import failed:', error);
			importResult = {
				success: false,
				error: `Import failed: ${error instanceof Error ? error.message : 'Unknown error'}`
			};
		} finally {
			isImporting = false;
		}
	}

	async function performImport(importData: any, strategy: 'replace' | 'merge' | 'skip-duplicates'): Promise<ImportResult> {
		const warnings: string[] = [];
		let booksImported = 0;
		let booksSkipped = 0;

		try {
			// Get existing books if we're merging or skipping duplicates
			let existingBooks: ApiBook[] = [];
			if (strategy !== 'replace') {
				existingBooks = await apiClient.getBooks();
			}

			// Process imported books
			for (const bookData of importData.books) {
				try {
					// Validate required fields
					if (!bookData.title || !bookData.author) {
						warnings.push(`Skipped book with missing title or author: ${bookData.title || 'Unknown'}`);
						booksSkipped++;
						continue;
					}

					// Check for duplicates if needed
					if (strategy === 'skip-duplicates') {
						const exists = existingBooks.some(book =>
							book.title.toLowerCase() === bookData.title.toLowerCase() &&
							book.author.toLowerCase() === bookData.author.toLowerCase()
						);
						if (exists) {
							warnings.push(`Skipped duplicate book: ${bookData.title} by ${bookData.author}`);
							booksSkipped++;
							continue;
						}
					} else if (strategy === 'merge') {
						// For merge, delete existing book if it exists
						const existingBook = existingBooks.find(book =>
							book.title.toLowerCase() === bookData.title.toLowerCase() &&
							book.author.toLowerCase() === bookData.author.toLowerCase()
						);
						if (existingBook) {
							await apiClient.deleteBook(existingBook.id);
							warnings.push(`Updated existing book: ${bookData.title} by ${bookData.author}`);
						}
					}

					// Prepare book data for API
					const bookToCreate = {
						title: bookData.title.trim(),
						author: bookData.author.trim(),
						narratorRating: bookData.narratorRating || undefined,
						performanceRating: bookData.performanceRating || undefined,
						description: bookData.description?.trim() || undefined,
						coverImageUrl: bookData.coverImageUrl?.trim() || undefined,
						audibleUrl: bookData.audibleUrl?.trim() || undefined,
						queuePosition: bookData.queuePosition || undefined,
						highlyRatedFor: bookData.highlyRatedFor?.trim() || undefined,
						tags: bookData.tags?.map((tag: any) => ({
							id: tag.id || generateId(),
							name: tag.name,
							color: tag.color
						})) || []
					};

					// Create the book via API
					await apiClient.createBook(bookToCreate);
					booksImported++;

				} catch (bookError) {
					console.warn('Failed to import book:', bookData, bookError);
					warnings.push(`Failed to import book "${bookData.title}": ${bookError instanceof Error ? bookError.message : 'Unknown error'}`);
					booksSkipped++;
				}
			}

			return {
				success: true,
				booksImported,
				booksSkipped,
				warnings: warnings.length > 0 ? warnings : undefined
			};

		} catch (error) {
			return {
				success: false,
				error: error instanceof Error ? error.message : 'Unknown error during import'
			};
		}
	}

	function readFileAsText(file: File): Promise<string> {
		return new Promise((resolve, reject) => {
			const reader = new FileReader();
			reader.onload = (event) => {
				const result = event.target?.result;
				if (typeof result === 'string') {
					resolve(result);
				} else {
					reject(new Error('Failed to read file as text'));
				}
			};
			reader.onerror = () => reject(new Error('Failed to read file'));
			reader.readAsText(file);
		});
	}

	// Drag and drop handlers
	function handleDragOver(event: DragEvent) {
		event.preventDefault();
		dragOver = true;
	}

	function handleDragLeave(event: DragEvent) {
		event.preventDefault();
		dragOver = false;
	}

	async function handleDrop(event: DragEvent) {
		event.preventDefault();
		dragOver = false;

		const files = event.dataTransfer?.files;
		if (files && files.length > 0) {
			await processImportFile(files[0]);
		}
	}

	function closeModal() {
		dispatch('close');
	}

	function selectFile() {
		fileInputRef?.click();
	}
</script>

{#if isOpen}
	<div class="modal modal-open" role="dialog" aria-labelledby="modal-title">
		<div class="modal-box max-w-4xl">
			<h3 id="modal-title" class="font-bold text-lg mb-6">Import/Export Settings</h3>

			<!-- Export Section -->
			<div class="mb-8">
				<h4 class="font-semibold text-base mb-4 flex items-center gap-2">
					<span class="text-lg">📤</span>
					Export Data
				</h4>
				<p class="text-sm text-base-content/70 mb-4">
					Download your audiobook wishlist as a JSON file for backup or transfer to another device.
				</p>
				<button
					class="btn btn-primary"
					class:loading={isExporting}
					disabled={isExporting}
					onclick={handleExport}
				>
					{#if isExporting}
						Exporting...
					{:else}
						Export Wishlist
					{/if}
				</button>
			</div>

			<div class="divider"></div>

			<!-- Import Section -->
			<div class="mb-8">
				<h4 class="font-semibold text-base mb-4 flex items-center gap-2">
					<span class="text-lg">📥</span>
					Import Data
				</h4>
				<p class="text-sm text-base-content/70 mb-4">
					Import books from a previously exported JSON file.
				</p>

				<!-- Import Mode Selection -->
				<div class="mb-4">
					<label class="label">
						<span class="label-text font-medium">Import Mode</span>
					</label>
					<div class="form-control">
						<label class="label cursor-pointer justify-start gap-3">
							<input
								type="radio"
								name="import-mode"
								class="radio radio-primary"
								bind:group={importMode}
								value="replace"
							/>
							<div>
								<div class="label-text font-medium">Replace All</div>
								<div class="label-text-alt text-base-content/60">
									Remove all existing books and import new ones
								</div>
							</div>
						</label>
						<label class="label cursor-pointer justify-start gap-3">
							<input
								type="radio"
								name="import-mode"
								class="radio radio-primary"
								bind:group={importMode}
								value="merge"
							/>
							<div>
								<div class="label-text font-medium">Merge</div>
								<div class="label-text-alt text-base-content/60">
									Add new books and update existing ones
								</div>
							</div>
						</label>
						<label class="label cursor-pointer justify-start gap-3">
							<input
								type="radio"
								name="import-mode"
								class="radio radio-primary"
								bind:group={importMode}
								value="skip-duplicates"
							/>
							<div>
								<div class="label-text font-medium">Skip Duplicates</div>
								<div class="label-text-alt text-base-content/60">
									Only add books that don't already exist
								</div>
							</div>
						</label>
					</div>
				</div>

				<!-- File Drop Area -->
				<div
					class="border-2 border-dashed rounded-lg p-8 text-center transition-colors duration-200"
					class:border-primary={dragOver}
					class:bg-primary={dragOver}
					class:bg-opacity-5={dragOver}
					class:border-base-300={!dragOver}
					ondragover={handleDragOver}
					ondragleave={handleDragLeave}
					ondrop={handleDrop}
				>
					<div class="flex flex-col items-center gap-3">
						<span class="text-4xl">📄</span>
						<p class="font-medium">Drop your JSON file here or click to select</p>
						<p class="text-sm text-base-content/60">Maximum file size: 10MB</p>
						<button
							class="btn btn-outline btn-sm"
							onclick={selectFile}
							disabled={isImporting}
						>
							Select File
						</button>
					</div>
				</div>

				<input
					type="file"
					accept=".json,application/json"
					class="hidden"
					bind:this={fileInputRef}
					onchange={handleFileSelect}
				/>
			</div>

			<!-- Import Results -->
			{#if importResult}
				<div class="mb-6">
					{#if importResult.success}
						<div class="alert alert-success">
							<svg xmlns="http://www.w3.org/2000/svg" class="stroke-current shrink-0 h-6 w-6" fill="none" viewBox="0 0 24 24">
								<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
							</svg>
							<div>
								<h3 class="font-bold">Import Successful!</h3>
								<div class="text-xs">
									{#if importResult.booksImported}
										<p>📚 {importResult.booksImported} books imported</p>
									{/if}
									{#if importResult.booksSkipped}
										<p>⏭️ {importResult.booksSkipped} books skipped</p>
									{/if}
								</div>
							</div>
						</div>
					{:else}
						<div class="alert alert-error">
							<svg xmlns="http://www.w3.org/2000/svg" class="stroke-current shrink-0 h-6 w-6" fill="none" viewBox="0 0 24 24">
								<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" />
							</svg>
							<div>
								<h3 class="font-bold">Import Failed</h3>
								<div class="text-xs">{importResult.error}</div>
							</div>
						</div>
					{/if}

					{#if importResult.warnings && importResult.warnings.length > 0}
						<div class="alert alert-warning mt-4">
							<svg xmlns="http://www.w3.org/2000/svg" class="stroke-current shrink-0 h-6 w-6" fill="none" viewBox="0 0 24 24">
								<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.268 16.5c-.77.833.192 2.5 1.732 2.5z" />
							</svg>
							<div>
								<h4 class="font-bold">Warnings</h4>
								<ul class="text-xs mt-1 space-y-1">
									{#each importResult.warnings as warning}
										<li>• {warning}</li>
									{/each}
								</ul>
							</div>
						</div>
					{/if}
				</div>
			{/if}

			{#if isImporting}
				<div class="mb-6">
					<div class="alert alert-info">
						<span class="loading loading-spinner loading-sm"></span>
						<span>Importing books... Please wait.</span>
					</div>
				</div>
			{/if}

			<!-- Modal Actions -->
			<div class="modal-action">
				<button class="btn" onclick={closeModal}>Close</button>
			</div>
		</div>
	</div>
{/if}