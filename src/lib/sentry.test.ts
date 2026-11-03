import { afterEach, describe, expect, it, vi } from 'vitest';

const load = async (dsn: string | undefined) => {
	vi.resetModules();
	vi.doMock('$app/env/public', () => ({ PUBLIC_SENTRY_DSN: dsn }));
	return (await import('./sentry.js')).sentryOptions;
};

afterEach(() => {
	vi.doUnmock('$app/env/public');
});

describe('sentryOptions', () => {
	it('stays conservative by default', async () => {
		const options = await load(undefined);
		expect(options.sendDefaultPii).toBe(false);
		expect(options.tracesSampleRate).toBeLessThanOrEqual(0.1);
	});

	it('uses a falsy non-nullish dsn when unset so the server env fallback stays off', async () => {
		expect((await load(undefined)).dsn).toBe('');
	});

	it('passes a configured dsn through', async () => {
		expect((await load('https://key@example.ingest.sentry.io/1')).dsn).toBe(
			'https://key@example.ingest.sentry.io/1'
		);
	});
});
