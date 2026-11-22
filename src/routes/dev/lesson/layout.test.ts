import { isHttpError } from '@sveltejs/kit';
import { afterEach, describe, expect, it, vi } from 'vitest';

const env = vi.hoisted(() => ({ dev: false, VERCEL_ENV: undefined as string | undefined }));
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

const { load } = await import('./+layout');

afterEach(() => {
	env.dev = false;
	env.VERCEL_ENV = undefined;
});

describe('dev lesson guard', () => {
	it('Given_ProductionBuild_When_Load_Then_404', () => {
		// Arrange
		env.VERCEL_ENV = 'production';
		// Act
		let thrown: unknown;
		try {
			load();
		} catch (e) {
			thrown = e;
		}
		// Assert
		expect(isHttpError(thrown, 404)).toBe(true);
	});

	it.each([
		[true, undefined],
		[false, 'preview']
	])('Given_dev_%s_env_%s_When_Load_Then_Open', (dev, vercel) => {
		// Arrange
		env.dev = dev;
		env.VERCEL_ENV = vercel;
		// Act
		const got = load();
		// Assert
		expect(got).toBeUndefined();
	});
});
