import type { RequestHandler as GenericRequestHandler } from '@sveltejs/kit';

export type RequestHandler = GenericRequestHandler<{
    id: string;
}>;