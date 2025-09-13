import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';

// GET /api/ping - Simple ping endpoint without database checks
export const GET: RequestHandler = async () => {
    return json({
        success: true,
        data: {
            status: 'ok',
            timestamp: new Date().toISOString(),
            message: 'Server is running'
        },
        message: 'Pong'
    });
};