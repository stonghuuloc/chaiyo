// Lesson bundles stay out of the precache: install stays small and current.json stays network-first.
export function appShell(paths: string[]): string[] {
	return paths.filter((p) => !p.startsWith('/content/'));
}
