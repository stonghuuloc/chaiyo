import tailwindcss from '@tailwindcss/vite';
import { paraglideVitePlugin } from '@inlang/paraglide-js';
import { defineConfig } from 'vitest/config';
import adapter from '@sveltejs/adapter-vercel';
import { sentrySvelteKit } from '@sentry/sveltekit/vite';
import { sveltekit } from '@sveltejs/kit/vite';

export default defineConfig(() => {
	const env = process.env;

	return {
		plugins: [
			sentrySvelteKit({
				autoInstrument: false,
				autoUploadSourceMaps: Boolean(env.SENTRY_AUTH_TOKEN),
				authToken: env.SENTRY_AUTH_TOKEN,
				sentryUrl: env.SENTRY_URL,
				org: env.SENTRY_ORG,
				project: env.SENTRY_PROJECT
			}),
			tailwindcss(),
			sveltekit({
				compilerOptions: {
					// Force runes mode for the project, except for libraries. Can be removed in svelte 6.
					runes: ({ filename }) =>
						filename.split(/[/\\]/).includes('node_modules') ? undefined : true
				},
				adapter: adapter()
			}),

			paraglideVitePlugin({
				project: './project.inlang',
				outdir: './src/lib/paraglide',
				emitTsDeclarations: true
			})
		],
		test: {
			expect: { requireAssertions: true },
			coverage: {
				provider: 'v8',
				include: ['src/**/*.{js,ts,svelte}'],
				exclude: [
					'src/lib/paraglide/**',
					'src/service-worker/**',
					'src/hooks.client.ts',
					'src/**/*.{test,spec}.{js,ts}',
					'src/**/*.d.ts',
					'src/**/fixtures/**'
				],
				reporter: ['text', 'html', 'json-summary'],
				thresholds: { lines: 67, statements: 67, functions: 52, branches: 79 }
			},
			projects: [
				{
					extends: './vite.config.ts',
					test: {
						name: 'server',
						environment: 'node',
						include: ['src/**/*.{test,spec}.{js,ts}'],
						exclude: ['src/**/*.svelte.{test,spec}.{js,ts}']
					}
				}
			]
		}
	};
});
