import { readdirSync, readFileSync, statSync } from 'node:fs';
import { dirname, join, sep } from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';

const src = fileURLToPath(new URL('../../', import.meta.url));
const read = (path: string) => readFileSync(join(src, path), 'utf8');
const walk = (dir: string): string[] =>
	readdirSync(dir).flatMap((name) => {
		const path = join(dir, name);
		return statSync(path).isDirectory() ? walk(path) : [path];
	});

// walks outwards from idx through each enclosing { block and reads the text that opens it
function insideHoverMedia(code: string, idx: number) {
	let depth = 0;
	for (let i = idx - 1; i >= 0; i--) {
		if (code[i] === '}') depth++;
		if (code[i] !== '{') continue;
		if (depth-- > 0) continue;
		const head = code.slice(Math.max(code.lastIndexOf('}', i), code.lastIndexOf(';', i), 0), i);
		if (head.includes('@media') && head.includes('hover: hover')) return true;
	}
	return false;
}

describe('route shell declarations', () => {
	it.each([
		['routes/(app)/(tabs)/+layout.ts', 'tab-root'],
		['routes/(app)/lesson/[id]/[section]/+page.ts', 'focus'],
		['routes/(app)/lesson/[id]/gate/+page.ts', 'focus'],
		['routes/(app)/practice/session/+page.ts', 'focus'],
		['routes/(app)/word/[id]/+page.ts', 'pushed'],
		['routes/(app)/settings/+page.ts', 'pushed']
	])('Given_%s_Then_DeclaresTemplate_%s', (file, template) => {
		// Arrange
		// Act
		const code = read(file);
		// Assert
		expect(code).toContain(`template: '${template}'`);
	});

	it.each([
		['routes/(app)/word/[id]/+page.ts', 'practice'],
		['routes/(app)/settings/+page.ts', 'me']
	])('Given_PushedRoute_%s_Then_LightsTab_%s', (file, section) => {
		// Arrange
		// Act
		const code = read(file);
		// Assert
		expect(code).toContain(`section: '${section}'`);
	});

	it('Given_EveryAppPage_Then_ItsRouteOrAParentLayoutDeclaresShell', () => {
		// Arrange
		const app = join(src, 'routes/(app)');
		const pages = walk(app).filter((f) => f.endsWith('+page.svelte'));
		const declared = walk(app).filter(
			(f) => /\+(page|layout)\.ts$/.test(f) && readFileSync(f, 'utf8').includes('shell:')
		);
		// Act
		const missing = pages.filter(
			(page) =>
				!declared.some((d) =>
					d.endsWith('+layout.ts')
						? dirname(page).startsWith(dirname(d) + sep)
						: dirname(page) === dirname(d)
				)
		);
		// Assert
		expect(missing.map((f) => f.replace(app, ''))).toEqual([]);
	});
});

describe('layout rules', () => {
	it('Given_TabsLayout_Then_TabBarPaddingAppliesOnlyBelow1024', () => {
		// Arrange
		// Act
		const layout = read('routes/(app)/(tabs)/+layout.svelte');
		// Assert
		expect(layout).toContain('pb-[calc(66px+14px+env(safe-area-inset-bottom,0px))] lg:pb-16');
	});

	it('Given_LayoutCss_Then_NavInsetIsNonZeroOnlyUnderMinWidth64rem', () => {
		// Arrange
		const css = read('routes/layout.css');
		// Act
		const base = css.match(/\.shell \{[^}]*--nav-inset: (\S+);/)?.[1];
		const wide = css.match(
			/@media \(min-width: 64rem\) \{[^@]*\.shell\[data-nav\] \{\s*--nav-inset: var\(--sidebar\);/
		);
		const all = css.match(/--nav-inset: [^;]+;/g);
		// Assert
		expect(base).toBe('0px');
		expect(wide).not.toBeNull();
		expect(all).toHaveLength(2);
	});

	it('Given_SrcStyles_Then_EveryHoverRuleSitsInsideAHoverMediaQuery', () => {
		// Arrange
		const files = walk(src).filter((f) => /\.(svelte|css)$/.test(f) && !f.includes('paraglide'));
		// Act
		const bad = files.flatMap((file) => {
			const code = readFileSync(file, 'utf8');
			return [...code.matchAll(/:hover/g)]
				.filter((hit) => !insideHoverMedia(code, hit.index))
				.map(() => file.replace(src, ''));
		});
		// Assert
		expect(bad).toEqual([]);
	});
});
