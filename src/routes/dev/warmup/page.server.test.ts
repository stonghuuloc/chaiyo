import { describe, expect, it, vi } from 'vitest';

const env = vi.hoisted(() => ({ dev: false, VERCEL_ENV: 'production' }));
vi.mock('$app/env', () => ({
	get dev() {
		return env.dev;
	}
}));
vi.mock('$app/env/public', () => ({
	get VERCEL_ENV() {
		return env.VERCEL_ENV;
	}
}));

const { load } = await import('./+page.server');

describe('dev warmup guard', () => {
	it.each([
		[true, 'production'],
		[false, 'preview']
	])('Given_Dev_%s_Env_%s_When_Load_Then_Allowed', (dev, vercel) => {
		// Arrange
		env.dev = dev;
		env.VERCEL_ENV = vercel;

		// Act
		const run = () => load();

		// Assert
		expect(run).not.toThrow();
	});

	it('Given_Production_When_Load_Then_404', () => {
		// Arrange
		env.dev = false;
		env.VERCEL_ENV = 'production';

		// Act
		const run = () => load();

		// Assert
		expect(run).toThrow(expect.objectContaining({ status: 404 }));
	});
});
