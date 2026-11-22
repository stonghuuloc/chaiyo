<script lang="ts">
	import type { Component } from 'svelte';
	import { setLookup, type LookupContext } from '#lib/lookup/context';

	let { ctx, view, props }: { ctx: LookupContext; view: Component<any>; props: object } = $props();
	setLookup(ctx);
	const View = $derived(view);
</script>

<View {...props} />
