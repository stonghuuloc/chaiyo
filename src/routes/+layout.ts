import { injectSpeedInsights } from '@vercel/speed-insights/sveltekit';

injectSpeedInsights();

// App pages are a client-rendered SPA behind login (ADR 0001); the Landing Page opts back into prerendering.
export const ssr = false;
