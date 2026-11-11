import { TABS } from './tabs.js';

export type Shell = {
	template: 'tab-root' | 'pushed' | 'focus' | 'public';
	section?: 'today' | 'roadmap' | 'practice' | 'me';
};

export type Nav = {
	// 'tab-bar': frost bar below 1024px, sidebar from 1024px. 'sidebar': sidebar from 1024px only.
	mode: 'tab-bar' | 'sidebar';
	active: number | null;
};

/** A route that declares no shell gets no navigation (fail-safe); each load returns its own template. */
export function navFor(shell: Shell | undefined, pathname: string): Nav | null {
	if (shell?.template === 'tab-root') {
		const i = TABS.findIndex((t) => t.path === pathname);
		return { mode: 'tab-bar', active: i === -1 ? null : i };
	}
	if (shell?.template !== 'pushed') return null;
	const i = TABS.findIndex((t) => t.path === `/${shell.section}`);
	return { mode: 'sidebar', active: i === -1 ? null : i };
}
