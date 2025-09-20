import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { db } from '$lib/server/db/connection.js';
import { sql } from 'drizzle-orm';
import dbPath from '$lib/server/db/path.js';

// GET /api/debug - Diagnostic information about database state
export const GET: RequestHandler = async ({ request }) => {
    try {
        const fs = await import('fs');
        const path = await import('path');

        const diagnostics = {
            timestamp: new Date().toISOString(),
            environment: {
                NODE_ENV: process.env.NODE_ENV,
                RAILWAY_VOLUME_MOUNT_PATH: process.env.RAILWAY_VOLUME_MOUNT_PATH || 'NOT SET',
                DATABASE_PATH: process.env.DATABASE_PATH || 'NOT SET'
            },
            databasePath: {
                resolved: dbPath,
                exists: false,
                size: 0,
                readable: false,
                writable: false
            },
            directory: {
                path: '',
                exists: false,
                writable: false,
                contents: []
            },
            database: {
                connected: false,
                tables: [],
                error: null
            }
        };

        // Check database file
        try {
            if (fs.existsSync(dbPath)) {
                diagnostics.databasePath.exists = true;
                const stats = fs.statSync(dbPath);
                diagnostics.databasePath.size = stats.size;

                try {
                    fs.accessSync(dbPath, fs.constants.R_OK);
                    diagnostics.databasePath.readable = true;
                } catch {}

                try {
                    fs.accessSync(dbPath, fs.constants.W_OK);
                    diagnostics.databasePath.writable = true;
                } catch {}
            }
        } catch (error) {
            diagnostics.databasePath.error = (error as Error).message;
        }

        // Check directory
        const dbDir = path.dirname(dbPath);
        diagnostics.directory.path = dbDir;

        try {
            if (fs.existsSync(dbDir)) {
                diagnostics.directory.exists = true;

                try {
                    fs.accessSync(dbDir, fs.constants.W_OK);
                    diagnostics.directory.writable = true;
                } catch {}

                try {
                    const contents = fs.readdirSync(dbDir);
                    diagnostics.directory.contents = contents.slice(0, 20); // Limit to first 20 files
                } catch {}
            }
        } catch (error) {
            diagnostics.directory.error = (error as Error).message;
        }

        // Test database connection
        try {
            await db.select({ test: sql`1` }).limit(1);
            diagnostics.database.connected = true;

            // Get table list
            const tables = await db.all(sql`
                SELECT name FROM sqlite_master
                WHERE type='table' AND name NOT LIKE 'sqlite_%'
                ORDER BY name
            `);
            diagnostics.database.tables = tables.map((t: any) => t.name);

        } catch (error) {
            diagnostics.database.error = (error as Error).message;
        }

        // Check specific volume mount paths if Railway
        if (process.env.RAILWAY_VOLUME_MOUNT_PATH) {
            try {
                const volumeContents = fs.readdirSync(process.env.RAILWAY_VOLUME_MOUNT_PATH);
                diagnostics.railway = {
                    volumeExists: true,
                    volumeContents: volumeContents.slice(0, 20)
                };
            } catch (error) {
                diagnostics.railway = {
                    volumeExists: false,
                    error: (error as Error).message
                };
            }
        }

        return json({
            success: true,
            diagnostics
        });

    } catch (error) {
        return json({
            success: false,
            error: (error as Error).message,
            stack: (error as Error).stack
        }, { status: 500 });
    }
};