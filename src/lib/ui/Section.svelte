<script lang="ts">
	import type { Snippet } from 'svelte';

	let { children }: { children: Snippet } = $props();
</script>

<section class="section">{@render children()}</section>

<style>
	.section {
		margin-top: var(--spacing-s5);
		padding-top: var(--spacing-s6);
		border-top: 1px solid var(--color-ruled-line);
	}

	.section:first-child {
		margin-top: 0;
		border-top: 0;
	}
</style>
