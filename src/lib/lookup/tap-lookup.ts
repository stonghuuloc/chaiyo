import type { LookupHit } from '#lib/catalog/index.js';

export type TapLookup = {
	sentenceId: string;
	onhit: (hit: LookupHit) => void;
	onmiss?: (error: unknown) => void;
};

export function tapLookup(node: HTMLElement, params: TapLookup) {
	const onclick = async (e: MouseEvent) => {
		if (e.detail !== 1 || getSelection()?.isCollapsed === false) return;
		const el = (e.target as Element | null)?.closest<HTMLElement>('[data-i]');
		if (!el || !node.contains(el)) return;
		e.stopPropagation();
		const { sentenceId, onhit, onmiss } = params;
		try {
			const { catalog } = await import('#lib/catalog/app.js');
			onhit(await catalog.lookup(sentenceId, Number(el.dataset.i)));
		} catch (error) {
			onmiss?.(error);
		}
	};
	node.addEventListener('click', onclick);
	return {
		update(next: TapLookup) {
			params = next;
		},
		destroy() {
			node.removeEventListener('click', onclick);
		}
	};
}
