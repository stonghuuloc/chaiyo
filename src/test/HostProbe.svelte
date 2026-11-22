<script lang="ts">
	import type { LookupHit } from '#lib/catalog/index.js';
	import type { Ledger } from '#lib/ledger/index.js';
	import LookupHost from '#lib/lookup/LookupHost.svelte';
	import LookupProbe from './LookupProbe.svelte';

	let { ledger, hits, rect }: { ledger: Ledger; hits: LookupHit[]; rect: DOMRect } = $props();
</script>

<LookupHost {ledger}><LookupProbe {hits} {rect} /></LookupHost>
