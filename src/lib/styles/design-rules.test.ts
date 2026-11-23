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
const BORDER_WIDTH = /^(?:[\w-]+:)*border(?:-[trblxyse])?(?:-\d+|-\[[^\]]+\])?$/;
const BORDER_COLOUR = new RegExp(
	`^(?:[\\w-]+:)*border(?:-[trblxyse])?-(?:${COLOURS.join('|')}|transparent|current)(?:/\\d+)?$`
);
const EMOJI = /[\u{1F000}-\u{1FAFF}\u{2300}-\u{23FF}\u{2600}-\u{27BF}\u{2B00}-\u{2BFF}]|\u{FE0F}/u;
const LETTER = `['"](?:Key[A-Z]|[A-Za-z])['"]`;
const LETTER_KEY = new RegExp(
	`\\.(?:key|code)(?:\\.toLowerCase\\(\\))?\\s*[!=]==?\\s*${LETTER}|switch\\s*\\(\\s*\\w+\\.(?:key|code)\\s*\\)\\s*\\{(?:[^{}]|\\{[^{}]*\\})*?case\\s+${LETTER}\\s*:`,
	'g'
);
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
	const styles = [...text.matchAll(/<style[^>]*>([\s\S]*?)<\/style>/g)]
		.map((m) => m[1].replace(/\/\*[\s\S]*?\*\//g, ''))
		.join();
	const sized = [...styles.matchAll(/([^{}]*)\{([^{}]*)\}/g)].filter((m) =>
		/\bfont(-size)?\s*:/.test(m[2])
	);
	return new Set(
		sized.flatMap((m) =>
			m[1].split(',').flatMap((sel) => {
				const last =
					sel
						.trim()
						.split(/[\s>+~]+/)
						.pop() ?? '';
				return [...last.matchAll(/\.(-?[_a-zA-Z][\w-]*)/g)].map((c) => c[1]);
			})
		)
	);
}

const CLASS_ATTR = /\bclass=(?:"([^"]*)"|'([^']*)'|\{((?:[^{}]|\{[^{}]*\})*)\})/g;

function classLists(text: string): { at: number; classes: string[] }[] {
	return [...text.matchAll(CLASS_ATTR)].map((m) => ({
		at: m.index,
		classes: (m[1] ?? m[2] ?? m[3])
			.replace(/\[(?=\s*['"`])|(?<=['"`]\s*)\]|[{},?'"`]|&&|\|\|/g, ' ')
			.split(/\s+/)
			.filter(Boolean)
	}));
}

function lineAt(text: string, index: number): number {
	return text.slice(0, index).split('\n').length;
}

function unsizedHeadings(text: string): number[] {
	const local = scoped(text);
	return [...text.matchAll(HEADING)]
		.filter(
			(m) =>
				!classLists(m[0]).some(({ classes }) =>
					classes.some((c) => HEADING_SIZE.test(c) || local.has(c))
				)
		)
		.map((m) => lineAt(text, m.index));
}

const variantOf = (c: string) => c.slice(0, c.lastIndexOf(':') + 1);

function uncolouredBorders(text: string): number[] {
	return classLists(text)
		.filter(({ classes }) => {
			const colours = classes.filter((c) => BORDER_COLOUR.test(c)).map(variantOf);
			return classes
				.filter((c) => BORDER_WIDTH.test(c))
				.some((w) => !colours.some((v) => v === '' || v === variantOf(w)));
		})
		.map(({ at }) => lineAt(text, at));
}

function hits(files: string[], find: (text: string) => number[]): string[] {
	return files.flatMap((f) => {
		const text = readFileSync(f, 'utf8');
		return find(text).map((line) => `${relative(src, f)}:${line}`);
	});
}

function lines(re: RegExp) {
	const global = new RegExp(re.source, re.flags.includes('g') ? re.flags : `${re.flags}g`);
	return (text: string) => [...text.matchAll(global)].map((m) => lineAt(text, m.index));
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
		['<h1 class="wrap">x</h1><style>.wrap { margin: 0; }</style>', 1],
		["<h1 class='text-title'>x</h1>", 0],
		["<h1 class={['text-title']}>x</h1>", 0],
		["<h2 class={['mt-4']}>x</h2>", 1],
		['<h1 class="text-[56px] leading-none">x</h1>', 0],
		['<h1 class="card">x</h1><style>.card h1 { font-size: 2px; }</style>', 1]
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
		['<div class="border p-4 {extra}"></div>', 1],
		['<div class="md:border-2"></div>', 1],
		["<div class={['border', 'p-4']}></div>", 1],
		["<div class={['border', 'border-ruled-line']}></div>", 0],
		["<div class='border p-4'></div>", 1],
		["<div class={open ? 'border border-ink' : 'p-4'}></div>", 0],
		['<div class="border border-border"></div>', 0],
		['<div class="md:border-2 md:border-border"></div>', 0],
		['<div class="border-ruled-line not-first:border-t"></div>', 0],
		['<div class="md:border-2 md:border-ink"></div>', 0]
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
		['<span>⏰</span>', true],
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
		["if (e.key.toLowerCase() === 'n') next();", true],
		["switch (e.key) { case 'n': next(); }", true],
		["switch (e.key) {\n\tcase 'n':\n\t\tnext();\n}", true],
		["switch (e.key) {\n\tcase 'Enter': {\n\t\tgo();\n\t}\n\tcase 'n':\n\t\tnext();\n}", true],
		["switch (e.key) {\n\tcase 'Enter':\n\t\tgo();\n}\nswitch (grade) {\n\tcase 'A':\n}", false],
		["if (e.key === 'Escape') close();", false]
	])('Given_KeyHandler_Then_LetterRuleMatches: %s', (sample, hit) => {
		// Arrange
		// Act
		const found = lines(LETTER_KEY)(sample).length > 0;
		// Assert
		expect(found).toBe(hit);
	});
});
