import { error } from '@sveltejs/kit';
import { VERCEL_ENV } from '$app/env/public';

export const prerender = false;

export function load() {
	if (VERCEL_ENV === 'production') error(404);
}
