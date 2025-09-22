import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { sqlite } from '$lib/server/db/connection.js';

export const GET: RequestHandler = async () => {
    try {
        // Check if migrations table exists
        const tablesResult = sqlite.prepare(`
            SELECT name FROM sqlite_master
            WHERE type='table' AND name='_migrations'
        `).all();

        if (tablesResult.length === 0) {
            return json({
                success: true,
                data: {
                    migrationsTableExists: false,
                    appliedMigrations: [],
                    message: 'Migrations table not found'
                }
            });
        }

        // Get applied migrations
        const migrations = sqlite.prepare(`
            SELECT id, applied_at
            FROM _migrations
            ORDER BY applied_at
        `).all();

        return json({
            success: true,
            data: {
                migrationsTableExists: true,
                appliedMigrations: migrations,
                totalApplied: migrations.length
            }
        });
    } catch (error) {
        return json({
            success: false,
            error: 'Failed to check migrations',
            details: (error as Error).message
        }, { status: 500 });
    }
};