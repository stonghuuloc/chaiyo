import { defineEnvVars } from '@sveltejs/kit/env';

const optional = (value: string | undefined) => value || undefined;

// Supabase project values are public by design; RLS guards the data.
export const variables = defineEnvVars({
	PUBLIC_SUPABASE_URL: { public: true, static: true },
	PUBLIC_SUPABASE_PUBLISHABLE_KEY: { public: true, static: true },
	// Sentry is a no-op while the DSN is unset. The DSN is public by design.
	PUBLIC_SENTRY_DSN: { public: true, static: true, schema: optional },
	// Public base URL of the audio clips bucket (R2 r2.dev or custom domain); unset serves /audio on the app origin.
	PUBLIC_AUDIO_BASE_URL: { public: true, static: true, schema: optional },
	// Deployment name (production, preview, development) set by Vercel at build; local builds fall back to development.
	VERCEL_ENV: { public: true, static: true, schema: optional }
});
