import { error } from '@sveltejs/kit';
import { dev } from '$app/env';
import { VERCEL_ENV } from '$app/env/public';
import { loadSyllableClips } from './syllable-cells.server';

export const prerender = false;

export function load() {
	if (!dev && VERCEL_ENV !== 'preview') error(404);
	return loadSyllableClips();
}
