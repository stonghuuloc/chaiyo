import { describe, expect, it } from 'vitest';
import { cssMs, dialogPop, scrimFade, sheetSlide, toastRise } from './motion';

const node = {} as Element;

describe('ui motion', () => {
	it('Given_NoDocument_When_CssMs_Then_ReturnsFallback', () => {
		// Arrange
		// Act
		const ms = cssMs('--motion-sheet', 280);
		// Assert
		expect(ms).toBe(280);
	});

	it.each([
		['sheetSlide', sheetSlide, 280, 'translateY(0%)'],
		['dialogPop', dialogPop, 280, 'scale(1)'],
		['toastRise', toastRise, 180, 'translateY(0px)']
	])('Given_NotReduced_When_%s_Then_MovesAndFades', (_n, fn, ms, rest) => {
		// Arrange
		// Act
		const cfg = fn(node, { reduced: false });
		const css = cfg.css?.(1, 0) ?? '';
		const start = cfg.css?.(0, 1) ?? '';
		// Assert
		expect(cfg.duration).toBe(ms);
		expect(css).toContain(rest);
		expect(start).toContain('transform');
	});

	it.each([
		['sheetSlide', sheetSlide],
		['dialogPop', dialogPop],
		['toastRise', toastRise],
		['scrimFade', scrimFade]
	])('Given_Reduced_When_%s_Then_FadeOnly150ms', (_n, fn) => {
		// Arrange
		// Act
		const cfg = fn(node, { reduced: true });
		const css = cfg.css?.(0.5, 0.5) ?? '';
		// Assert
		expect(cfg.duration).toBe(150);
		expect(css).toContain('opacity: 0.5');
		expect(css).not.toContain('transform');
	});

	it('Given_NotReduced_When_ScrimFade_Then_UsesScrimToken', () => {
		// Arrange
		// Act
		const cfg = scrimFade(node, { reduced: false });
		// Assert
		expect(cfg.duration).toBe(150);
		expect(cfg.css?.(0.25, 0.75)).toBe('opacity: 0.25');
	});
});
