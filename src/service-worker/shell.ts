// Lesson bundles stay out of the precache: install stays small and opened lessons are cached on read.
export function appShell(paths: string[]): string[] {
	return paths.filter((p) => !p.startsWith('/content/'));
}

// ssr = false: every route ships the same document, so one cached page boots any URL offline.
export const APP_SHELL = '/today';

export async function cachedPage(
	cache: Pick<Cache, 'match'>,
	request: Request,
	shell: string
): Promise<Response | undefined> {
	return (await cache.match(request)) ?? (await cache.match(shell));
}
