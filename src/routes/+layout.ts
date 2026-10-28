import { browser } from '$app/env';
import { injectSpeedInsights } from '@vercel/speed-insights';

// The /sveltekit entry imports $app/stores, which Kit 3 removed; the generic entry has no such import.
if (browser) injectSpeedInsights({ framework: 'sveltekit' });

// App pages are a client-rendered SPA behind login (ADR 0001); the Landing Page opts back into prerendering.
export const ssr = false;
