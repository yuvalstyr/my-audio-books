import { sveltekit } from '@sveltejs/kit/vite';
import { defineConfig } from 'vite';
import tailwindcss from '@tailwindcss/vite';
import { VitePWA } from 'vite-plugin-pwa';

export default defineConfig({
	plugins: [
		sveltekit(),
		tailwindcss(),
		VitePWA({
			registerType: 'autoUpdate',
			workbox: {
				globPatterns: ['**/*.{js,css,html,ico,png,svg,webp,woff,woff2}'],
				navigateFallback: null,
				runtimeCaching: []
			},
			manifest: {
				name: 'Audiobook Wishlist Manager',
				short_name: 'Audiobook Wishlist',
				description: 'Personal audiobook wishlist management application',
				theme_color: '#1f2937',
				background_color: '#ffffff',
				display: 'standalone',
				orientation: 'portrait-primary',
				scope: process.env.BASE_PATH || '/',
				start_url: process.env.BASE_PATH || '/',
				icons: [
					{
						src: `${process.env.BASE_PATH || ''}/favicon.ico`,
						sizes: '48x48',
						type: 'image/x-icon'
					},
					{
						src: `${process.env.BASE_PATH || ''}/icon-192.png`,
						sizes: '192x192',
						type: 'image/png',
						purpose: 'maskable any'
					},
					{
						src: `${process.env.BASE_PATH || ''}/icon-512.png`,
						sizes: '512x512',
						type: 'image/png',
						purpose: 'maskable any'
					}
				]
			},
			devOptions: {
				enabled: true
			}
		})
	]
});
