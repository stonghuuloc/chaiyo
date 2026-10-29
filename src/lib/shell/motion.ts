import { cubicOut } from 'svelte/easing';
import type { TransitionConfig } from 'svelte/transition';

export function slideParams(reduced: boolean) {
	return { duration: reduced ? 0 : 260 };
}

// Slides by transform only: opacity < 1 on the bar would blank its backdrop-filter mid-slide.
export function barSlide(_node: Element, params: { reduced: boolean }): TransitionConfig {
	return {
		...slideParams(params.reduced),
		easing: cubicOut,
		css: (_t, u) => `transform: translateY(${u * 100}%)`
	};
}
