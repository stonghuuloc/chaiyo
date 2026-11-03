import { defineEnvVars } from '@sveltejs/kit/env';

const optional = (value: string | undefined) => value || undefined;

// Supabase project values are public by design; RLS guards the data.
export const variables = defineEnvVars({
	PUBLIC_SUPABASE_URL: { public: true, static: true },
	PUBLIC_SUPABASE_PUBLISHABLE_KEY: { public: true, static: true },
	// Sentry is a no-op while the DSN is unset. The DSN is public by design.
	PUBLIC_SENTRY_DSN: { public: true, static: true, schema: optional },
	// Build-time only, read by vite.config.ts for source-map upload; never bundled.
	SENTRY_AUTH_TOKEN: { static: true, schema: optional },
	SENTRY_ORG: { static: true, schema: optional },
	SENTRY_PROJECT: { static: true, schema: optional },
	SENTRY_URL: { static: true, schema: optional }
});
