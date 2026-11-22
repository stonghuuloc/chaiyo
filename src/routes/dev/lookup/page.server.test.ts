import { afterEach, describe, expect, it, vi } from 'vitest';

const load = async (dev: boolean, VERCEL_ENV?: string) => {
	vi.resetModules();
	vi.doMock('$app/env', () => ({ dev }));
	vi.doMock('$app/env/public', () => ({ VERCEL_ENV }));
	return (await import('./+page.server')).load;
};

afterEach(() => {
	vi.doUnmock('$app/env');
	vi.doUnmock('$app/env/public');
});

describe('dev lookup guard', () => {
	it('Given_Dev_When_Load_Then_Allowed', async () => {
		// Arrange
		const guard = await load(true);
		// Act
		const run = () => guard();
		// Assert
		expect(run).not.toThrow();
	});

	it('Given_PreviewBuild_When_Load_Then_Allowed', async () => {
		// Arrange
		const guard = await load(false, 'preview');
		// Act
		const run = () => guard();
		// Assert
		expect(run).not.toThrow();
	});

	it('Given_ProductionBuild_When_Load_Then_404', async () => {
		// Arrange
		const guard = await load(false, 'production');
		// Act
		const run = () => guard();
		// Assert
		expect(run).toThrow(expect.objectContaining({ status: 404 }));
	});
});
