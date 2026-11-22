<script lang="ts">
	import type { LookupHit } from '#lib/catalog/index.js';
	import { getLookup } from '#lib/lookup/context.js';

	let { hits, rect }: { hits: LookupHit[]; rect: DOMRect } = $props();
	const lookup = getLookup();
</script>

{#each hits as h, i (i)}
	<button type="button" data-part="probe-open" onclick={() => lookup?.open(h, rect)}>{i}</button>
{/each}
