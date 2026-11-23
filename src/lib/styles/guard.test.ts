import { readdirSync, readFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import { dirname, join, relative, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { __unstable__loadDesignSystem } from 'tailwindcss';
import { beforeAll, describe, expect, it } from 'vitest';

const src = fileURLToPath(new URL('../../', import.meta.url));
const COLOUR_LITERAL =
	/(?<!href=["']|url\()#[0-9a-fA-F]{3,8}\b|\b(?:rgba?|hsla?|hwb|lab|lch|oklab|oklch|color)\(/i;
const GENERATED = join('lib', 'styles', 'tokens.css');

function walk(dir: string): string[] {
	return readdirSync(dir, { withFileTypes: true }).flatMap((e) => {
		const p = join(dir, e.name);
		if (e.isDirectory()) return e.name === 'paraglide' ? [] : walk(p);
		return /\.(svelte|css)$/.test(e.name) ? [p] : [];
	});
}

describe('colour literals in component files', () => {
	it('Given_ComponentFiles_When_ScanForColourLiterals_Then_None', () => {
		// Arrange
		const files = walk(src).filter((f) => relative(src, f) !== GENERATED);
		// Act
		const offenders = files.flatMap((f) =>
			readFileSync(f, 'utf8')
				.split('\n')
				.flatMap((line, i) => (COLOUR_LITERAL.test(line) ? [`${relative(src, f)}:${i + 1}`] : []))
		);
		// Assert
		expect(files.length).toBeGreaterThan(5);
		expect(offenders).toEqual([]);
	});

	it.each([
		'color: #c6301d;',
		'color: #fff',
		'rgb(40 20 10 / 0.08)',
		'rgba(0,0,0,.5)',
		'hsl(0 0% 0%)',
		'oklch(60% 0.2 30)',
		'hwb(0 0% 0%)',
		'color(display-p3 1 0 0)',
		'RGB(0 0 0)',
		'OKLCH(60% 0.2 30)',
		'fill="#fff"'
	])('Given_ColourLiteralSample_Then_RegexRejectsIt: %s', (sample) => {
		// Arrange
		// Act
		const hit = COLOUR_LITERAL.test(sample);
		// Assert
		expect(hit).toBe(true);
	});

	it('Given_TokenReference_Then_RegexAllowsIt', () => {
		// Arrange
		const sample =
			'box-shadow: inset 0 1px 0 var(--frost-rim); href="#i-regular-house" href="#add" mask: url(#fade)';
		// Act
		const hit = COLOUR_LITERAL.test(sample);
		// Assert
		expect(hit).toBe(false);
	});
});

type DesignSystem = Awaited<ReturnType<typeof __unstable__loadDesignSystem>>;

const require = createRequire(import.meta.url);
const STRING_LITERAL = /'([^'\n]*)'|"([^"\n]*)"|`([^`]*)`/g;
const CLASS_ATTR = /\bclass=(?:"([^"]*)"|'([^']*)')/g;
const CLASS_EXPR = /\bclass=\{([^}]*)\}/g;
const CLASS_DIRECTIVE = /\bclass:([^\s=>]+)/g;
const IN_EXPR = /\{([^}]*)\}/g;

async function loadTokens(): Promise<DesignSystem> {
	const entry = join(src, 'routes', 'layout.css');
	return __unstable__loadDesignSystem(readFileSync(entry, 'utf8'), {
		base: dirname(entry),
		loadStylesheet: async (id: string, base: string) => {
			if (id === 'tailwindcss') {
				const path = require.resolve('tailwindcss/index.css');
				return { path, base: dirname(path), content: readFileSync(path, 'utf8') };
			}
			if (!id.startsWith('.')) return { path: id, base, content: '' };
			const path = resolve(base, id);
			return { path, base: dirname(path), content: readFileSync(path, 'utf8') };
		}
	});
}

