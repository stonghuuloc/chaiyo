import { readdirSync, readFileSync } from 'node:fs';
import { join, relative } from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';

const src = fileURLToPath(new URL('../../', import.meta.url));
const messages = fileURLToPath(new URL('../../../messages/', import.meta.url));
const tokens = readFileSync(join(src, 'lib', 'styles', 'tokens.css'), 'utf8');

const COLOURS = [...tokens.matchAll(/--color-([a-z][\w-]*):/g)].map((m) => m[1]);
const HEADING = /<h[12]\b[^>]*>/g;
const HEADING_SIZE =
	/^(text-(display|headline|title|action|body|label|chip|toast|tab)|text-\[[^\]]+\]|sr-only)$/;
const BORDER_WIDTH = /^(?:[\w-]+:)*border(?:-[trblxy])?(?:-\d+|-\[[^\]]+\])?$/;
const BORDER_COLOUR = new RegExp(
	`^(?:[\\w-]+:)*border(?:-[trblxy])?-(?:${COLOURS.join('|')}|transparent|current)(?:/\\d+)?$`
);
const EMOJI = /[\u{1F000}-\u{1FAFF}\u{2600}-\u{27BF}\u{2B00}-\u{2BFF}]|\u{FE0F}/u;
const LETTER_KEY = /\.(?:key|code)\s*[!=]==?\s*['"](?:Key[A-Z]|[A-Za-z])['"]/;
const WEBGL = /getContext\(\s*['"](?:webgl2?|experimental-webgl)['"]/;

function walk(dir: string, ext: RegExp): string[] {
	return readdirSync(dir, { withFileTypes: true }).flatMap((e) => {
		const p = join(dir, e.name);
		if (e.isDirectory()) return e.name === 'paraglide' ? [] : walk(p, ext);
		return ext.test(e.name) && !/\.(test|spec)\./.test(e.name) ? [p] : [];
	});
}

const screens = () =>
	walk(src, /\.svelte$/).filter((f) => !relative(src, f).startsWith(join('routes', 'dev')));
const code = () => walk(src, /\.(svelte|ts)$/);

function scoped(text: string): Set<string> {
	const styles = [...text.matchAll(/<style[^>]*>([\s\S]*?)<\/style>/g)].map((m) => m[1]).join();
	const sized = [...styles.matchAll(/([^{}]*)\{([^{}]*)\}/g)].filter((m) =>
		/\bfont(-size)?\s*:/.test(m[2])
	);
	return new Set(
		sized.flatMap((m) => [...m[1].matchAll(/\.(-?[_a-zA-Z][\w-]*)/g)].map((c) => c[1]))
	);
}

function classesOf(tag: string): string[] {
	const m = /\bclass="([^"]*)"/.exec(tag);
	return m
		? m[1]
				.replace(/\{[^}]*\}/g, ' ')
				.split(/\s+/)
				.filter(Boolean)
		: [];
}

function lineAt(text: string, index: number): number {
	return text.slice(0, index).split('\n').length;
}

function unsizedHeadings(text: string): number[] {
	const local = scoped(text);
	return [...text.matchAll(HEADING)]
		.filter((m) => !classesOf(m[0]).some((c) => HEADING_SIZE.test(c) || local.has(c)))
		.map((m) => lineAt(text, m.index));
}

