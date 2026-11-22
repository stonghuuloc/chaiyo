import { getContext, setContext } from 'svelte';
import type { LookupHit } from '#lib/catalog/index.js';

export type LookupContext = {
	open: (hit: LookupHit, rect: DOMRect) => void;
	hit: () => LookupHit | null;
};

const LOOKUP = Symbol('lookup');
export const setLookup = (ctx: LookupContext) => setContext(LOOKUP, ctx);
export const getLookup = () => getContext<LookupContext | undefined>(LOOKUP);
