<script lang="ts">
	import type { Snippet } from 'svelte';
	import type { LookupHit } from '#lib/catalog/index.js';
	import type { Ledger } from '#lib/ledger/index.js';
	import { setLookup } from './context';
	import LookupSheet from './LookupSheet.svelte';

	let { ledger, children }: { ledger: Ledger; children: Snippet } = $props();

	let hit = $state<LookupHit | null>(null);
	let anchor = $state<DOMRect>();

	setLookup({
		open: (h, rect) => {
			hit = h;
			anchor = rect;
		},
		hit: () => hit
	});
</script>

{@render children()}
{#if anchor}
	<LookupSheet {hit} {ledger} {anchor} onclose={() => (hit = null)} />
{/if}
