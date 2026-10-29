import { cubicOut } from 'svelte/easing';
import type { TransitionConfig } from 'svelte/transition';

type Params = { reduced: boolean };

// Durations live in design.tokens.json (--motion-*); the fallback only serves node, where no stylesheet exists.
export function cssMs(name: string, fallback: number): number {
	if (typeof document === 'undefined') return fallback;
	const raw = getComputedStyle(document.documentElement).getPropertyValue(name).trim();
	const ms = parseFloat(raw);
	return Number.isFinite(ms) ? (raw.endsWith('ms') ? ms : ms * 1000) : fallback;
}

const reducedMs = () => cssMs('--motion-fade-reduced', 150);

// Reduced motion cuts the movement and keeps a short fade.
const fadeOnly = (): TransitionConfig => ({
	duration: reducedMs(),
	easing: cubicOut,
	css: (t) => `opacity: ${t}`
});

export function scrimFade(_node: Element, { reduced }: Params): TransitionConfig {
	if (reduced) return fadeOnly();
	return { duration: cssMs('--motion-scrim', 150), css: (t) => `opacity: ${t}` };
}

export function sheetSlide(_node: Element, { reduced }: Params): TransitionConfig {
	if (reduced) return fadeOnly();
	return {
		duration: cssMs('--motion-sheet', 280),
		easing: cubicOut,
		css: (_t, u) => `transform: translateY(${u * 100}%)`
	};
}

export function dialogPop(_node: Element, { reduced }: Params): TransitionConfig {
	if (reduced) return fadeOnly();
	return {
		duration: cssMs('--motion-dialog', 280),
		easing: cubicOut,
		css: (t, u) => `opacity: ${t}; transform: translateY(${u * 24}px) scale(${1 - u * 0.04})`
	};
}

export function toastRise(_node: Element, { reduced }: Params): TransitionConfig {
	if (reduced) return fadeOnly();
	return {
		duration: cssMs('--motion-toast', 180),
		easing: cubicOut,
		css: (t, u) => `opacity: ${t}; transform: translateY(${u * 8}px)`
	};
}
