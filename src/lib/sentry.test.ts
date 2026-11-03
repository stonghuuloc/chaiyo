import { describe, expect, it } from 'vitest';
import { sentryOptions } from './sentry.js';

describe('sentryOptions', () => {
	it('stays conservative by default', () => {
		expect(sentryOptions.sendDefaultPii).toBe(false);
		expect(sentryOptions.tracesSampleRate).toBeLessThanOrEqual(0.1);
	});

	it('is disabled without a DSN', () => {
		expect(sentryOptions.dsn).toBeUndefined();
	});
});
