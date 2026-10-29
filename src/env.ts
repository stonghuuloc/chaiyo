import { defineEnvVars } from '@sveltejs/kit/env';

// Supabase project values are public by design; RLS guards the data.
export const variables = defineEnvVars({
	PUBLIC_SUPABASE_URL: { public: true, static: true },
	PUBLIC_SUPABASE_PUBLISHABLE_KEY: { public: true, static: true }
});
