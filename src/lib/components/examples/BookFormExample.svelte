<script lang="ts">
    import BookForm from "../BookForm.svelte";
    import type { Book, CreateBookInput } from "$lib/types/book";

    let isFormOpen = false;
    let editingBook: Book | null = null;
    let books: Book[] = [];

    function openAddForm() {
        editingBook = null;
        isFormOpen = true;
    }

    function openEditForm(book: Book) {
        editingBook = book;
        isFormOpen = true;
    }

    function handleSave(event: CustomEvent<{ book: CreateBookInput | Book }>) {
        const { book } = event.detail;

        if ("id" in book) {
            // Edit mode - update existing book
            const index = books.findIndex((b) => b.id === book.id);
            if (index !== -1) {
                books[index] = book as Book;
                books = books; // Trigger reactivity
            }
        } else {
            // Add mode - create new book
            const newBook: Book = {
                ...book,
                id: `book-${Date.now()}`,
                dateAdded: new Date(),
            };
            books = [...books, newBook];
        }

        isFormOpen = false;
    }

    function handleCancel() {
        isFormOpen = false;
    }

    function deleteBook(bookId: string) {
        books = books.filter((b) => b.id !== bookId);
    }
</script>

<div class="p-6 max-w-4xl mx-auto">
    <div class="flex justify-between items-center mb-6">
        <h1 class="text-3xl font-bold">BookForm Example</h1>
        <button class="btn btn-primary" on:click={openAddForm}>
            Add New Book
        </button>
    </div>

    <!-- Books List -->
    <div class="grid gap-4">
        {#each books as book (book.id)}
            <div class="card bg-base-100 shadow-md border">
                <div class="card-body">
                    <div class="flex justify-between items-start">
                        <div>
                            <h3 class="card-title">{book.title}</h3>
                            <p class="text-base-content/70">by {book.author}</p>
                            {#if book.audibleUrl}
                                <a
                                    href={book.audibleUrl}
                                    class="link link-primary text-sm"
                                    target="_blank"
                                >
                                    View on Audible
                                </a>
                            {/if}
                            {#if book.tags.length > 0}
                                <div class="flex flex-wrap gap-1 mt-2">
                                    {#each book.tags as tag}
                                        <span class="badge {tag.color} badge-sm"
                                            >{tag.name}</span
                                        >
                                    {/each}
                                </div>
                            {/if}
                        </div>
                        <div class="flex gap-2">
                            <button
                                class="btn btn-sm btn-outline"
                                on:click={() => openEditForm(book)}
                            >
                                Edit
                            </button>
                            <button
                                class="btn btn-sm btn-error btn-outline"
                                on:click={() => deleteBook(book.id)}
                            >
                                Delete
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        {:else}
            <div class="text-center py-12">
                <p class="text-base-content/60">
                    No books added yet. Click "Add New Book" to get started!
                </p>
            </div>
        {/each}
    </div>

    <!-- BookForm Modal -->
    <BookForm
        book={editingBook}
        {isFormOpen}
        on:save={handleSave}
        on:cancel={handleCancel}
    />
</div>
