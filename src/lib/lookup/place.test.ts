import { describe, expect, it } from 'vitest';
import { place } from './place';

const H = 667;

describe('place', () => {
	it('Given_LineInTopHalf_When_Place_Then_PanelBelowLine', () => {
		// Arrange
		const rect = { top: 140, bottom: 200 };
		// Act
		const p = place(rect, H);
		// Assert
		expect(p).toEqual({ top: 208, maxHeight: 443 });
	});

	it('Given_LineInBottomHalf_When_Place_Then_PanelAboveLine', () => {
		// Arrange
		const rect = { top: 430, bottom: 500 };
		// Act
		const p = place(rect, H);
		// Assert
		expect(p).toEqual({ top: 8, maxHeight: 414 });
	});

	it('Given_LineNearTop_When_PlaceAbove_Then_MaxHeightFloorsAt120', () => {
		// Arrange
		const rect = { top: 60, bottom: 400 };
		// Act
		const p = place(rect, 600);
		// Assert
		expect(p).toEqual({ top: 8, maxHeight: 120 });
	});

	it.each([
		[140, 200],
		[430, 500]
	])('Given_EitherHalf_When_Place_Then_NoOverlap (%i-%i)', (top, bottom) => {
		// Arrange
		const rect = { top, bottom };
		// Act
		const p = place(rect, H);
		// Assert
		const panelEnd = p.top + p.maxHeight;
		expect(p.top >= bottom || panelEnd <= top).toBe(true);
	});
});
