import { PUBLIC_SENTRY_DSN, VERCEL_ENV } from '$app/env/public';

export const sentryOptions = {
	dsn: PUBLIC_SENTRY_DSN ?? '',
	environment: VERCEL_ENV ?? 'development',
	tracesSampleRate: 0.05,
	sendDefaultPii: false
};
