import { describe, expect, it } from 'vitest';
import { variables } from './env.js';

describe('optional Sentry variables', () => {
	it.each(['PUBLIC_SENTRY_DSN', 'VERCEL_ENV'] as const)(
		'%s treats an empty value as unset',
		(name) => {
			const { schema } = variables[name];
			expect(schema['~standard'].validate('')).toEqual({ value: undefined });
			expect(schema['~standard'].validate('x')).toEqual({ value: 'x' });
		}
	);
});