function deadClassesAt(
	ds: DesignSystem,
	text: string,
	scoped = new Set<string>()
): { at: number; name: string }[] {
	const literals = (expr: string, at: number) =>
		[...expr.matchAll(STRING_LITERAL)].map((m) => ({
			attr: true,
			expr: true,
			at,
			body: (m[1] ?? m[2] ?? m[3]).replace(/\$\{[^}]*\}/g, ' ')
		}));
	const lists = [
		...[...text.matchAll(CLASS_ATTR)].flatMap((m) => {
			const value = m[1] ?? m[2];
			return [
				{ attr: true, at: m.index, body: value.replace(IN_EXPR, ' ') },
				...[...value.matchAll(IN_EXPR)].flatMap((e) => literals(e[1], m.index))
			];
		}),
		...[...text.matchAll(CLASS_EXPR)].flatMap((m) => literals(m[1], m.index)),
		...[...text.matchAll(CLASS_DIRECTIVE)].map((m) => ({ attr: true, at: m.index, body: m[1] })),
		...[...text.matchAll(STRING_LITERAL)].map((m) => ({
			attr: false,
			at: m.index,
			body: (m[1] ?? m[2] ?? m[3]).replace(/\$\{[^}]*\}/g, ' ')
		}))
	];
	const dead = lists.flatMap(({ attr, at, body, ...rest }) => {
		const words = body.split(/\s+/).filter((t) => t && !scoped.has(t));
		const tokens = words.filter((t) => ds.parseCandidate(t).length > 0);
		if (tokens.length === 0) return [];
		if (!attr && tokens.length < words.length) return [];
		const css = ds.candidatesToCss(tokens);
		if (!attr && css.every((c) => c === null)) return [];
		const bare = tokens.every((t, i) => css[i] === null && !/[-:]/.test(t));
		if ('expr' in rest && bare) return [];
		return tokens.filter((_, i) => css[i] === null).map((name) => ({ at, name }));
	});
	return [...new Map(dead.map((d) => [`${d.at} ${d.name}`, d])).values()];
}

function deadClasses(ds: DesignSystem, text: string, scoped?: Set<string>): string[] {
	return [...new Set(deadClassesAt(ds, text, scoped).map((d) => d.name))];
}

function scopedClasses(text: string): Set<string> {
	const styles = [...text.matchAll(/<style[^>]*>([\s\S]*?)<\/style>/g)].map((m) => m[1]).join('\n');
	return new Set([...styles.matchAll(/\.(-?[_a-zA-Z][\w-]*)/g)].map((m) => m[1]));
}

function sourceFiles(dir: string): string[] {
	return readdirSync(dir, { withFileTypes: true }).flatMap((e) => {
		const p = join(dir, e.name);
		if (e.isDirectory()) return e.name === 'paraglide' ? [] : sourceFiles(p);
		return /\.(svelte|ts)$/.test(e.name) && !/\.(test|spec)\./.test(e.name) ? [p] : [];
	});
}

describe('utility classes resolve to design tokens', () => {
	let ds: DesignSystem;

	beforeAll(async () => {
		ds = await loadTokens();
	});

	it('Given_SourceFiles_When_ResolveEveryUtilityClass_Then_NoneCompilesToNothing', () => {
		// Arrange
		const files = sourceFiles(src);
		// Act
		const offenders = files.flatMap((f) => {
			const text = readFileSync(f, 'utf8');
			return deadClassesAt(ds, text, scopedClasses(text)).map(
				({ at, name }) => `${relative(src, f)}:${text.slice(0, at).split('\n').length} ${name}`
			);
		});
		// Assert
		expect(files.length).toBeGreaterThan(5);
		expect(offenders).toEqual([]);
	});

	it.each([
		'class="text-sm"',
		'class="rounded"',
		'class="shadow"',
		"'flex rounded-2xl p-4'",
		"'flex text-lg gap-2'",
		'class="lg:text-xl"',
		'class="max-w-md"',
		'class="text-gray-500"',
		"class=\"grid gap-1.5 {today\n\t? 'x' : ''} text-caption\"",
		"class=\"grid {today ? 'text-caption' : 'text-label'}\"",
		"class={open ? 'text-sm' : 'text-label'}",
		"class={['flex', open && 'rounded-2xl']}",
		'class:rounded-2xl={x}',
		"class='flex shadow'"
	])('Given_StockTailwindClass_Then_GuardRejectsIt: %s', (sample) => {
		// Arrange
		// Act
		const dead = deadClasses(ds, sample);
		// Assert
		expect(dead).toHaveLength(1);
	});

	it.each([
		'class="text-label rounded-cell shadow-lift"',
		'class="rounded-full text-[56px] size-9 max-w-column"',
		"'flex items-center gap-2'",
		"'shadow'",
		"'hello world'",
		"'select sha from content_versions order by imported_at'",
		"class={kind === 'text' ? 'text-label' : 'text-title'}",
		'`create table t (id int); grant select on t to anon`',
		"class=\"flex {open ? 'a' : 'b'}\""
	])('Given_TokenClassOrPlainString_Then_GuardAllowsIt: %s', (sample) => {
		// Arrange
		// Act
		const dead = deadClasses(ds, sample);
		// Assert
		expect(dead).toEqual([]);
	});

	it('Given_ClassDefinedInComponentStyle_Then_GuardAllowsIt', () => {
		// Arrange
		const file = '<a class="tab top"></a>\n<style>.tab { color: red; } .top {}</style>';
		// Act
		const dead = deadClasses(ds, file, scopedClasses(file));
		// Assert
		expect(dead).toEqual([]);
	});
});
