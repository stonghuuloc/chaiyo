import { execFileSync } from 'node:child_process';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';

describe('generated motion tokens', () => {
	const css = readFileSync(new URL('./tokens.css', import.meta.url), 'utf8');

	it('has the fade duration', () => {
		expect(css).toContain('--motion-fade: 260ms;');
	});

	it('has the reduced-motion fade duration', () => {
		expect(css).toContain('--motion-fade-reduced: 150ms;');
	});
});

describe('layout width tokens (ADR 0008)', () => {
	const css = readFileSync(new URL('./tokens.css', import.meta.url), 'utf8');

	it.each([
		['--container-column', '430px'],
		['--container-dialog', '340px'],
		['--container-medium', '600px'],
		['--container-main', '640px'],
		['--container-aside', '280px'],
		['--container-narrow', '560px'],
		['--container-form', '400px'],
		['--container-sheet', '480px'],
		['--sidebar', '232px']
	])('Given_Tokens_Then_%s_Is_%s', (name, px) => {
		// Arrange
		// Act
		const match = css.match(new RegExp(`^\\t${name}: (.+);$`, 'm'));
		// Assert
		expect(match?.[1]).toBe(px);
	});

	it('Given_WideAside_Then_SidebarMainAndAsideFillTheContentAreaAt1280', () => {
		// Arrange
		const px = (name: string) => Number(css.match(new RegExp(`\\t${name}: (\\d+)px;`))?.[1]);
		// Act
		const area = 1280 - px('--sidebar') - 2 * 40;
		// Assert
		expect(area).toBe(px('--container-main') + 48 + px('--container-aside'));
	});
});

describe('generated tokens.css', () => {
	const root = fileURLToPath(new URL('../../../', import.meta.url));
	const committed = readFileSync(new URL('./tokens.css', import.meta.url), 'utf8');
	// run in node: importing the untyped .mjs breaks svelte-check (implicit any)
	const regenerate = () =>
		execFileSync(
			process.execPath,
			[
				'--input-type=module',
				'-e',
				"import { readFileSync } from 'node:fs'; import { toCss } from './scripts/build-tokens.mjs'; process.stdout.write(toCss(JSON.parse(readFileSync('design.tokens.json', 'utf8'))));"
			],
			{ cwd: root, encoding: 'utf8' }
		);

	it('Given_DesignTokens_When_ToCss_Then_EqualsCommittedTokensCss', () => {
		// Arrange
		// Act
		const generated = regenerate();
		// Assert
		expect(committed).toBe(generated);
		expect(generated.match(/^\t--[\w-]+:/gm)?.length).toBeGreaterThan(70);
	});

	it('Given_FrostSheenTokens_Then_CarryTheTabBarValues', () => {
		// Arrange
		// Act
		const vars = Object.fromEntries(
			[...committed.matchAll(/^\t(--color-frost-(?:inner|sheen-[a-z]+)): (.+);$/gm)].map((m) => [
				m[1],
				m[2]
			])
		);
		// Assert
		expect(vars).toEqual({
			'--color-frost-inner': 'rgb(40 20 10 / 0.08)',
			'--color-frost-sheen-top': 'rgb(255 255 255 / 0.45)',
			'--color-frost-sheen-clear': 'rgb(255 255 255 / 0)',
			'--color-frost-sheen-glow': 'rgb(255 255 255 / 0.25)'
		});
	});
});

describe('primitive tokens', () => {
	const css = readFileSync(new URL('./tokens.css', import.meta.url), 'utf8');
	const has = (line: string) => css.includes(`\t${line};`);

	it('Given_PrimitiveTokens_Then_PresentInTokensCss', () => {
		// Arrange
		const expected = [
			'--container-column: 430px',
			'--container-dialog: 340px',
			'--shadow-lift: 0px 10px 24px 0px rgb(168 38 20 / 0.28)',
			'--color-lift-rim: rgb(255 255 255 / 0.18)',
			'--color-scrim: rgb(29 24 20 / 0.5)',
			'--shadow-overlay: 0px 20px 60px 0px rgb(29 24 20 / 0.3)',
			'--color-frost-divider: rgb(40 25 15 / 0.18)',
			'--spacing: 4px',
			'--inset-shadow-lift: inset 0px 1px 0px 0px var(--color-lift-rim)',
			'--color-*: initial',
			'--motion-press: 120ms',
			'--motion-scrim: 150ms',
			'--motion-sheet: 280ms',
			'--motion-dialog: 280ms',
			'--motion-toast: 180ms'
		];
		// Act
		const missing = expected.filter((l) => !has(l));
		// Assert
		expect(missing).toEqual([]);
	});
});
