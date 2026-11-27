import { globSync, readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

const TRACKERS = [
	'google-analytics.com',
	'googletagmanager.com',
	'plausible.io',
	'posthog',
	'mixpanel',
	'amplitude',
	'@vercel/analytics'
];

describe('analytics guard', () => {
	it('Given_Repo_Then_NoAnalyticsHostOrPackage', () => {
		const pkg = JSON.parse(readFileSync('package.json', 'utf8')) as {
			dependencies?: Record<string, string>;
			devDependencies?: Record<string, string>;
		};
		const deps = Object.keys({ ...pkg.dependencies, ...pkg.devDependencies });
		const files = globSync('src/**/*.{ts,svelte,html}').filter((f) => !f.endsWith('.test.ts'));
		expect(files.length).toBeGreaterThan(100);
		const hits = [
			...deps.filter((d) => TRACKERS.some((t) => d.includes(t))).map((d) => `package.json ${d}`),
			...files.flatMap((f) => {
				const text = readFileSync(f, 'utf8').toLowerCase();
				return TRACKERS.filter((t) => text.includes(t)).map((t) => `${f} ${t}`);
			})
		];
		expect(hits).toEqual([]);
	});
});
