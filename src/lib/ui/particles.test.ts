import { afterEach, describe, expect, it, vi } from 'vitest';
import { particles, reducedMotion } from './particles';

afterEach(() => vi.unstubAllGlobals());

describe('particles', () => {
	it('Given_Ember_When_Particles_Then_18WithinRanges', () => {
		// Arrange
		const low = () => 0;
		const high = () => 0.999;

		// Act
		const a = particles('ember', low);
		const b = particles('ember', high);

		// Assert
		expect(a).toHaveLength(18);
		expect(b).toHaveLength(18);
		expect(a[0]).toEqual({ left: 0, size: 10, duration: 3, delay: 0 });
		for (const p of b) {
			expect(p.left).toBeGreaterThanOrEqual(0);
			expect(p.left).toBeLessThan(100);
			expect(p.size).toBeGreaterThanOrEqual(10);
			expect(p.size).toBeLessThan(22);
			expect(p.duration).toBeGreaterThanOrEqual(3);
			expect(p.duration).toBeLessThan(6);
			expect(p.delay).toBeGreaterThanOrEqual(0);
			expect(p.delay).toBeLessThan(1.5);
		}
	});

	it('Given_Snow_When_Particles_Then_Size12to26', () => {
		// Arrange / Act
		const a = particles('snow', () => 0);
		const b = particles('snow', () => 0.999);

		// Assert
		expect(a).toHaveLength(18);
		expect(a[0].size).toBe(12);
		expect(b.every((p) => p.size >= 12 && p.size < 26)).toBe(true);
	});

	it('Given_MatchMediaReduce_When_ReducedMotion_Then_True', () => {
		// Arrange
		vi.stubGlobal('matchMedia', (q: string) => ({
			matches: q === '(prefers-reduced-motion: reduce)'
		}));

		// Act / Assert
		expect(reducedMotion()).toBe(true);
	});

	it('Given_MatchMediaNoPreference_When_ReducedMotion_Then_False', () => {
		// Arrange
		vi.stubGlobal('matchMedia', () => ({ matches: false }));

		// Act / Assert
		expect(reducedMotion()).toBe(false);
	});
});
