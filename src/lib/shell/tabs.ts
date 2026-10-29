import { m } from '#lib/paraglide/messages.js';

export const TABS = [
	{ path: '/today', icon: 'house', route: '/(app)/(tabs)/today', label: m.tab_today },
	{ path: '/roadmap', icon: 'path', route: '/(app)/(tabs)/roadmap', label: m.tab_roadmap },
	{ path: '/practice', icon: 'brain', route: '/(app)/(tabs)/practice', label: m.tab_practice },
	{ path: '/me', icon: 'user-circle', route: '/(app)/(tabs)/me', label: m.tab_me }
] as const;

export function tabFor(pathname: string): number | null {
	const i = TABS.findIndex((t) => t.path === pathname);
	return i === -1 ? null : i;
}
