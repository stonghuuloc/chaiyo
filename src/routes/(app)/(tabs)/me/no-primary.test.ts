import { describe, expect, it } from 'vitest';

const sources = import.meta.glob('./*.svelte', {
	query: '?raw',
	import: 'default',
	eager: true
}) as Record<string, string>;

const bare = (src: string) =>
	[...src.matchAll(/<Button\b[^>]*>/g)].filter((t) => !/variant="(ink|outline)"/.test(t[0]));

describe('me route has no red primary button', () => {
	it('Given_MeComponents_Then_NoPrimaryButton', () => {
		expect(Object.keys(sources).length).toBeGreaterThan(5);
		const offenders = Object.entries(sources).flatMap(([file, src]) =>
			bare(src).map((t) => `${file}: ${t[0]}`)
		);
		expect(offenders).toEqual([]);
	});

	it('Given_FixtureWithBareButton_Then_RuleFlags', () => {
		expect(bare('<Button>Go</Button>')).toHaveLength(1);
		expect(bare('<Button variant="ink">Go</Button>')).toHaveLength(0);
		expect(bare('<Button variant="outline" size="sm">Go</Button>')).toHaveLength(0);
	});
});