function uncolouredBorders(text: string): number[] {
	return [...text.matchAll(/\bclass="([^"]*)"/g)]
		.filter((m) => {
			const cls = m[1].replace(/[{}?:'"`]|&&|\|\|/g, (t) => (t === ':' ? ':' : ' ')).split(/\s+/);
			return (
				cls.some((c) => BORDER_WIDTH.test(c) && !c.includes(':')) &&
				!cls.some((c) => BORDER_COLOUR.test(c) && !c.includes(':'))
			);
		})
		.map((m) => lineAt(text, m.index));
}

function hits(files: string[], find: (text: string) => number[]): string[] {
	return files.flatMap((f) => {
		const text = readFileSync(f, 'utf8');
		return find(text).map((line) => `${relative(src, f)}:${line}`);
	});
}

function lines(re: RegExp) {
	return (text: string) => text.split('\n').flatMap((line, i) => (re.test(line) ? [i + 1] : []));
}

describe('DESIGN.md rules', () => {
	it('Given_Screens_Then_EveryH1AndH2CarriesATypeToken', () => {
		// Arrange
		const files = screens();
		// Act
		const bad = hits(files, unsizedHeadings);
		// Assert
		expect(files.length).toBeGreaterThan(5);
		expect(bad).toEqual([]);
	});

	it('Given_Screens_Then_EveryBorderHasATokenColour', () => {
		// Arrange
		const files = screens();
		// Act
		const bad = hits(files, uncolouredBorders);
		// Assert
		expect(bad).toEqual([]);
	});

	it('Given_UiTextAndMessages_Then_NoEmoji', () => {
		// Arrange
		const files = [...screens(), ...walk(messages, /\.json$/)];
		// Act
		const bad = files.flatMap((f) =>
			lines(EMOJI)(readFileSync(f, 'utf8')).map((l) => `${relative(src, f)}:${l}`)
		);
		// Assert
		expect(bad).toEqual([]);
	});

	it('Given_Code_Then_NoLetterKeyShortcuts', () => {
		// Arrange
		// Act
		const bad = hits(code(), lines(LETTER_KEY));
		// Assert
		expect(bad).toEqual([]);
	});

	it('Given_Code_Then_NoWebGl', () => {
		// Arrange
		// Act
		const bad = hits(code(), lines(WEBGL));
		// Assert
		expect(bad).toEqual([]);
	});

	it.each([
		['<h1>Hôm nay</h1>', 1],
		['<h2 class="mt-5 font-display">Lộ trình</h2>', 1],
		['<h1 class="text-display">Hôm nay</h1>', 0],
		['<h2 class="sr-only">x</h2>', 0],
		['<h1 class="title">x</h1><style>.title { font-size: 36px; }</style>', 0],
		['<h1 class="wrap">x</h1><style>.wrap { margin: 0; }</style>', 1]
	])('Given_Heading_Then_SizeRuleCounts: %s', (sample, count) => {
		// Arrange
		// Act
		const bad = unsizedHeadings(sample);
		// Assert
		expect(bad).toHaveLength(count);
	});

	it.each([
		['<div class="border p-4"></div>', 1],
		['<div class="mt-6 border-t pt-5"></div>', 1],
		['<div class="border border-ruled-line"></div>', 0],
		['<div class="border-t-2 border-lantern-red/40"></div>', 0],
		['<div class="aria-selected:border-ink border"></div>', 1],
		['<div class="border border-ruled-line aria-selected:border-ink"></div>', 0],
		['<div class="border p-4 {extra}"></div>', 1]
	])('Given_Border_Then_ColourRuleCounts: %s', (sample, count) => {
		// Arrange
		// Act
		const bad = uncolouredBorders(sample);
		// Assert
		expect(bad).toHaveLength(count);
	});

	it.each([
		['<span>✓</span>', true],
		['"streak": "🔥 7 ngày"', true],
		['<span>你好！</span>', false],
		['"x": "Chào · bạn"', false]
	])('Given_Text_Then_EmojiRuleMatches: %s', (sample, hit) => {
		// Arrange
		// Act
		const found = EMOJI.test(sample);
		// Assert
		expect(found).toBe(hit);
	});

	it.each([
		["if (e.key === 'n') next();", true],
		["if (e.code === 'KeyN') next();", true],
		["if (e.code === 'Digit1') pick(0);", false],
		["if (e.key === 'Enter') submit();", false],
		["if (e.key === 'Escape') close();", false]
	])('Given_KeyHandler_Then_LetterRuleMatches: %s', (sample, hit) => {
		// Arrange
		// Act
		const found = LETTER_KEY.test(sample);
		// Assert
		expect(found).toBe(hit);
	});
});
