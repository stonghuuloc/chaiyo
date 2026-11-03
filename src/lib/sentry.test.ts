import { afterEach, describe, expect, it, vi } from 'vitest';

const load = async (values: { PUBLIC_SENTRY_DSN?: string; VERCEL_ENV?: string }) => {
	vi.resetModules();
	vi.doMock('$app/env/public', () => ({
		PUBLIC_SENTRY_DSN: undefined,
		VERCEL_ENV: undefined,
		...values
	}));
	return (await import('./sentry.js')).sentryOptions;
};

afterEach(() => {
	vi.doUnmock('$app/env/public');
});

describe('sentryOptions', () => {
	it('stays conservative by default', async () => {
		const options = await load({});
		expect(options.sendDefaultPii).toBe(false);
		expect(options.tracesSampleRate).toBe(0);
		expect(
			(await load({ PUBLIC_SENTRY_DSN: 'https://key@example.ingest.sentry.io/1' })).tracesSampleRate
		).toBeLessThanOrEqual(0.1);
	});

	it('uses a falsy non-nullish dsn when unset so the server env fallback stays off', async () => {
		expect((await load({})).dsn).toBe('');
	});

	it('passes a configured dsn through', async () => {
		expect((await load({ PUBLIC_SENTRY_DSN: 'https://key@example.ingest.sentry.io/1' })).dsn).toBe(
			'https://key@example.ingest.sentry.io/1'
		);
	});

	it('defaults the environment to development locally', async () => {
		expect((await load({})).environment).toBe('development');
	});

	it.each(['production', 'preview'])('uses the Vercel environment %s', async (VERCEL_ENV) => {
		expect((await load({ VERCEL_ENV })).environment).toBe(VERCEL_ENV);
	});
});
