import { readdirSync, readFileSync } from 'node:fs';
import { join, relative } from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';

const src = fileURLToPath(new URL('../../', import.meta.url));
const COLOUR_LITERAL = /#[0-9a-fA-F]{3,8}\b|\b(?:rgb|rgba|hsl|hsla)\(/;
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
		'hsl(0 0% 0%)'
	])('Given_ColourLiteralSample_Then_RegexRejectsIt: %s', (sample) => {
		// Arrange
		// Act
		const hit = COLOUR_LITERAL.test(sample);
		// Assert
		expect(hit).toBe(true);
	});

	it('Given_TokenReference_Then_RegexAllowsIt', () => {
		// Arrange
		const sample = 'box-shadow: inset 0 1px 0 var(--frost-rim); href="#i-regular-house"';
		// Act
		const hit = COLOUR_LITERAL.test(sample);
		// Assert
		expect(hit).toBe(false);
	});
});
