import { cubicOut } from 'svelte/easing';
import type { TransitionConfig } from 'svelte/transition';

/** Return a duration in milliseconds: 260 normally, or 0 when reduced motion is requested. */
export function slideParams(reduced: boolean) {
	return { duration: reduced ? 0 : 260 };
}

/**
 * Create a Svelte transition that slides the bar between its resting position
 * and 100% of its own height below it, using cubic-out easing.
 * `params.reduced` sets the duration to 0ms instead of 260ms.
 * Slides by transform only: opacity < 1 on the bar would blank its backdrop-filter mid-slide.
 */
export function barSlide(node: Element, params: { reduced: boolean }): TransitionConfig {
	// the sidebar (CSS sets --nav-mode: sidebar from 1024px) does not slide
	const sidebar = getComputedStyle(node).getPropertyValue('--nav-mode').trim() === 'sidebar';
	return {
		...slideParams(params.reduced || sidebar),
		easing: cubicOut,
		css: (_t, u) => `transform: translateY(${u * 100}%)`
	};
}
