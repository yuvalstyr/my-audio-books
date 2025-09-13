import { defineConfig } from 'vitest/config';
import { sveltekit } from '@sveltejs/kit/vite';

export default defineConfig({
    plugins: [sveltekit()],
    test: {
        include: ['src/**/*.{test,spec}.{js,ts}'],
        environment: 'jsdom',
        setupFiles: ['src/test-setup.ts'],
        typecheck: {
            include: ['src/**/*.{test,spec}.{js,ts}']
        },
        coverage: {
            provider: 'v8',
            reporter: ['text', 'json', 'html', 'lcov'],
            include: ['src/**/*.{js,ts,svelte}'],
            exclude: [
                'src/**/*.test.{js,ts}',
                'src/**/*.spec.{js,ts}',
                'src/**/__tests__/**',
                'src/app.html'
            ],
            thresholds: {
                global: {
                    branches: 70,
                    functions: 70,
                    lines: 70,
                    statements: 70
                }
            }
        },
        testTimeout: 10000,
        hookTimeout: 10000
    }
});