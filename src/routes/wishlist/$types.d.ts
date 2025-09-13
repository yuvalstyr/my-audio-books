import type { PageLoad } from './$types';
import type { Book, BookTag } from '$lib/types/book';

export interface PageData {
    books: Book[];
    tags: BookTag[];
    loadError?: string;
    cache?: {
        maxAge: number;
        staleWhileRevalidate: number;
    };
}

export type { PageLoad };