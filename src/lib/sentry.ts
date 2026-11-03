import { PUBLIC_SENTRY_DSN, VERCEL_ENV } from '$app/env/public';

export const sentryOptions = {
	dsn: PUBLIC_SENTRY_DSN ?? '',
	environment: VERCEL_ENV ?? 'development',
	tracesSampleRate: PUBLIC_SENTRY_DSN ? 0.05 : 0,
	sendDefaultPii: false
};
