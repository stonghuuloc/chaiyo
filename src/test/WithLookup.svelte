<script lang="ts">
	import { untrack, type Component } from 'svelte';
	import { setLookup, type LookupContext } from '#lib/lookup/context.js';

	let { ctx, view, props }: { ctx: LookupContext; view: Component<any>; props: object } = $props();
	setLookup(untrack(() => ctx));
	const View = $derived(view);
</script>

<View {...props} />
