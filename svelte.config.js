import adapter from '@sveltejs/adapter-node';
import { vitePreprocess } from '@sveltejs/vite-plugin-svelte';

/** @type {import('@sveltejs/kit').Config} */
const config = {
	// Consult https://svelte.dev/docs/kit/integrations
	// for more information about preprocessors
	preprocess: vitePreprocess(),

	// Disable accessibility warnings globally
	onwarn: (warning, handler) => {
		if (warning.code.startsWith('a11y_')) {
			return;
		}
		handler(warning);
	},

	kit: {
		// Use Node adapter for Railway deployment
		adapter: adapter(),
		serviceWorker: {
			register: !process.argv.includes('dev')
		}
	}
};

export default config;
