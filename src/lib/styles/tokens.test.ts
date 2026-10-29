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
			[...committed.matchAll(/^\t(--frost-(?:inner|sheen-[a-z]+)): (.+);$/gm)].map((m) => [
				m[1],
				m[2]
			])
		);
		// Assert
		expect(vars).toEqual({
			'--frost-inner': 'rgb(40 20 10 / 0.08)',
			'--frost-sheen-top': 'rgb(255 255 255 / 0.45)',
			'--frost-sheen-clear': 'rgb(255 255 255 / 0)',
			'--frost-sheen-glow': 'rgb(255 255 255 / 0.25)'
		});
	});
});
