import adapter from '@sveltejs/adapter-auto';
import { vitePreprocess } from '@sveltejs/vite-plugin-svelte';

/** @type {import('@sveltejs/kit').Config} */
const config = {
	// Consult https://svelte.dev/docs/kit/integrations
	// for more information about preprocessors
	preprocess: vitePreprocess(),

	kit: {
		// Use auto adapter for Railway deployment
		adapter: adapter(),
		serviceWorker: {
			register: !process.argv.includes('dev')
		}
	}
};

export default config;
