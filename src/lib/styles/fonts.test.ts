import { existsSync, readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';

const src = fileURLToPath(new URL('../../', import.meta.url));
const read = (rel: string) => readFileSync(new URL(rel, import.meta.url), 'utf8');
const fontsCss = read('./fonts.css');
const tokensCss = read('./tokens.css');

const blocks = [...fontsCss.matchAll(/@font-face\s*\{([^}]*)\}/g)].map((m) => m[1]);
const faces = blocks.map((b) => ({
	family: b.match(/font-family:\s*['"]?([^'";]+?)['"]?\s*;/)?.[1] ?? '',
	display: b.match(/font-display:\s*(\w+)/)?.[1] ?? '',
	urls: [...b.matchAll(/url\(\s*['"]?([^'")]+)['"]?\s*\)/g)].map((m) => m[1])
}));
const imports = [...fontsCss.matchAll(/@import\s+['"]([^'"]+)['"]/g)].map((m) => m[1]);

function walk(dir: string): string[] {
	return readdirSync(dir, { withFileTypes: true }).flatMap((e) => {
		const p = join(dir, e.name);
		if (e.isDirectory()) return e.name === 'paraglide' ? [] : walk(p);
		return /\.(svelte|css|ts|html)$/.test(e.name) && !e.name.endsWith('.test.ts') ? [p] : [];
	});
}

describe('self-hosted fonts', () => {
	it('Given_Source_When_ScanForFontCdnHosts_Then_None', () => {
		// Arrange
		const files = walk(src);
		// Act
		const hits = files.filter((f) =>
			/fonts\.(googleapis|gstatic)\.com/.test(readFileSync(f, 'utf8'))
		);
		// Assert
		expect(files.some((f) => f.endsWith('app.html'))).toBe(true);
		expect(hits).toEqual([]);
	});

	it('Given_FontFaces_Then_EverySrcIsRelativeAndExists', () => {
		// Arrange
		const urls = faces.flatMap((f) => f.urls);
		// Act
		const bad = urls.filter(
			(u) =>
				/^(?:[a-z]+:)?\/\//i.test(u) ||
				!existsSync(new URL(u, new URL('./fonts.css', import.meta.url)))
		);
		// Assert
		expect(urls.length).toBeGreaterThanOrEqual(5);
		expect(bad).toEqual([]);
	});

	it('Given_Fonts_Then_DeclareEveryFamilyTheTokensName', () => {
		// Arrange
		const declared = new Set([
			...faces.map((f) => f.family),
			...imports.map((i) => (i.includes('be-vietnam-pro') ? 'Be Vietnam Pro' : ''))
		]);
		const first = (v: string) =>
			tokensCss.match(new RegExp(`--font-${v}: "?([^",;]+)`))?.[1] ?? 'missing';
		// Act
		const wanted = ['sans', 'serif', 'pinyin', 'hanzi'].map(first);
		// Assert
		expect(wanted).toEqual(['Be Vietnam Pro', 'Literata', 'Onest', 'AR PL UKai CN']);
		expect(wanted.filter((w) => !declared.has(w))).toEqual([]);
	});

	it('Given_FontFaces_Then_LatinFacesSwapAndKaishuBlocks', () => {
		// Arrange
		const kaishu = faces.filter((f) => f.family === 'AR PL UKai CN');
		const latin = faces.filter((f) => f.family !== 'AR PL UKai CN');
		// Act
		const wrong = latin.filter((f) => f.display !== 'swap');
		// Assert
		expect(kaishu.map((f) => f.display)).toEqual(['block']);
		expect(latin.length).toBeGreaterThanOrEqual(5);
		expect(wrong).toEqual([]);
	});

	it('Given_Onest_Then_ThreeWeightsDeclared', () => {
		// Arrange
		const onest = blocks.filter((b) => /font-family:\s*['"]?Onest/.test(b));
		// Act
		const weights = onest.map((b) => b.match(/font-weight:\s*(\d+)/)?.[1]).sort();
		// Assert
		expect(weights).toEqual(['400', '500', '600']);
	});
});
