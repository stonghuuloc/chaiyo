import { PUBLIC_SENTRY_DSN } from '$app/env/public';

export const sentryOptions = {
	dsn: PUBLIC_SENTRY_DSN,
	tracesSampleRate: 0.05,
	sendDefaultPii: false
};
