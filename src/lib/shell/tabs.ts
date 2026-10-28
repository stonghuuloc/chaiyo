import { m } from '#lib/paraglide/messages.js';

export const TABS = [
	{ path: '/today', route: '/(app)/(tabs)/today', label: m.tab_today },
	{ path: '/roadmap', route: '/(app)/(tabs)/roadmap', label: m.tab_roadmap },
	{ path: '/practice', route: '/(app)/(tabs)/practice', label: m.tab_practice },
	{ path: '/me', route: '/(app)/(tabs)/me', label: m.tab_me }
] as const;

export function tabFor(pathname: string): number | null {
	const i = TABS.findIndex((t) => t.path === pathname);
	return i === -1 ? null : i;
}
